/**
 * A parameter's keyframe lane (upstream Film `panels/effect_controls.rs` `param_row`): its
 * keyframes along a time range, a diamond for linear, a square for hold, and a circle for the
 * Bezier and ease kinds, in the accent colour when selected. A click selects one (Shift adds), a
 * click in the empty lane clears the selection, a drag moves the selected keyframes (snapped,
 * kept inside the range, reported once on release), the arrow keys step them one frame, and a
 * right-click asks for the keyframe's menu. Styled only through the Kit UI protocol's theme tokens
 * (styles.css).
 *
 * Only the keyframes in view take part: those within a hair of the range (upstream skips a keyframe
 * whose place along the lane is outside −0.01..=1.01). A selected keyframe out of view is neither
 * drawn, dragged, nor stepped, so it never holds a drag back.
 *
 * A drag moves the keyframes' elements directly, without a React render per pointer move; the
 * lane renders again only when its props change.
 */
import { useRef, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { useStrings } from './context'
import { formatTimecode } from './TimecodeField'
import type { ContextMenuPoint } from './ui'

export type Keyframe = { id: string; time: number; selected?: boolean; interpolation?: 'linear' | 'bezier' | 'hold' | 'easeIn' | 'easeOut' | 'autoBezier' | 'continuousBezier' }

export type KeyframeLaneProps = {
  keyframes: readonly Keyframe[]
  /** Visible range in seconds and the lane's width map times to x. */
  start: number
  end: number
  onSelect: (ids: string[], add: boolean) => void
  /** Called once on release with the dragged ids and the time delta. */
  onMove: (ids: string[], delta: number) => void
  snap?: (time: number) => number
  /** Frames per second: an arrow key moves the selected keyframes one frame (30 by default). */
  fps?: number
  /** A keyframe's menu was asked for at a screen point (upstream's interpolation menu). */
  onMenu?: (id: string, at: ContextMenuPoint) => void
  /** The Kit UI id every keyframe carries (`control:effects.keyframe`). */
  uiId?: string
  testId?: string
}

/** How a keyframe of each interpolation is drawn (upstream: linear a diamond, hold a square, the rest a circle). */
function shapeOf(interpolation: Keyframe['interpolation']): 'diamond' | 'square' | 'circle' {
  if (!interpolation || interpolation === 'linear') return 'diamond'
  if (interpolation === 'hold') return 'square'
  return 'circle'
}

/** How far outside the range, as a fraction of it, a keyframe is still in view (upstream `param_row`). */
const VIEW_SLACK = 0.01

/** How far (CSS pixels) a press may wander and still count as a click. */
const CLICK_SLOP = 2

/** An in-progress press: the keyframes it drags, the one under the pointer, and how far it went. */
type Press = {
  pointerId: number
  startX: number
  width: number
  /** The keyframe pressed; null for a press in the empty lane. */
  anchor: Keyframe | null
  ids: string[]
  /** Whether the press is on a keyframe that was already selected, with no Shift. */
  onSelected: boolean
  moved: boolean
  delta: number
  element: HTMLElement
}

function useLaneLabels() {
  const t = useStrings()
  return { lane: t('keyframeLane'), at: (time: string) => t('keyframeAt', { time }) }
}

export function KeyframeLane({ keyframes, start, end, onSelect, onMove, snap, fps = 30, onMenu, uiId, testId }: KeyframeLaneProps) {
  const labels = useLaneLabels()
  const elements = useRef(new Map<string, HTMLElement>())
  const press = useRef<Press | null>(null)
  const span = end - start
  const inView = (key: Keyframe) => {
    const at = (key.time - start) / span
    return at >= -VIEW_SLACK && at <= 1 + VIEW_SLACK
  }
  const shown = span > 0 ? keyframes.filter(inView) : []
  const selected = shown.filter((key) => key.selected)

  /** The time delta a drag of `dx` CSS pixels gives: snapped, and kept inside the range (a keyframe already a hair outside it is not pushed in). */
  function deltaFor(current: Press, dx: number): number {
    if (!current.anchor || current.width <= 0) return 0
    const raw = current.anchor.time + (dx * span) / current.width
    const target = snap ? snap(raw) : raw
    const times = shown.filter((key) => current.ids.includes(key.id)).map((key) => key.time)
    const low = Math.min(0, start - Math.min(...times))
    const high = Math.max(0, end - Math.max(...times))
    return Math.min(high, Math.max(low, target - current.anchor.time))
  }

  /** Shows the dragged keyframes offset by `delta` seconds, or back in place for zero. */
  function place(current: Press, delta: number) {
    const px = current.width > 0 && span > 0 ? (delta * current.width) / span : 0
    for (const id of current.ids) {
      const element = elements.current.get(id)
      if (element) element.style.transform = delta === 0 ? '' : `translateX(${Math.round(px * 1000) / 1000}px)`
    }
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-keyframe-id]')
    const anchor = target ? (shown.find((key) => key.id === target.dataset.keyframeId) ?? null) : null
    const box = event.currentTarget.getBoundingClientRect()
    let ids: string[] = []
    let onSelected = false
    if (anchor) {
      if (anchor.selected && !event.shiftKey) {
        ids = selected.map((key) => key.id)
        onSelected = true
      } else {
        onSelect([anchor.id], event.shiftKey)
        ids = event.shiftKey ? [...new Set([...selected.map((key) => key.id), anchor.id])] : [anchor.id]
      }
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.currentTarget.focus({ preventScroll: true })
    press.current = { pointerId: event.pointerId, startX: event.clientX, width: box.width, anchor, ids, onSelected, moved: false, delta: 0, element: event.currentTarget }
  }

  function track(current: Press, clientX: number) {
    const dx = clientX - current.startX
    if (!current.moved && Math.abs(dx) <= CLICK_SLOP) return
    current.moved = true
    const delta = deltaFor(current, dx)
    if (delta === current.delta) return
    current.delta = delta
    place(current, delta)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = press.current
    if (!current || current.pointerId !== event.pointerId || !current.anchor) return
    track(current, event.clientX)
  }

  function finish(event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) {
    const current = press.current
    if (!current || current.pointerId !== event.pointerId) return
    press.current = null
    current.element.releasePointerCapture?.(current.pointerId)
    if (current.anchor && !cancelled) track(current, event.clientX)
    place(current, 0)
    if (cancelled) return
    if (!current.anchor) {
      if (!current.moved && keyframes.some((key) => key.selected)) onSelect([], false)
      return
    }
    if (current.moved) {
      if (current.delta !== 0) onMove(current.ids, current.delta)
    } else if (current.onSelected && keyframes.filter((key) => key.selected).length > 1) {
      // A click on one of several selected keyframes selects it alone.
      onSelect([current.anchor.id], false)
    }
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && press.current) {
      event.preventDefault()
      const current = press.current
      press.current = null
      current.element.releasePointerCapture?.(current.pointerId)
      place(current, 0)
      return
    }
    if ((event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') || selected.length === 0) return
    // The lane's own key: the editor's shortcuts (a playhead step) do not see it too.
    event.preventDefault()
    event.stopPropagation()
    const frame = 1 / (fps > 0 ? fps : 30)
    onMove(
      selected.map((key) => key.id),
      event.key === 'ArrowRight' ? frame : -frame,
    )
  }

  function onContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-keyframe-id]')
    if (!target || !onMenu) return
    event.preventDefault()
    onMenu(target.dataset.keyframeId!, { x: event.clientX, y: event.clientY })
  }

  return (
    <div
      className="kui-keyframe-lane"
      role="listbox"
      aria-label={labels.lane}
      aria-multiselectable="true"
      tabIndex={0}
      data-testid={testId}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => finish(event, false)}
      onPointerCancel={(event) => finish(event, true)}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}
    >
      {shown.map((key) => (
        <span
          key={key.id}
          ref={(element) => {
            if (element) elements.current.set(key.id, element)
            else elements.current.delete(key.id)
          }}
          className="kui-keyframe"
          role="option"
          aria-selected={!!key.selected}
          aria-label={labels.at(formatTimecode(key.time, fps))}
          data-keyframe-id={key.id}
          data-shape={shapeOf(key.interpolation)}
          data-kit-ui-id={uiId}
          data-testid={testId ? `${testId}-${key.id}` : undefined}
          style={{ left: `${((key.time - start) / span) * 100}%` }}
        />
      ))}
    </div>
  )
}
