/** @jsxRuntime automatic */
/**
 * A tone or hue curve: the generic form of upstream Film's Lumetri `curve_editor`
 * (`panels/lumetri.rs`). Points are `[x, y]` in 0..1, kept in x order. A drag that starts within
 * 9 px of a point moves it (past its neighbours too, as upstream's; the points are reported in x
 * order); a drag that starts elsewhere adds a point there; a double-click on a point removes it (an RGB curve keeps its end
 * points), and a double-click in empty space resets an RGB curve to `[[0, 0], [1, 1]]`. An RGB
 * curve is a square; a hue curve (`kind: 'hue'`) is periodic in x, 0.45 as tall as wide, with a
 * hue strip below, and level at 0.5 without points. The drawn line is `samples` when the caller
 * gives them (the engine's), else the engine's own interpolation (`sampleCurve`). Reports as
 * `useDragGesture` describes: a drag is `begin`, `merge`s (at most one per frame), and `end`; a
 * key or a double-click is `end` alone. Keys: on a point, the arrows nudge it by 0.01 (Shift
 * 0.1) and Delete or Backspace removes it; Enter on the plot adds a point on the curve in the
 * widest gap. Drawn with the theme tokens (`color` for the line, the caller's).
 */
import { useEffect, useRef, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { clamp, composing, useDragGesture, useKitUiText, type DragPhase } from './colorGesture'

export type CurvePoint = readonly [number, number]
export type CurveKind = 'rgb' | 'hue'

export type CurveEditorProps = {
  points: readonly CurvePoint[]
  /** 'rgb': a square with protected end points; 'hue': periodic in x, a hue strip below, 0.45 aspect. */
  kind: CurveKind
  /** The curve's samples to draw (0..1 over x), given by the caller; `sampleCurve`'s by default. */
  samples?: readonly number[]
  /** The line and points' CSS colour; the theme's text colour by default. */
  color?: string
  onChange: (points: CurvePoint[], phase: DragPhase) => void
  /** The plot's accessible name ("Curve" by default). */
  label?: string
  disabled?: boolean
  uiId?: string
  testId?: string
}

/** An RGB curve's neutral points. */
export const RGB_IDENTITY: readonly CurvePoint[] = [
  [0, 0],
  [1, 1],
]

/** How close two points may come in x. */
const GAP = 0.001
/** How near a press must be to a point to take it, in CSS pixels (upstream's 9). */
const HIT = 9
/** How far a press moves before it is a drag, in CSS pixels. */
const SLOP = 3
/** Samples drawn when the caller gives none (upstream's 128). */
const DRAWN = 128

const round4 = (value: number) => Math.round(value * 10000) / 10000 + 0
const point = (x: number, y: number): [number, number] => [round4(clamp(x, 0, 1)), round4(clamp(y, 0, 1))]

/** The points in x order (a stable sort), as new arrays. */
export function sortCurve(points: readonly CurvePoint[]): [number, number][] {
  return points.map((p) => [p[0], p[1]] as [number, number]).sort((a, b) => a[0] - b[0])
}

/**
 * The engine's interpolation (`effects.rs` `curve_lut`): a monotone cubic (Fritsch–Carlson)
 * through the points in x order (repeated x dropped), level outside them; the identity without
 * points, and level with one.
 */
function interpolator(points: readonly CurvePoint[]): (x: number) => number {
  const pts: [number, number][] = []
  for (const p of sortCurve(points)) if (!pts.length || Math.abs(pts[pts.length - 1][0] - p[0]) >= 1e-6) pts.push(p)
  if (pts.length === 0) return (x) => x
  if (pts.length === 1) return () => pts[0][1]
  const m = pts.length
  const d = Array.from({ length: m - 1 }, (_, i) => (pts[i + 1][1] - pts[i][1]) / Math.max(pts[i + 1][0] - pts[i][0], 1e-6))
  const t = new Array<number>(m).fill(0)
  t[0] = d[0]
  t[m - 1] = d[m - 2]
  for (let i = 1; i < m - 1; i += 1) t[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2
  for (let i = 0; i < m - 1; i += 1) {
    if (Math.abs(d[i]) < 1e-9) {
      t[i] = 0
      t[i + 1] = 0
      continue
    }
    const a = t[i] / d[i]
    const b = t[i + 1] / d[i]
    const h = a * a + b * b
    if (h > 9) {
      const k = 3 / Math.sqrt(h)
      t[i] = k * a * d[i]
      t[i + 1] = k * b * d[i]
    }
  }
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1]
    if (x >= pts[m - 1][0]) return pts[m - 1][1]
    let i = 0
    while (i < m - 2 && pts[i + 1][0] <= x) i += 1
    const hh = pts[i + 1][0] - pts[i][0]
    const u = (x - pts[i][0]) / hh
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1
    const h10 = u ** 3 - 2 * u ** 2 + u
    const h01 = -2 * u ** 3 + 3 * u ** 2
    const h11 = u ** 3 - u ** 2
    return h00 * pts[i][1] + h10 * hh * t[i] + h01 * pts[i + 1][1] + h11 * hh * t[i + 1]
  }
}

