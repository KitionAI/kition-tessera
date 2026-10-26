/** @jsxRuntime automatic */
/**
 * Movable, resizable windows over a kit's workspace, as upstream Film draws its floating bin
 * panels (`panels/project.rs` `floating`: an `egui::Window` with a title and a close button, not
 * collapsible, 520 × 360 at first and no smaller than 320 × 220). Opt-in: without panels it draws
 * nothing. The layer fills its parent (`position: absolute; inset: 0`), so the kit renders it
 * inside an element with a non-static `position` that covers the area the windows may use (its
 * workspace's container); the windows stay inside that element.
 *
 * A window moves by its title bar and resizes from any edge or corner, as egui's windows do, with
 * the pointer captured; a gesture ends on release, a cancel, a lost capture, a move with no button
 * held, Escape (taken in the capture phase while the gesture runs, so the editor never sees it),
 * or when its window closes or is hidden, and stores its rectangle once, in whole pixels. The
 * rectangles live in the kit's store (`useKitStore`, `kit:<kit>:<store>`), so every editor page of
 * the kit opens a window where it was left; which windows are open belongs to each page (the
 * kit's `panels`). The store keeps the open windows' rectangles and the 64 most recently stored
 * others. A window stays inside the layer: when the editor shrinks it is drawn moved or shrunk to
 * fit, and its stored rectangle comes back once there is room again.
 *
 * A window with no stored rectangle is placed as egui's `automatic_area_position` places a new
 * window: 16 px in from the top-left, then in a gap between the open windows' columns, under a
 * column that ends above the middle, in a new column, or under the shortest column. It keeps that
 * place while it stays open, whatever opens or closes around it. Unlike egui, the place is chosen
 * from the window's default size before it is drawn (egui places a window after measuring its
 * first frame), and it is kept for this layer only: a window closed and opened again is placed
 * again unless it was moved or resized (then its stored rectangle wins).
 *
 * A press or focus inside a window raises it and tells the kit (`onFocus`), so the kit can route
 * its keys there; a press on its title bar or edges moves focus into it when focus was outside,
 * so a field in another window stops taking keys. The layer takes no keys of its own, so the
 * editor keeps its keys whenever focus is outside a window (and Escape in a field inside never
 * closes one). A window whose Kit UI id the host hides is not drawn, and its body is not rendered.
 */
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { XIcon as X } from '@kition/tessera-icons/react'
import { clamp, composing, useKitUiText } from './colorGesture'
import { useKitStore } from './kitStore'
import { IconButton } from './ui'
import { useElements } from './context'

/**
 * A window: its `id` keys its stored rectangle; `uiId` is the Kit UI id its window, title bar,
 * close button, and resize edges carry. `render` draws its body; a window's body is rendered again
 * whenever `render` is a new function, so keep it stable (`useCallback`) for bodies that should
 * not re-render on every render of the kit.
 */
export type FloatingPanel = { id: string; title: string; render: () => ReactNode; uiId?: string }
export type FloatingSize = { width: number; height: number }
export type FloatingRect = { x: number; y: number; width: number; height: number }
/** A side or corner a window resizes from. */
export type FloatingEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export type FloatingPanelsProps = {
  kit: string
  /**
   * Store name for positions and sizes (`useKitStore`). It holds the windows' rectangles only:
   * anything else under it is dropped on read, so a kit keeps its own list of open windows under
   * a different name.
   */
  store: string
  /** The open windows, bottom to top as first opened. Keep the array and each `render` stable (`useMemo`, `useCallback`). */
  panels: readonly FloatingPanel[]
  onClose: (id: string) => void
  /** The window the kit treats as focused (drawn as such and raised); null for none. */
  focused: string | null
  /** A press or focus inside a window. */
  onFocus: (id: string) => void
  /** A new window's size (upstream's `default_size`, 520 × 360). */
  defaultSize?: FloatingSize
  /** The smallest a window resizes to (upstream's `min_size`, 320 × 220). */
  minSize?: FloatingSize
  testId?: string
}

const DEFAULT_SIZE: FloatingSize = { width: 520, height: 360 }
const MIN_SIZE: FloatingSize = { width: 320, height: 220 }
const EDGES: readonly FloatingEdge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
/** egui's spacing between automatically placed windows. */
const SPACING = 16
/** How many closed windows' rectangles the store keeps, besides the open ones'. */
const KEEP_CLOSED = 64
/** The stored rectangles' cap: far more than any number of windows needs. */
const MAX_BYTES = 64 * 1024

/**
 * `rect` drawn inside `bounds` (null before the layer is measured), in whole pixels: at least
 * `min` (or the bounds, when smaller), at most the bounds, and moved in until it fits.
 */
