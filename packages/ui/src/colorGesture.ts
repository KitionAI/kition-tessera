/**
 * The press tracker the colour controls share (`CurveEditor`, `ColorWheel`, `GradientSlider`):
 * one gesture per press, reported as `begin` (the first value a drag reaches), `merge` (the
 * latest value, at most once per animation frame), and `end` (the last value, on release, on
 * Escape, when the pointer is cancelled or its capture is lost, or when the control unmounts). A
 * press that never moves reports its value once, as `end` alone, when the control commits on
 * click; a keyboard change or a double-click is `end` alone too. So a drag is always one history
 * step that ends with a final value, and a click is a step of its own (Film's `begin`/`merge`
 * contract, as `NumberField`'s hot text reports `final`).
 *
 * Only the primary pointer starts a press, and not while one is down. The value a press reached
 * stays drawn after it ends until the caller's value changes (`shown`), so an engine's round trip
 * never snaps the control back for a frame. The control calls `finish()` when it turns disabled
 * mid-press.
 *
 * Escape during a drag is taken in the capture phase and marked handled (`preventDefault`), so a
 * surrounding dialog (`Dialog`, `PreviewDialog`) does not cancel.
 */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useStrings } from './context'

/** Where a value sits in a gesture: the first of a drag, one of its moves, or the last. */
export type DragPhase = 'begin' | 'merge' | 'end'

type Press<T> = {
  pointerId: number
  element: Element
  last: T
  begun: boolean
  /** A press that never moved reports its value on release. */
  clickCommits: boolean
  frame: number | null
  onKey: (event: KeyboardEvent) => void
  /** What was drawn before the press, drawn again when it ends without a step. */
  before: Held<T> | null
}

/** The value drawn in place of the caller's: during a press (`base: null`), or after one until the caller's value (keyed) leaves `base`. */
type Held<T> = { value: T; base: string | null }

const keyOf = (value: unknown) => JSON.stringify(value)

export const schedule = (callback: () => void): number =>
  typeof requestAnimationFrame === 'function' ? requestAnimationFrame(callback) : (setTimeout(callback, 16) as unknown as number)
export const unschedule = (handle: number) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(handle) : clearTimeout(handle))

/** Whether a key belongs to an input method composing text. */
export const composing = (event: { isComposing?: boolean; keyCode?: number; nativeEvent?: { isComposing?: boolean } }) =>
  Boolean(event.isComposing || event.nativeEvent?.isComposing || event.keyCode === 229)

/**
 * One gesture per press over the caller's `value`. `report` gets the values as described above;
 * `shown` is the value to draw.
 */
export function useDragGesture<T>(report: (value: T, phase: DragPhase) => void, value: T) {
  const latest = useRef({ report, value })
  latest.current = { report, value }
  const press = useRef<Press<T> | null>(null)
  const [held, setHeldState] = useState<Held<T> | null>(null)
  const heldNow = useRef<Held<T> | null>(null)
  const setHeld = (next: Held<T> | null) => {
    heldNow.current = next
    setHeldState(next)
  }

  const finish = () => {
    const current = press.current
    if (!current) return
    press.current = null
    if (current.frame !== null) unschedule(current.frame)
    window.removeEventListener('keydown', current.onKey, true)
    if (current.element.hasPointerCapture?.(current.pointerId)) current.element.releasePointerCapture(current.pointerId)
    const committed = current.begun || current.clickCommits
    const base = keyOf(latest.current.value)
    if (!committed) setHeld(current.before)
    else setHeld(keyOf(current.last) !== base ? { value: current.last, base } : null)
    if (committed) latest.current.report(current.last, 'end')
  }

  // A gesture that outlives its control still ends with its final value.
  useEffect(() => finish, [])

  const shown = held && (held.base === null || held.base === keyOf(value)) ? held.value : value
  return {
    shown,
    /** Whether a press is down. */
    dragging: held?.base === null,
    /** Whether `event` may start a press: the primary button of the primary pointer, while none is down. */
    accepts(event: ReactPointerEvent<Element>) {
      return event.button === 0 && event.isPrimary !== false && press.current === null
    },
    /** Starts a press at `value`, capturing the pointer. */
    start(event: ReactPointerEvent<Element>, start: T, clickCommits: boolean) {
      event.currentTarget.setPointerCapture?.(event.pointerId)
      const onKey = (key: KeyboardEvent) => {
        if (key.key !== 'Escape' || composing(key)) return
        key.preventDefault()
        key.stopPropagation()
        finish()
      }
      window.addEventListener('keydown', onKey, true)
      press.current = { pointerId: event.pointerId, element: event.currentTarget, last: start, begun: false, clickCommits, frame: null, onKey, before: heldNow.current }
      setHeld({ value: start, base: null })
    },
    /** Whether `event` belongs to the press in progress. */
    owns(event: { pointerId: number }) {
      return press.current?.pointerId === event.pointerId
    },
    /** The value a drag reached: `begin` at once the first time, then `merge` once per frame. */
    move(next: T) {
      const current = press.current
      if (!current) return
      current.last = next
      setHeld({ value: next, base: null })
      if (!current.begun) {
        current.begun = true
        latest.current.report(next, 'begin')
        return
      }
      if (current.frame !== null) return
      current.frame = schedule(() => {
        current.frame = null
        if (press.current === current) latest.current.report(current.last, 'merge')
      })
    },
    /** Ends the press (release, cancel, lost capture): reports `end` with the last value. */
    end(event: { pointerId: number }) {
      if (press.current?.pointerId === event.pointerId) finish()
    },
    /** Ends any press now, with its last value (the control turned disabled). */
    finish,
  }
}

/** Tessera's strings here (see `useStrings`). */
export const useKitUiText = useStrings

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