/** A hue curve's points repeated one period either side, squeezed into 0..1 (the engine's `hue_lut`). */
function wrapped(points: readonly CurvePoint[]): CurvePoint[] {
  return [-1, 0, 1].flatMap((offset) => points.map((p) => [(p[0] + offset + 1) / 3, p[1]] as const))
}

/**
 * `n` samples of the curve over x in 0..1, as the engine draws and applies it (`curve_lut`, and
 * `hue_lut` for a hue curve: wrapped in x, level at 0.5 without points).
 */
export function sampleCurve(points: readonly CurvePoint[], n: number, kind: CurveKind): number[] {
  if (kind === 'hue') {
    if (!points.length) return new Array<number>(n).fill(0.5)
    const at = interpolator(wrapped(points))
    return Array.from({ length: n }, (_, j) => at((n + j) / (3 * n - 1)))
  }
  const at = interpolator(points)
  return Array.from({ length: n }, (_, j) => at(n > 1 ? j / (n - 1) : 0))
}

/** The curve's value at `x`. */
function valueAt(points: readonly CurvePoint[], x: number, kind: CurveKind): number {
  if (kind === 'hue') return points.length ? interpolator(wrapped(points))((x + 1) / 3) : 0.5
  return interpolator(points)(x)
}

/**
 * The points (in x order) with point `index` moved to `to` inside the square, and the moved
 * point's index among them. A point may pass its neighbours, as upstream's (`from_screen` only
 * clamps to the square, and the engine sorts the points); the moved point keeps its place among
 * points at the same x, as the engine's stable sort does.
 */
export function moveCurvePoint(points: readonly CurvePoint[], index: number, to: CurvePoint): { points: [number, number][]; index: number } {
  const next = sortCurve(points)
  next[index] = point(to[0], to[1])
  const order = next.map((p, i) => ({ p, i })).sort((a, b) => a.p[0] - b.p[0])
  return { points: order.map(({ p }) => p), index: order.findIndex(({ i }) => i === index) }
}

/** The points (in x order) with one added at `at`, and its index; `null` when a point is already at that x. */
export function addCurvePoint(points: readonly CurvePoint[], at: CurvePoint): { points: [number, number][]; index: number } | null {
  const next = sortCurve(points)
  const added = point(at[0], at[1])
  if (next.some((p) => Math.abs(p[0] - added[0]) < GAP)) return null
  const index = next.findIndex((p) => p[0] > added[0])
  const slot = index === -1 ? next.length : index
  next.splice(slot, 0, added)
  return { points: next, index: slot }
}

/** The points (in x order) without point `index`; `null` for an RGB curve's end points. */
export function removeCurvePoint(points: readonly CurvePoint[], index: number, kind: CurveKind): [number, number][] | null {
  const next = sortCurve(points)
  if (kind === 'rgb' && (index === 0 || index === next.length - 1)) return null
  next.splice(index, 1)
  return next
}

/** The index (in x order) of the point nearest `at` (pixels from the plot's top left, `size` its width and height) within `radius` px. */
export function hitCurvePoint(points: readonly CurvePoint[], at: readonly [number, number], size: readonly [number, number], radius = HIT): number | null {
  let best: number | null = null
  let bestDistance = radius
  sortCurve(points).forEach((p, i) => {
    const distance = Math.hypot(p[0] * size[0] - at[0], size[1] - p[1] * size[1] - at[1])
    if (distance < bestDistance) {
      best = i
      bestDistance = distance
    }
  })
  return best
}

/** A press on the plot: where it began, the point it took (if any), and the points it reached. */
type Press = { x: number; y: number; index: number | null; dragging: boolean; points: [number, number][] }

