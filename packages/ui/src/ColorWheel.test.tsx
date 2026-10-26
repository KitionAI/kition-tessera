// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dblclick, get, key, lostCapture, pointer, render, runFrames, setUp, tearDown } from './test/colorControls.testkit'
import { ColorWheel, lightnessAt, wheelRadius, wheelValueAt, type ColorWheelProps } from './ColorWheel'
import { createStrings, TESSERA_CATALOGS as KIT_UI_CATALOGS } from './context'
import type { DragPhase } from './colorGesture'

// The wheel is 120 px square at the origin (centre 60, 60; the puck travels 42 px); the
// lightness track runs from y 8 to 112 (centre 60).
beforeEach(() =>
  setUp((element) => {
    const id = element.getAttribute('data-testid')
    if (id === 'wheel-wheel') return { left: 0, top: 0, width: 120, height: 120 }
    if (id === 'wheel-lightness') return { left: -12, top: 8, width: 4, height: 104 }
    return null
  }),
)
afterEach(tearDown)

type Call = [unknown, DragPhase]

function wheel(props: Partial<ColorWheelProps> = {}) {
  const offsets: Call[] = []
  const lightness: Call[] = []
  const all: ColorWheelProps = {
    value: [0, 0],
    lightness: 0,
    label: 'Shadows',
    size: 120,
    onChange: (value, phase) => void offsets.push([value, phase]),
    onLightness: (value, phase) => void lightness.push([value, phase]),
    testId: 'wheel',
    uiId: 'control:lumetri.wheel_shadows',
    lightnessUiId: 'control:lumetri.wheel_shadows_l',
    ...props,
  }
  render(<ColorWheel {...all} />)
  return { offsets, lightness }
}

describe('ColorWheel value mapping', () => {
  it('maps a pointer offset from the centre to a value of length at most 1, y up', () => {
    expect(wheelRadius(120)).toBe(42)
    expect(wheelValueAt(42, 0, 42)).toEqual([1, 0])
    expect(wheelValueAt(0, -42, 42)).toEqual([0, 1])
    expect(wheelValueAt(0, 21, 42)).toEqual([0, -0.5])
    expect(wheelValueAt(84, 0, 42)).toEqual([1, 0])
    const [x, y] = wheelValueAt(-100, -100, 42)
    expect(Math.hypot(x, y)).toBeCloseTo(1, 4)
    expect(x).toBeCloseTo(-Math.SQRT1_2, 4)
    expect(y).toBeCloseTo(Math.SQRT1_2, 4)
    expect(wheelValueAt(0, 0, 42)).toEqual([0, 0])
  })

  it('maps a height on the lightness track to -100..100, up is lighter', () => {
    const box = { top: 8, height: 104 }
    expect(lightnessAt(8, box)).toBe(100)
    expect(lightnessAt(112, box)).toBe(-100)
    expect(lightnessAt(60, box)).toBe(0)
    expect(lightnessAt(34, box)).toBe(50)
    expect(lightnessAt(-50, box)).toBe(100)
    expect(lightnessAt(500, box)).toBe(-100)
  })
})

