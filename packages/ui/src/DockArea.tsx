/** @jsxRuntime automatic */
/**
 * A dock of panel groups (Layers, Properties, History, …), stacked vertically: each group has a
 * tab strip (click, or Left/Right arrows, switch the active tab, remembered), a chevron that
 * collapses it to just the strip, and a drag handle (mouse or Up/Down arrows) on its bottom edge
 * that resizes it. The last expanded group (the filler) takes whatever height the others leave,
 * laid out as upstream `dock.rs`'s `heights_for` does (`dockHeights`): groups the person never
 * resized give way first, nearest the filler first, down to their compact heights, so the filler
 * gets its preferred height; when the column is still too short, every expanded group gives way
 * down to its minimum, and the dock itself scrolls as the last resort. Until the dock has a
 * measured height (its first frame, or jsdom), flexbox does a simpler version of the same: the
 * filler grows, every other expanded group can shrink to its minimum. Layout
 * (active tab, height, collapsed) persists per kit in `localStorage`, written on release for a
 * drag and at once for every other, discrete change.
 */
import { useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref } from 'react'
import { ChevronDownIcon as ChevronDown, ChevronRightIcon as ChevronRight } from '@kition/tessera-icons/react'
import { IconButton } from './ui'
import { Element, useElements, useStrings } from './context'
import { readKitStore, writeKitStore } from './kitStore'

/** A tab's `id` is its Kit UI panel (`panel:<id>`). */
export type DockTab = { id: string; label: string; render: () => ReactNode }
/**
 * A group's `id` is the dock's own (its stored layout, its test ids), not a Kit UI id: the strip
 * carries its active tab's `panel:<tab>`, and a group whose tabs are all hidden is not drawn.
 */
export type DockGroup = {
  id: string
  tabs: readonly DockTab[]
  defaultHeight: number
  minHeight?: number
  /**
   * What the group, left at its default height, gives way down to so the filler keeps its
   * `preferredFill` in a short column (upstream's `Group::compact_height`); its default height
   * (no give-way) when unset. A height the person dragged to never gives way.
   */
  compactHeight?: number
  /**
   * The height the group asks for when it is the filler (the last expanded group), before the
   * default-sized groups above it keep their full defaults (upstream's `Group::preferred_fill`:
   * Layers wants room for about ten rows); its minimum when unset.
   */
  preferredFill?: number
}

/** One group as `dockHeights` lays it out. */
export type DockSizing = { height: number; resized: boolean; collapsed: boolean; minHeight: number; compactHeight: number; preferredFill: number }

/**
 * Upstream's `DockLayout::heights_for`: each group's height (tab strip included) in a column
 * `available` tall, with `strip`-high collapsed groups and `gap` between groups. The last expanded
 * group fills the rest. Groups the person never resized give way first, the one nearest the
 * filler first, down to their compact heights, so the filler gets its preferred height; when the
 * column is still too short every expanded group gives way, nearest first, down to its minimum.
 * The filler never goes below its minimum (the column then overflows).
 */
export function dockHeights(groups: readonly DockSizing[], available: number, strip: number, gap = 0): number[] {
  const avail = Number.isFinite(available) ? Math.max(0, available) : 0
  let filler = -1
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    if (!groups[index].collapsed) {
      filler = index
      break
    }
  }
  const heights = groups.map((group, index) => (group.collapsed ? strip : index === filler ? 0 : group.height))
  if (filler < 0) return heights
  const gaps = gap * Math.max(0, groups.length - 1)
  const total = () => heights.reduce((sum, height) => sum + height, 0) + gaps
  const fill = groups[filler]
  const giveWay = (deficit: number, floor: (group: DockSizing) => number, skip: (group: DockSizing) => boolean) => {
    for (let index = filler - 1; index >= 0 && deficit > 0; index -= 1) {
      const group = groups[index]
      if (group.collapsed || skip(group)) continue
      const give = Math.min(Math.max(0, heights[index] - floor(group)), deficit)
      heights[index] -= give
      deficit -= give
    }
  }
  giveWay(Math.max(0, total() + fill.preferredFill - avail), (group) => group.compactHeight, (group) => group.resized)
  giveWay(Math.max(0, total() + fill.minHeight - avail), (group) => group.minHeight, () => false)
  heights[filler] = Math.max(avail - total(), fill.minHeight)
  return heights
}
/**
 * What a kit can ask of its dock: show a tab (upstream's Adjustments panel shows Properties after
 * adding a layer, its Window menu shows a panel's group and tab), and which tab a group shows.
 */
