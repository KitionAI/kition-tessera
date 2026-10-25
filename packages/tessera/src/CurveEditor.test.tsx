// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dblclick, get, key, lostCapture, pointer, render, runFrames, setUp, tearDown } from './test/colorControls.testkit'
import { addCurvePoint, CurveEditor, hitCurvePoint, moveCurvePoint, removeCurvePoint, RGB_IDENTITY, sampleCurve, type CurveEditorProps, type CurvePoint } from './CurveEditor'
import { TESSERA_CATALOGS as KIT_UI_CATALOGS } from './context'
import { PreviewDialog } from './PreviewDialog'
import type { DragPhase } from './colorGesture'

// The plot is 200 px square at the origin for an RGB curve, 200 by 90 for a hue curve, so a
// point (x, y) sits at pixel (200x, height - height·y).
beforeEach(() =>
  setUp((element) => {
    if (element.getAttribute('data-testid') !== 'curve-plot') return null
    const hue = element.closest('[data-kind="hue"]')
    return { left: 0, top: 0, width: 200, height: hue ? 90 : 200 }
  }),
)
afterEach(tearDown)

const MID: CurvePoint[] = [
  [0, 0],
  [0.5, 0.5],
  [1, 1],
]

function curve(props: Partial<CurveEditorProps> = {}) {
  const calls: [CurvePoint[], DragPhase][] = []
  const all: CurveEditorProps = { points: MID, kind: 'rgb', onChange: (points, phase) => void calls.push([points, phase]), testId: 'curve', uiId: 'control:lumetri.curve_luma', ...props }
  const view = render(<CurveEditor {...all} />)
  return { calls, view }
}

describe('sampleCurve', () => {
  it('samples a straight curve, and an empty RGB curve as the identity', () => {
    expect(sampleCurve(RGB_IDENTITY, 5, 'rgb')).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(sampleCurve([], 5, 'rgb')).toEqual([0, 0.25, 0.5, 0.75, 1])
  })

  it("matches the engine's curve_lut and hue_lut (values from kition-film's render crate)", () => {
    const rgb = sampleCurve(
      [
        [0, 0],
        [0.3, 0.6],
        [0.7, 0.4],
        [1, 1],
      ],
      9,
      'rgb',
    )
    const engineRgb = [0, 0.3107639, 0.5694445, 0.58154297, 0.5, 0.41845706, 0.43055558, 0.68923616, 1]
    rgb.forEach((value, i) => expect(value).toBeCloseTo(engineRgb[i], 5))
    const hue = sampleCurve(
      [
        [0.1, 0.8],
        [0.5, 0.3],
        [0.8, 0.6],
      ],
      8,
      'hue',
    )
    const engineHue = [0.7885793, 0.75509244, 0.54184926, 0.33554053, 0.32712257, 0.4793787, 0.62239665, 0.73635256]
    hue.forEach((value, i) => expect(value).toBeCloseTo(engineHue[i], 5))
  })

  it('passes through its points and stays monotone between them (Fritsch–Carlson, as the engine)', () => {
    const samples = sampleCurve(
      [
        [0, 0],
        [0.5, 0.25],
        [1, 1],
      ],
      129,
      'rgb',
    )
    expect(samples[0]).toBe(0)
    expect(samples[64]).toBeCloseTo(0.25, 6)
    expect(samples[128]).toBe(1)
    for (let i = 1; i < samples.length; i += 1) expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1] - 1e-9)
  })

  it('never overshoots a flat stretch', () => {
    const samples = sampleCurve(
      [
        [0, 0],
        [0.4, 0.5],
        [0.6, 0.5],
        [1, 1],
      ],
      101,
      'rgb',
    )
    for (let i = 40; i <= 60; i += 1) expect(samples[i]).toBeCloseTo(0.5, 6)
    for (const value of samples) expect(value).toBeGreaterThanOrEqual(0)
  })

  it('sorts its points by x first, and holds the ends level outside them', () => {
    const points: CurvePoint[] = [
      [0.8, 0.9],
      [0.2, 0.1],
    ]
    const samples = sampleCurve(points, 11, 'rgb')
    expect(samples).toEqual(sampleCurve([points[1], points[0]], 11, 'rgb'))
    expect(samples[0]).toBeCloseTo(0.1, 6)
    expect(samples[10]).toBeCloseTo(0.9, 6)
  })

  it('wraps a hue curve in x, and draws an empty one level at 0.5', () => {
    const points: CurvePoint[] = [
      [0.05, 0.9],
      [0.5, 0.5],
    ]
    const hue = sampleCurve(points, 128, 'hue')
    expect(hue).toHaveLength(128)
    expect(Math.abs(hue[0] - hue[127])).toBeLessThan(0.02)
    const flat = sampleCurve(points, 128, 'rgb')
    expect(flat[0]).toBeCloseTo(0.9, 6)
    expect(flat[127]).toBeCloseTo(0.5, 6)
    expect(sampleCurve([], 4, 'hue')).toEqual([0.5, 0.5, 0.5, 0.5])
  })
})

