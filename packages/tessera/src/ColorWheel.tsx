/**
 * A colour wheel with a lightness slider at its left: the generic form of upstream Film's Lumetri
 * `color_wheel` (`panels/lumetri.rs`). The hue ring shows the direction, and the puck's offset
 * from the centre is the value, `[x, y]` with y up and a length of at most 1 (the puck's travel
 * ends inside the ring). A click sets the offset, a drag follows the pointer, a double-click
 * resets it to `[0, 0]`; the lightness slider spans -100 (bottom) to 100 (top). Reports as
 * `useDragGesture` describes: a drag is `begin`, `merge`s (at most one per frame), and `end`; a
 * click, a key, or a double-click is `end` alone. Keys: the arrows nudge by 0.01 (Shift 0.1) and
 * Home resets; on the lightness slider, the arrows step by 1 (Shift 10), Home and End go to its
 * ends. The hue ring is the content's colours; everything else is drawn with the theme tokens.
 */
import { useEffect, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { clamp, composing, useDragGesture, useKitUiText, type DragPhase } from './colorGesture'

export type ColorWheelProps = {
  /** The offset, `[x, y]`, y up, of length at most 1. */
  value: readonly [number, number]
  /** -100 to 100. */
  lightness: number
  onChange: (value: [number, number], phase: DragPhase) => void
  onLightness: (value: number, phase: DragPhase) => void
  /** Shown above the wheel, and its accessible name. */
  label: string
  /**
   * The wheel's side in CSS pixels (120 by default, upstream's largest). The control is `size + 18`
   * px wide: the lightness strip (16 px and a 2 px gap) sits outside the wheel, where upstream draws
   * it inside the wheel's square. To fit upstream's row of three wheels (Film's Lumetri Color
   * Wheels, Task 29), pass `size = min((available - 24) / 3, 120) - 18`.
   */
  size?: number
  disabled?: boolean
  /** The wheel's Kit UI id. */
  uiId?: string
  /** The lightness slider's Kit UI id. */
  lightnessUiId?: string
  testId?: string
}

/** How far the puck travels from the centre in a wheel `size` wide (upstream: the ring's inside less 4 px). */
export function wheelRadius(size: number): number {
  return size / 2 - 4 - 10 - 4
}

const round4 = (value: number) => Math.round(value * 10000) / 10000 + 0

/** The offset for a pointer `dx`, `dy` from the centre (screen pixels, y down) on a wheel whose puck travels `radius`. */
export function wheelValueAt(dx: number, dy: number, radius: number): [number, number] {
  const x = dx / radius
  const y = dy / radius
  const length = Math.hypot(x, y)
  if (length < 1e-6) return [0, 0]
  const scale = Math.min(length, 1) / length
  return [round4(x * scale), round4(-y * scale)]
}

/** The lightness at `clientY` on a track box (its top and height): 100 at the top, -100 at the bottom. */
export function lightnessAt(clientY: number, box: { top: number; height: number }): number {
  if (box.height <= 0) return 0
  const center = box.top + box.height / 2
  return clamp(((center - clientY) / (box.height / 2)) * 100, -100, 100) + 0
}

/** Upstream's ring: hue 0 (red) at the right, going round clockwise on screen. */
const RING = `conic-gradient(from 90deg, ${Array.from({ length: 13 }, (_, i) => `hsl(${i * 30} 75% 50%)`).join(', ')})`

export function ColorWheel({ value, lightness, onChange, onLightness, label, size = 120, disabled, uiId, lightnessUiId, testId }: ColorWheelProps) {
  const t = useKitUiText()
  const wheel = useDragGesture<[number, number]>(onChange, [value[0], value[1]])
  const light = useDragGesture<number>(onLightness, lightness)

  useEffect(() => {
    if (!disabled) return
    wheel.finish()
    light.finish()
  }, [disabled])

  function offsetAt(event: ReactPointerEvent<Element>) {
    const box = event.currentTarget.getBoundingClientRect()
    return wheelValueAt(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2), wheelRadius(box.width))
  }

  function onWheelDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || !wheel.accepts(event)) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    // The second press of a double-click is not a step: the double-click resets the offset.
    const second = event.detail >= 2
    wheel.start(event, second ? wheel.shown : offsetAt(event), !second)
  }

  function onWheelMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!wheel.owns(event)) return
    if ((event.buttons & 1) === 0) return wheel.end(event)
    wheel.move(offsetAt(event))
  }

  function onWheelKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled || composing(event)) return
    const step = event.shiftKey ? 0.1 : 0.01
    const moves: Record<string, [number, number]> = { ArrowRight: [step, 0], ArrowLeft: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
    let next: [number, number]
    if (event.key === 'Home') next = [0, 0]
    else if (event.key in moves) {
      const x = wheel.shown[0] + moves[event.key][0]
      const y = wheel.shown[1] + moves[event.key][1]
      const length = Math.hypot(x, y)
      const scale = length > 1 ? 1 / length : 1
      next = [round4(x * scale), round4(y * scale)]
    } else return
    event.preventDefault()
    event.stopPropagation()
    onChange(next, 'end')
  }

  function onLightDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || !light.accepts(event)) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    light.start(event, lightnessAt(event.clientY, event.currentTarget.getBoundingClientRect()), true)
  }

  function onLightMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!light.owns(event)) return
    if ((event.buttons & 1) === 0) return light.end(event)
    light.move(lightnessAt(event.clientY, event.currentTarget.getBoundingClientRect()))
  }

  function onLightKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled || composing(event)) return
    const step = event.shiftKey ? 10 : 1
    const from = light.shown
    const keys: Record<string, number> = { ArrowUp: from + step, ArrowRight: from + step, ArrowDown: from - step, ArrowLeft: from - step, Home: -100, End: 100 }
    if (!(event.key in keys)) return
    event.preventDefault()
    event.stopPropagation()
    onLightness(clamp(keys[event.key], -100, 100), 'end')
  }

  const [x, y] = wheel.shown
  const shownLight = light.shown
  const travel = wheelRadius(size)
  const dx = round4(x * travel)
  const dy = round4(y * travel)
  const at = (offset: number, sign: '+' | '-') => `calc(50% ${offset < 0 ? (sign === '+' ? '-' : '+') : sign} ${Math.abs(offset)}px)`
  return (
    <div className="kui-color-wheel" data-testid={testId} data-disabled={disabled || undefined} style={{ '--kui-color-wheel-size': `${size}px`, '--kui-color-wheel-ring': RING } as CSSProperties}>
      <span className="kui-color-wheel-label">{label}</span>
      <div className="kui-color-wheel-body">
        <div
          className="kui-color-wheel-lightness"
          role="slider"
          aria-orientation="vertical"
          tabIndex={disabled ? -1 : 0}
          aria-label={t('colorWheelLightness', { label })}
          aria-valuemin={-100}
          aria-valuemax={100}
          aria-valuenow={Math.round(shownLight)}
          aria-disabled={disabled || undefined}
          data-kit-ui-id={lightnessUiId}
          data-testid={testId ? `${testId}-lightness` : undefined}
          onPointerDown={onLightDown}
          onPointerMove={onLightMove}
          onPointerUp={(event) => light.end(event)}
          onPointerCancel={(event) => light.end(event)}
          onLostPointerCapture={(event) => light.end(event)}
          onKeyDown={onLightKey}
        >
          <span className="kui-color-wheel-lightness-knob" style={{ top: `${(1 - (clamp(shownLight, -100, 100) + 100) / 200) * 100}%` }} data-testid={testId ? `${testId}-lightness-knob` : undefined} />
        </div>
        <div
          className="kui-color-wheel-wheel"
          role="group"
          aria-roledescription={t('colorWheel')}
          tabIndex={disabled ? -1 : 0}
          aria-label={t('colorWheelOffset', { label, x: x.toFixed(2), y: y.toFixed(2) })}
          aria-disabled={disabled || undefined}
          data-kit-ui-id={uiId}
          data-dragging={wheel.dragging || undefined}
          data-testid={testId ? `${testId}-wheel` : undefined}
          onPointerDown={onWheelDown}
          onPointerMove={onWheelMove}
          onPointerUp={(event) => wheel.end(event)}
          onPointerCancel={(event) => wheel.end(event)}
          onLostPointerCapture={(event) => wheel.end(event)}
          onKeyDown={onWheelKey}
          onDoubleClick={() => {
            if (!disabled) onChange([0, 0], 'end')
          }}
        >
          <span className="kui-color-wheel-cross" />
          <span className="kui-color-wheel-puck" style={{ left: at(dx, '+'), top: at(dy, '-') }} data-testid={testId ? `${testId}-puck` : undefined} />
        </div>
      </div>
    </div>
  )
}
