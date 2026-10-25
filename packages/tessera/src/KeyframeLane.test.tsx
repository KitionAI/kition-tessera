// @vitest-environment jsdom
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KeyframeLane, type Keyframe, type KeyframeLaneProps } from './KeyframeLane'

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

let host: HTMLDivElement
let roots: Root[] = []
afterEach(() => {
  for (const root of roots) act(() => root.unmount())
  roots = []
  host?.remove()
})

const KEYS: Keyframe[] = [
  { id: 'a', time: 2 },
  { id: 'b', time: 4, interpolation: 'hold' },
  { id: 'c', time: 6, interpolation: 'bezier', selected: true },
]

function render(overrides: Partial<KeyframeLaneProps> = {}) {
  const props: KeyframeLaneProps = { keyframes: KEYS, start: 0, end: 10, onSelect: vi.fn(), onMove: vi.fn(), testId: 'lane', ...overrides }
  host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  act(() => root.render(<KeyframeLane {...props} />))
  // jsdom lays nothing out: the lane is 100 px wide from x = 0.
  lane().getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20, x: 0, y: 0, toJSON: () => ({}) })
  return { props, rerender: (node: ReactNode) => act(() => root.render(node)) }
}

const lane = () => host.querySelector('[data-testid="lane"]') as HTMLElement
const key = (id: string) => host.querySelector(`[data-testid="lane-${id}"]`) as HTMLElement

function pointer(target: HTMLElement, type: 'pointerdown' | 'pointermove' | 'pointerup', clientX: number, shiftKey = false) {
  act(() => {
    target.dispatchEvent(new PointerEvent(type, { clientX, clientY: 10, pointerId: 1, button: 0, shiftKey, bubbles: true }))
  })
}