export type DockAreaHandle = {
  /**
   * Makes `tab` its group's active tab and expands the group, remembered as a click is. A group
   * the dock does not show yet opens on it once shown (a Window row shows the group and brings the
   * tab forward in one step); a hidden tab, or one no group has, changes nothing.
   */
  showTab: (tab: string) => void
  /**
   * The tab a group shows (or will show once shown) and whether it is collapsed; null for a group
   * the dock does not have or whose tabs are all hidden.
   */
  activeTab: (group: string) => { tab: string; collapsed: boolean } | null
}
export type DockAreaProps = {
  /** Remembers the layout per kit, in the kit's store (`kit:<kit>:dock`, see `kitStore`). */
  kit: string
  groups: readonly DockGroup[]
  /** Groups the Window menu shows; others are not drawn. */
  shown: ReadonlySet<string>
  onShownChange?: (shown: ReadonlySet<string>) => void
  width?: number
  /** Receives the dock's `DockAreaHandle`. */
  handle?: Ref<DockAreaHandle>
  testId?: string
}

type GroupLayout = { tab: string; height: number; collapsed: boolean }
type Layout = Record<string, GroupLayout>

/** Upper bound on a stored height: a guard against absurd values left in `localStorage`, not a real limit. */
const DOCK_MAX_HEIGHT = 4000
const DEFAULT_MIN_HEIGHT = 80
/** Each group's bottom border (styles.css `.kui-dock-group`). */
const GROUP_BORDER = 1
/** Keyboard resize step (Up/Down), and with Shift held. */
const RESIZE_STEP = 16
const RESIZE_STEP_FAST = 64

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** The layout's name in the kit's store (`kit:<kit>:dock`). */
const STORE_NAME = 'dock'

/** A group's stored entry, tolerating anything that is not the shape expected (corrupt JSON, an old or foreign format). */
function entryOf(layout: Layout, id: string): Partial<GroupLayout> {
  const raw: unknown = (layout as Record<string, unknown>)[id]
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Partial<GroupLayout>) : {}
}

/**
 * The saved layout, tolerating corrupt JSON (falls back to nothing saved) and entries for groups
 * that no longer exist (kept as-is; `entryOf` only reads what the caller asks for, so an unknown
 * or removed group's entry just rides along unread until that group comes back).
 */
function loadLayout(kit: string): Layout {
  return readKitStore(kit, STORE_NAME, (parsed) => (parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Layout) : undefined)) ?? {}
}

/** Storage full, disabled, or unavailable: the layout just does not persist (`writeKitStore` says so; nothing to do). */
function saveLayout(kit: string, layout: Layout) {
  writeKitStore(kit, STORE_NAME, layout)
}

/** A group's live state: its active (visible) tab, height, and whether it is collapsed, the stored entry filling in over the group's own defaults. A stored tab that is no longer visible (just hidden by configuration, or gone) gives way to the first visible one. */
function resolveGroup(layout: Layout, group: DockGroup, visibleTabs: readonly DockTab[]) {
  const stored = entryOf(layout, group.id)
  const minHeight = group.minHeight ?? DEFAULT_MIN_HEIGHT
  const collapsed = typeof stored.collapsed === 'boolean' ? stored.collapsed : false
  const resized = typeof stored.height === 'number' && Number.isFinite(stored.height)
  const height = clamp(resized ? (stored.height as number) : group.defaultHeight, minHeight, DOCK_MAX_HEIGHT)
  const tab = visibleTabs.find((item) => item.id === stored.tab) ?? visibleTabs[0]
  const compactHeight = clamp(group.compactHeight ?? height, minHeight, DOCK_MAX_HEIGHT)
  const preferredFill = Math.max(minHeight, group.preferredFill ?? minHeight)
  return { collapsed, height, resized, tab, minHeight, compactHeight, preferredFill }
}

