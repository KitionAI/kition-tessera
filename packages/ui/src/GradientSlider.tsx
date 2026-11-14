/** @jsxRuntime automatic */
/**
 * A slider on a thin (or gradient) track with a ring knob and scrubbable hot text at the right:
 * the generic form of upstream Film's Lumetri `slider` (`panels/lumetri.rs`). A click on the
 * track sets an absolute value in the soft range, a drag follows the pointer, a double-click
 * restores `default`, and the hot text scrubs or takes a typed value over the full range. Values
 * are rounded to `decimals`. Reports as `useDragGesture` describes: a drag is `begin`, `merge`s
 * (at most one per frame), and `end`; a click, a key, a typed value, or a double-click is `end`
 * alone. Styled through the theme tokens; the gradient is the caller's (`stops`).
 */
import { useEffect, useRef, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { clamp, composing, schedule, unschedule, useDragGesture, type DragPhase } from './colorGesture'
import { NumberField } from './NumberField'

export type GradientSliderProps = {
  value: number
  min: number
  max: number
  /** The track's range (upstream's `soft_min`/`soft_max`); `min` and `max` by default. The hot text reaches `min`..`max`. */
  softMin?: number
  softMax?: number
  /** Decimals a value is rounded to (0 by default). */
  decimals?: number
  /** Restored by a double-click on the track; no double-click without it. */
  default?: number
  /** CSS gradient stops for the track (Temperature, Tint, Hue; see `SLIDER_GRADIENTS`); a plain track when absent. */
  stops?: readonly string[]
  label: string
  onChange: (value: number, phase: DragPhase) => void
  disabled?: boolean
  uiId?: string
  testId?: string
}

/** Upstream's Lumetri gradients (`Gradient::Temp`, `Tint`, `Hue`) as CSS stops. */
export const SLIDER_GRADIENTS = {
  temperature: ['rgb(70, 120, 230)', 'rgb(240, 150, 50)'],
  tint: ['rgb(60, 190, 80)', 'rgb(220, 70, 200)'],
  hue: Array.from({ length: 13 }, (_, i) => `hsl(${i * 30} 80% 50%)`),
} as const satisfies Record<string, readonly string[]>

const roundTo = (value: number, decimals: number) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** The value at `fraction` of the track (clamped to it), rounded to `decimals`. */
export function sliderValueAt(fraction: number, softMin: number, softMax: number, decimals: number): number {
  return roundTo(softMin + clamp(fraction, 0, 1) * (softMax - softMin), decimals)
}

/** Where `value` sits on the track, 0 to 1 (clamped to the soft range). */
export function sliderFraction(value: number, softMin: number, softMax: number): number {
  return softMax > softMin ? clamp((value - softMin) / (softMax - softMin), 0, 1) : 0
}

/** Hot text's open scrub: whether it began and the latest value waiting for a frame. */
type HotScrub = { last: number; frame: number | null }

export function GradientSlider({ value, min, max, softMin = min, softMax = max, decimals = 0, default: fallback, stops, label, onChange, disabled, uiId, testId }: GradientSliderProps) {
  const gesture = useDragGesture<number>(onChange, value)
  const hot = useRef<HotScrub | null>(null)
  const latest = useRef(onChange)
  latest.current = onChange
  const unmounted = useRef(false)

  useEffect(() => {
    if (disabled) gesture.finish()
  }, [disabled])

  // A hot-text scrub cut short by unmounting ends with its last value, and no frame merges after
  // it (the hot text's own ending, in whichever order the two run, is ignored after this).
  useEffect(
    () => () => {
      const open = hot.current
      unmounted.current = true
      hot.current = null
      if (!open) return
      if (open.frame !== null) unschedule(open.frame)
      latest.current(open.last, 'end')
    },
    [],
  )

  function valueAt(clientX: number, element: Element) {
    const box = element.getBoundingClientRect()
    return sliderValueAt(box.width > 0 ? (clientX - box.left) / box.width : 0, softMin, softMax, decimals)
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || !gesture.accepts(event)) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    // The second press of a double-click is not a step: the double-click restores the default.
    const second = event.detail >= 2
    gesture.start(event, second ? gesture.shown : valueAt(event.clientX, event.currentTarget), !second)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!gesture.owns(event)) return
    if ((event.buttons & 1) === 0) return gesture.end(event)
    gesture.move(valueAt(event.clientX, event.currentTarget))
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled || composing(event)) return
    const step = roundTo((softMax - softMin) / 100, decimals) || 10 ** -decimals
    const by = (sign: number) => clamp(roundTo(gesture.shown + sign * step * (event.shiftKey ? 10 : 1), decimals), min, max)
    const keys: Record<string, () => number> = {
      ArrowRight: () => by(1),
      ArrowUp: () => by(1),
      ArrowLeft: () => by(-1),
      ArrowDown: () => by(-1),
      Home: () => softMin,
      End: () => softMax,
    }
    const next = keys[event.key]
    if (!next) return
    event.preventDefault()
    event.stopPropagation()
    onChange(next(), 'end')
  }

  function onDoubleClick() {
    if (disabled || fallback === undefined) return
    onChange(fallback, 'end')
  }

  /** Hot text reports `final: false` per move and `final: true` once: begin, merges per frame, end. */
  function onHot(next: number, final: boolean) {
    if (unmounted.current) return
    const open = hot.current
    if (final) {
      hot.current = null
      if (open?.frame != null) unschedule(open.frame)
      onChange(next, 'end')
      return
    }
    if (!open) {
      hot.current = { last: next, frame: null }
      onChange(next, 'begin')
      return
    }
    open.last = next
    if (open.frame !== null) return
    open.frame = schedule(() => {
      open.frame = null
      if (hot.current === open) onChange(open.last, 'merge')
    })
  }

  const shown = gesture.shown
  const fraction = sliderFraction(shown, softMin, softMax)
  const style = stops?.length ? ({ '--kui-gradient-slider-track': `linear-gradient(to right, ${stops.join(', ')})` } as CSSProperties) : undefined
  const step = Number((10 ** -decimals).toFixed(decimals))
  return (
    <div className="kui-gradient-slider" data-kit-ui-id={uiId} data-testid={testId} data-disabled={disabled || undefined}>
      <span className="kui-gradient-slider-label" title={label}>
        {label}
      </span>
      <div
        className="kui-gradient-slider-track"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={shown}
        aria-valuetext={shown.toFixed(decimals)}
        aria-disabled={disabled || undefined}
        data-gradient={stops?.length ? '' : undefined}
        data-dragging={gesture.dragging || undefined}
        style={style}
        data-testid={testId ? `${testId}-track` : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => gesture.end(event)}
        onPointerCancel={(event) => gesture.end(event)}
        onLostPointerCapture={(event) => gesture.end(event)}
        onKeyDown={onKeyDown}
        onDoubleClick={onDoubleClick}
      >
        <span className="kui-gradient-slider-knob" style={{ left: `${Math.round(fraction * 1000000) / 10000}%` }} data-testid={testId ? `${testId}-knob` : undefined} />
      </div>
      <span className="kui-gradient-slider-value">
        <NumberField hot label={label} value={shown} min={min} max={max} step={step} speed={(softMax - softMin) / 300} onChange={onHot} disabled={disabled} testId={testId ? `${testId}-value` : undefined} />
      </span>
    </div>
  )
}
