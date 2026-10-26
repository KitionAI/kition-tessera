/** @jsxRuntime automatic */
/**
 * A Premiere-style workspace: the frames of a `WorkspaceNode` tree laid out in the area, split by
 * 4 px gutters that drag (or arrow keys) resize, each frame a tab group with a strip, a panel menu
 * (`≡`), and the active tab's content. This ports a docking editor's chrome (Film's upstream
 * `dock.rs` `layout` and `draw_group_chrome`, and `panels/mod.rs` `panel_menu_popup`). The kit owns
 * the state: the tree, the focused panel, and the maximized one; the layout reports changes.
 *
 * Only active tabs render; an inactive tab is unmounted, so it does no work. Frames are keyed by
 * their active panel, so a panel keeps its state when its frame moves (a split collapsing, a frame
 * maximized and restored). A frame redraws only when its own tabs, place, size, focus, or menu
 * change, and its content only when its panel's `render` or the frame's size changes: a kit keeps
 * `panels` (and each panel's `render`) stable across renders, or every frame redraws. A gutter
 * drag reports at most one tree per animation frame, and the last one on release.
 *
 * Kit UI ids: each tab is `panel:<id>`; a hidden tab is not drawn, and a group whose tabs are all
 * hidden is not drawn and closes its split. A frame carries its active tab's `panel:<id>` (and
 * `data-panel`, for a kit's "frame under the pointer"), and a disabled tab's content renders in a
 * disabled `KitElement`. Gutters carry no Kit UI id: they change only the layout, never the
 * document, so a kit maps upstream's `dock.gutter.*` to their test ids (`<testId>-gutter-<path>`).
 */