describe('curve point edits', () => {
  it('moves a point anywhere in the square, past its neighbours as upstream does, and keeps the points in x order', () => {
    expect(moveCurvePoint(MID, 1, [0.3, 0.7])).toEqual({
      points: [
        [0, 0],
        [0.3, 0.7],
        [1, 1],
      ],
      index: 1,
    })
    expect(moveCurvePoint(MID, 1, [1.2, -0.3])).toEqual({
      points: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
      index: 1,
    })
    expect(moveCurvePoint(MID, 0, [0.8, 0.2])).toEqual({
      points: [
        [0.5, 0.5],
        [0.8, 0.2],
        [1, 1],
      ],
      index: 1,
    })
    expect(moveCurvePoint(MID, 2, [-1, 2])).toEqual({
      points: [
        [0, 0],
        [0, 1],
        [0.5, 0.5],
      ],
      index: 1,
    })
  })

  it('adds a point in x order, unless one is already at that x', () => {
    expect(addCurvePoint(MID, [0.3, 0.6])).toEqual({
      points: [
        [0, 0],
        [0.3, 0.6],
        [0.5, 0.5],
        [1, 1],
      ],
      index: 1,
    })
    expect(addCurvePoint(MID, [0.5, 0.9])).toBeNull()
    expect(addCurvePoint([], [0.2, 0.4])).toEqual({ points: [[0.2, 0.4]], index: 0 })
  })

  it("removes a point, but keeps an RGB curve's end points", () => {
    expect(removeCurvePoint(MID, 1, 'rgb')).toEqual([
      [0, 0],
      [1, 1],
    ])
    expect(removeCurvePoint(MID, 0, 'rgb')).toBeNull()
    expect(removeCurvePoint(MID, 2, 'rgb')).toBeNull()
    expect(removeCurvePoint(MID, 0, 'hue')).toEqual([
      [0.5, 0.5],
      [1, 1],
    ])
  })

  it('finds the nearest point within 9 px', () => {
    expect(hitCurvePoint(MID, [104, 96], [200, 200])).toBe(1)
    expect(hitCurvePoint(MID, [110, 100], [200, 200])).toBeNull()
    expect(hitCurvePoint(MID, [5, 197], [200, 200])).toBe(0)
  })
})

