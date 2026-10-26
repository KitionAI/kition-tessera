// @vitest-environment jsdom
import { act, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { EyeButton, PanelFooter, RenameField, Thumbnail, type ThumbnailImage } from './PanelParts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom has no PointerEvent, canvas, pointer capture, or layout (see DockArea.test.tsx).
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
const drawn: unknown[] = []
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({ clearRect: () => undefined, drawImage: (...args: unknown[]) => drawn.push(args) })) as unknown as typeof HTMLCanvasElement.prototype.getContext
  HTMLElement.prototype.setPointerCapture = () => undefined
  HTMLElement.prototype.releasePointerCapture = () => undefined
})

let container: HTMLDivElement
let roots: Root[] = []
afterEach(() => {
  for (const root of roots) act(() => root.unmount())
  roots = []
  container?.remove()
  drawn.length = 0
})

function render(node: ReactNode) {
  container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  act(() => root.render(node))
}

const find = (testId: string) => document.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
const pointer = (element: Element, type: string, init: MouseEventInit & { pointerId?: number } = {}) =>
  act(() => {
    element.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, ...init }))
  })

describe('Thumbnail', () => {
  it('fits the image in its cell at its own aspect, and draws it', () => {
    const image = { width: 200, height: 100 } as unknown as ThumbnailImage
    render(<Thumbnail image={image} size={24} testId="thumb" />)
    const cell = find('thumb')!
    expect(cell.dataset.drawn).toBe('true')
    expect(cell.style.width).toBe('24px')
    const canvas = cell.querySelector('canvas')!
    expect([canvas.style.width, canvas.style.height]).toEqual(['24px', '12px'])
    expect(drawn.length).toBe(1)
  })

  it('draws nothing, and does not throw, for an image released meanwhile', () => {
    const closed = { width: 10, height: 10 } as unknown as ThumbnailImage
    const draw = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = (() => ({ clearRect: () => undefined, drawImage: () => { throw new DOMException('closed', 'InvalidStateError') } })) as unknown as typeof draw
    try {
      expect(() => render(<Thumbnail image={closed} size={24} testId="thumb" />)).not.toThrow()
      expect(find('thumb')!.dataset.drawn).toBe('true')
    } finally {
      HTMLCanvasElement.prototype.getContext = draw
    }
  })

  it('is an empty cell without an image', () => {
    render(<Thumbnail image={null} size={24} testId="thumb" />)
    expect(find('thumb')!.dataset.drawn).toBe('false')
    expect(find('thumb')!.querySelector('canvas')).toBeNull()
  })
})

describe('EyeButton', () => {
  it('toggles on the press, with Alt, and from the keyboard once', () => {
    const onPress = vi.fn()
    render(<EyeButton visible label="Toggle visibility" onPress={onPress} testId="eye" />)
    const eye = find('eye')!
    expect(eye.getAttribute('aria-pressed')).toBe('true')
    expect(eye.querySelector('svg')).not.toBeNull()
    pointer(eye, 'pointerdown', { altKey: true })
    // The click after a press does not toggle again.
    act(() => eye.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })))
    act(() => eye.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })))
    expect(onPress.mock.calls).toEqual([[true], [false]])
  })

  it('draws an empty box while hidden', () => {
    render(<EyeButton visible={false} label="Toggle visibility" onPress={vi.fn()} tabIndex={-1} testId="eye" />)
    expect(find('eye')!.getAttribute('aria-pressed')).toBe('false')
    expect(find('eye')!.tabIndex).toBe(-1)
    expect(find('eye')!.querySelector('svg')).toBeNull()
  })

  it('sweeps over the eyes of its group the pointer crosses, each once, on any pointer', () => {
    const over = vi.fn()
    function Column() {
      return (
        <>
          {['a', 'b', 'c'].map((id) => (
            <EyeButton key={id} visible label={id} onPress={vi.fn()} sweep={{ id, group: 'layers', onOver: over }} testId={`eye-${id}`} />
          ))}
          <EyeButton visible label="other" onPress={vi.fn()} sweep={{ id: 'x', group: 'channels', onOver: over }} testId="eye-x" />
        </>
      )
    }
    render(<Column />)
    // jsdom lays nothing out: a point's eye is the one at that y (10 px rows: a, b, c, then x).
    const order = ['a', 'b', 'c', 'x']
    document.elementFromPoint = ((_x: number, y: number) => find(`eye-${order[Math.floor(y / 10)]}`)) as typeof document.elementFromPoint
    const a = find('eye-a')!
    pointer(a, 'pointerdown', { clientX: 5, clientY: 5, pointerId: 7 })
    // One fast move from row a to row x crosses b and c (sampled every few pixels), then x, in another group.
    pointer(a, 'pointermove', { clientX: 5, clientY: 35, pointerId: 7 })
    pointer(a, 'pointermove', { clientX: 5, clientY: 15, pointerId: 7 })
    pointer(a, 'pointerup', { clientX: 5, clientY: 15, pointerId: 7 })
    pointer(a, 'pointermove', { clientX: 5, clientY: 25, pointerId: 7 })
    expect(over.mock.calls).toEqual([['b'], ['c']])
  })
})

describe('RenameField', () => {
  function Field({ onDone }: { onDone: (commit: boolean, text: string) => void }) {
    const [text, setText] = useState('Layer 1')
    return <RenameField value={text} label="Rename" onChange={setText} onDone={(commit) => onDone(commit, text)} testId="rename" />
  }
  const key = (element: Element, value: string) => act(() => element.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true })))

  it('starts focused, commits on Enter once, and keeps the key from the row', () => {
    const onDone = vi.fn()
    const rowKey = vi.fn()
    render(
      <div onKeyDown={rowKey}>
        <Field onDone={onDone} />
      </div>,
    )
    const input = find('rename') as HTMLInputElement
    expect(document.activeElement).toBe(input)
    key(input, 'Enter')
    act(() => input.blur())
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith(true, 'Layer 1')
    expect(rowKey).not.toHaveBeenCalled()
  })

  it('cancels on Escape', () => {
    const onDone = vi.fn()
    render(<Field onDone={onDone} />)
    key(find('rename')!, 'Escape')
    expect(onDone).toHaveBeenCalledWith(false, 'Layer 1')
  })
})

describe('PanelFooter', () => {
  it('lays its buttons out at the start and the end', () => {
    render(<PanelFooter start={<button type="button">Load</button>} end={<button type="button">New</button>} />)
    const groups = container.querySelectorAll('.kui-panel-footer-group')
    expect([...groups].map((group) => group.textContent)).toEqual(['Load', 'New'])
  })
})
