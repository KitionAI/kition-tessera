// @vitest-environment jsdom
import { act, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FloatingPanels, clampFloatingRect, type FloatingPanel, type FloatingPanelsProps } from './index'
import { kitStoreKey } from './index'
import { NumberField } from './index'
import { createTestElements, TestElements } from './testElements'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom has no PointerEvent (https://github.com/jsdom/jsdom/issues/2527); a MouseEvent with the
// right type and a pointerId reaches React's pointer handlers just the same (see DockArea.test.tsx).
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

/** The editor's size as the layer measures it (jsdom lays nothing out). */
let bounds = { width: 800, height: 600 }

let roots: Root[] = []
let hosts: HTMLElement[] = []
beforeEach(() => {
  localStorage.clear()
  bounds = { width: 800, height: 600 }
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const { width, height } = this.classList.contains('kui-floating-layer') ? bounds : { width: 0, height: 0 }
    return { x: 0, y: 0, left: 0, top: 0, width, height, right: width, bottom: height, toJSON: () => ({}) } as DOMRect
  })
})
afterEach(() => {
  for (const root of roots) act(() => root.unmount())
  roots = []
  for (const host of hosts) host.remove()
  hosts = []
  vi.restoreAllMocks()
  localStorage.clear()
})

function render(node: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  hosts.push(host)
  const root = createRoot(host)
  roots.push(root)
  act(() => root.render(node))
  return { host, root }
}

function pointer(element: Element, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'lostpointercapture', clientX: number, clientY: number, pointerId = 1, buttons?: number) {
  // A press and its moves hold the primary button; a release holds none.
  const held = buttons ?? (type === 'pointerdown' || type === 'pointermove' ? 1 : 0)
  act(() => {
    element.dispatchEvent(new PointerEvent(type, { clientX, clientY, pointerId, button: 0, buttons: held, bubbles: true }))
  })
}

function key(target: EventTarget, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  act(() => {
    target.dispatchEvent(event)
  })
  return event
}

const panel = (id: string, body: ReactNode = <span>{id} body</span>): FloatingPanel => ({ id, title: `Bin: ${id}`, render: () => body, uiId: `panel:bin.${id}` })

function props(overrides: Partial<FloatingPanelsProps> = {}): FloatingPanelsProps {
  return { kit: 'test', store: 'floats', panels: [panel('a')], onClose: () => undefined, focused: null, onFocus: () => undefined, ...overrides }
}

const EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const

const win = (host: Element, id: string) => host.querySelector<HTMLElement>(`[data-testid="floating-${id}"]`)!
const rectOf = (element: HTMLElement) => ({ x: parseFloat(element.style.left), y: parseFloat(element.style.top), width: parseFloat(element.style.width), height: parseFloat(element.style.height) })
const stored = () => JSON.parse(localStorage.getItem(kitStoreKey('test', 'floats')) ?? 'null')

function storeWrites() {
  const setItem = vi.spyOn(Storage.prototype, 'setItem')
  return () => setItem.mock.calls.filter(([name]) => name === kitStoreKey('test', 'floats')).length
}