export function CurveEditor({ points, kind, samples, color, onChange, label, disabled, uiId, testId }: CurveEditorProps) {
  const t = useKitUiText()
  const gesture = useDragGesture<readonly CurvePoint[]>((value, phase) => onChange(value as CurvePoint[], phase), points)
  const press = useRef<Press | null>(null)
  const plot = useRef<HTMLDivElement | null>(null)
  const shown = sortCurve(gesture.shown)

  useEffect(() => {
    if (disabled) gesture.finish()
  }, [disabled])

  function local(event: { clientX: number; clientY: number }, element: Element) {
    const box = element.getBoundingClientRect()
    return { px: event.clientX - box.left, py: event.clientY - box.top, w: box.width, h: box.height }
  }
  const unit = (px: number, py: number, w: number, h: number): CurvePoint => point(w > 0 ? px / w : 0, h > 0 ? (h - py) / h : 0)

  function focusPoint(index: number | null) {
    const target = index === null ? plot.current : plot.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)
    target?.focus({ preventScroll: true })
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || !gesture.accepts(event)) return
    event.preventDefault()
    const { px, py, w, h } = local(event, event.currentTarget)
    const index = hitCurvePoint(shown, [px, py], [w, h])
    focusPoint(index)
    press.current = { x: event.clientX, y: event.clientY, index, dragging: false, points: shown }
    gesture.start(event, press.current.points, false)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = press.current
    if (!current || !gesture.owns(event)) return
    if ((event.buttons & 1) === 0) return gesture.end(event)
    const { px, py, w, h } = local(event, event.currentTarget)
    if (!current.dragging) {
      if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < SLOP) return
      if (current.index === null) {
        const start = local({ clientX: current.x, clientY: current.y }, event.currentTarget)
        const added = addCurvePoint(current.points, unit(start.px, start.py, start.w, start.h))
        if (!added) return
        current.points = added.points
        current.index = added.index
      }
      current.dragging = true
    }
    const moved = moveCurvePoint(current.points, current.index!, unit(px, py, w, h))
    current.points = moved.points
    current.index = moved.index
    gesture.move(current.points)
  }

  function onPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (!gesture.owns(event)) return
    press.current = null
    gesture.end(event)
  }

  function onDoubleClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (disabled) return
    const { px, py, w, h } = local(event, event.currentTarget)
    const index = hitCurvePoint(shown, [px, py], [w, h])
    if (index !== null) {
      const next = removeCurvePoint(shown, index, kind)
      if (next) onChange(next, 'end')
    } else if (kind === 'rgb') {
      onChange(sortCurve(RGB_IDENTITY), 'end')
    }
  }

  function onPointKey(event: ReactKeyboardEvent<HTMLSpanElement>, index: number) {
    if (disabled || composing(event)) return
    const step = event.shiftKey ? 0.1 : 0.01
    const moves: Record<string, [number, number]> = { ArrowRight: [step, 0], ArrowLeft: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
    let next: [number, number][] | null
    if (event.key in moves) {
      const p = shown[index]
      next = moveCurvePoint(shown, index, [p[0] + moves[event.key][0], p[1] + moves[event.key][1]]).points
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      next = removeCurvePoint(shown, index, kind)
    } else return
    event.preventDefault()
    event.stopPropagation()
    if (next) onChange(next, 'end')
  }

  function onPlotKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled || composing(event) || event.target !== event.currentTarget || event.key !== 'Enter') return
    event.preventDefault()
    event.stopPropagation()
    // The middle of the widest gap in x, on the curve.
    const xs = [0, ...shown.map((p) => p[0]), 1]
    let x = 0.5
    let widest = -1
    for (let i = 1; i < xs.length; i += 1) {
      if (xs[i] - xs[i - 1] > widest) {
        widest = xs[i] - xs[i - 1]
        x = (xs[i] + xs[i - 1]) / 2
      }
    }
    const added = addCurvePoint(shown, [x, valueAt(shown, x, kind)])
    if (added) onChange(added.points, 'end')
  }

  const line = samples ?? sampleCurve(shown, DRAWN, kind)
  const polyline = line.map((y, i) => `${round4(line.length > 1 ? i / (line.length - 1) : 0)},${round4(1 - clamp(y, 0, 1))}`).join(' ')
  const style = color ? ({ '--kui-curve-color': color } as CSSProperties) : undefined
  return (
    <div className="kui-curve-editor" data-kind={kind} data-kit-ui-id={uiId} data-testid={testId} data-disabled={disabled || undefined} style={style}>
      <div
        ref={plot}
        className="kui-curve-editor-plot"
        role="group"
        tabIndex={disabled ? -1 : 0}
        aria-label={label ?? t('curveEditor')}
        aria-disabled={disabled || undefined}
        data-testid={testId ? `${testId}-plot` : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={onPointerEnd}
        onDoubleClick={onDoubleClick}
        onKeyDown={onPlotKey}
      >
        <svg className="kui-curve-editor-svg" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((f) => (
            <g key={f} className="kui-curve-editor-grid">
              <line x1={f} y1={0} x2={f} y2={1} vectorEffect="non-scaling-stroke" />
              <line x1={0} y1={f} x2={1} y2={f} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
          <polyline className="kui-curve-editor-line" points={polyline} vectorEffect="non-scaling-stroke" data-testid={testId ? `${testId}-line` : undefined} />
        </svg>
        {kind === 'hue' ? <span className="kui-curve-editor-hue" aria-hidden="true" /> : null}
        {shown.map((p, i) => (
          <span
            key={i}
            className="kui-curve-editor-point"
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={t('curveEditorPoint', { index: i + 1, x: p[0].toFixed(2), y: p[1].toFixed(2) })}
            data-index={i}
            data-active={(gesture.dragging && press.current?.index === i) || undefined}
            data-testid={testId ? `${testId}-point-${i}` : undefined}
            style={{ left: `${round4(p[0] * 100)}%`, top: `${round4((1 - p[1]) * 100)}%` }}
            onKeyDown={(event) => onPointKey(event, i)}
          />
        ))}
      </div>
    </div>
  )
}