describe('CurveEditor', () => {
  it('draws its points and the curve, and carries the Kit UI id', () => {
    curve()
    expect(get('curve').getAttribute('data-kit-ui-id')).toBe('control:lumetri.curve_luma')
    expect(get('curve-point-1').style.left).toBe('50%')
    expect(get('curve-point-1').style.top).toBe('50%')
    expect(get('curve-point-1').getAttribute('aria-label')).toBe('Point 2: 0.50, 0.50')
    const line = get('curve-line').getAttribute('points')!.split(' ')
    expect(line[0]).toBe('0,1')
    expect(line.at(-1)).toBe('1,0')
  })

  it("draws the caller's samples when given", () => {
    curve({ samples: [0, 0.5, 1] })
    expect(get('curve-line').getAttribute('points')).toBe('0,1 0.5,0.5 1,0')
  })

  it('moves a point dragged from within 9 px of it, as one step: begin, merges per frame, end', () => {
    const { calls } = curve()
    const plot = get('curve-plot')
    pointer(plot, 'pointerdown', 106, 104)
    pointer(plot, 'pointermove', 107, 104)
    expect(calls).toEqual([])
    pointer(plot, 'pointermove', 102, 60)
    pointer(plot, 'pointermove', 110, 50)
    pointer(plot, 'pointermove', 120, 40)
    runFrames()
    pointer(plot, 'pointermove', 140, 20)
    pointer(plot, 'pointerup', 140, 20)
    expect(calls).toEqual([
      [
        [
          [0, 0],
          [0.51, 0.7],
          [1, 1],
        ],
        'begin',
      ],
      [
        [
          [0, 0],
          [0.6, 0.8],
          [1, 1],
        ],
        'merge',
      ],
      [
        [
          [0, 0],
          [0.7, 0.9],
          [1, 1],
        ],
        'end',
      ],
    ])
  })

  it('reports nothing for a press that does not move', () => {
    const { calls } = curve()
    pointer(get('curve-plot'), 'pointerdown', 50, 50)
    pointer(get('curve-plot'), 'pointerup', 50, 50)
    expect(calls).toEqual([])
  })

  it('adds a point when the drag starts away from every point', () => {
    const { calls } = curve()
    const plot = get('curve-plot')
    pointer(plot, 'pointerdown', 50, 100)
    pointer(plot, 'pointermove', 50, 90)
    pointer(plot, 'pointerup', 50, 90)
    const added: CurvePoint[] = [
      [0, 0],
      [0.25, 0.55],
      [0.5, 0.5],
      [1, 1],
    ]
    expect(calls).toEqual([
      [added, 'begin'],
      [added, 'end'],
    ])
  })

  it('ends a drag with its last value when the pointer capture is lost', () => {
    const { calls } = curve()
    const plot = get('curve-plot')
    pointer(plot, 'pointerdown', 100, 100)
    pointer(plot, 'pointermove', 100, 80)
    lostCapture(plot)
    pointer(plot, 'pointerup', 100, 60)
    const moved: CurvePoint[] = [
      [0, 0],
      [0.5, 0.6],
      [1, 1],
    ]
    expect(calls).toEqual([
      [moved, 'begin'],
      [moved, 'end'],
    ])
  })

  it("removes a point on a double-click, but keeps an RGB curve's end points", () => {
    const { calls } = curve()
    dblclick(get('curve-plot'), 102, 99)
    dblclick(get('curve-plot'), 2, 198)
    dblclick(get('curve-plot'), 198, 2)
    expect(calls).toEqual([
      [
        [
          [0, 0],
          [1, 1],
        ],
        'end',
      ],
    ])
  })

  it('resets an RGB curve on a double-click in empty space; a hue curve keeps its points', () => {
    const { calls } = curve()
    dblclick(get('curve-plot'), 40, 40)
    expect(calls).toEqual([[RGB_IDENTITY.map((point) => [...point]), 'end']])
    tearDown()
    setUp((element) => (element.getAttribute('data-testid') === 'curve-plot' ? { left: 0, top: 0, width: 200, height: 90 } : null))
    const hue = curve({
      kind: 'hue',
      points: [
        [0.2, 0.7],
        [0.6, 0.4],
      ],
    })
    dblclick(get('curve-plot'), 160, 10)
    expect(hue.calls).toEqual([])
    // A hue curve's end points can go.
    dblclick(get('curve-plot'), 40, 27)
    expect(hue.calls).toEqual([[[[0.6, 0.4]], 'end']])
  })

  it('draws a hue curve 0.45 as tall as wide, with the hue strip, level at 0.5 when empty', () => {
    curve({ kind: 'hue', points: [] })
    expect(get('curve').getAttribute('data-kind')).toBe('hue')
    expect(get('curve').querySelector('.kui-curve-editor-hue')).not.toBeNull()
    const line = get('curve-line').getAttribute('points')!.split(' ')
    expect(line[0]).toBe('0,0.5')
    expect(line.at(-1)).toBe('1,0.5')
  })

  it('nudges a focused point with the arrow keys (Shift for ten times) and deletes it with Delete', () => {
    const { calls } = curve()
    const point = get('curve-point-1')
    expect(point.tabIndex).toBe(0)
    key(point, 'ArrowUp')
    key(point, 'ArrowLeft', { shiftKey: true })
    key(point, 'Delete')
    key(get('curve-point-0'), 'Backspace')
    key(point, 'ArrowUp', { isComposing: true })
    expect(calls).toEqual([
      [
        [
          [0, 0],
          [0.5, 0.51],
          [1, 1],
        ],
        'end',
      ],
      [
        [
          [0, 0],
          [0.4, 0.5],
          [1, 1],
        ],
        'end',
      ],
      [
        [
          [0, 0],
          [1, 1],
        ],
        'end',
      ],
    ])
  })

  it('adds a point on the curve in its widest gap with Enter on the plot', () => {
    const { calls } = curve({ points: RGB_IDENTITY })
    const plot = get('curve-plot')
    expect(plot.tabIndex).toBe(0)
    key(plot, 'Enter')
    expect(calls).toEqual([
      [
        [
          [0, 0],
          [0.5, 0.5],
          [1, 1],
        ],
        'end',
      ],
    ])
  })

  it('takes Escape during a drag for itself, so a surrounding preview dialog stays open', () => {
    const onCancel = vi.fn()
    const calls: [CurvePoint[], DragPhase][] = []
    render(
      <PreviewDialog title="Curves" onOk={() => undefined} onCancel={onCancel}>
        <CurveEditor points={MID} kind="rgb" testId="curve" onChange={(points, phase) => void calls.push([points, phase])} />
      </PreviewDialog>,
    )
    const plot = get('curve-plot')
    pointer(plot, 'pointerdown', 100, 100)
    pointer(plot, 'pointermove', 100, 80)
    key(plot, 'Escape')
    expect(onCancel).not.toHaveBeenCalled()
    expect(calls.map(([, phase]) => phase)).toEqual(['begin', 'end'])
  })

  it('does nothing while disabled', () => {
    const { calls } = curve({ disabled: true })
    pointer(get('curve-plot'), 'pointerdown', 100, 100)
    pointer(get('curve-plot'), 'pointermove', 100, 50)
    pointer(get('curve-plot'), 'pointerup', 100, 50)
    dblclick(get('curve-plot'), 100, 100)
    key(get('curve-point-1'), 'ArrowUp')
    expect(calls).toEqual([])
  })

  it('has its strings in both locales', () => {
    for (const name of ['curveEditor', 'curveEditorPoint']) {
      expect(KIT_UI_CATALOGS['en-US'][name]).toBeTruthy()
      expect(KIT_UI_CATALOGS['zh-CN'][name]).toBeTruthy()
    }
  })
})

