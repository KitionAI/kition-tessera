/** @jsxRuntime automatic */
/**
 * A scrubbable number field (Photoshop-style drag value): a label that scrubs the value
 * horizontally and a text input that accepts a typed number; with `track`, a slider row instead
 * (the label at the start, the field at the end, and a slider under them, as Photoshop's
 * Properties panel draws Opacity or an adjustment's values). Styled only through the Kit UI
 * protocol's theme tokens (styles.css).
 */
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'

export type NumberFieldProps = {
  label: string
  /**
   * The field's accessible name and tooltip when `label` is a symbol rather than words
   * (Photoshop's Character panel labels its fields with glyphs: tT, A↕, VA); `label` by default.
   */
  name?: string
  value: number
  min: number
  max: number
  /** Step for arrows and scrubbing; decimals shown follow it (1 → integer). */
  step?: number
  unit?: string
  /** Called while scrubbing with `final: false`, and once with `final: true` on release, Enter, or blur. */
  onChange: (value: number, final: boolean) => void
  disabled?: boolean
  width?: number
  testId?: string
  /** A Kit UI id when the field is a declared element. */
  uiId?: string
  /** A slider row: the label and field on one line, a slider from `min` to `max` under them. */
  track?: boolean
  /**
   * Hot text (Premiere's, upstream Film's `widgets::hot_number`): the value and its unit drawn as
   * accent text, without a box or a visible label (`label` names it). Dragged sideways it scrubs
   * by `speed` per CSS pixel (Shift ten times faster, Cmd, Ctrl, or Alt ten times finer), reporting
   * `final: false` per move and the last value again with `final: true` on release; a click opens
   * a field to type into, which commits on Enter or blur and leaves unchanged on Escape.
   */
  hot?: boolean
  /** Hot text: value units per CSS pixel dragged (`step` by default). */
  speed?: number
  /** Hot text: called once a typed edit ends (Enter, Escape, or blur), so the editor can take the focus back. */
  onDone?: () => void
}

