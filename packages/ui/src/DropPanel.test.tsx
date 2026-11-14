// @vitest-environment jsdom
import { act, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DropPanel } from './DropPanel'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root | null = null
afterEach(() => {
  if (root) act(() => root!.unmount())
  root = null
  container?.remove()
  vi.unstubAllGlobals()
})

function Harness() {
  const anchor = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(true)
  return (
    <>
      <button type="button" data-testid="outside">
        Outside
      </button>
      <span ref={anchor}>
        <button type="button" data-testid="toggle" onClick={() => setOpen((value) => !value)}>
          Home
        </button>
        <DropPanel open={open} anchor={anchor} onClose={() => setOpen(false)} label="Home" testId="panel">
          <button type="button" data-testid="field">
            Font
          </button>
          <button type="button" data-testid="run" data-kit-ui-id="command:format.bold">
            Bold
          </button>
        </DropPanel>
      </span>
    </>
  )
}

const byTestId = (id: string) => document.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
const click = (id: string) => act(() => void byTestId(id)?.dispatchEvent(new MouseEvent('click', { bubbles: true })))

describe('DropPanel', () => {
  it('stays open for its own controls and closes on a press outside, Escape, or a command', () => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => root!.render(<Harness />))
    expect(byTestId('panel')?.getAttribute('role')).toBe('dialog')
    click('field')
    expect(byTestId('panel')).not.toBeNull()
    act(() => void byTestId('outside')?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })))
    expect(byTestId('panel')).toBeNull()
    click('toggle')
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
    expect(byTestId('panel')).toBeNull()
    click('toggle')
    // An Escape a menu inside already took (it prevented the default) leaves the panel open.
    const taken = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
    taken.preventDefault()
    act(() => void window.dispatchEvent(taken))
    expect(byTestId('panel')).not.toBeNull()
    click('run')
    expect(byTestId('panel')).toBeNull()
  })

  it('takes the focus as it opens and gives it back to its button as it closes', () => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => root!.render(<Harness />))
    // Opened by its button (the harness starts open, before its anchor is attached).
    click('toggle')
    click('toggle')
    expect(document.activeElement).toBe(byTestId('field'))
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
    expect(document.activeElement).toBe(byTestId('toggle'))
    click('toggle')
    expect(document.activeElement).toBe(byTestId('field'))
    byTestId('run')?.focus()
    // A command closes the panel and unmounts the button that had the focus.
    click('run')
    expect(document.activeElement).toBe(byTestId('toggle'))
  })

  it('stays inside the window as its content grows after it opens (a gallery that fills in)', () => {
    let resized: ResizeObserverCallback = () => undefined
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resized = callback
        }
        observe() {}
        disconnect() {}
      },
    )
    let width = 200
    const offsetWidth = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => width)
    const box = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 600, right: 660, top: 0, bottom: 30, width: 60, height: 30, x: 600, y: 0, toJSON: () => null })
    try {
      container = document.createElement('div')
      document.body.append(container)
      root = createRoot(container)
      act(() => root!.render(<Harness />))
      click('toggle')
      click('toggle')
      expect(byTestId('panel')?.style.left).toBe('600px')
      width = 900
      act(() => resized([], {} as ResizeObserver))
      expect(byTestId('panel')?.style.left).toBe(`${window.innerWidth - 900 - 4}px`)
    } finally {
      offsetWidth.mockRestore()
      box.mockRestore()
    }
  })
})
