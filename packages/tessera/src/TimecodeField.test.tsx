// @vitest-environment jsdom
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimecodeField, formatTimecode, parseTimecode } from './TimecodeField'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom has no PointerEvent (https://github.com/jsdom/jsdom/issues/2527); a MouseEvent with the
// right type and a pointerId reaches React's pointer handlers just the same (see NumberField.test.tsx).
if (typeof PointerEvent === 'undefined') {
  class FakePointerEvent extends MouseEvent {
    pointerId: number
    constructor(type: string, params: MouseEventInit & { pointerId?: number } = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
    }
  }
  globalThis.PointerEvent = FakePointerEvent as unknown as typeof PointerEvent
}

const nativeInputValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!

let host: HTMLDivElement
let roots: Root[] = []
afterEach(() => {
  for (const root of roots) act(() => root.unmount())
  roots = []
  host?.remove()
})

function render(node: ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  act(() => root.render(node))
  return root
}

const readout = () => host.querySelector('[data-testid="tc"]') as HTMLElement
const input = () => host.querySelector('input') as HTMLInputElement | null

function pointer(type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', clientX: number) {
  act(() => {
    readout().dispatchEvent(new PointerEvent(type, { clientX, pointerId: 1, button: 0, bubbles: true }))
  })
}

/** A press and release in place: the readout turns into a text field. */
function startTyping() {
  pointer('pointerdown', 10)
  pointer('pointerup', 10)
}

function type(text: string) {
  act(() => {
    const field = input()!
    nativeInputValue.call(field, text)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function key(name: string) {
  act(() => {
    input()!.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }))
  })
}

describe('formatTimecode', () => {
  it('writes hours, minutes, seconds, and frames', () => {
    expect(formatTimecode(3661.5, 24)).toBe('01:01:01:12')
    expect(formatTimecode(0, 25)).toBe('00:00:00:00')
  })

  it('counts drop frame at 29.97 with semicolons, as the engine does', () => {
    // 1800 frames at 30000/1001 is the first label after minute 1's two dropped labels.
    expect(formatTimecode((1800 * 1001) / 30000, 29.97, true)).toBe('00;01;00;02')
    // Sixty wall-clock seconds are 1798.2 frames.
    expect(formatTimecode(60, 29.97, true)).toBe('00;00;59;28')
    expect(formatTimecode((17982 * 1001) / 30000, 29.97, true)).toBe('00;10;00;00')
    // Drop frame never applies at a rate that does not support it.
    expect(formatTimecode(60, 25, true)).toBe('00:01:00:00')
  })

  it('pads frames to three digits at 100 fps and above', () => {
    expect(formatTimecode(1.5, 120)).toBe('00:00:01:060')
  })

  it('keeps huge times to whole-number fields', () => {
    for (const seconds of [1e300, -1e300, Number.MAX_VALUE, 1e20]) {
      const text = formatTimecode(seconds, 24)
      expect(text).toMatch(/^-?\d+:\d\d:\d\d:\d\d$/)
    }
    expect(formatTimecode(1e300, 24)).toBe(formatTimecode((Number.MAX_SAFE_INTEGER / 24) * 2, 24))
  })
})

describe('parseTimecode', () => {
  it('reads full timecodes and digits filled from the right', () => {
    expect(parseTimecode('00:00:10:00', 25)).toBe(10)
    expect(parseTimecode('1:00', 24)).toBe(1)
    expect(parseTimecode('1000', 25)).toBe(10)
    expect(parseTimecode('1.00', 25)).toBe(1)
    expect(parseTimecode('00;01;00;02', 29.97, true)).toBeCloseTo((1800 * 1001) / 30000, 9)
  })

  it('reads frames relative to the current time', () => {
    expect(parseTimecode('+10', 24, false, 1)).toBeCloseTo(34 / 24, 9)
    expect(parseTimecode('-5', 24, false, 1)).toBeCloseTo(19 / 24, 9)
    expect(parseTimecode('-1.00', 25, false, 4)).toBeCloseTo(3, 9)
  })

  it('reads signed fields as the engine does (Rust `i64::parse` takes a sign)', () => {
    expect(parseTimecode('1:+5', 24)).toBeCloseTo(29 / 24, 9)
    expect(parseTimecode('1:-5', 24)).toBeCloseTo(19 / 24, 9)
    expect(parseTimecode('+1:+5', 24, false, 1)).toBeCloseTo(53 / 24, 9)
    expect(parseTimecode('1:+', 24)).toBeNull()
    expect(parseTimecode('1:+-5', 24)).toBeNull()
    expect(parseTimecode('+-5', 24)).toBeNull()
    expect(parseTimecode('--5', 24)).toBeNull()
  })

  it('refuses numbers beyond the safe integers', () => {
    expect(parseTimecode('+99999999999999999999', 24)).toBeNull()
    expect(parseTimecode('1:99999999999999999999', 24)).toBeNull()
    expect(parseTimecode('9999999999999:00:00:00', 24)).toBeNull()
  })

  it('refuses anything else', () => {
    expect(parseTimecode('', 24)).toBeNull()
    expect(parseTimecode('abc', 24)).toBeNull()
    expect(parseTimecode('1:2:3:4:5', 24)).toBeNull()
    expect(parseTimecode('f', 24)).toBeNull()
    // Upstream's parser has no frame-count suffix.
    expect(parseTimecode('48f', 24)).toBeNull()
    expect(parseTimecode('48F', 24)).toBeNull()
    expect(parseTimecode('+10f', 24, false, 1)).toBeNull()
  })
})

describe('TimecodeField', () => {
  it('shows the formatted time with its label', () => {
    render(<TimecodeField value={1} fps={24} label="Playhead Position" accent uiId="control:program.timecode" testId="tc" />)
    expect(readout().textContent).toBe('00:00:01:00')
    expect(readout().getAttribute('aria-label')).toBe('Playhead Position')
    expect(readout().getAttribute('data-kit-ui-id')).toBe('control:program.timecode')
    expect(readout().getAttribute('data-accent')).toBe('true')
  })

  it('commits typed text on Enter with final true', () => {
    const onChange = vi.fn()
    render(<TimecodeField value={1} fps={24} label="Time" onChange={onChange} testId="tc" />)
    startTyping()
    expect(input()).not.toBeNull()
    expect(input()!.value).toBe('00:00:01:00')
    type('+10')
    key('Enter')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toBeCloseTo(34 / 24, 9)
    expect(onChange.mock.calls[0][1]).toBe(true)
    expect(input()).toBeNull()
  })

  it('reverts invalid text without calling onChange', () => {
    const onChange = vi.fn()
    render(<TimecodeField value={1} fps={24} label="Time" onChange={onChange} testId="tc" />)
    startTyping()
    type('soon')
    key('Enter')
    expect(onChange).not.toHaveBeenCalled()
    expect(input()).toBeNull()
    expect(readout().textContent).toBe('00:00:01:00')
  })

  it('reverts on Escape', () => {
    const onChange = vi.fn()
    render(<TimecodeField value={1} fps={24} label="Time" onChange={onChange} testId="tc" />)
    startTyping()
    type('5:00')
    key('Escape')
    expect(onChange).not.toHaveBeenCalled()
    expect(readout().textContent).toBe('00:00:01:00')
  })

  it('commits on blur', () => {
    const onChange = vi.fn()
    render(<TimecodeField value={0} fps={24} label="Time" onChange={onChange} testId="tc" />)
    startTyping()
    type('2:00')
    act(() => input()!.blur())
    expect(onChange).toHaveBeenCalledWith(2, true)
  })

  it('reverts a frame count ending in f, as upstream does', () => {
    const onChange = vi.fn()
    render(<TimecodeField value={1} fps={24} label="Time" onChange={onChange} testId="tc" />)
    startTyping()
    type('48f')
    key('Enter')
    expect(onChange).not.toHaveBeenCalled()
    expect(readout().textContent).toBe('00:00:01:00')
  })

  it('scrubs one frame per 2 px and reports once more on release', () => {
    const onChange = vi.fn()
    render(<TimecodeField value={1} fps={24} label="Time" onChange={onChange} testId="tc" />)
    pointer('pointerdown', 100)
    pointer('pointermove', 110)
    pointer('pointermove', 120)
    expect(readout().textContent).toBe('00:00:01:10')
    pointer('pointerup', 120)
    const calls = onChange.mock.calls
    expect(calls.at(-1)![0]).toBeCloseTo(34 / 24, 9)
    expect(calls.at(-1)![1]).toBe(true)
    expect(calls.slice(0, -1).every((call) => call[1] === false)).toBe(true)
    expect(calls[0][0]).toBeCloseTo(29 / 24, 9)
    expect(input()).toBeNull()
  })

  it('reverts to the start time when the scrub is cancelled', () => {
    const onChange = vi.fn()
    render(<TimecodeField value={1} fps={24} label="Time" onChange={onChange} testId="tc" />)
    pointer('pointerdown', 100)
    pointer('pointermove', 120)
    expect(onChange).toHaveBeenLastCalledWith(34 / 24, false)
    pointer('pointercancel', 120)
    expect(onChange).toHaveBeenLastCalledWith(1, true)
    expect(readout().textContent).toBe('00:00:01:00')
    expect(input()).toBeNull()
  })

  it('never scrubs below zero', () => {
    const onChange = vi.fn()
    render(<TimecodeField value={0.5} fps={24} label="Time" onChange={onChange} testId="tc" />)
    pointer('pointerdown', 100)
    pointer('pointermove', 0)
    pointer('pointerup', 0)
    expect(onChange).toHaveBeenLastCalledWith(0, true)
  })

  it('is read-only without onChange', () => {
    render(<TimecodeField value={1} fps={24} label="Duration" testId="tc" />)
    startTyping()
    expect(input()).toBeNull()
    expect(readout().getAttribute('aria-readonly')).toBe('true')
  })
})