describe('KeyframeLane', () => {
  it('places keyframes along the range and draws each interpolation as upstream does', () => {
    render()
    expect(key('a').style.left).toBe('20%')
    expect(key('c').style.left).toBe('60%')
    expect(key('a').getAttribute('data-shape')).toBe('diamond')
    expect(key('b').getAttribute('data-shape')).toBe('square')
    expect(key('c').getAttribute('data-shape')).toBe('circle')
    expect(key('c').getAttribute('aria-selected')).toBe('true')
    expect(key('a').getAttribute('aria-selected')).toBe('false')
  })

  it('leaves out keyframes outside the range', () => {
    render({ keyframes: [...KEYS, { id: 'late', time: 12 }] })
    expect(key('late')).toBeNull()
  })

  it('selects a keyframe on a click, and adds one with Shift', () => {
    const { props } = render()
    pointer(key('a'), 'pointerdown', 20)
    pointer(key('a'), 'pointerup', 20)
    expect(props.onSelect).toHaveBeenCalledTimes(1)
    expect(props.onSelect).toHaveBeenLastCalledWith(['a'], false)
    pointer(key('b'), 'pointerdown', 40, true)
    pointer(key('b'), 'pointerup', 40, true)
    expect(props.onSelect).toHaveBeenLastCalledWith(['b'], true)
    expect(props.onMove).not.toHaveBeenCalled()
  })

  it('clears the selection on a click in the empty lane', () => {
    const { props } = render()
    pointer(lane(), 'pointerdown', 90)
    pointer(lane(), 'pointerup', 90)
    expect(props.onSelect).toHaveBeenLastCalledWith([], false)
  })

  it('moves the dragged keyframe once on release, by the time the drag covers', () => {
    const { props } = render()
    pointer(key('a'), 'pointerdown', 20)
    pointer(key('a'), 'pointermove', 40)
    pointer(key('a'), 'pointermove', 70)
    expect(props.onMove).not.toHaveBeenCalled()
    // The diamond follows the pointer without a React render.
    expect(key('a').style.transform).toBe('translateX(50px)')
    pointer(key('a'), 'pointerup', 70)
    expect(props.onMove).toHaveBeenCalledTimes(1)
    expect(props.onMove).toHaveBeenCalledWith(['a'], 5)
    expect(key('a').style.transform).toBe('')
  })

  it('drags every selected keyframe when the press lands on a selected one', () => {
    const keyframes: Keyframe[] = [{ id: 'a', time: 2, selected: true }, { id: 'b', time: 4 }, { id: 'c', time: 6, selected: true }]
    const { props } = render({ keyframes })
    pointer(key('c'), 'pointerdown', 60)
    pointer(key('c'), 'pointerup', 50)
    expect(props.onMove).toHaveBeenCalledWith(['a', 'c'], -1)
    expect(props.onSelect).not.toHaveBeenCalled()
  })

  it('applies snap to the dragged keyframe', () => {
    const snap = vi.fn((time: number) => Math.round(time))
    const { props } = render({ snap })
    pointer(key('a'), 'pointerdown', 20)
    pointer(key('a'), 'pointermove', 67)
    expect(key('a').style.transform).toBe('translateX(50px)')
    pointer(key('a'), 'pointerup', 67)
    expect(snap).toHaveBeenCalled()
    expect(props.onMove).toHaveBeenCalledWith(['a'], 5)
  })

  it('keeps a drag inside the range', () => {
    const { props } = render()
    pointer(key('a'), 'pointerdown', 20)
    pointer(key('a'), 'pointerup', -80)
    expect(props.onMove).toHaveBeenCalledWith(['a'], -2)
  })

  it('reports no move for a drag that comes back to where it started', () => {
    const { props } = render()
    pointer(key('a'), 'pointerdown', 20)
    pointer(key('a'), 'pointermove', 50)
    pointer(key('a'), 'pointerup', 20)
    expect(props.onMove).not.toHaveBeenCalled()
  })

  it('steps the selected keyframes one frame with the arrow keys', () => {
    const { props } = render({ fps: 25 })
    act(() => lane().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })))
    expect(props.onMove).toHaveBeenLastCalledWith(['c'], 0.04)
    act(() => lane().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })))
    expect(props.onMove).toHaveBeenLastCalledWith(['c'], -0.04)
  })

  it("keeps a stepping arrow key from the editor's own shortcuts", () => {
    // The editor's keys are a React handler on an ancestor (kit-ui's shell).
    const outer = vi.fn()
    const lanes = (keyframes: Keyframe[]) => (
      <div onKeyDown={outer}>
        <KeyframeLane keyframes={keyframes} start={0} end={10} fps={25} onSelect={vi.fn()} onMove={vi.fn()} testId="lane" />
      </div>
    )
    host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    roots.push(root)
    act(() => root.render(lanes(KEYS)))
    act(() => lane().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })))
    expect(outer).not.toHaveBeenCalled()
    act(() => root.render(lanes(KEYS.map((each) => ({ ...each, selected: false })))))
    act(() => lane().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })))
    expect(outer).toHaveBeenCalledTimes(1)
  })

  it('drags and steps only the selected keyframes in view, as upstream skips the ones outside the lane', () => {
    const keyframes: Keyframe[] = [
      { id: 'early', time: -3, selected: true },
      { id: 'c', time: 6, selected: true },
      { id: 'late', time: 14, selected: true },
    ]
    const { props } = render({ keyframes })
    expect(key('early')).toBeNull()
    expect(key('late')).toBeNull()
    pointer(key('c'), 'pointerdown', 60)
    pointer(key('c'), 'pointermove', 80)
    // No jump: the drag follows the pointer, held back by none of the unseen keyframes.
    expect(key('c').style.transform).toBe('translateX(20px)')
    pointer(key('c'), 'pointerup', 80)
    expect(props.onMove).toHaveBeenCalledWith(['c'], 2)
    act(() => lane().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })))
    expect(props.onMove).toHaveBeenLastCalledWith(['c'], -1 / 30)
  })

  it('shows a keyframe a hair outside the range, as upstream does, and never pushes it in when dragging', () => {
    const keyframes: Keyframe[] = [{ id: 'edge', time: 10.05, selected: true }]
    const { props } = render({ keyframes })
    expect(key('edge')).not.toBeNull()
    pointer(key('edge'), 'pointerdown', 100)
    pointer(key('edge'), 'pointerup', 90)
    expect(props.onMove).toHaveBeenCalledWith(['edge'], -1)
  })

  it('offers a keyframe menu on a right-click', () => {
    const onMenu = vi.fn()
    render({ onMenu })
    act(() => key('b').dispatchEvent(new MouseEvent('contextmenu', { clientX: 40, clientY: 12, bubbles: true, cancelable: true })))
    expect(onMenu).toHaveBeenCalledWith('b', { x: 40, y: 12 })
  })
})
