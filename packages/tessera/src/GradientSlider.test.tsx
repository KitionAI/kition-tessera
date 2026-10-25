// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dblclick, get, key, lostCapture, pointer, render, runFrames, setUp, tearDown } from './test/colorControls.testkit'
import { GradientSlider, SLIDER_GRADIENTS, sliderFraction, sliderValueAt, type GradientSliderProps } from './GradientSlider'
import { PreviewDialog } from './PreviewDialog'
import type { DragPhase } from './colorGesture'

// The track spans x 100 to 300 (200 px), so a pixel is 1 unit of the soft range -100..100.
beforeEach(() => setUp((element) => (element.getAttribute('data-testid') === 'slider-track' ? { left: 100, top: 0, width: 200, height: 26 } : { left: 0, top: 0, width: 400, height: 26 })))
afterEach(tearDown)

function slider(props: Partial<GradientSliderProps> = {}) {
  const calls: [number, DragPhase][] = []
  const onChange = vi.fn((value: number, phase: DragPhase) => void calls.push([value, phase]))
  const all: GradientSliderProps = { value: 0, min: -300, max: 300, softMin: -100, softMax: 100, decimals: 1, default: 0, label: 'Temperature', onChange, testId: 'slider', uiId: 'control:lumetri.temperature', ...props }
  const view = render(<GradientSlider {...all} />)
  return { calls, onChange, view, all }
}

describe('GradientSlider value mapping', () => {
  it('maps a track position to a value in the soft range, rounded to the decimals', () => {
    expect(sliderValueAt(0, -100, 100, 1)).toBe(-100)
    expect(sliderValueAt(0.25, -100, 100, 1)).toBe(-50)
    expect(sliderValueAt(1.5, -100, 100, 1)).toBe(100)
    expect(sliderValueAt(-1, -100, 100, 1)).toBe(-100)
    expect(sliderValueAt(1 / 3, 0, 1, 2)).toBe(0.33)
  })

  it('maps a value to its knob position, clamped to the soft range', () => {
    expect(sliderFraction(50, -100, 100)).toBe(0.75)
    expect(sliderFraction(250, -100, 100)).toBe(1)
    expect(sliderFraction(-250, -100, 100)).toBe(0)
    expect(sliderFraction(3, 3, 3)).toBe(0)
  })
})

