/** @jsxRuntime automatic */
/**
 * A timecode readout that edits in place (upstream Film `widgets.rs` `timecode_label` and
 * `hot_number`, the time crate's `format_timecode_frames` and `parse_timecode`): it shows
 * `hh:mm:ss:ff` (`hh;mm;ss;ff` in drop frame), scrubs one frame per 2 px of horizontal drag, and
 * turns into a text field on a click, where Enter or leaving the field commits and Escape reverts.
 * Styled only through the Kit UI protocol's theme tokens (styles.css).
 */
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'

export type TimecodeFieldProps = {
  /** Seconds. */
  value: number
  fps: number
  dropFrame?: boolean
  /** Called while scrubbing (`final: false`) and once on release, Enter, or blur. */
  onChange?: (seconds: number, final: boolean) => void
  /** Upstream's accent-coloured playhead timecode. */
  accent?: boolean
  label: string
  uiId?: string
  testId?: string
}

/** A frame rate as a fraction, so NTSC rates (29.97 is 30000/1001) count frames exactly. */
type Rate = { num: number; den: number }

/** The exact rate `fps` stands for: an NTSC fraction for 23.976, 29.97, 59.94, and the like. */
function rateOf(fps: number): Rate {
  const safe = Number.isFinite(fps) && fps > 0 ? fps : 30
  const nominal = Math.round(safe * 1.001)
  if (!Number.isInteger(safe) && Math.abs(safe - (nominal * 1000) / 1001) < 0.005) return { num: nominal * 1000, den: 1001 }
  return { num: safe, den: 1 }
}

/** Frames counted per timecode second: 30 for 29.97, 24 for 23.976. */
function timecodeBase(rate: Rate): number {
  return Math.max(1, Math.ceil(rate.num / rate.den - 1e-9))
}

/** Whether drop-frame counting applies (29.97, 59.94, 119.88). */
function supportsDropFrame(rate: Rate): boolean {
  return rate.den === 1001 && timecodeBase(rate) % 30 === 0
}

/** The index of the frame that contains `seconds` (a hair of tolerance against float error). */
function frameAt(seconds: number, rate: Rate): number {
  return Math.floor((seconds * rate.num) / rate.den + 1e-6)
}

/** The time at which frame `frame` starts. */
function secondsOf(frame: number, rate: Rate): number {
  return (frame * rate.den) / rate.num
}

/** A frame count as SMPTE fields, counted as drop frame when `drop` is set. */
function framesToFields(frame: number, rate: Rate, drop: boolean): [boolean, number, number, number, number] {
  const negative = frame < 0
  let n = Math.abs(frame)
  const base = timecodeBase(rate)
  const dropped = base / 15
  if (drop) {
    const perMinute = base * 60 - dropped
    const perTen = perMinute * 10 + dropped
    const tens = Math.floor(n / perTen)
    const rest = n % perTen
    n += dropped * 9 * tens
    if (rest > dropped) n += dropped * Math.floor((rest - dropped) / perMinute)
    n = Math.min(n, Number.MAX_SAFE_INTEGER)
  }
  return [negative, Math.floor(n / (base * 3600)), Math.floor(n / (base * 60)) % 60, Math.floor(n / base) % 60, n % base]
}

/** SMPTE fields as a frame count, counted as drop frame when `drop` is set. */
function fieldsToFrames(h: number, m: number, s: number, f: number, rate: Rate, drop: boolean): number {
  const base = timecodeBase(rate)
  let n = ((h * 3600 + m * 60 + s) * base) + f
  if (drop) {
    const minutes = h * 60 + m
    n -= (base / 15) * (minutes - Math.floor(minutes / 10))
  }
  return n
}

const pad = (value: number, width: number) => String(value).padStart(width, '0')

/**
 * `seconds` as SMPTE timecode, `hh:mm:ss:ff`, or `hh;mm;ss;ff` in drop frame where the rate
 * supports it (as the Film engine writes it). Frames take three digits at 100 fps and above.
 */