describe('CurveEditor gestures (review fixes)', () => {
  it('finishes a drag when it turns disabled mid-drag', () => {
    const calls: [CurvePoint[], DragPhase][] = []
    const props: CurveEditorProps = { points: MID, kind: 'rgb', testId: 'curve', onChange: (points, phase) => void calls.push([points, phase]) }
    const view = render(<CurveEditor {...props} />)
    const plot = get('curve-plot')
    pointer(plot, 'pointerdown', 100, 100)
    pointer(plot, 'pointermove', 100, 80)
    view.rerender(<CurveEditor {...props} disabled />)
    pointer(plot, 'pointermove', 100, 40)
    runFrames()
    pointer(plot, 'pointerup', 100, 40)
    expect(calls.map(([, phase]) => phase)).toEqual(['begin', 'end'])
    expect(calls[1][0]).toEqual([
      [0, 0],
      [0.5, 0.6],
      [1, 1],
    ])
  })

  it('takes the primary pointer only, and no second press while one is down', () => {
    const { calls } = curve()
    const plot = get('curve-plot')
    pointer(plot, 'pointerdown', 100, 100, { isPrimary: false, pointerId: 7 })
    pointer(plot, 'pointermove', 100, 60, { pointerId: 7 })
    pointer(plot, 'pointerup', 100, 60, { pointerId: 7 })
    pointer(plot, 'pointerdown', 100, 100)
    pointer(plot, 'pointermove', 100, 80)
    pointer(plot, 'pointerdown', 50, 150, { pointerId: 2 })
    pointer(plot, 'pointermove', 50, 120, { pointerId: 2 })
    pointer(plot, 'pointerup', 50, 120, { pointerId: 2 })
    pointer(plot, 'pointerup', 100, 80)
    expect(calls.map(([, phase]) => phase)).toEqual(['begin', 'end'])
  })

  it('lets a dragged point pass its neighbours, as upstream, and keeps following it', () => {
    const points: CurvePoint[] = [
      [0, 0],
      [0.3, 0.3],
      [0.6, 0.6],
      [1, 1],
    ]
    const { calls } = curve({ points })
    const plot = get('curve-plot')
    pointer(plot, 'pointerdown', 60, 140)
    pointer(plot, 'pointermove', 160, 140)
    runFrames()
    pointer(plot, 'pointermove', 20, 100)
    pointer(plot, 'pointerup', 20, 100)
    expect(calls).toEqual([
      [
        [
          [0, 0],
          [0.6, 0.6],
          [0.8, 0.3],
          [1, 1],
        ],
        'begin',
      ],
      [
        [
          [0, 0],
          [0.1, 0.5],
          [0.6, 0.6],
          [1, 1],
        ],
        'end',
      ],
    ])
  })

  it("keeps the dragged points after release until the caller's points change", () => {
    const { view } = curve()
    const plot = get('curve-plot')
    pointer(plot, 'pointerdown', 100, 100)
    pointer(plot, 'pointermove', 100, 60)
    pointer(plot, 'pointerup', 100, 60)
    expect(get('curve-point-1').style.top).toBe('30%')
    view.rerender(<CurveEditor points={RGB_IDENTITY} kind="rgb" testId="curve" onChange={() => undefined} />)
    expect(get('curve').querySelectorAll('.kui-curve-editor-point')).toHaveLength(2)
  })

  it('draws the plot edge without a border, so its box is the plot that hit-testing maps', () => {
    const css = readFileSync(join(__dirname, 'styles.css'), 'utf8')
    const at = css.indexOf('.kui-curve-editor-plot {')
    const rule = css.slice(at, css.indexOf('}', at))
    expect(rule).not.toMatch(/(^|\s)border:/)
    expect(rule).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--kit-border\)/)
  })
})