describe('ColorWheel', () => {
  it('draws the puck at the value and the label, and carries the Kit UI ids', () => {
    wheel({ value: [0.5, 0.5], lightness: 50 })
    const puck = get('wheel-puck')
    expect(puck.style.left).toBe('calc(50% + 21px)')
    expect(puck.style.top).toBe('calc(50% - 21px)')
    expect(get('wheel').textContent).toContain('Shadows')
    expect(get('wheel-wheel').getAttribute('data-kit-ui-id')).toBe('control:lumetri.wheel_shadows')
    expect(get('wheel-lightness').getAttribute('data-kit-ui-id')).toBe('control:lumetri.wheel_shadows_l')
    expect(get('wheel-lightness').getAttribute('aria-label')).toBe('Shadows lightness')
    expect(get('wheel-lightness-knob').style.top).toBe('25%')
  })

  it('gives a length-1 value for a click at the rim, with y inverted', () => {
    const { offsets } = wheel()
    pointer(get('wheel-wheel'), 'pointerdown', 115, 60)
    pointer(get('wheel-wheel'), 'pointerup', 115, 60)
    pointer(get('wheel-wheel'), 'pointerdown', 60, 18)
    pointer(get('wheel-wheel'), 'pointerup', 60, 18)
    expect(offsets).toEqual([
      [[1, 0], 'end'],
      [[0, 1], 'end'],
    ])
  })

  it('reports one drag as begin, merges per frame, and the last value on release', () => {
    const { offsets } = wheel()
    const area = get('wheel-wheel')
    pointer(area, 'pointerdown', 60, 60)
    pointer(area, 'pointermove', 81, 60)
    pointer(area, 'pointermove', 60, 81)
    pointer(area, 'pointermove', 39, 60)
    runFrames()
    pointer(area, 'pointermove', 60, 39)
    pointer(area, 'pointerup', 60, 39)
    expect(offsets).toEqual([
      [[0.5, 0], 'begin'],
      [[-0.5, 0], 'merge'],
      [[0, 0.5], 'end'],
    ])
    // The puck follows the drag before the caller's value does.
    pointer(area, 'pointerdown', 60, 60)
    pointer(area, 'pointermove', 102, 60)
    expect(get('wheel-puck').style.left).toBe('calc(50% + 42px)')
  })

  it('ends a drag with its last value when the pointer capture is lost', () => {
    const { offsets } = wheel()
    const area = get('wheel-wheel')
    pointer(area, 'pointerdown', 60, 60)
    pointer(area, 'pointermove', 81, 60)
    lostCapture(area)
    pointer(area, 'pointerup', 81, 60)
    expect(offsets).toEqual([
      [[0.5, 0], 'begin'],
      [[0.5, 0], 'end'],
    ])
  })

  it('resets the offset on a double-click', () => {
    const { offsets } = wheel({ value: [0.3, 0.2] })
    dblclick(get('wheel-wheel'), 90, 60)
    expect(offsets).toEqual([[[0, 0], 'end']])
  })

  it('nudges the offset with the arrow keys (Shift for ten times), inside the unit disc; Home resets', () => {
    const { offsets } = wheel({ value: [0.2, 0.3] })
    const area = get('wheel-wheel')
    expect(area.tabIndex).toBe(0)
    key(area, 'ArrowRight')
    key(area, 'ArrowDown', { shiftKey: true })
    key(area, 'Home')
    key(area, 'ArrowRight', { isComposing: true })
    expect(offsets).toEqual([
      [[0.21, 0.3], 'end'],
      [[0.2, 0.2], 'end'],
      [[0, 0], 'end'],
    ])
  })

  it('keeps a nudged offset inside the unit disc', () => {
    const { offsets } = wheel({ value: [1, 0] })
    key(get('wheel-wheel'), 'ArrowRight')
    expect(offsets).toEqual([[[1, 0], 'end']])
  })

  it('sets the lightness from -100 to 100 by click and drag, as one step per drag', () => {
    const { lightness, offsets } = wheel()
    const track = get('wheel-lightness')
    pointer(track, 'pointerdown', -10, 8)
    pointer(track, 'pointerup', -10, 8)
    pointer(track, 'pointerdown', -10, 112)
    pointer(track, 'pointerup', -10, 112)
    pointer(track, 'pointerdown', -10, 60)
    pointer(track, 'pointermove', -10, 34)
    pointer(track, 'pointermove', -10, 300)
    runFrames()
    pointer(track, 'pointercancel', -10, 300)
    expect(lightness).toEqual([
      [100, 'end'],
      [-100, 'end'],
      [50, 'begin'],
      [-100, 'merge'],
      [-100, 'end'],
    ])
    expect(offsets).toEqual([])
  })

  it('nudges the lightness with the keys', () => {
    const { lightness } = wheel({ lightness: 10 })
    const track = get('wheel-lightness')
    key(track, 'ArrowUp')
    key(track, 'ArrowDown', { shiftKey: true })
    key(track, 'Home')
    key(track, 'End')
    expect(lightness).toEqual([
      [11, 'end'],
      [0, 'end'],
      [-100, 'end'],
      [100, 'end'],
    ])
  })

  it('does nothing while disabled', () => {
    const { offsets, lightness } = wheel({ disabled: true })
    pointer(get('wheel-wheel'), 'pointerdown', 100, 60)
    pointer(get('wheel-wheel'), 'pointerup', 100, 60)
    pointer(get('wheel-lightness'), 'pointerdown', -10, 20)
    pointer(get('wheel-lightness'), 'pointerup', -10, 20)
    key(get('wheel-wheel'), 'ArrowRight')
    dblclick(get('wheel-wheel'), 100, 60)
    expect(offsets).toEqual([])
    expect(lightness).toEqual([])
  })

  it('has its strings in both locales', () => {
    for (const name of ['colorWheelLightness', 'colorWheelOffset']) {
      expect(KIT_UI_CATALOGS['en-US'][name]).toBeTruthy()
      expect(KIT_UI_CATALOGS['zh-CN'][name]).toBeTruthy()
    }
    const zh = createStrings(KIT_UI_CATALOGS, 'zh-CN')
    expect(zh('colorWheelLightness', { label: 'X' })).toContain('X')
    expect(zh('colorWheelLightness', { label: 'X' })).not.toBe(createStrings(KIT_UI_CATALOGS, 'en-US')('colorWheelLightness', { label: 'X' }))
  })
})