export function formatTimecode(seconds: number, fps: number, dropFrame?: boolean): string {
  const rate = rateOf(fps)
  const drop = !!dropFrame && supportsDropFrame(rate)
  // Huge times stop at the largest whole frame count, as the engine's saturating `i64` does at its own.
  const frame = Math.max(-Number.MAX_SAFE_INTEGER, Math.min(Number.MAX_SAFE_INTEGER, frameAt(Number.isFinite(seconds) ? seconds : 0, rate)))
  const [negative, h, m, s, f] = framesToFields(frame, rate, drop)
  const sep = drop ? ';' : ':'
  return `${negative ? '-' : ''}${pad(h, 2)}${sep}${pad(m, 2)}${sep}${pad(s, 2)}${sep}${pad(f, timecodeBase(rate) >= 100 ? 3 : 2)}`
}

/**
 * Typed text as seconds, read the way upstream's timecode fields read it, or `null` when it is not
 * a time. It takes a full timecode with any of `:;.,` between the fields (`01:02:03:04`, `1.00`);
 * bare digits read as `hhmmssff` filled from the right (`1000` is ten seconds); a leading `+` or
 * `-` counts from `current` (`+10` is ten frames later, `-1.00` one second earlier). Nothing else
 * reads as a time (`48f` included), as in upstream's parser. A field of a full timecode may carry
 * its own sign (`1:+5`, `1:-5`), as Rust's `i64::parse` reads it. A number beyond the safe
 * integers reads as `null`, where the engine would saturate.
 */
export function parseTimecode(text: string, fps: number, dropFrame?: boolean, current = 0): number | null {
  const rate = rateOf(fps)
  const trimmed = text.trim()
  if (trimmed === '') return null
  const sign = trimmed[0] === '+' ? 1 : trimmed[0] === '-' ? -1 : 0
  const body = sign === 0 ? trimmed : trimmed.slice(1)
  const parts = body.split(/[:;.,]/)
  let fields: number[]
  if (parts.length === 1) {
    if (!/^\d+$/.test(parts[0])) return null
    if (sign !== 0) {
      // A relative bare number is frames.
      const frames = Number(parts[0])
      return Number.isSafeInteger(frames) ? safeSeconds(frameAt(current, rate) + sign * frames, rate) : null
    }
    fields = []
    for (let end = parts[0].length; end > 0; end -= 2) fields.unshift(Number(parts[0].slice(Math.max(0, end - 2), end)))
  } else {
    if (!parts.every((part) => /^([+-]?\d+)?$/.test(part))) return null
    fields = parts.map((part) => (part === '' ? 0 : Number(part)))
    if (!fields.every(Number.isSafeInteger)) return null
  }
  if (fields.length > 4) return null
  const [h, m, s, f] = [...Array(4 - fields.length).fill(0), ...fields] as number[]
  const base = timecodeBase(rate)
  // Overflowing fields (90 frames) are allowed, as upstream allows them; drop frame only counts
  // a timecode whose fields are in range.
  const drop = !!dropFrame && supportsDropFrame(rate) && m < 60 && s < 60 && f < base
  const frames = fieldsToFrames(h, m, s, f, rate, drop)
  return safeSeconds(sign === 0 ? frames : frameAt(current, rate) + sign * frames, rate)
}

/** A frame count's start time, or null when the count is past the safe integers. */
function safeSeconds(frame: number, rate: Rate): number | null {
  return Number.isSafeInteger(frame) ? secondsOf(frame, rate) : null
}

/** An in-progress scrub: where it started, the frame it reached, and whether it moved at all. */
type Scrub = { pointerId: number; startX: number; startValue: number; startFrame: number; frame: number; moved: boolean; element: HTMLElement }

/** How far (CSS pixels) a press may wander and still count as a click that starts typing. */
const CLICK_SLOP = 2

/** CSS pixels of horizontal drag per frame. */
const PX_PER_FRAME = 2

/**
 * A timecode readout: `value` (seconds) shown as timecode at `fps`. With `onChange` it scrubs
 * (one frame per 2 px, reported with `final: false`, then once with `final: true` on release) and
 * a click turns it into a text field (`parseTimecode`'s forms; Enter or blur commit with
 * `final: true`, Escape or text that is not a time reverts). Without `onChange` it only shows.
 */