export function clampFloatingRect(rect: FloatingRect, bounds: FloatingSize | null, min: FloatingSize): FloatingRect {
  let width = Math.max(Math.round(rect.width), min.width)
  let height = Math.max(Math.round(rect.height), min.height)
  const x = Math.round(rect.x)
  const y = Math.round(rect.y)
  if (!bounds) return { x, y, width, height }
  const areaWidth = Math.floor(bounds.width)
  const areaHeight = Math.floor(bounds.height)
  width = Math.min(width, areaWidth)
  height = Math.min(height, areaHeight)
  return { x: clamp(x, 0, areaWidth - width), y: clamp(y, 0, areaHeight - height), width, height }
}

/** `from` resized by dragging `edge` by (`dx`, `dy`): the opposite sides stay, no smaller than `min`, no further out than `bounds`. */
export function resizeFloatingRect(from: FloatingRect, edge: FloatingEdge, dx: number, dy: number, bounds: FloatingSize | null, min: FloatingSize): FloatingRect {
  let { x, y, width, height } = from
  const right = from.x + from.width
  const bottom = from.y + from.height
  if (edge.includes('e')) width = clamp(from.width + dx, min.width, bounds ? bounds.width - from.x : Number.POSITIVE_INFINITY)
  if (edge.includes('w')) {
    x = clamp(from.x + dx, bounds ? 0 : Number.NEGATIVE_INFINITY, right - min.width)
    width = right - x
  }
  if (edge.includes('s')) height = clamp(from.height + dy, min.height, bounds ? bounds.height - from.y : Number.POSITIVE_INFINITY)
  if (edge.includes('n')) {
    y = clamp(from.y + dy, bounds ? 0 : Number.NEGATIVE_INFINITY, bottom - min.height)
    height = bottom - y
  }
  return clampFloatingRect({ x, y, width, height }, bounds, min)
}

/** egui's `automatic_area_position`: where a new window goes among the `open` ones, inside `bounds` (unbounded before the layer is measured). */
export function automaticFloatingPosition(open: readonly FloatingRect[], bounds: FloatingSize | null): { x: number; y: number } {
  const left = SPACING
  const top = SPACING
  if (open.length === 0) return { x: left, y: top }
  const existing = [...open].sort((a, b) => Math.round(a.x) - Math.round(b.x))
  // The open windows in columns: a window that starts left of a column's right edge joins it.
  const columns = [{ ...existing[0] }]
  for (const rect of existing) {
    const column = columns[columns.length - 1]
    if (rect.x < column.x + column.width) {
      const right = Math.max(column.x + column.width, rect.x + rect.width)
      const bottom = Math.max(column.y + column.height, rect.y + rect.height)
      column.x = Math.min(column.x, rect.x)
      column.y = Math.min(column.y, rect.y)
      column.width = right - column.x
      column.height = bottom - column.y
    } else {
      columns.push({ ...rect })
    }
  }
  // A gap between columns wide enough for a window.
  let x = left
  for (const column of columns) {
    if (column.x - x >= 300) return { x, y: top }
    x = column.x + column.width + SPACING
  }
  // A column that ends above the middle.
  const middle = bounds ? bounds.height / 2 : Number.POSITIVE_INFINITY
  for (const column of columns) {
    if (column.y + column.height < middle) return { x: column.x, y: column.y + column.height + SPACING }
  }
  // A new column.
  const last = columns[columns.length - 1]
  const rightmost = last.x + last.width
  if (rightmost + 200 < (bounds ? bounds.width : Number.POSITIVE_INFINITY)) return { x: rightmost + SPACING, y: top }
  // Under the shortest column.
  let best = { x: left, y: columns[0].y + columns[0].height + SPACING }
  for (const column of columns) {
    const y = column.y + column.height + SPACING
    if (y < best.y) best = { x: column.x, y }
  }
  return best
}

type Rects = Record<string, FloatingRect>

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** The stored rectangles that are rectangles; anything else (corrupt, another shape) is dropped. */
function validRects(raw: unknown): Rects | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const rects: Rects = {}
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const rect = value as Partial<FloatingRect> | null
    if (rect && typeof rect === 'object' && finite(rect.x) && finite(rect.y) && finite(rect.width) && finite(rect.height) && rect.width > 0 && rect.height > 0) {
      rects[id] = { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    }
  }
  return rects
}

const sameRect = (a: FloatingRect, b: FloatingRect) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

type Gesture = {
  id: string
  /** The title bar moves the window; an edge or corner resizes it. */
  edge: FloatingEdge | 'move'
  pointerId: number
  element: Element
  startX: number
  startY: number
  start: FloatingRect
  last: FloatingRect
  onKey: (event: KeyboardEvent) => void
}