describe('GradientSlider', () => {
  it('puts the knob at the value and carries the Kit UI id', () => {
    slider({ value: 50 })
    expect(get('slider').getAttribute('data-kit-ui-id')).toBe('control:lumetri.temperature')
    expect(get('slider-knob').style.left).toBe('75%')
    expect(get('slider-track').getAttribute('aria-valuenow')).toBe('50')
  })

  it('sets an absolute value on a click, reported once as the end of its own step', () => {
    const { calls } = slider()
    pointer(get('slider-track'), 'pointerdown', 150, 13)
    pointer(get('slider-track'), 'pointerup', 150, 13)
    expect(calls).toEqual([[-50, 'end']])
  })

  it('clamps a click outside the track to the soft range', () => {
    const { calls } = slider()
    pointer(get('slider-track'), 'pointerdown', 20, 13)
    pointer(get('slider-track'), 'pointerup', 20, 13)
    pointer(get('slider-track'), 'pointerdown', 390, 13)
    pointer(get('slider-track'), 'pointerup', 390, 13)
    expect(calls).toEqual([
      [-100, 'end'],
      [100, 'end'],
    ])
  })

  it('reports one drag as begin once, merges at most once per frame, and the last value on release', () => {
    const { calls } = slider()
    const track = get('slider-track')
    pointer(track, 'pointerdown', 100, 13)
    pointer(track, 'pointermove', 200, 13)
    pointer(track, 'pointermove', 240, 13)
    pointer(track, 'pointermove', 250, 13)
    expect(calls).toEqual([[0, 'begin']])
    runFrames()
    pointer(track, 'pointermove', 260, 13)
    pointer(track, 'pointerup', 260, 13)
    runFrames()
    expect(calls).toEqual([
      [0, 'begin'],
      [50, 'merge'],
      [60, 'end'],
    ])
    // The knob follows the drag before the caller's value does.
    pointer(track, 'pointerdown', 100, 13)
    pointer(track, 'pointermove', 280, 13)
    expect(get('slider-knob').style.left).toBe('90%')
    pointer(track, 'pointerup', 280, 13)
  })

  it('ends a drag with its last value when the pointer capture is lost or cancelled', () => {
    const { calls } = slider()
    const track = get('slider-track')
    pointer(track, 'pointerdown', 100, 13)
    pointer(track, 'pointermove', 220, 13)
    lostCapture(track)
    pointer(track, 'pointerup', 220, 13)
    expect(calls).toEqual([
      [20, 'begin'],
      [20, 'end'],
    ])
    calls.length = 0
    pointer(track, 'pointerdown', 100, 13)
    pointer(track, 'pointermove', 230, 13)
    pointer(track, 'pointercancel', 230, 13)
    expect(calls).toEqual([
      [30, 'begin'],
      [30, 'end'],
    ])
  })

  it('ends a drag when a move arrives with the button already up', () => {
    const { calls } = slider()
    const track = get('slider-track')
    pointer(track, 'pointerdown', 100, 13)
    pointer(track, 'pointermove', 220, 13)
    pointer(track, 'pointermove', 240, 13, { buttons: 0 })
    expect(calls).toEqual([
      [20, 'begin'],
      [20, 'end'],
    ])
  })

  it('ends a drag with its last value when it unmounts', () => {
    const { calls, view } = slider()
    pointer(get('slider-track'), 'pointerdown', 100, 13)
    pointer(get('slider-track'), 'pointermove', 220, 13)
    view.rerender(<div />)
    expect(calls).toEqual([
      [20, 'begin'],
      [20, 'end'],
    ])
  })

  it('restores the default on a double-click, and does nothing without one', () => {
    const { calls } = slider({ value: 40, default: 7 })
    dblclick(get('slider-track'), 150, 13)
    expect(calls).toEqual([[7, 'end']])
    tearDown()
    setUp(() => ({ left: 100, top: 0, width: 200, height: 26 }))
    const other = slider({ value: 40, default: undefined })
    dblclick(get('slider-track'), 150, 13)
    expect(other.calls).toEqual([])
  })

  it('nudges with the arrow keys (Shift for ten times), Home and End go to the soft ends', () => {
    const { calls } = slider({ value: 10 })
    const track = get('slider-track')
    expect(track.tabIndex).toBe(0)
    key(track, 'ArrowRight')
    key(track, 'ArrowLeft', { shiftKey: true })
    key(track, 'ArrowUp')
    key(track, 'Home')
    key(track, 'End')
    expect(calls).toEqual([
      [12, 'end'],
      [-10, 'end'],
      [12, 'end'],
      [-100, 'end'],
      [100, 'end'],
    ])
  })

  it('ignores keys while an input method composes', () => {
    const { calls } = slider()
    key(get('slider-track'), 'ArrowRight', { isComposing: true })
    expect(calls).toEqual([])
  })

  it('shows the value as hot text rounded to the decimals, which scrubs as one step', () => {
    const { calls } = slider({ value: 12.345, decimals: 1 })
    const value = get('slider-value-value')
    expect(value.textContent).toBe('12.3')
    pointer(value, 'pointerdown', 10, 5)
    pointer(value, 'pointermove', 40, 5)
    pointer(value, 'pointermove', 70, 5)
    runFrames()
    pointer(value, 'pointerup', 70, 5)
    expect(calls.map(([, phase]) => phase)).toEqual(['begin', 'merge', 'end'])
    // The scrub speed is the soft range over 300 px (upstream's `hot_number`).
    expect(calls[0][0]).toBeCloseTo(12.3 + 30 * (200 / 300), 0)
    expect(calls[2]).toEqual([calls[1][0], 'end'])
  })

  it('types a value in the hot text, as a step of its own', () => {
    const { calls } = slider({ value: 0 })
    const value = get('slider-value-value')
    pointer(value, 'pointerdown', 10, 5)
    pointer(value, 'pointerup', 10, 5)
    const input = get('slider-value-input') as HTMLInputElement
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '250.27')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    key(input, 'Enter')
    expect(calls).toEqual([[250.3, 'end']])
  })

  it('draws the track with the gradient stops, or a plain track without them', () => {
    slider({ stops: SLIDER_GRADIENTS.temperature })
    const track = get('slider-track')
    expect(track.style.getPropertyValue('--kui-gradient-slider-track')).toBe(`linear-gradient(to right, ${SLIDER_GRADIENTS.temperature.join(', ')})`)
    expect(track.hasAttribute('data-gradient')).toBe(true)
    tearDown()
    setUp(() => ({ left: 100, top: 0, width: 200, height: 26 }))
    slider()
    expect(get('slider-track').hasAttribute('data-gradient')).toBe(false)
    expect(get('slider-track').style.getPropertyValue('--kui-gradient-slider-track')).toBe('')
  })

  it("gives upstream's Temperature, Tint, and Hue gradients", () => {
    expect(SLIDER_GRADIENTS.temperature).toEqual(['rgb(70, 120, 230)', 'rgb(240, 150, 50)'])
    expect(SLIDER_GRADIENTS.tint).toEqual(['rgb(60, 190, 80)', 'rgb(220, 70, 200)'])
    expect(SLIDER_GRADIENTS.hue[0]).toBe('hsl(0 80% 50%)')
    expect(SLIDER_GRADIENTS.hue.at(-1)).toBe('hsl(360 80% 50%)')
  })

  it('does nothing while disabled', () => {
    const { calls } = slider({ disabled: true })
    pointer(get('slider-track'), 'pointerdown', 150, 13)
    pointer(get('slider-track'), 'pointerup', 150, 13)
    key(get('slider-track'), 'ArrowRight')
    dblclick(get('slider-track'), 150, 13)
    expect(calls).toEqual([])
  })

  it('takes Escape during a drag for itself, so a surrounding preview dialog stays open', () => {
    const onCancel = vi.fn()
    const calls: [number, DragPhase][] = []
    render(
      <PreviewDialog title="Gain" onOk={() => undefined} onCancel={onCancel}>
        <GradientSlider value={0} min={-100} max={100} label="Gain" testId="slider" onChange={(value, phase) => void calls.push([value, phase])} />
      </PreviewDialog>,
    )
    const track = get('slider-track')
    pointer(track, 'pointerdown', 100, 13)
    pointer(track, 'pointermove', 250, 13)
    key(track, 'Escape')
    expect(onCancel).not.toHaveBeenCalled()
    expect(calls).toEqual([
      [50, 'begin'],
      [50, 'end'],
    ])
    pointer(track, 'pointerup', 250, 13)
    expect(calls).toHaveLength(2)
    // Without a drag, Escape is the dialog's again.
    key(track, 'Escape')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

/** The declarations of the first rule for `selector` in kit-ui's styles. */
function cssRule(selector: string): string {
  const css = readFileSync(join(__dirname, 'styles.css'), 'utf8')
  const at = css.indexOf(`${selector} {`)
  if (at === -1) throw new Error(`no rule ${selector}`)
  return css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at))
}

describe('GradientSlider gestures (review fixes)', () => {
  it('takes Escape during a hot-text scrub for itself inside a preview dialog, as the end of the scrub', () => {
    const onCancel = vi.fn()
    const calls: [number, DragPhase][] = []
    render(
      <PreviewDialog title="Gain" onOk={() => undefined} onCancel={onCancel}>
        <GradientSlider value={0} min={-100} max={100} label="Gain" testId="slider" onChange={(value, phase) => void calls.push([value, phase])} />
      </PreviewDialog>,
    )
    const value = get('slider-value-value')
    pointer(value, 'pointerdown', 10, 5)
    pointer(value, 'pointermove', 40, 5)
    pointer(value, 'pointermove', 70, 5)
    key(value, 'Escape')
    expect(onCancel).not.toHaveBeenCalled()
    runFrames()
    pointer(value, 'pointermove', 90, 5)
    pointer(value, 'pointerup', 90, 5)
    expect(calls.map(([, phase]) => phase)).toEqual(['begin', 'end'])
    expect(calls[1][0]).toBe(40)
  })

  it('ends a hot-text scrub with its last value when it unmounts inside a preview dialog, and merges nothing after', () => {
    const calls: [number, DragPhase][] = []
    const view = render(
      <PreviewDialog title="Gain" onOk={() => undefined} onCancel={() => undefined}>
        <GradientSlider value={0} min={-100} max={100} label="Gain" testId="slider" onChange={(value, phase) => void calls.push([value, phase])} />
      </PreviewDialog>,
    )
    const value = get('slider-value-value')
    pointer(value, 'pointerdown', 10, 5)
    pointer(value, 'pointermove', 40, 5)
    pointer(value, 'pointermove', 70, 5)
    view.rerender(
      <PreviewDialog title="Gain" onOk={() => undefined} onCancel={() => undefined}>
        <span />
      </PreviewDialog>,
    )
    runFrames()
    expect(calls).toEqual([
      [20, 'begin'],
      [40, 'end'],
    ])
  })

  it('finishes a drag when it turns disabled mid-drag', () => {
    const { calls, view, all } = slider()
    const track = get('slider-track')
    pointer(track, 'pointerdown', 100, 13)
    pointer(track, 'pointermove', 220, 13)
    view.rerender(<GradientSlider {...all} disabled />)
    pointer(track, 'pointermove', 260, 13)
    runFrames()
    pointer(track, 'pointerup', 260, 13)
    expect(calls).toEqual([
      [20, 'begin'],
      [20, 'end'],
    ])
  })

  it('takes the primary pointer only, and no second press while one is down', () => {
    const { calls } = slider()
    const track = get('slider-track')
    pointer(track, 'pointerdown', 150, 13, { isPrimary: false, pointerId: 7 })
    pointer(track, 'pointerup', 150, 13, { pointerId: 7 })
    pointer(track, 'pointerdown', 100, 13)
    pointer(track, 'pointermove', 220, 13)
    pointer(track, 'pointerdown', 280, 13, { pointerId: 2 })
    pointer(track, 'pointerup', 280, 13, { pointerId: 2 })
    pointer(track, 'pointerup', 220, 13)
    expect(calls).toEqual([
      [20, 'begin'],
      [20, 'end'],
    ])
  })

  it("does not commit a double-click's second click, so it ends with only the default", () => {
    const { calls } = slider({ default: 7 })
    const track = get('slider-track')
    pointer(track, 'pointerdown', 150, 13)
    pointer(track, 'pointerup', 150, 13)
    pointer(track, 'pointerdown', 150, 13, { detail: 2 })
    pointer(track, 'pointerup', 150, 13, { detail: 2 })
    dblclick(track, 150, 13)
    expect(calls).toEqual([
      [-50, 'end'],
      [7, 'end'],
    ])
  })

  it("keeps the dragged value after release until the caller's value changes, and the hot text follows the drag", () => {
    const { view, all } = slider()
    const track = get('slider-track')
    pointer(track, 'pointerdown', 100, 13)
    pointer(track, 'pointermove', 200, 13)
    pointer(track, 'pointermove', 250, 13)
    expect(get('slider-value-value').textContent).toBe('50.0')
    pointer(track, 'pointerup', 250, 13)
    expect(get('slider-knob').style.left).toBe('75%')
    view.rerender(<GradientSlider {...all} value={50} />)
    expect(get('slider-knob').style.left).toBe('75%')
    view.rerender(<GradientSlider {...all} value={10} />)
    expect(get('slider-knob').style.left).toBe('55%')
    expect(get('slider-value-value').textContent).toBe('10.0')
  })

  it('keeps a visible focus outline on the track', () => {
    const rule = cssRule('.kui-gradient-slider-track:focus-visible')
    expect(rule).toMatch(/outline:\s*2px solid var\(--kit-primary\)/)
    expect(rule).not.toMatch(/outline:\s*none/)
  })
})
