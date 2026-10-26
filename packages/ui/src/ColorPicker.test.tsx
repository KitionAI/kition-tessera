// @vitest-environment jsdom
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ColorPicker, hsvToRgb, rgbToHsv, parseHex, rgbToHex, type RGB } from './ColorPicker'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom has no PointerEvent (https://github.com/jsdom/jsdom/issues/2527); a MouseEvent with the
// right type and a pointerId reaches React's pointer handlers just the same.
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

const square = () => host.querySelector('[data-testid="cp-square"]') as HTMLDivElement
const hue = () => host.querySelector('[data-testid="cp-hue"]') as HTMLDivElement
const hexInput = () => host.querySelector('[data-testid="cp-hex"]') as HTMLInputElement
const rInput = () => host.querySelector('[data-testid="cp-r"] input') as HTMLInputElement

function rectOf(element: HTMLElement, rect: Partial<DOMRect>) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 200, bottom: 200, width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}), ...rect } as DOMRect)
}

function pointer(element: HTMLElement, type: 'pointerdown' | 'pointermove' | 'pointerup', clientX: number, clientY: number) {
  act(() => {
    element.dispatchEvent(new PointerEvent(type, { clientX, clientY, pointerId: 1, bubbles: true }))
  })
}

function type(input: HTMLInputElement, text: string) {
  act(() => {
    nativeInputValue.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function key(input: HTMLElement, k: string, options: Partial<KeyboardEventInit> = {}) {
  act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...options }))
  })
}

describe('ColorPicker color math', () => {
  it('round-trips rgb through hsv', () => {
    for (const rgb of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [128, 64, 64], [10, 200, 90]] as RGB[]) {
      const { h, s, v } = rgbToHsv(rgb)
      const back = hsvToRgb(h, s, v)
      expect(back).toEqual(rgb)
    }
  })

  it('parses a 6-digit hex string with or without the leading #, in either case', () => {
    expect(parseHex('#ff8800')).toEqual([255, 136, 0])
    expect(parseHex('ff8800')).toEqual([255, 136, 0])
    expect(parseHex('#FF8800')).toEqual([255, 136, 0])
  })

  it('parses a 3-digit shorthand hex string, expanding each nibble', () => {
    expect(parseHex('#f80')).toEqual([255, 136, 0])
    expect(parseHex('f80')).toEqual([255, 136, 0])
    expect(parseHex('#ABC')).toEqual([170, 187, 204])
  })

  it('rejects malformed hex text', () => {
    expect(parseHex('zzzzzz')).toBeNull()
    expect(parseHex('#ff88')).toBeNull()
    expect(parseHex('')).toBeNull()
  })

  it('formats rgb as a lowercase hex string', () => {
    expect(rgbToHex([255, 136, 0])).toBe('#ff8800')
  })
})

describe('ColorPicker', () => {
  it('calls onChange with the parsed rgb when a valid hex is typed and committed', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={[0, 0, 0]} onChange={onChange} testId="cp" />)
    type(hexInput(), 'ff8800')
    key(hexInput(), 'Enter')
    expect(onChange).toHaveBeenCalledWith([255, 136, 0], true)
  })

  it('reverts the hex field and calls nothing for invalid text', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={[0, 0, 0]} onChange={onChange} testId="cp" />)
    type(hexInput(), 'zzzzzz')
    key(hexInput(), 'Enter')
    expect(onChange).not.toHaveBeenCalled()
    expect(hexInput().value).toBe('000000')
  })

  it('dragging in the saturation/brightness square changes S and B, not swapped', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={[255, 0, 0]} onChange={onChange} testId="cp" />)
    rectOf(square(), {})
    // s = 0.25 (x fraction), v = 0.75 (1 - y fraction of 0.25)
    pointer(square(), 'pointerdown', 50, 50)
    expect(onChange).toHaveBeenCalledWith([191, 143, 143], false)
    pointer(square(), 'pointerup', 50, 50)
    expect(onChange).toHaveBeenLastCalledWith([191, 143, 143], true)
  })

  it('a vertical drag moves brightness, a horizontal drag moves saturation (axes are not swapped)', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={[255, 0, 0]} onChange={onChange} testId="cp" />)
    rectOf(square(), {})
    // s = 0.75, v = 0.25: distinct output from the s=0.25,v=0.75 case above.
    pointer(square(), 'pointerdown', 150, 150)
    expect(onChange).toHaveBeenCalledWith([64, 16, 16], false)
  })

  it('dragging the hue strip changes the hue, 360° at the top and 0° at the bottom (upstream direction)', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={[255, 0, 0]} onChange={onChange} testId="cp" />)
    rectOf(hue(), {})
    // A quarter of the way down a 200px strip (clientY 50 of 200): hue (1 - 0.25) * 360 = 270
    // (violet, [128, 0, 255]). The old (unflipped) direction would give 0.25 * 360 = 90
    // (chartreuse, [128, 255, 0]) instead, so this fails under the old mapping.
    pointer(hue(), 'pointerdown', 10, 50)
    expect(onChange).toHaveBeenCalledWith([128, 0, 255], false)
    pointer(hue(), 'pointerup', 10, 50)
    expect(onChange).toHaveBeenLastCalledWith([128, 0, 255], true)
  })

  it('ArrowRight on the square raises saturation and commits once', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={[128, 64, 64]} onChange={onChange} testId="cp" />)
    key(square(), 'ArrowRight')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith([128, 63, 63], true)
  })

  it('ArrowUp on the square raises brightness, not saturation (axes are not swapped)', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={[128, 64, 64]} onChange={onChange} testId="cp" />)
    key(square(), 'ArrowUp')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith([131, 65, 65], true)
  })

  it('ArrowUp on the hue strip raises the hue (Up moves toward 360° at the top)', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={[0, 255, 255]} onChange={onChange} testId="cp" />) // cyan, h = 180
    key(hue(), 'ArrowUp')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith([0, 251, 255], true) // h = 181
  })

  it('ArrowDown on the hue strip lowers the hue (Down moves toward 0° at the bottom)', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={[0, 255, 255]} onChange={onChange} testId="cp" />) // cyan, h = 180
    key(hue(), 'ArrowDown')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith([0, 255, 251], true) // h = 179
  })

  it('carries slider semantics on the square and the hue strip', () => {
    render(<ColorPicker value={[255, 0, 0]} onChange={vi.fn()} testId="cp" />)
    expect(square().getAttribute('role')).toBe('slider')
    expect(square().getAttribute('aria-valuemin')).toBe('0')
    expect(square().getAttribute('aria-valuemax')).toBe('100')
    expect(square().hasAttribute('aria-valuenow')).toBe(true)
    expect(square().hasAttribute('aria-valuetext')).toBe(true)
    expect(hue().getAttribute('role')).toBe('slider')
    expect(hue().getAttribute('aria-valuemin')).toBe('0')
    expect(hue().getAttribute('aria-valuemax')).toBe('359')
    expect(hue().getAttribute('aria-valuenow')).toBe('0')
    expect(hue().hasAttribute('aria-valuetext')).toBe(true)
  })

  it('R, G, B NumberFields report rgb changes', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={[10, 20, 30]} onChange={onChange} testId="cp" />)
    type(rInput(), '200')
    key(rInput(), 'Enter')
    expect(onChange).toHaveBeenCalledWith([200, 20, 30], true)
  })
})