/** An in-progress resize gesture: which group, where it started, the height it started from, and whether its first change pinned the other groups. */
type Drag = { pointerId: number; groupId: string; startY: number; startHeight: number; element: HTMLDivElement; pinned: boolean }

/**
 * The "expand/collapse panel group" labels: the editor's own strings when a `KitEditorProvider`
 * is present (so a kit's own catalog can override them), otherwise the shared en-US text —
 * `DockArea` may render on its own, outside any editor, as in tests or a host-less preview.
 */
function usePanelGroupLabels() {
  const t = useStrings()
  return { expand: t('expandPanelGroup'), collapse: t('collapsePanelGroup') }
}

export function DockArea({ kit, groups, shown, width, handle, testId = 'dock' }: DockAreaProps) {
  const ui = useElements()
  const labels = usePanelGroupLabels()
  const [layout, setLayout] = useState<Layout>(() => loadLayout(kit))
  const drag = useRef<Drag | null>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  /** The heights the expanded groups other than the filler show, for `pinned`. */
  const shownHeights = useRef<Map<string, number>>(new Map())
  // The column's height and a tab strip's, once laid out: what `dockHeights` divides.
  const dockRef = useRef<HTMLDivElement>(null)
  const [column, setColumn] = useState<{ available: number; strip: number } | null>(null)
  const measure = useRef<() => void>(() => undefined)
  const observer = useRef<ResizeObserver | null>(null)
  useLayoutEffect(() => {
    const element = dockRef.current
    if (!element) return undefined
    measure.current = () => {
      const strip = element.querySelector<HTMLElement>('.kui-dock-strip')?.offsetHeight ?? 0
      const available = element.clientHeight
      setColumn((current) => (available > 0 && (current?.available !== available || current.strip !== strip) ? { available, strip } : current))
    }
    measure.current()
    if (typeof ResizeObserver === 'undefined') return undefined
    observer.current = new ResizeObserver(() => measure.current())
    observer.current.observe(element)
    return () => {
      observer.current?.disconnect()
      observer.current = null
    }
  }, [])

  /** Updates one group's entry; `persist` writes it through to `localStorage` at once (a discrete change: a click, a keypress), or leaves it for the caller to write later (a drag's own moves, released as one write). */
  function patch(id: string, change: Partial<GroupLayout>, persist: boolean, base: Layout = layout) {
    const next: Layout = { ...base, [id]: { ...entryOf(base, id), ...change } as GroupLayout }
    setLayout(next)
    if (persist) saveLayout(kit, next)
  }

  useImperativeHandle(
    handle,
    () => ({
      showTab(tab) {
        const group = groups.find((item) => item.tabs.some((candidate) => candidate.id === tab))
        if (!group || ui.state(`panel:${tab}`).hidden) return
        patch(group.id, { tab, collapsed: false }, true)
      },
      activeTab(id) {
        const group = groups.find((item) => item.id === id)
        const tabs = group?.tabs.filter((tab) => !ui.state(`panel:${tab.id}`).hidden) ?? []
        if (!group || tabs.length === 0) return null
        const resolved = resolveGroup(layout, group, tabs)
        return { tab: resolved.tab.id, collapsed: resolved.collapsed }
      },
    }),
    // `patch` and `activeTab` read the current layout: the handle follows it.
    [groups, kit, layout, ui],
  )

  /**
   * A resize's first step pins the other groups at the heights they show (upstream's `resize`),
   * so groups still at their defaults, which give way to the filler, stay put while one is resized.
   */
  function pinned(): Layout {
    let next = layout
    for (const [id, height] of shownHeights.current) {
      if (typeof entryOf(next, id).height !== 'number') next = { ...next, [id]: { ...entryOf(next, id), height } as GroupLayout }
    }
    return next
  }

  function onHandlePointerDown(event: ReactPointerEvent<HTMLDivElement>, group: DockGroup, height: number) {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = { pointerId: event.pointerId, groupId: group.id, startY: event.clientY, startHeight: height, element: event.currentTarget, pinned: false }
  }

  function onHandlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const group = groups.find((item) => item.id === current.groupId)
    const minHeight = group?.minHeight ?? DEFAULT_MIN_HEIGHT
    const next = clamp(current.startHeight + (event.clientY - current.startY), minHeight, DOCK_MAX_HEIGHT)
    // A press or a move that changes no height pins nothing (upstream pins on a drag's first change).
    if (!current.pinned && next === current.startHeight) return
    const base = !current.pinned && column ? pinned() : layout
    current.pinned = true
    patch(current.groupId, { height: next }, false, base)
  }

  function onHandlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    current.element.releasePointerCapture?.(current.pointerId)
    drag.current = null
    // One write for the whole gesture, with whatever the last move left in `layout`; a click (no change) writes nothing.
    if (current.pinned) saveLayout(kit, layout)
  }

  function onHandleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, group: DockGroup, height: number) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    const minHeight = group.minHeight ?? DEFAULT_MIN_HEIGHT
    const step = event.shiftKey ? RESIZE_STEP_FAST : RESIZE_STEP
    const next = clamp(height + (event.key === 'ArrowDown' ? step : -step), minHeight, DOCK_MAX_HEIGHT)
    if (next === height) return
    patch(group.id, { height: next }, true, column ? pinned() : layout)
  }

  function onTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, group: DockGroup, tabs: readonly DockTab[], activeId: string | undefined) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    if (tabs.length < 2) return
    event.preventDefault()
    const index = Math.max(0, tabs.findIndex((item) => item.id === activeId))
    const delta = event.key === 'ArrowRight' ? 1 : -1
    const next = tabs[(index + delta + tabs.length) % tabs.length]
    patch(group.id, { tab: next.id }, true)
    tabRefs.current.get(next.id)?.focus()
  }

  // A group whose tabs are all hidden is not drawn at all, not even as an empty strip.
  const visible = groups
    .filter((group) => shown.has(group.id))
    .map((group) => ({ group, tabs: group.tabs.filter((tab) => !ui.state(`panel:${tab.id}`).hidden) }))
    .filter(({ tabs }) => tabs.length > 0)

  // A tab strip's height can change on its own (the theme's font, a host's zoom): watch the strips too.
  const stripKey = visible.map(({ group }) => group.id).join('|')
  useLayoutEffect(() => {
    const element = dockRef.current
    const watching = observer.current
    if (!element || !watching) return undefined
    const strips = [...element.querySelectorAll<HTMLElement>('.kui-dock-strip')]
    for (const strip of strips) watching.observe(strip)
    measure.current()
    return () => {
      for (const strip of strips) watching.unobserve(strip)
    }
  }, [stripKey])

  // The last expanded group fills whatever height the others leave.
  const resolvedGroups = visible.map(({ group, tabs }) => resolveGroup(layout, group, tabs))
  let fillerIndex = -1
  for (let index = resolvedGroups.length - 1; index >= 0; index -= 1) {
    if (!resolvedGroups[index].collapsed) {
      fillerIndex = index
      break
    }
  }
  // Each group's border is part of its height in the column, not of what `dockHeights` divides.
  const laidOut = column ? dockHeights(resolvedGroups, column.available - resolvedGroups.length * GROUP_BORDER, column.strip) : null
  shownHeights.current = new Map(laidOut ? visible.flatMap(({ group }, index) => (index === fillerIndex || resolvedGroups[index].collapsed ? [] : [[group.id, Math.round(laidOut[index])] as const])) : [])

  return (
    <div ref={dockRef} className="kui-dock" data-testid={testId} style={width != null ? { width } : undefined}>
      {visible.map(({ group, tabs }, index) => {
        const resolved = resolvedGroups[index]
        const isFiller = index === fillerIndex
        // The height the group shows (a default-sized group may have given way to the filler).
        const shownHeight = laidOut ? laidOut[index] : resolved.height
        const panelId = resolved.tab ? `${testId}-panel-${group.id}` : undefined
        // Longhand flex properties, not the shorthand: easy to assert on in tests, and never
        // ambiguous about which part of "0 0 150px" a browser (or jsdom) decomposed where. Every
        // expanded group can shrink (down to its own `minHeight`) before the dock itself has to
        // scroll: `flexShrink: 1` here, not `0`, is the "give way" half of upstream's layout.
        // Once measured, every expanded group is the height `dockHeights` gave it; the filler
        // still grows into any rounding left over.
        const style: CSSProperties = resolved.collapsed
          ? { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' }
          : isFiller
            ? { flexGrow: 1, flexShrink: 1, flexBasis: laidOut ? `${shownHeight}px` : '0%', minHeight: resolved.minHeight }
            : { flexGrow: 0, flexShrink: laidOut ? 0 : 1, flexBasis: `${shownHeight}px`, minHeight: resolved.minHeight }
        return (
          <div key={group.id} className="kui-dock-group" data-testid={`${testId}-group-${group.id}`} data-collapsed={resolved.collapsed} data-height={laidOut ? Math.round(shownHeight) : undefined} style={style}>
            {/* The strip and its collapse button are the active tab's panel: a host that hides a
                tab never finds its id on screen, and a group needs no id of its own. */}
            <div className="kui-dock-strip" data-kit-ui-id={resolved.tab ? `panel:${resolved.tab.id}` : undefined}>
              <div className="kui-dock-tabs" role="tablist">
                {tabs.map((tab) => {
                  const active = tab.id === resolved.tab?.id
                  return (
                    <button
                      key={tab.id}
                      ref={(element) => {
                        if (element) tabRefs.current.set(tab.id, element)
                        else tabRefs.current.delete(tab.id)
                      }}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls={panelId}
                      tabIndex={active ? 0 : -1}
                      className="kui-dock-tab"
                      data-testid={`${testId}-tab-${tab.id}`}
                      data-kit-ui-id={`panel:${tab.id}`}
                      onClick={() => patch(group.id, { tab: tab.id }, true)}
                      onKeyDown={(event) => onTabKeyDown(event, group, tabs, resolved.tab?.id)}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              <IconButton
                icon={resolved.collapsed ? ChevronRight : ChevronDown}
                label={resolved.collapsed ? labels.expand : labels.collapse}
                aria-expanded={!resolved.collapsed}
                data-kit-ui-id={resolved.tab ? `panel:${resolved.tab.id}` : undefined}
                onClick={() => patch(group.id, { collapsed: !resolved.collapsed }, true)}
                data-testid={`${testId}-collapse-${group.id}`}
              />
            </div>
            {resolved.collapsed || !resolved.tab ? null : (
              <div className="kui-dock-body" role="tabpanel" id={panelId}>
                <Element id={`panel:${resolved.tab.id}`}>{resolved.tab.render()}</Element>
              </div>
            )}
            {resolved.collapsed || isFiller ? null : (
              <div
                className="kui-dock-handle"
                role="separator"
                aria-orientation="horizontal"
                aria-valuenow={Math.round(shownHeight)}
                aria-valuemin={resolved.minHeight}
                aria-valuemax={DOCK_MAX_HEIGHT}
                tabIndex={0}
                data-testid={`${testId}-handle-${group.id}`}
                onPointerDown={(event) => onHandlePointerDown(event, group, shownHeight)}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onPointerCancel={onHandlePointerUp}
                onKeyDown={(event) => onHandleKeyDown(event, group, shownHeight)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