import {
  memo,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { ChevronsRightIcon as ChevronsRight, MenuIcon as Menu } from '@kition/tessera-icons/react'
import { ContextMenu, ICON_STROKE, MenuItem, MenuSeparator, type ContextMenuPoint } from './ui'
import { Element, useElements, useStrings } from './context'
import { activate, closePanel, contains, resizeAt, shownActive, splitFirst, visiblePanels, type WorkspaceNode, type WorkspaceSize } from './workspaceTree'

export type WorkspacePanel = {
  id: string
  label: string
  render: () => ReactNode
  /** No tab strip, a slim grip instead (upstream `compact`: Tools, Audio Meters). */
  compact?: boolean
  /**
   * Drawn in place of the tab's label, and may hold buttons of its own (upstream's Timeline
   * shows its open sequences while its tab is `active`, and the active one's name otherwise).
   */
  strip?: (active: boolean) => ReactNode
  /**
   * Closes the panel instead of removing its tab, for Close Panel and a middle click (upstream's
   * Timeline closes its active sequence and stays).
   */
  onClose?: () => void
  /** Rows right after Close Panel (upstream's Close Other Timeline Panels); `close` closes the menu. */
  afterClose?: (close: () => void) => ReactNode
  /** Extra rows for the panel menu after Close Panel, Maximize Frame, Restore Workspace. */
  menu?: (close: () => void) => ReactNode
  /** Rows of the » list in place of the panel's own row (upstream lists the Timeline's sequences). */
  moreRows?: (close: () => void) => ReactNode
}

export type WorkspaceLayoutProps = {
  tree: WorkspaceNode
  onTree: (tree: WorkspaceNode) => void
  /** Keep this array, and each panel's `render`, stable across renders (see above). */
  panels: readonly WorkspacePanel[]
  focused: string | null
  onFocus: (panel: string) => void
  /**
   * The maximized panel fills the area without changing the tree (upstream `keys.maximized`, the
   * ` and Shift+` keys). The panel menu's Maximize Frame, as upstream, replaces the tree instead.
   */
  maximized: string | null
  onMaximized: (panel: string | null) => void
  /** Restore Workspace in the panel menu. */
  onRestore: () => void
  testId?: string
}

/** The gutter between a split's children (upstream `Tokens::gap`). */
const GAP = 4
/** The smallest size a gutter drag leaves either child (upstream `layout`). */
const DRAG_MIN = 40
/** Keyboard resize step, and with Shift held. */
const RESIZE_STEP = 16
const RESIZE_STEP_FAST = 64
/** Upstream `draw_group_chrome`'s tab fitting: the strip's own margin, the space between tabs, and the » button's. */
const STRIP_MARGIN = 12
const TAB_GAP = 8
const MORE_WIDTH = 24
/** The ≡ button's width and its distance from the active tab's right edge. */
const MENU_WIDTH = 20
const MENU_INSET = 4

type Rect = { left: number; top: number; width: number; height: number }

/** A group as drawn: its visible tabs and the one shown. `path` is the group's place in `tree`. */
type ViewGroup = { path: string; tabs: string[]; active: string }
/** The tree as drawn: hidden and unknown tabs left out, emptied groups collapsing their splits. */
type View = ViewGroup | { path: string; split: 'row' | 'column'; size: WorkspaceSize; a: View; b: View }

type Gutter = { path: string; split: 'row' | 'column'; size: WorkspaceSize; rect: Rect; first: number; available: number }

function viewOf(node: WorkspaceNode, path: string, shown: (panel: string) => boolean): View | null {
  if ('split' in node) {
    const a = viewOf(node.a, `${path}a`, shown)
    const b = viewOf(node.b, `${path}b`, shown)
    if (!a || !b) return a ?? b
    return { path, split: node.split, size: node.size, a, b }
  }
  const active = shownActive(node, shown)
  return active === undefined ? null : { path, tabs: node.tabs.filter(shown), active }
}

/** Upstream `layout`: each group's rect, and each split's gutter. */
function place(view: View, rect: Rect, groups: Array<{ group: ViewGroup; rect: Rect }>, gutters: Gutter[]) {
  if (!('split' in view)) {
    groups.push({ group: view, rect })
    return
  }
  const row = view.split === 'row'
  const available = Math.max((row ? rect.width : rect.height) - GAP, 0)
  const first = splitFirst(view.size, available)
  const second = Math.max(available - first, 0)
  const gutter = { path: view.path, split: view.split, size: view.size, first, available }
  if (row) {
    place(view.a, { ...rect, width: first }, groups, gutters)
    gutters.push({ ...gutter, rect: { ...rect, left: rect.left + first, width: GAP } })
    place(view.b, { ...rect, left: rect.left + first + GAP, width: second }, groups, gutters)
  } else {
    place(view.a, { ...rect, height: first }, groups, gutters)
    gutters.push({ ...gutter, rect: { ...rect, top: rect.top + first, height: GAP } })
    place(view.b, { ...rect, top: rect.top + first + GAP, height: second }, groups, gutters)
  }
}

const gutterMax = (gutter: Gutter) => Math.max(gutter.available - DRAG_MIN, DRAG_MIN)

/** A gutter moved so its split's first child is `first` px: the split's size, of the same kind (upstream `layout`). */
function sizeFor(gutter: Gutter, first: number): WorkspaceSize {
  const next = Math.min(Math.max(first, DRAG_MIN), gutterMax(gutter))
  if ('ratio' in gutter.size) return { ratio: next / Math.max(gutter.available, 1) }
  if ('fixedA' in gutter.size) return { fixedA: next }
  return { fixedB: gutter.available - next }
}

const LABEL_KEYS = ['closePanel', 'maximizeFrame', 'restoreWorkspace', 'panelMenu', 'moreTabs', 'resizePanels'] as const
type Labels = Record<(typeof LABEL_KEYS)[number], string>

function useLabels(): Labels {
  const t = useStrings()
  const values = LABEL_KEYS.map((key) => t(key))
  const joined = values.join('\n')
  // The same object while the text is the same, so frames need not redraw.
  return useMemo(() => Object.fromEntries(LABEL_KEYS.map((key, index) => [key, values[index]])) as Labels, [joined])
}

const tabDomId = (uid: string, panel: string) => `${uid}-tab-${panel}`
const bodyDomId = (uid: string, panel: string) => `${uid}-body-${panel}`

type Drag = { pointerId: number; gutter: Gutter; start: number; element: HTMLElement }

export function WorkspaceLayout(props: WorkspaceLayoutProps) {
  const { tree, panels, focused, maximized, testId = 'workspace' } = props
  const latest = useRef(props)
  latest.current = props
  const ui = useElements()
  const labels = useLabels()
  const uid = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [area, setArea] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const drag = useRef<Drag | null>(null)
  /** The tree a gutter drag reports at the next animation frame. */
  const pending = useRef<{ tree: WorkspaceNode | null; frame: number }>({ tree: null, frame: 0 })
  const [menu, setMenu] = useState<{ panel: string; at: ContextMenuPoint } | null>(null)
  /** A tab to focus once drawn: the arrow keys moved to it, or its frame took a closed panel's place. */
  const focusTab = useRef<string | null>(null)

  useLayoutEffect(() => {
    const element = rootRef.current
    if (!element) return undefined
    const measure = () => {
      const box = element.getBoundingClientRect()
      setArea((current) => (current.width === box.width && current.height === box.height ? current : { width: box.width, height: box.height }))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => () => cancelAnimationFrame(pending.current.frame), [])

  useLayoutEffect(() => {
    const wanted = focusTab.current
    if (!wanted) return
    focusTab.current = null
    document.getElementById(tabDomId(uid, wanted))?.focus()
  })

  const byId = useMemo(() => new Map(panels.map((panel) => [panel.id, panel])), [panels])
  const shown = (panel: string) => byId.has(panel) && !ui.state(`panel:${panel}`).hidden
  const shownRef = useRef(shown)
  shownRef.current = shown
  // The maximized panel alone fills the area, while the tree holds and shows it.
  const max = maximized !== null && shown(maximized) && contains(tree, maximized) ? maximized : null
  const view: View | null = max ? { path: '', tabs: [max], active: max } : viewOf(tree, '', shown)
  const groups: Array<{ group: ViewGroup; rect: Rect }> = []
  const gutters: Gutter[] = []
  if (view) place(view, { left: 0, top: 0, width: area.width, height: area.height }, groups, gutters)

  const focus = useCallback((panel: string) => {
    if (panel !== latest.current.focused) latest.current.onFocus(panel)
  }, [])

  const show = useCallback(
    (panel: string) => {
      const { tree: current, onTree } = latest.current
      const next = activate(current, panel)
      if (next !== current) onTree(next)
      focus(panel)
    },
    [focus],
  )

  const close = useCallback((panel: string) => {
    const { tree: current, onTree, maximized: maximizedNow, onMaximized, panels: list } = latest.current
    const own = list.find((item) => item.id === panel)?.onClose
    if (own) {
      own()
      return
    }
    const before = visiblePanels(current, shownRef.current)
    const at = before.indexOf(panel)
    const next = closePanel(current, panel)
    if (panel === maximizedNow) onMaximized(null)
    onTree(next)
    if (at < 0) return
    // The keyboard goes to the frame's next tab, or to the frame that took the closed one's place.
    const after = visiblePanels(next, shownRef.current)
    focusTab.current = after.find((item) => !before.includes(item)) ?? after[Math.min(at, after.length - 1)] ?? null
  }, [])

  const queueFocusTab = useCallback((panel: string) => {
    focusTab.current = panel
  }, [])

  const openMenu = useCallback((panel: string, at: ContextMenuPoint | null) => setMenu(at ? { panel, at } : null), [])

  function flush() {
    const current = pending.current
    cancelAnimationFrame(current.frame)
    current.frame = 0
    const next = current.tree
    current.tree = null
    if (next) latest.current.onTree(next)
  }

  function onGutterPointerDown(event: ReactPointerEvent<HTMLDivElement>, gutter: Gutter) {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = { pointerId: event.pointerId, gutter, start: gutter.split === 'row' ? event.clientX : event.clientY, element: event.currentTarget }
  }

  function onGutterPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const delta = (current.gutter.split === 'row' ? event.clientX : event.clientY) - current.start
    pending.current.tree = resizeAt(latest.current.tree, current.gutter.path, sizeFor(current.gutter, current.gutter.first + delta))
    if (!pending.current.frame) pending.current.frame = requestAnimationFrame(flush)
  }

  function onGutterPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    current.element.releasePointerCapture?.(current.pointerId)
    drag.current = null
    flush()
  }

  function onGutterKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, gutter: Gutter) {
    const keys: Record<string, number> = gutter.split === 'row' ? { ArrowLeft: -1, ArrowRight: 1 } : { ArrowUp: -1, ArrowDown: 1 }
    const direction = keys[event.key]
    if (direction === undefined) return
    event.preventDefault()
    const size = sizeFor(gutter, gutter.first + direction * (event.shiftKey ? RESIZE_STEP_FAST : RESIZE_STEP))
    // At its limit a gutter does not move: no change to report.
    if (Object.entries(size)[0].join() !== Object.entries(gutter.size)[0].join()) props.onTree(resizeAt(tree, gutter.path, size))
  }

  const menuPanel = menu ? byId.get(menu.panel) : undefined
  const closeMenu = () => setMenu(null)

  return (
    <div ref={rootRef} className="kui-workspace" data-testid={testId}>
      {groups.map(({ group, rect }) => (
        <Frame
          key={group.active}
          uid={uid}
          testId={testId}
          tabsKey={group.tabs.join('\n')}
          active={group.active}
          left={rect.left}
          top={rect.top}
          width={rect.width}
          height={rect.height}
          focused={focused === group.active}
          menuOpen={menu !== null && group.tabs.includes(menu.panel)}
          byId={byId}
          labels={labels}
          onFocus={focus}
          onShow={show}
          onClose={close}
          onMenu={openMenu}
          onFocusTab={queueFocusTab}
        />
      ))}
      {gutters.map((gutter) => (
        <div
          key={gutter.path}
          className="kui-ws-gutter"
          role="separator"
          aria-label={labels.resizePanels}
          // A row's gutter is a vertical line between side-by-side frames.
          aria-orientation={gutter.split === 'row' ? 'vertical' : 'horizontal'}
          aria-valuenow={Math.round(gutter.first)}
          aria-valuemin={DRAG_MIN}
          aria-valuemax={Math.round(gutterMax(gutter))}
          tabIndex={0}
          data-split={gutter.split}
          data-testid={`${testId}-gutter-${gutter.path}`}
          style={toStyle(gutter.rect)}
          onPointerDown={(event) => onGutterPointerDown(event, gutter)}
          onPointerMove={onGutterPointerMove}
          onPointerUp={onGutterPointerUp}
          onPointerCancel={onGutterPointerUp}
          onKeyDown={(event) => onGutterKeyDown(event, gutter)}
        />
      ))}
      <ContextMenu at={menu?.at ?? null} onClose={closeMenu} label={labels.panelMenu} testId={menu ? `${testId}-panel-menu-${menu.panel}` : undefined}>
        {menu && menuPanel ? (
          <>
            <MenuItem label={labels.closePanel} uiId={`panel:${menu.panel}`} testId={`${testId}-menu-${menu.panel}-close`} onSelect={() => close(menu.panel)} />
            {menuPanel.afterClose?.(closeMenu)}
            {/* As upstream's panel menu: the frame's panel becomes the whole layout, until Restore Workspace. */}
            <MenuItem
              label={labels.maximizeFrame}
              uiId={`panel:${menu.panel}`}
              testId={`${testId}-menu-${menu.panel}-maximize`}
              onSelect={() => {
                props.onTree({ tabs: [menu.panel], active: 0 })
                focus(menu.panel)
              }}
            />
            <MenuItem label={labels.restoreWorkspace} uiId={`panel:${menu.panel}`} testId={`${testId}-menu-${menu.panel}-restore`} onSelect={props.onRestore} />
            {menuPanel.menu ? (
              <>
                <MenuSeparator />
                {menuPanel.menu(closeMenu)}
              </>
            ) : null}
          </>
        ) : null}
      </ContextMenu>
    </div>
  )
}