describe('ColorWheel gestures (review fixes)', () => {
  function wheelView(props: Partial<ColorWheelProps> = {}) {
    const offsets: Call[] = []
    const lightness: Call[] = []
    const all: ColorWheelProps = {
      value: [0, 0],
      lightness: 0,
      label: 'Shadows',
      size: 120,
      onChange: (value, phase) => void offsets.push([value, phase]),
      onLightness: (value, phase) => void lightness.push([value, phase]),
      testId: 'wheel',
      ...props,
    }
    const view = render(<ColorWheel {...all} />)
    return { offsets, lightness, view, all }
  }

  it('finishes a drag when it turns disabled mid-drag', () => {
    const { offsets, lightness, view, all } = wheelView()
    pointer(get('wheel-wheel'), 'pointerdown', 60, 60)
    pointer(get('wheel-wheel'), 'pointermove', 81, 60)
    pointer(get('wheel-lightness'), 'pointerdown', -10, 60, { pointerId: 3 })
    pointer(get('wheel-lightness'), 'pointermove', -10, 34, { pointerId: 3 })
    view.rerender(<ColorWheel {...all} disabled />)
    pointer(get('wheel-wheel'), 'pointermove', 102, 60)
    pointer(get('wheel-lightness'), 'pointermove', -10, 8, { pointerId: 3 })
    runFrames()
    expect(offsets).toEqual([
      [[0.5, 0], 'begin'],
      [[0.5, 0], 'end'],
    ])
    expect(lightness).toEqual([
      [50, 'begin'],
      [50, 'end'],
    ])
  })

  it('takes the primary pointer only, and no second press while one is down', () => {
    const { offsets } = wheelView()
    const area = get('wheel-wheel')
    pointer(area, 'pointerdown', 115, 60, { isPrimary: false, pointerId: 7 })
    pointer(area, 'pointerup', 115, 60, { pointerId: 7 })
    pointer(area, 'pointerdown', 60, 60)
    pointer(area, 'pointermove', 81, 60)
    pointer(area, 'pointerdown', 60, 18, { pointerId: 2 })
    pointer(area, 'pointerup', 60, 18, { pointerId: 2 })
    pointer(area, 'pointerup', 81, 60)
    expect(offsets).toEqual([
      [[0.5, 0], 'begin'],
      [[0.5, 0], 'end'],
    ])
  })

  it("does not commit a double-click's second click", () => {
    const { offsets } = wheelView()
    const area = get('wheel-wheel')
    pointer(area, 'pointerdown', 81, 60)
    pointer(area, 'pointerup', 81, 60)
    pointer(area, 'pointerdown', 81, 60, { detail: 2 })
    pointer(area, 'pointerup', 81, 60, { detail: 2 })
    dblclick(area, 81, 60)
    expect(offsets).toEqual([
      [[0.5, 0], 'end'],
      [[0, 0], 'end'],
    ])
  })

  it("keeps the dragged puck after release until the caller's value changes", () => {
    const { view, all } = wheelView()
    const area = get('wheel-wheel')
    pointer(area, 'pointerdown', 60, 60)
    pointer(area, 'pointermove', 81, 60)
    pointer(area, 'pointerup', 81, 60)
    expect(get('wheel-puck').style.left).toBe('calc(50% + 21px)')
    view.rerender(<ColorWheel {...all} value={[0, 1]} />)
    expect(get('wheel-puck').style.left).toBe('calc(50% + 0px)')
    expect(get('wheel-puck').style.top).toBe('calc(50% - 42px)')
  })

  it('describes the wheel as a colour wheel', () => {
    wheelView()
    expect(get('wheel-wheel').getAttribute('aria-roledescription')).toBe(KIT_UI_CATALOGS['en-US'].colorWheel)
    expect(KIT_UI_CATALOGS['zh-CN'].colorWheel).toBeTruthy()
  })
})