/** How many decimals `step` implies: `1` → none, `0.1` → one, `0.01` → two. */
function decimalsOf(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0
  const text = String(step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

function format(value: number, step: number): string {
  return value.toFixed(decimalsOf(step))
}

/** A typed number, comma or dot decimal; `null` for anything else. */
function parse(text: string): number | null {
  const normalized = text.trim().replace(',', '.')
  if (normalized === '') return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Rounds to the precision `step` implies, so arithmetic drift (`0.2 + 0.1`) never reaches a caller. */
function round(value: number, step: number): number {
  return Number(value.toFixed(decimalsOf(step)))
}

/**
 * `min`/`max` rounded to `step`'s precision, moved back inside the original range when rounding
 * pushed them out of it (`round(10.06, 0.1)` is `10.1`, past a `max` of `10.06`): `Math.floor` for
 * `max`, `Math.ceil` for `min`, at that same precision, so a bound is never crossed.
 */
function roundedBound(value: number, step: number, mode: 'floor' | 'ceil'): number {
  const rounded = round(value, step)
  const insideMax = mode === 'floor' && rounded <= value
  const insideMin = mode === 'ceil' && rounded >= value
  if (insideMax || insideMin) return rounded
  const factor = 10 ** decimalsOf(step)
  return (mode === 'floor' ? Math.floor(value * factor) : Math.ceil(value * factor)) / factor
}

/** The drag-value multiplier for modifier keys: Shift scrubs faster, Alt scrubs finer. */
function dragMultiplier(event: { shiftKey: boolean; altKey: boolean }): number {
  if (event.shiftKey) return 10
  if (event.altKey) return 0.1
  return 1
}

/** An in-progress scrub gesture: where it started, the last value it reached, and whether that
 * value was ever reported (a press with no move reports nothing). */
type Drag = { pointerId: number; startX: number; startValue: number; last: number; sent: boolean; element: HTMLSpanElement }

/** An in-progress slider gesture: the last value it reached, and whether it ever reported one. */
type Slide = { pointerId: number; last: number; sent: boolean; element: HTMLDivElement }

export function NumberField(props: NumberFieldProps) {
  return props.hot ? <HotNumber {...props} /> : <BoxedNumberField {...props} />
}

/** Hot text's press: where it started and the last value it reported, if any. */
type HotPress = { pointerId: number; startX: number; startValue: number; last: number; moved: boolean; sent: boolean; element: HTMLElement; onEscape: (event: KeyboardEvent) => void }

/** The `hot` form of `NumberField` (see its props). */
function HotNumber({ label, name, value, min, max, step = 1, unit, speed, onChange, onDone, disabled, testId, uiId }: NumberFieldProps) {
  const [typing, setTyping] = useState<string | null>(null)
  const press = useRef<HotPress | null>(null)
  const field = useRef<HTMLInputElement | null>(null)
  const ended = useRef(false)
  const latestChange = useRef(onChange)
  latestChange.current = onChange

  // A scrub that outlives its field, or whose field turns disabled, still ends with its final value.
  useEffect(() => () => {
    if (press.current) finishPress(press.current, true)
  }, [])
  useEffect(() => {
    if (disabled && press.current) finishPress(press.current, true)
  }, [disabled])

  useEffect(() => {
    if (typing === null) return
    field.current?.focus()
    field.current?.select()
  }, [typing === null])

  function resolve(raw: number): number {
    return clamp(round(raw, step), roundedBound(min, step, 'ceil'), roundedBound(max, step, 'floor'))
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (disabled || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    // Escape during a scrub ends it with its last value, taken before anything else hears it (a
    // surrounding dialog would cancel).
    const onEscape = (key: KeyboardEvent) => {
      if (key.key !== 'Escape' || key.isComposing || key.keyCode === 229 || press.current !== current) return
      key.preventDefault()
      key.stopPropagation()
      finishPress(current, true)
    }
    const current: HotPress = { pointerId: event.pointerId, startX: event.clientX, startValue: value, last: value, moved: false, sent: false, element: event.currentTarget, onEscape }
    press.current = current
    window.addEventListener('keydown', onEscape, true)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const current = press.current
    if (disabled || !current || current.pointerId !== event.pointerId) return
    // The button is up but no release arrived (it happened outside, or was swallowed): the drag is over.
    if ((event.buttons & 1) === 0) {
      onPointerUp(event, true)
      return
    }
    const dx = event.clientX - current.startX
    if (!current.moved && Math.abs(dx) <= 2) return
    current.moved = true
    const fine = event.metaKey || event.ctrlKey || event.altKey
    const next = resolve(current.startValue + dx * (speed ?? step) * (event.shiftKey ? 10 : fine ? 0.1 : 1))
    if (next === current.last) return
    current.last = next
    current.sent = true
    onChange(next, false)
  }

  /**
   * Ends a press: on release (`up`), or when the system takes the pointer away (`pointercancel`,
   * lost capture). Every drag that reported a value ends with a final one, even back where it
   * began or cut short, so the caller's drag always closes; only a release without a move opens
   * the field.
   */
  function onPointerUp(event: ReactPointerEvent<HTMLElement>, cancelled: boolean) {
    const current = press.current
    if (!current || current.pointerId !== event.pointerId) return
    finishPress(current, cancelled)
  }

  function finishPress(current: HotPress, cancelled: boolean) {
    press.current = null
    window.removeEventListener('keydown', current.onEscape, true)
    if (current.element.hasPointerCapture?.(current.pointerId)) current.element.releasePointerCapture(current.pointerId)
    if (current.moved) {
      if (current.sent) latestChange.current(current.last, true)
    } else if (!cancelled && !disabled) {
      ended.current = false
      setTyping(format(value, step))
    }
  }

  function end(commitText: string | null) {
    if (ended.current) return
    ended.current = true
    setTyping(null)
    if (commitText !== null) {
      const trimmed = commitText.trim()
      const bare = unit?.trim() && trimmed.endsWith(unit.trim()) ? trimmed.slice(0, -unit.trim().length) : trimmed
      const parsed = parse(bare)
      if (parsed !== null) {
        const next = resolve(parsed)
        if (next !== value) onChange(next, true)
      }
    }
    onDone?.()
  }

  function onKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    // Keys that compose text (an input method) are the method's.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Enter') {
      event.preventDefault()
      end(event.currentTarget.value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      end(null)
    }
  }

  function onButtonKey(event: ReactKeyboardEvent<HTMLElement>) {
    if (disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      ended.current = false
      setTyping(format(value, step))
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      // The field's own key: the editor's shortcuts do not see it.
      event.preventDefault()
      event.stopPropagation()
      const next = resolve(value + (event.key === 'ArrowUp' ? 1 : -1) * step * (event.shiftKey ? 10 : 1))
      if (next !== value) onChange(next, true)
    }
  }

  const text = `${format(value, step)}${unit ?? ''}`
  return (
    <span className="kui-hot-number" data-kit-ui-id={uiId} data-testid={testId} data-disabled={disabled || undefined}>
      {typing !== null ? (
        <input
          ref={field}
          className="kui-field kui-hot-number-input"
          type="text"
          inputMode="decimal"
          aria-label={name ?? label}
          value={typing}
          onChange={(event) => setTyping(event.target.value)}
          onKeyDown={onKey}
          onBlur={(event) => end(event.currentTarget.value)}
          data-testid={testId ? `${testId}-input` : undefined}
        />
      ) : (
        <span
          className="kui-hot-number-value"
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-label={name ?? label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={text}
          aria-disabled={disabled || undefined}
          title={name ?? label}
          data-testid={testId ? `${testId}-value` : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => onPointerUp(event, false)}
          onPointerCancel={(event) => onPointerUp(event, true)}
          onLostPointerCapture={(event) => onPointerUp(event, true)}
          onKeyDown={onButtonKey}
        >
          {text}
        </span>
      )}
    </span>
  )
}

function BoxedNumberField({ label, name, value, min, max, step = 1, unit, onChange, disabled, width, testId, uiId, track }: NumberFieldProps) {
  const [text, setText] = useState(() => format(value, step))
  const editing = useRef(false)
  const drag = useRef<Drag | null>(null)
  const slide = useRef<Slide | null>(null)
  // The slider's value while it is dragged (the caller's `value` may follow a step behind).
  const [sliding, setSliding] = useState<number | null>(null)

  // A drag in progress is local state too: an external `value` change (another kit, a host undo)
  // must not overwrite the text mid-scrub, only once the gesture ends.
  useEffect(() => {
    if (editing.current || drag.current || slide.current) return
    setText(format(value, step))
  }, [value, step])

  // A gesture that outlives its own field (the host disables it mid-drag) still has to end
  // cleanly: release the pointer, stop scrubbing, and report a final value only if one was
  // already on its way out.
  useEffect(() => {
    if (!disabled) return
    const current = drag.current
    if (!current) return
    endDrag(current)
  }, [disabled])

  function resolve(raw: number): number {
    const lo = roundedBound(min, step, 'ceil')
    const hi = roundedBound(max, step, 'floor')
    return clamp(round(raw, step), lo, hi)
  }

  function endDrag(current: Drag) {
    drag.current = null
    current.element.releasePointerCapture?.(current.pointerId)
    if (current.sent && current.last !== value) {
      setText(format(current.last, step))
      onChange(current.last, true)
    } else {
      setText(format(value, step))
    }
  }

  function commit(raw: string, final: boolean) {
    const parsed = parse(raw)
    if (parsed === null) {
      setText(format(value, step))
      return
    }
    const next = resolve(parsed)
    setText(format(next, step))
    if (next !== value) onChange(next, final)
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    if (disabled) return
    editing.current = true
    setText(event.target.value)
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (disabled) return
    if (event.key === 'Enter') {
      event.preventDefault()
      editing.current = false
      commit(text, true)
    } else if (event.key === 'Escape') {
      // Escape reverts typed text, and keeps the key only then: with nothing to revert it is the
      // page's (a dialog's Cancel).
      if (text !== format(value, step)) event.preventDefault()
      editing.current = false
      setText(format(value, step))
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const delta = (event.key === 'ArrowUp' ? 1 : -1) * step * (event.shiftKey ? 10 : 1)
      const next = resolve(value + delta)
      editing.current = false
      setText(format(next, step))
      onChange(next, true)
    }
  }

  function onBlur() {
    if (disabled || !editing.current) return
    editing.current = false
    commit(text, true)
  }

  function onPointerDown(event: ReactPointerEvent<HTMLSpanElement>) {
    if (disabled) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startValue: value, last: value, sent: false, element: event.currentTarget }
  }

  function scrubbed(event: ReactPointerEvent<HTMLSpanElement>, current: Drag): number {
    const steps = (event.clientX - current.startX) / 2
    return resolve(current.startValue + steps * step * dragMultiplier(event))
  }

  function onPointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    if (disabled) return
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const next = scrubbed(event, current)
    current.last = next
    current.sent = true
    setText(format(next, step))
    onChange(next, false)
  }

  function onPointerUp(event: ReactPointerEvent<HTMLSpanElement>) {
    if (disabled) return
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    current.last = scrubbed(event, current)
    current.sent = true
    endDrag(current)
  }

  /** The value at `clientX` on the slider's track. */
  function slid(clientX: number, element: HTMLDivElement): number {
    const box = element.getBoundingClientRect()
    const fraction = box.width > 0 ? clamp((clientX - box.left) / box.width, 0, 1) : 0
    return resolve(min + fraction * (max - min))
  }

  function slideTo(next: number, current: Slide) {
    current.last = next
    setSliding(next)
    setText(format(next, step))
    if (next !== value || current.sent) {
      current.sent = true
      onChange(next, false)
    }
  }

  function onSlideDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const current: Slide = { pointerId: event.pointerId, last: value, sent: false, element: event.currentTarget }
    slide.current = current
    slideTo(slid(event.clientX, current.element), current)
  }

  function onSlideMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = slide.current
    if (disabled || !current || current.pointerId !== event.pointerId) return
    slideTo(slid(event.clientX, current.element), current)
  }

  function onSlideUp(event: ReactPointerEvent<HTMLDivElement>) {
    const current = slide.current
    if (!current || current.pointerId !== event.pointerId) return
    slide.current = null
    setSliding(null)
    current.element.releasePointerCapture?.(current.pointerId)
    if (current.sent) onChange(current.last, true)
    else setText(format(value, step))
  }

  function onSlideKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const delta = step * (event.shiftKey ? 10 : 1)
    const keys: Record<string, number> = { ArrowRight: value + delta, ArrowUp: value + delta, ArrowLeft: value - delta, ArrowDown: value - delta, Home: min, End: max }
    if (!(event.key in keys)) return
    event.preventDefault()
    const next = resolve(keys[event.key])
    setText(format(next, step))
    if (next !== value) onChange(next, true)
  }

  const valueText = unit ? `${format(value, step)} ${unit}` : format(value, step)
  const scrubLabel = (className: string) => (
    <span
      className={className}
      data-testid={testId ? `${testId}-label` : undefined}
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {label}
    </span>
  )
  const field = (
    <div className="kui-number-field" data-kit-ui-id={track ? undefined : uiId} data-testid={track ? undefined : testId} title={track ? undefined : name} style={width && !track ? { width } : undefined}>
      {track ? null : scrubLabel('kui-number-field-label')}
      <input
        className="kui-field kui-number-field-input"
        type="text"
        inputMode="decimal"
        role="spinbutton"
        aria-label={name ?? label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        value={text}
        disabled={disabled}
        onChange={onInput}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
      {unit ? <span className="kui-number-field-unit">{unit}</span> : null}
    </div>
  )
  if (!track) return field
  const shown = sliding ?? value
  const fraction = max > min ? clamp((shown - min) / (max - min), 0, 1) : 0
  return (
    <div className="kui-slider-row" data-kit-ui-id={uiId} data-testid={testId} title={name} data-disabled={disabled || undefined} style={width ? { width } : undefined}>
      <div className="kui-slider-row-head">
        {scrubLabel('kui-slider-row-label')}
        {field}
      </div>
      <div
        className="kui-slider"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={name ?? label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={shown}
        aria-valuetext={valueText}
        aria-disabled={disabled || undefined}
        onPointerDown={onSlideDown}
        onPointerMove={onSlideMove}
        onPointerUp={onSlideUp}
        onPointerCancel={onSlideUp}
        onKeyDown={onSlideKey}
        data-testid={testId ? `${testId}-track` : undefined}
      >
        <span className="kui-slider-fill" style={{ width: `${fraction * 100}%` }} />
        <span className="kui-slider-knob" style={{ left: `${fraction * 100}%` }} />
      </div>
    </div>
  )
}