const toStyle = (rect: Rect): CSSProperties => ({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })

type FrameProps = {
  uid: string
  testId: string
  /** The group's drawn tabs, joined by newlines (a string, so an unchanged group compares equal). */
  tabsKey: string
  active: string
  left: number
  top: number
  width: number
  height: number
  focused: boolean
  menuOpen: boolean
  byId: ReadonlyMap<string, WorkspacePanel>
  labels: Labels
  onFocus: (panel: string) => void
  onShow: (panel: string) => void
  onClose: (panel: string) => void
  onMenu: (panel: string, at: ContextMenuPoint | null) => void
  onFocusTab: (panel: string) => void
}

/** A panel's content: drawn again only when its `render` or its frame's size changes. */
const Body = memo(function Body({ id, render }: { id: string; render: () => ReactNode; width: number; height: number }) {
  return <Element id={`panel:${id}`}>{render()}</Element>
})

/** One tab group (upstream `draw_group_chrome`): a frame, its strip or grip, and its active tab's content. */
const Frame = memo(function Frame({ uid, testId, tabsKey, active, left, top, width, height, focused, menuOpen, byId, labels, onFocus, onShow, onClose, onMenu, onFocusTab }: FrameProps) {
  const tabs = useMemo(() => tabsKey.split('\n'), [tabsKey])
  const panel = byId.get(active)!
  const compact = tabs.length === 1 && panel.compact === true
  const stripRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef(new Map<string, HTMLElement>())
  const overlayRefs = useRef(new Map<string, HTMLElement>())
  const menuButton = useRef<HTMLButtonElement>(null)
  const [overflow, setOverflow] = useState(false)
  const [list, setList] = useState<ContextMenuPoint | null>(null)
  const moreButton = useRef<HTMLButtonElement>(null)
  /**
   * Whether a menu was open when its button was pressed (upstream `list_opened`): the press closes
   * it (a press outside a menu does), and the click that follows must not open it again. Read in
   * a window listener added before any menu's own, so it sees the menu still open.
   */
  const wasOpen = useRef({ list: false, menu: false })
  const openNow = useRef({ list: false, menu: false })
  openNow.current = { list: list !== null, menu: menuOpen }
  useLayoutEffect(() => {
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (moreButton.current?.contains(target)) wasOpen.current.list = openNow.current.list
      if (menuButton.current?.contains(target)) wasOpen.current.menu = openNow.current.menu
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => window.removeEventListener('pointerdown', onDown, true)
  }, [])

  /**
   * Upstream's tab fitting: the active tab always shows; tabs before it drop out until it fits,
   * then as many after it as there is room for. The rest are not drawn, reached through ».
   */
  const fit = useRef(() => undefined as void)
  fit.current = () => {
    const strip = stripRef.current
    if (!strip) return
    const elements = tabs.map((id) => tabRefs.current.get(id)!)
    tabs.forEach((id, index) => {
      // A strip a panel draws itself sizes its tab.
      const overlay = overlayRefs.current.get(id)
      const spacer = elements[index].firstElementChild as HTMLElement | null
      if (overlay && spacer) spacer.style.width = `${overlay.scrollWidth}px`
      elements[index].style.display = ''
    })
    const widths = elements.map((element) => element.offsetWidth)
    const span = (from: number, to: number) => widths.slice(from, to + 1).reduce((sum, value) => sum + value + TAB_GAP, 0)
    const at = Math.max(tabs.indexOf(active), 0)
    let room = width - STRIP_MARGIN
    const allFit = span(0, tabs.length - 1) <= room
    if (!allFit) room -= MORE_WIDTH
    let first = 0
    while (first < at && span(first, at) > room) first += 1
    let last = Math.max(at, first)
    while (last + 1 < tabs.length && span(first, last + 1) <= room) last += 1
    elements.forEach((element, index) => {
      element.style.display = index < first || index > last ? 'none' : ''
    })
    tabs.forEach((id, index) => {
      const overlay = overlayRefs.current.get(id)
      if (!overlay) return
      overlay.style.display = elements[index].style.display
      const spacer = elements[index].firstElementChild as HTMLElement | null
      overlay.style.left = `${elements[index].offsetLeft + (spacer?.offsetLeft ?? 0)}px`
    })
    const current = elements[at]
    if (menuButton.current) menuButton.current.style.left = `${current.offsetLeft + current.offsetWidth - MENU_WIDTH - MENU_INSET}px`
    setOverflow(!allFit)
  }
  useLayoutEffect(() => fit.current(), [tabsKey, active, width])
  useLayoutEffect(() => {
    const strip = stripRef.current
    if (!strip || typeof ResizeObserver === 'undefined') return undefined
    // A label's width can change on its own (the theme's font, a strip's own content).
    const observer = new ResizeObserver(() => fit.current())
    observer.observe(strip)
    for (const overlay of overlayRefs.current.values()) observer.observe(overlay)
    return () => observer.disconnect()
  }, [tabsKey])

  function onTabKeyDown(event: ReactKeyboardEvent<HTMLElement>, id: string) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    if (tabs.length < 2) return
    event.preventDefault()
    const index = tabs.indexOf(id)
    const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]
    // The frame is keyed by its active tab: the layout focuses the new tab once the next frame draws it.
    onFocusTab(next)
    onShow(next)
  }

  const bodyId = bodyDomId(uid, active)
  return (
    <div
      className="kui-ws-frame"
      data-testid={`${testId}-frame-${active}`}
      data-kit-ui-id={`panel:${active}`}
      data-panel={active}
      data-focused={focused ? 'true' : undefined}
      data-compact={compact ? 'true' : undefined}
      style={{ left, top, width, height }}
      onPointerDownCapture={() => onFocus(active)}
      onFocusCapture={() => onFocus(active)}
    >
      {compact ? (
        <div className="kui-ws-grip" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ) : (
        <div ref={stripRef} className="kui-ws-strip">
          <div className="kui-ws-tabs" role="tablist" aria-orientation="horizontal">
            {tabs.map((id) => {
              const item = byId.get(id)!
              const selected = id === active
              return (
                <button
                  key={id}
                  ref={(element) => {
                    if (element) tabRefs.current.set(id, element)
                    else tabRefs.current.delete(id)
                  }}
                  type="button"
                  role="tab"
                  id={tabDomId(uid, id)}
                  aria-selected={selected}
                  aria-controls={selected ? bodyId : undefined}
                  aria-label={item.strip ? item.label : undefined}
                  tabIndex={selected ? 0 : -1}
                  className="kui-ws-tab"
                  data-testid={`${testId}-tab-${id}`}
                  data-kit-ui-id={`panel:${id}`}
                  onClick={() => onShow(id)}
                  onKeyDown={(event) => onTabKeyDown(event, id)}
                  onMouseDown={(event) => {
                    // A middle press would start the browser's autoscroll.
                    if (event.button === 1) event.preventDefault()
                  }}
                  onAuxClick={(event) => {
                    if (event.button !== 1) return
                    event.preventDefault()
                    onClose(id)
                  }}
                  onContextMenu={(event) => {
                    // A right-click shows the tab and opens its panel menu (as in Premiere).
                    event.preventDefault()
                    onShow(id)
                    onMenu(id, { x: event.clientX, y: event.clientY })
                  }}
                >
                  {item.strip ? <span className="kui-ws-tab-spacer" /> : item.label}
                </button>
              )
            })}
          </div>
          {/* A panel's own strip lies over its tab, outside the tablist: it may hold buttons. */}
          {tabs.map((id) => {
            const item = byId.get(id)!
            if (!item.strip) return null
            return (
              <div
                key={id}
                ref={(element) => {
                  if (element) overlayRefs.current.set(id, element)
                  else overlayRefs.current.delete(id)
                }}
                className="kui-ws-tab-overlay"
                role="group"
                aria-labelledby={tabDomId(uid, id)}
                data-kit-ui-id={`panel:${id}`}
                data-testid={`${testId}-strip-${id}`}
                onClick={() => onShow(id)}
              >
                {item.strip(id === active)}
              </div>
            )
          })}
          <button
            ref={menuButton}
            type="button"
            className="kui-ws-menu-button kui-ws-panel-menu"
            aria-label={labels.panelMenu}
            title={labels.panelMenu}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            data-testid={`${testId}-menu-${active}`}
            data-kit-ui-id={`panel:${active}`}
            onClick={(event) => {
              const box = event.currentTarget.getBoundingClientRect()
              onMenu(active, wasOpen.current.menu ? null : { x: box.left, y: box.bottom })
              wasOpen.current.menu = false
            }}
          >
            <Menu size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
          {overflow ? (
            <button
              ref={moreButton}
              type="button"
              className="kui-ws-menu-button kui-ws-more"
              aria-label={labels.moreTabs}
              title={labels.moreTabs}
              aria-haspopup="menu"
              aria-expanded={list !== null}
              data-testid={`${testId}-more-${active}`}
              data-kit-ui-id={`panel:${active}`}
              onClick={(event) => {
                const box = event.currentTarget.getBoundingClientRect()
                setList(wasOpen.current.list ? null : { x: box.right - 160, y: box.bottom })
                wasOpen.current.list = false
              }}
            >
              <ChevronsRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>
          ) : null}
          <ContextMenu at={list} onClose={() => setList(null)} label={labels.moreTabs} testId={`${testId}-more-list-${active}`}>
            {tabs.map((id) => {
              const item = byId.get(id)!
              return item.moreRows ? (
                <span key={id} style={{ display: 'contents' }}>
                  {item.moreRows(() => setList(null))}
                </span>
              ) : (
                <MenuItem key={id} label={item.label} checked={id === active} uiId={`panel:${id}`} testId={`${testId}-more-${active}-${id}`} onSelect={() => onShow(id)} />
              )
            })}
          </ContextMenu>
        </div>
      )}
      <div className="kui-ws-body" role="tabpanel" id={bodyId} aria-labelledby={compact ? undefined : tabDomId(uid, active)} aria-label={compact ? panel.label : undefined}>
        <Body id={active} render={panel.render} width={width} height={height} />
      </div>
    </div>
  )
})