/** The stored rectangles with `id`'s new one last (the most recent): the open windows' and the `KEEP_CLOSED` most recent others. */
function withRect(stored: Rects, id: string, rect: FloatingRect, open: ReadonlySet<string>): Rects {
  const closed = Object.keys(stored).filter((other) => other !== id && !open.has(other))
  const kept = new Set(closed.slice(-KEEP_CLOSED))
  const next: Rects = {}
  for (const [other, value] of Object.entries(stored)) if (other !== id && (open.has(other) || kept.has(other))) next[other] = value
  next[id] = rect
  return next
}

/** A window's body: rendered again only when its `render` changes, never while a window moves. */
const WindowBody = memo(function WindowBody({ render }: { render: () => ReactNode }) {
  return <>{render()}</>
})

/**
 * The floating windows layer (see the module's comment). Render it inside an element with a
 * non-static `position` (`relative`) that covers the area the windows may use: the layer fills
 * that element and keeps every window inside it.
 */
export function FloatingPanels(props: FloatingPanelsProps) {
  // No windows: nothing drawn, nothing read, nothing listened to.
  if (props.panels.length === 0) return null
  return <FloatingLayer {...props} />
}

function FloatingLayer({ kit, store, panels, onClose, focused, onFocus, defaultSize = DEFAULT_SIZE, minSize = MIN_SIZE, testId = 'floating' }: FloatingPanelsProps) {
  const ui = useElements()
  const t = useKitUiText()
  const [rects, setRects] = useKitStore<Rects>(kit, store, { initial: {}, validate: validRects, maxBytes: MAX_BYTES })
  const ids = panels.map((panel) => panel.id)
  const latest = useRef({ focused, onFocus, setRects, minSize, ids })
  latest.current = { focused, onFocus, setRects, minSize, ids }

  // The layer's size: what a window stays inside.
  const layer = useRef<HTMLDivElement>(null)
  const [bounds, setBounds] = useState<FloatingSize | null>(null)
  useLayoutEffect(() => {
    const element = layer.current
    if (!element) return undefined
    const measure = () => {
      const { width, height } = element.getBoundingClientRect()
      setBounds((current) => (width > 0 && height > 0 ? (current?.width === width && current.height === height ? current : { width, height }) : null))
    }
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure)
      observer.observe(element)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Z-order, bottom to top: windows raised so far, then any new ones (a new window opens on top).
  const [stack, setStack] = useState<readonly string[]>([])
  const order = [...stack.filter((id) => ids.includes(id)), ...ids.filter((id) => !stack.includes(id))]
  const orderRef = useRef(order)
  orderRef.current = order
  const raise = useCallback((id: string) => {
    const current = orderRef.current
    if (current[current.length - 1] === id) return
    setStack([...current.filter((other) => other !== id), id])
  }, [])
  useEffect(() => {
    if (focused !== null) raise(focused)
  }, [focused, raise])
  const activate = useCallback(
    (id: string) => {
      raise(id)
      if (latest.current.focused !== id) latest.current.onFocus(id)
    },
    [raise],
  )

  // The gesture in progress and the rectangle it shows; the store is written once, when it ends.
  const gesture = useRef<Gesture | null>(null)
  const [live, setLive] = useState<{ id: string; rect: FloatingRect } | null>(null)
  const boundsRef = useRef(bounds)
  boundsRef.current = bounds

  const finish = useCallback(() => {
    const current = gesture.current
    if (!current) return
    gesture.current = null
    window.removeEventListener('keydown', current.onKey, true)
    try {
      if (current.element.hasPointerCapture?.(current.pointerId)) current.element.releasePointerCapture(current.pointerId)
    } catch {
      // The pointer is gone already.
    }
    setLive(null)
    if (sameRect(current.last, current.start)) return
    const open = new Set(latest.current.ids)
    latest.current.setRects((stored) => withRect(stored, current.id, current.last, open))
  }, [])
  // A gesture that outlives its layer, or its window (closed or hidden), still stores where it ended.
  useEffect(() => finish, [finish])
  const visible = panels.filter((panel) => !panel.uiId || !ui.state(panel.uiId).hidden)
  const visibleKey = visible.map((panel) => panel.id).join('\n')
  useEffect(() => {
    if (gesture.current && !visibleKey.split('\n').includes(gesture.current.id)) finish()
  }, [finish, visibleKey])

  const start = (event: ReactPointerEvent<HTMLElement>, id: string, edge: Gesture['edge'], rect: FloatingRect) => {
    if (event.button !== 0 || event.isPrimary === false || gesture.current) return
    // The close button (and anything else pressable in the title bar) is not a handle.
    if (edge === 'move' && (event.target as Element).closest?.('button, input, select, textarea, a[href]')) return
    event.preventDefault()
    const element = event.currentTarget
    // The press keeps no focus of its own (preventDefault): take it into the window from outside,
    // so a field in another window, or the editor, stops taking keys.
    const window_ = element.closest<HTMLElement>('.kui-floating-panel')
    if (window_ && !window_.contains(document.activeElement)) window_.focus({ preventScroll: true })
    try {
      element.setPointerCapture?.(event.pointerId)
    } catch {
      // A pointer the browser no longer tracks: the gesture still ends on release.
    }
    const onKey = (key: KeyboardEvent) => {
      if (key.key !== 'Escape' || composing(key)) return
      key.preventDefault()
      key.stopPropagation()
      finish()
    }
    window.addEventListener('keydown', onKey, true)
    gesture.current = { id, edge, pointerId: event.pointerId, element, startX: event.clientX, startY: event.clientY, start: rect, last: rect, onKey }
  }

  const move = (event: ReactPointerEvent<HTMLElement>) => {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    // No button held: the release went somewhere else; the gesture ends where it got to.
    if (event.buttons === 0) {
      finish()
      return
    }
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    const { start: from } = current
    const area = boundsRef.current
    const min = latest.current.minSize
    const next = current.edge === 'move' ? clampFloatingRect({ ...from, x: from.x + dx, y: from.y + dy }, area, min) : resizeFloatingRect(from, current.edge, dx, dy, area, min)
    if (sameRect(next, current.last)) return
    current.last = next
    setLive({ id: current.id, rect: next })
  }

  const end = (event: ReactPointerEvent<HTMLElement>) => {
    if (gesture.current?.pointerId === event.pointerId) finish()
  }

  // Each open window's automatic place, kept while it stays open (closing one never moves
  // another). Kept in a ref during render: placing is idempotent, so a render React drops
  // places the same windows the same way again.
  const placed = useRef(new Map<string, { x: number; y: number }>())
  for (const id of [...placed.current.keys()]) if (!ids.includes(id)) placed.current.delete(id)
  const shown = new Map<string, FloatingRect>()
  const rectOf = (id: string) => (live?.id === id ? live.rect : (rects[id] ?? (placed.current.has(id) ? { ...placed.current.get(id)!, ...defaultSize } : undefined)))
  for (const panel of visible) {
    const rect = rectOf(panel.id)
    if (rect) shown.set(panel.id, clampFloatingRect(rect, bounds, minSize))
  }
  for (const panel of visible) {
    if (shown.has(panel.id)) continue
    const at = automaticFloatingPosition([...shown.values()], bounds)
    // Placed for good once the layer has its size; until then (its first frame) only drawn.
    if (bounds) placed.current.set(panel.id, at)
    shown.set(panel.id, clampFloatingRect({ ...at, ...defaultSize }, bounds, minSize))
  }

  return (
    <div ref={layer} className="kui-floating-layer" data-testid={testId}>
      {visible.map((panel) => {
        const rect = shown.get(panel.id)!
        const handlers = (edge: Gesture['edge']) => ({
          onPointerDown: (event: ReactPointerEvent<HTMLElement>) => start(event, panel.id, edge, rect),
          onPointerMove: move,
          onPointerUp: end,
          onPointerCancel: end,
          onLostPointerCapture: end,
        })
        return (
          <section
            key={panel.id}
            className="kui-floating-panel"
            role="region"
            aria-label={panel.title}
            tabIndex={-1}
            data-kit-ui-id={panel.uiId}
            data-testid={`${testId}-${panel.id}`}
            data-focused={focused === panel.id}
            style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height, zIndex: 1 + order.indexOf(panel.id) }}
            onPointerDownCapture={() => activate(panel.id)}
            onFocusCapture={() => activate(panel.id)}
          >
            <div className="kui-floating-title" data-kit-ui-id={panel.uiId} data-testid={`${testId}-${panel.id}-title`} {...handlers('move')}>
              <span className="kui-floating-title-text">{panel.title}</span>
              <IconButton icon={X} label={t('floatingPanelClose', { title: panel.title })} data-kit-ui-id={panel.uiId} data-testid={`${testId}-${panel.id}-close`} onClick={() => onClose(panel.id)} />
            </div>
            <div className="kui-floating-body">
              <WindowBody render={panel.render} />
            </div>
            {EDGES.map((edge) => (
              <div key={edge} className="kui-floating-resize" data-edge={edge} title={t('floatingPanelResize')} data-kit-ui-id={panel.uiId} data-testid={`${testId}-${panel.id}-resize-${edge}`} {...handlers(edge)} />
            ))}
          </section>
        )
      })}
    </div>
  )
}