export function TimecodeField({ value, fps, dropFrame, onChange, accent, label, uiId, testId }: TimecodeFieldProps) {
  const rate = rateOf(fps)
  const [editing, setEditing] = useState<string | null>(null)
  const [scrubbing, setScrubbing] = useState<number | null>(null)
  const scrub = useRef<Scrub | null>(null)
  const field = useRef<HTMLInputElement>(null)
  // Whether the text field is still open: Enter and Escape close it, and the blur its removal may
  // fire afterwards must not commit a second time.
  const typing = useRef(false)
  // The readout's width when typing starts, so the field takes its place without moving the row.
  const width = useRef<number | null>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const readonly = !onChange

  useEffect(() => {
    if (editing === null) return
    field.current?.focus()
    field.current?.select()
    // Only when typing starts, not on every keystroke.
  }, [editing === null])

  function startTyping() {
    typing.current = true
    width.current = readout.current?.offsetWidth || null
    setEditing(formatTimecode(value, fps, dropFrame))
  }

  function stopTyping() {
    typing.current = false
    setEditing(null)
  }

  function commit(text: string) {
    if (!typing.current) return
    stopTyping()
    const parsed = parseTimecode(text, fps, dropFrame, value)
    if (parsed === null || !onChange) return
    onChange(Math.max(0, parsed), true)
  }

  function onPointerDown(event: ReactPointerEvent<HTMLSpanElement>) {
    if (readonly || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const startFrame = frameAt(value, rate)
    scrub.current = { pointerId: event.pointerId, startX: event.clientX, startValue: value, startFrame, frame: startFrame, moved: false, element: event.currentTarget }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    const current = scrub.current
    if (!current || current.pointerId !== event.pointerId || !onChange) return
    const dx = event.clientX - current.startX
    if (!current.moved && Math.abs(dx) <= CLICK_SLOP) return
    current.moved = true
    const frame = Math.max(0, current.startFrame + Math.round(dx / PX_PER_FRAME))
    if (frame === current.frame) return
    current.frame = frame
    setScrubbing(frame)
    onChange(secondsOf(frame, rate), false)
  }

  function onPointerUp(event: ReactPointerEvent<HTMLSpanElement>) {
    const current = scrub.current
    if (!current || current.pointerId !== event.pointerId) return
    scrub.current = null
    current.element.releasePointerCapture?.(current.pointerId)
    setScrubbing(null)
    if (!current.moved) {
      if (event.type === 'pointerup') startTyping()
      return
    }
    if (current.frame === current.startFrame) return
    // A cancelled scrub (the system took the pointer) reverts to where it started.
    if (event.type === 'pointercancel') onChange?.(current.startValue, true)
    else onChange?.(secondsOf(current.frame, rate), true)
  }

  function onReadoutKey(event: ReactKeyboardEvent<HTMLSpanElement>) {
    if (readonly || (event.key !== 'Enter' && event.key !== 'F2')) return
    event.preventDefault()
    startTyping()
  }

  function onFieldKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit(event.currentTarget.value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      stopTyping()
    }
    // Typing a time must not reach the editor's shortcuts (J, K, L, I, O).
    event.stopPropagation()
  }

  if (editing !== null) {
    return (
      <input
        ref={field}
        className="kui-timecode kui-timecode-input"
        type="text"
        spellCheck={false}
        aria-label={label}
        title={label}
        data-accent={accent || undefined}
        data-kit-ui-id={uiId}
        data-testid={testId ? `${testId}-input` : undefined}
        style={width.current ? { width: width.current } : undefined}
        value={editing}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setEditing(event.target.value)}
        onKeyDown={onFieldKey}
        onBlur={(event) => commit(event.currentTarget.value)}
      />
    )
  }
  const shown = scrubbing === null ? formatTimecode(value, fps, dropFrame) : formatTimecode(secondsOf(scrubbing, rate), fps, dropFrame)
  return (
    <span
      ref={readout}
      className="kui-timecode"
      role="textbox"
      tabIndex={readonly ? undefined : 0}
      aria-label={label}
      aria-readonly={readonly || undefined}
      title={label}
      data-accent={accent || undefined}
      data-readonly={readonly || undefined}
      data-kit-ui-id={uiId}
      data-testid={testId}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onReadoutKey}
    >
      {shown}
    </span>
  )
}