describe('FloatingPanels', () => {
  it('renders nothing without panels, and reads no store (default-preserving)', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const { host } = render(<FloatingPanels {...props({ panels: [] })} />)
    expect(host.innerHTML).toBe('')
    expect(getItem).not.toHaveBeenCalled()
  })

  it('opens a window at upstream\'s default size, with its title, body, and Kit UI ids on every part', () => {
    const { host } = render(<FloatingPanels {...props()} />)
    const element = win(host, 'a')
    expect(element.classList.contains('kui-floating-panel')).toBe(true)
    expect(rectOf(element)).toMatchObject({ width: 520, height: 360 })
    expect(element.textContent).toContain('Bin: a')
    expect(element.textContent).toContain('a body')
    expect(element.getAttribute('data-kit-ui-id')).toBe('panel:bin.a')
    for (const part of ['title', 'close', ...EDGES.map((edge) => `resize-${edge}`)]) expect(host.querySelector(`[data-testid="floating-a-${part}"]`)!.getAttribute('data-kit-ui-id')).toBe('panel:bin.a')
    expect(host.querySelector('[data-testid="floating-a-close"]')!.getAttribute('aria-label')).toBe('Close Bin: a')
    // egui's automatic position for the first window: 16 px in from the top-left.
    expect(rectOf(element)).toEqual({ x: 16, y: 16, width: 520, height: 360 })
  })

  it('drags by its title bar, clamped inside the workspace, and stores one rectangle per gesture', () => {
    const writes = storeWrites()
    const { host } = render(<FloatingPanels {...props()} />)
    const element = win(host, 'a')
    const start = rectOf(element)
    const title = host.querySelector('[data-testid="floating-a-title"]')!
    pointer(title, 'pointerdown', 100, 100)
    pointer(title, 'pointermove', 150, 130)
    expect(rectOf(element)).toMatchObject({ x: start.x + 50, y: start.y + 30 })
    pointer(title, 'pointermove', 5000, 5000)
    expect(rectOf(element)).toEqual({ x: 800 - 520, y: 600 - 360, width: 520, height: 360 })
    expect(writes()).toBe(0)
    pointer(title, 'pointerup', 5000, 5000)
    expect(writes()).toBe(1)
    expect(stored()).toEqual({ a: { x: 280, y: 240, width: 520, height: 360 } })
    pointer(title, 'pointermove', 0, 0)
    expect(rectOf(element)).toMatchObject({ x: 280, y: 240 })
  })

  it('resizes from its corner, no smaller than its minimum and no larger than the workspace', () => {
    const { host } = render(<FloatingPanels {...props()} />)
    const element = win(host, 'a')
    const { x, y } = rectOf(element)
    const corner = host.querySelector('[data-testid="floating-a-resize-se"]')!
    pointer(corner, 'pointerdown', 500, 500)
    pointer(corner, 'pointermove', 540, 520)
    expect(rectOf(element)).toEqual({ x, y, width: 560, height: 380 })
    pointer(corner, 'pointermove', 0, 0)
    expect(rectOf(element)).toEqual({ x, y, width: 320, height: 220 })
    pointer(corner, 'pointermove', 9000, 9000)
    expect(rectOf(element)).toEqual({ x, y, width: 800 - x, height: 600 - y })
    pointer(corner, 'pointerup', 9000, 9000)
    expect(stored().a).toEqual({ x, y, width: 800 - x, height: 600 - y })
  })

  it('ends a drag with its last position on a lost capture, a cancel, or Escape (taken before the editor)', () => {
    const writes = storeWrites()
    const { host } = render(<FloatingPanels {...props()} />)
    const element = win(host, 'a')
    const title = host.querySelector('[data-testid="floating-a-title"]')!
    const start = rectOf(element)

    pointer(title, 'pointerdown', 100, 100)
    pointer(title, 'pointermove', 110, 100)
    pointer(title, 'lostpointercapture', 110, 100)
    expect(writes()).toBe(1)
    expect(stored().a).toMatchObject({ x: start.x + 10 })

    pointer(title, 'pointerdown', 100, 100)
    pointer(title, 'pointermove', 120, 100)
    pointer(title, 'pointercancel', 120, 100)
    expect(writes()).toBe(2)
    expect(stored().a).toMatchObject({ x: start.x + 30 })

    const editorKeys = vi.fn()
    window.addEventListener('keydown', editorKeys)
    pointer(title, 'pointerdown', 100, 100)
    pointer(title, 'pointermove', 130, 100)
    const escape = key(document.body, 'Escape')
    expect(escape.defaultPrevented).toBe(true)
    expect(editorKeys).not.toHaveBeenCalled()
    expect(writes()).toBe(3)
    expect(stored().a).toMatchObject({ x: start.x + 60 })
    // The gesture is over: later moves do nothing, and Escape is the editor's again.
    pointer(title, 'pointermove', 400, 100)
    pointer(title, 'pointerup', 400, 100)
    expect(rectOf(element)).toMatchObject({ x: start.x + 60 })
    expect(writes()).toBe(3)
    key(document.body, 'Escape')
    expect(editorKeys).toHaveBeenCalledTimes(1)
    window.removeEventListener('keydown', editorKeys)
  })

  it('a press that does not move writes nothing', () => {
    const writes = storeWrites()
    const { host } = render(<FloatingPanels {...props()} />)
    const title = host.querySelector('[data-testid="floating-a-title"]')!
    pointer(title, 'pointerdown', 100, 100)
    pointer(title, 'pointerup', 100, 100)
    expect(writes()).toBe(0)
  })

  it('stores its rectangle, and a second instance on the same store reads it', () => {
    const first = render(<FloatingPanels {...props()} />)
    const title = first.host.querySelector('[data-testid="floating-a-title"]')!
    const start = rectOf(win(first.host, 'a'))
    pointer(title, 'pointerdown', 100, 100)
    pointer(title, 'pointermove', 140, 120)
    pointer(title, 'pointerup', 140, 120)
    const second = render(<FloatingPanels {...props()} />)
    expect(rectOf(win(second.host, 'a'))).toEqual({ x: start.x + 40, y: start.y + 20, width: 520, height: 360 })
  })

  it('ignores a corrupt or foreign stored value', () => {
    localStorage.setItem(kitStoreKey('test', 'floats'), JSON.stringify({ a: { x: 'left', y: 2, width: 3, height: 4 } }))
    const { host } = render(<FloatingPanels {...props()} />)
    expect(rectOf(win(host, 'a'))).toMatchObject({ width: 520, height: 360 })
  })

  it('places new windows as egui does, beside the open ones, never exactly on one', () => {
    const { host } = render(<FloatingPanels {...props({ panels: [panel('a'), panel('b'), panel('c')] })} />)
    const rects = ['a', 'b', 'c'].map((id) => rectOf(win(host, id)))
    expect(rects[0]).toMatchObject({ x: 16, y: 16 })
    for (let i = 0; i < rects.length; i += 1) for (let j = i + 1; j < rects.length; j += 1) expect(rects[i]).not.toEqual(rects[j])
  })

  it('keeps an open window where it was placed when another closes, and does not drop a new one on an open one', () => {
    const { host, root } = render(<FloatingPanels {...props({ panels: [panel('a'), panel('b'), panel('c')] })} />)
    const a = rectOf(win(host, 'a'))
    const c = rectOf(win(host, 'c'))
    act(() => root.render(<FloatingPanels {...props({ panels: [panel('a'), panel('c')] })} />))
    expect(rectOf(win(host, 'a'))).toEqual(a)
    expect(rectOf(win(host, 'c'))).toEqual(c)
    act(() => root.render(<FloatingPanels {...props({ panels: [panel('c')] })} />))
    expect(rectOf(win(host, 'c'))).toEqual(c)
    act(() => root.render(<FloatingPanels {...props({ panels: [panel('c'), panel('d')] })} />))
    expect(rectOf(win(host, 'c'))).toEqual(c)
    expect(rectOf(win(host, 'd'))).not.toEqual(c)
  })

  it('resizes from every edge and corner, keeping the opposite side and its minimum size', () => {
    bounds = { width: 1200, height: 900 }
    localStorage.setItem(kitStoreKey('test', 'floats'), JSON.stringify({ a: { x: 200, y: 200, width: 520, height: 360 } }))
    const { host } = render(<FloatingPanels {...props()} />)
    const element = win(host, 'a')
    const drag = (edge: string, dx: number, dy: number) => {
      const handle = host.querySelector(`[data-testid="floating-a-resize-${edge}"]`)!
      pointer(handle, 'pointerdown', 500, 500)
      pointer(handle, 'pointermove', 500 + dx, 500 + dy)
      pointer(handle, 'pointerup', 500 + dx, 500 + dy)
      return rectOf(element)
    }
    expect(drag('w', -10, 50)).toEqual({ x: 190, y: 200, width: 530, height: 360 })
    expect(drag('w', 1000, 0)).toEqual({ x: 400, y: 200, width: 320, height: 360 })
    expect(drag('w', -1000, 0)).toEqual({ x: 0, y: 200, width: 720, height: 360 })
    expect(drag('n', 30, -20)).toEqual({ x: 0, y: 180, width: 720, height: 380 })
    expect(drag('n', 0, 1000)).toEqual({ x: 0, y: 340, width: 720, height: 220 })
    expect(drag('e', -1000, 0)).toEqual({ x: 0, y: 340, width: 320, height: 220 })
    expect(drag('s', 0, 100)).toEqual({ x: 0, y: 340, width: 320, height: 320 })
    expect(drag('ne', 100, -40)).toEqual({ x: 0, y: 300, width: 420, height: 360 })
    expect(drag('nw', 50, 50)).toEqual({ x: 50, y: 350, width: 370, height: 310 })
    expect(drag('sw', -50, 2000)).toEqual({ x: 0, y: 350, width: 420, height: 550 })
    expect(stored().a).toEqual({ x: 0, y: 350, width: 420, height: 550 })
  })

  it('stores whole pixels', () => {
    const { host } = render(<FloatingPanels {...props()} />)
    const title = host.querySelector('[data-testid="floating-a-title"]')!
    pointer(title, 'pointerdown', 100, 100)
    pointer(title, 'pointermove', 110.4, 120.6)
    expect(rectOf(win(host, 'a'))).toMatchObject({ x: 26, y: 37 })
    pointer(title, 'pointerup', 110.4, 120.6)
    expect(stored().a).toEqual({ x: 26, y: 37, width: 520, height: 360 })
  })

  it('keeps the open windows and the 64 most recent others when it stores', () => {
    const old: Record<string, unknown> = {}
    for (let i = 0; i < 100; i += 1) old[`old${i}`] = { x: i, y: i, width: 400, height: 300 }
    old.b = { x: 50, y: 50, width: 400, height: 300 }
    localStorage.setItem(kitStoreKey('test', 'floats'), JSON.stringify(old))
    const { host } = render(<FloatingPanels {...props({ panels: [panel('a'), panel('b')] })} />)
    const title = host.querySelector('[data-testid="floating-a-title"]')!
    pointer(title, 'pointerdown', 100, 100)
    pointer(title, 'pointermove', 90, 110)
    pointer(title, 'pointerup', 90, 110)
    const kept = Object.keys(stored())
    expect(kept).toContain('a')
    expect(kept).toContain('b')
    expect(kept.filter((id) => id.startsWith('old'))).toEqual(Array.from({ length: 64 }, (_, i) => `old${i + 36}`))
  })

  it('ends a drag on a move with no button held (a release it never heard)', () => {
    const writes = storeWrites()
    const { host } = render(<FloatingPanels {...props()} />)
    const element = win(host, 'a')
    const title = host.querySelector('[data-testid="floating-a-title"]')!
    pointer(title, 'pointerdown', 100, 100)
    pointer(title, 'pointermove', 120, 100)
    pointer(title, 'pointermove', 300, 100, 1, 0)
    expect(writes()).toBe(1)
    expect(rectOf(element)).toMatchObject({ x: 36 })
    pointer(title, 'pointermove', 400, 100)
    expect(rectOf(element)).toMatchObject({ x: 36 })
  })

  it('ignores a second pointer while one drags', () => {
    const { host } = render(<FloatingPanels {...props()} />)
    const element = win(host, 'a')
    const title = host.querySelector('[data-testid="floating-a-title"]')!
    const corner = host.querySelector('[data-testid="floating-a-resize-se"]')!
    pointer(title, 'pointerdown', 100, 100, 1)
    pointer(corner, 'pointerdown', 500, 500, 2)
    pointer(corner, 'pointermove', 560, 560, 2)
    expect(rectOf(element)).toEqual({ x: 16, y: 16, width: 520, height: 360 })
    pointer(title, 'pointermove', 110, 100, 1)
    expect(rectOf(element)).toEqual({ x: 26, y: 16, width: 520, height: 360 })
    pointer(corner, 'pointerup', 560, 560, 2)
    pointer(title, 'pointermove', 120, 100, 1)
    expect(rectOf(element)).toMatchObject({ x: 36 })
  })

  it('stores where a drag got to when the window closes, hides, or the layer unmounts mid-gesture', () => {
    const store = createTestElements()
    const tree = (panels: FloatingPanel[]) => (
      <TestElements store={store}>
        <FloatingPanels {...props({ panels })} />
      </TestElements>
    )
    const { host, root } = render(tree([panel('a'), panel('b'), panel('c')]))
    const drag = (id: string, dx: number) => {
      const title = host.querySelector(`[data-testid="floating-${id}-title"]`)!
      const start = rectOf(win(host, id))
      pointer(title, 'pointerdown', 100, 100)
      pointer(title, 'pointermove', 100 + dx, 100)
      return start
    }
    const a = drag('a', 10)
    act(() => root.render(tree([panel('b'), panel('c')])))
    expect(stored().a).toMatchObject({ x: a.x + 10 })
    const b = drag('b', -10)
    act(() => store.replace({ hide: ['panel:bin.b'] }))
    expect(win(host, 'b')).toBeNull()
    expect(stored().b).toMatchObject({ x: b.x - 10 })
    const c = drag('c', 20)
    act(() => root.unmount())
    roots = roots.filter((other) => other !== root)
    expect(stored().c).toMatchObject({ x: c.x + 20 })
  })

  it('calls onClose from its close button, without starting a drag', () => {
    const onClose = vi.fn()
    const writes = storeWrites()
    const { host } = render(<FloatingPanels {...props({ onClose })} />)
    const close = host.querySelector<HTMLButtonElement>('[data-testid="floating-a-close"]')!
    pointer(close, 'pointerdown', 10, 10)
    pointer(close, 'pointermove', 60, 60)
    pointer(close, 'pointerup', 60, 60)
    act(() => close.click())
    expect(onClose).toHaveBeenCalledWith('a')
    expect(writes()).toBe(0)
  })

  it('focuses a window on pointer-down and raises it above the others', () => {
    function Harness() {
      const [focused, setFocused] = useState<string | null>(null)
      return <FloatingPanels {...props({ panels: [panel('a'), panel('b')], focused, onFocus: setFocused })} />
    }
    const { host } = render(<Harness />)
    const z = (id: string) => Number(win(host, id).style.zIndex)
    expect(z('b')).toBeGreaterThan(z('a'))
    pointer(win(host, 'a').querySelector('span')!, 'pointerdown', 10, 10)
    expect(z('a')).toBeGreaterThan(z('b'))
    expect(win(host, 'a').getAttribute('data-focused')).toBe('true')
    expect(win(host, 'b').getAttribute('data-focused')).toBe('false')
    pointer(host.querySelector('[data-testid="floating-b-title"]')!, 'pointerdown', 10, 10)
    expect(z('b')).toBeGreaterThan(z('a'))
    expect(win(host, 'b').getAttribute('data-focused')).toBe('true')
  })

  it('raises the window the kit focuses', () => {
    const { host, root } = render(<FloatingPanels {...props({ panels: [panel('a'), panel('b')] })} />)
    act(() => root.render(<FloatingPanels {...props({ panels: [panel('a'), panel('b')], focused: 'a' })} />))
    expect(Number(win(host, 'a').style.zIndex)).toBeGreaterThan(Number(win(host, 'b').style.zIndex))
  })

  it('focusing a field inside a window focuses the window', () => {
    const onFocus = vi.fn()
    const { host } = render(<FloatingPanels {...props({ panels: [panel('a', <input data-testid="field" />)], onFocus })} />)
    act(() => host.querySelector<HTMLInputElement>('[data-testid="field"]')!.focus())
    expect(onFocus).toHaveBeenCalledWith('a')
  })

  it('Escape in a field inside reaches the field and does not close the window', () => {
    const onClose = vi.fn()
    const onChange = vi.fn()
    const { host } = render(<FloatingPanels {...props({ panels: [panel('a', <NumberField label="Speed" value={100} min={0} max={1000} onChange={onChange} hot testId="speed" />)], onClose })} />)
    act(() => host.querySelector<HTMLElement>('[data-testid="speed-value"]')!.focus())
    key(host.querySelector('[data-testid="speed-value"]')!, 'Enter')
    const typing = host.querySelector<HTMLInputElement>('[data-testid="speed-input"]')!
    expect(typing).not.toBeNull()
    const escape = key(typing, 'Escape')
    // The field took it: typing mode ended without a change, and the window is still open.
    expect(host.querySelector('[data-testid="speed-input"]')).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
    expect(escape.defaultPrevented).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
    expect(win(host, 'a')).not.toBeNull()
  })

  it('a title-bar press takes focus into the window from outside, but not from a field inside', () => {
    const outside = document.createElement('input')
    document.body.append(outside)
    const { host } = render(<FloatingPanels {...props({ panels: [panel('a', <input data-testid="field" />), panel('b')] })} />)
    act(() => outside.focus())
    pointer(host.querySelector('[data-testid="floating-a-title"]')!, 'pointerdown', 10, 10)
    pointer(host.querySelector('[data-testid="floating-a-title"]')!, 'pointerup', 10, 10)
    expect(document.activeElement).toBe(win(host, 'a'))
    const field = host.querySelector<HTMLInputElement>('[data-testid="field"]')!
    act(() => field.focus())
    pointer(host.querySelector('[data-testid="floating-a-title"]')!, 'pointerdown', 10, 10)
    pointer(host.querySelector('[data-testid="floating-a-title"]')!, 'pointerup', 10, 10)
    expect(document.activeElement).toBe(field)
    // Another window's title bar takes focus from this window's field.
    pointer(host.querySelector('[data-testid="floating-b-title"]')!, 'pointerdown', 10, 10)
    pointer(host.querySelector('[data-testid="floating-b-title"]')!, 'pointerup', 10, 10)
    expect(document.activeElement).toBe(win(host, 'b'))
    outside.remove()
  })

  it('stays inside the editor when the editor shrinks, and keeps the stored rectangle for when it grows', () => {
    localStorage.setItem(kitStoreKey('test', 'floats'), JSON.stringify({ a: { x: 400, y: 300, width: 520, height: 360 } }))
    bounds = { width: 1200, height: 900 }
    const { host } = render(<FloatingPanels {...props()} />)
    expect(rectOf(win(host, 'a'))).toEqual({ x: 400, y: 300, width: 520, height: 360 })
    bounds = { width: 700, height: 500 }
    act(() => window.dispatchEvent(new Event('resize')))
    expect(rectOf(win(host, 'a'))).toEqual({ x: 180, y: 140, width: 520, height: 360 })
    expect(stored().a).toEqual({ x: 400, y: 300, width: 520, height: 360 })
    bounds = { width: 1200, height: 900 }
    act(() => window.dispatchEvent(new Event('resize')))
    expect(rectOf(win(host, 'a'))).toEqual({ x: 400, y: 300, width: 520, height: 360 })
  })

  it('does not draw, or render, a window whose Kit UI id is hidden', () => {
    const render_ = vi.fn(() => <span>hidden body</span>)
    const store = createTestElements({ hide: ['panel:bin.a'] })
    const { host } = render(
      <TestElements store={store}>
        <FloatingPanels {...props({ panels: [{ ...panel('a'), render: render_ }, panel('b')] })} />
      </TestElements>,
    )
    expect(win(host, 'a')).toBeNull()
    expect(win(host, 'b')).not.toBeNull()
    expect(render_).not.toHaveBeenCalled()
  })

  it('does not render a window body again while the window moves', () => {
    const body = vi.fn(() => <span>body</span>)
    const { host } = render(<FloatingPanels {...props({ panels: [{ ...panel('a'), render: body }] })} />)
    const calls = body.mock.calls.length
    const title = host.querySelector('[data-testid="floating-a-title"]')!
    pointer(title, 'pointerdown', 100, 100)
    pointer(title, 'pointermove', 120, 110)
    pointer(title, 'pointermove', 140, 120)
    pointer(title, 'pointerup', 140, 120)
    expect(body.mock.calls.length).toBe(calls)
  })
})

describe('clampFloatingRect', () => {
  const min = { width: 320, height: 220 }
  it('keeps a rectangle inside the bounds and at least its minimum size', () => {
    expect(clampFloatingRect({ x: -20, y: -5, width: 100, height: 100 }, { width: 800, height: 600 }, min)).toEqual({ x: 0, y: 0, width: 320, height: 220 })
    expect(clampFloatingRect({ x: 700, y: 500, width: 520, height: 360 }, { width: 800, height: 600 }, min)).toEqual({ x: 280, y: 240, width: 520, height: 360 })
  })
  it('shrinks to bounds smaller than the window, and leaves it alone before the editor is measured', () => {
    expect(clampFloatingRect({ x: 50, y: 50, width: 520, height: 360 }, { width: 300, height: 200 }, min)).toEqual({ x: 0, y: 0, width: 300, height: 200 })
    expect(clampFloatingRect({ x: 50, y: 50, width: 520, height: 360 }, null, min)).toEqual({ x: 50, y: 50, width: 520, height: 360 })
  })
})
