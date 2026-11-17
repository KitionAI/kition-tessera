/**
 * Test-only: shared jsdom set-up for the colour controls' tests (CurveEditor, ColorWheel, GradientSlider):
 * pointer events, pointer capture, element boxes, and animation frames run by hand.
 */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { vi } from 'vitest'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom has no PointerEvent (https://github.com/jsdom/jsdom/issues/2527); a MouseEvent with the
// right type and a pointerId reaches React's pointer handlers just the same.
if (typeof PointerEvent === 'undefined') {
  class FakePointerEvent extends MouseEvent {
    pointerId: number
    isPrimary: boolean
    constructor(type: string, params: MouseEventInit & { pointerId?: number; isPrimary?: boolean } = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
      this.isPrimary = params.isPrimary ?? true
    }
  }
  globalThis.PointerEvent = FakePointerEvent as unknown as typeof PointerEvent
}

let roots: Root[] = []
let frames: FrameRequestCallback[] = []
const captured = new WeakMap<Element, Set<number>>()

/** Every element gets the box `box(element)` answers; frames wait for `runFrames`. */
export function setUp(box: (element: Element) => { left: number; top: number; width: number; height: number } | null) {
  frames = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
    frames[handle - 1] = () => undefined
  })
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const b = box(this) ?? { left: 0, top: 0, width: 0, height: 0 }
    return { ...b, x: b.left, y: b.top, right: b.left + b.width, bottom: b.top + b.height, toJSON: () => b } as DOMRect
  })
  Element.prototype.setPointerCapture = function (this: Element, id: number) {
    const set = captured.get(this) ?? new Set<number>()
    set.add(id)
    captured.set(this, set)
  }
  Element.prototype.hasPointerCapture = function (this: Element, id: number) {
    return captured.get(this)?.has(id) ?? false
  }
  Element.prototype.releasePointerCapture = function (this: Element, id: number) {
    captured.get(this)?.delete(id)
  }
}

export function tearDown() {
  for (const root of roots) act(() => root.unmount())
  roots = []
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
}

export function render(node: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  act(() => root.render(node))
  return { root, rerender: (next: ReactNode) => act(() => root.render(next)) }
}

/** Runs the animation frames requested so far. */
export function runFrames() {
  const pending = frames
  frames = []
  act(() => {
    for (const frame of pending) frame(0)
  })
}

export function pointer(element: Element, type: string, x: number, y: number, options: { buttons?: number; shiftKey?: boolean; pointerId?: number; isPrimary?: boolean; detail?: number } = {}) {
  act(() => {
    element.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: options.buttons ?? (type === 'pointerup' ? 0 : 1),
        shiftKey: options.shiftKey,
        pointerId: options.pointerId ?? 1,
        isPrimary: options.isPrimary ?? true,
        detail: options.detail ?? 1,
      } as PointerEventInit),
    )
  })
}

export function lostCapture(element: Element, pointerId = 1) {
  act(() => {
    element.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, pointerId } as PointerEventInit))
  })
}

export function dblclick(element: Element, x: number, y: number) {
  act(() => {
    element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: x, clientY: y }))
  })
}

export function key(element: Element, name: string, options: { shiftKey?: boolean; isComposing?: boolean } = {}) {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, shiftKey: options.shiftKey, isComposing: options.isComposing })
  act(() => {
    element.dispatchEvent(event)
  })
  return event
}

export const get = (testId: string) => {
  const element = document.querySelector(`[data-testid="${testId}"]`)
  if (!element) throw new Error(`no ${testId}`)
  return element as HTMLElement
}
