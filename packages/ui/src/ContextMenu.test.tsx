// @vitest-environment jsdom
import { act, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContextMenu, MenuButton, MenuItem, MenuSeparator, type ContextMenuPoint } from './ui'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let roots: Root[] = []
afterEach(() => {
  for (const root of roots) act(() => root.unmount())
  roots = []
  container?.remove()
})

function render(node: ReactNode) {
  container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  act(() => root.render(node))
}

/** A row that opens its menu where it is right-clicked, as a Layers panel row does. */
function Row({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  const [at, setAt] = useState<ContextMenuPoint | null>(null)
  return (
    <>
      <div
        data-testid="row"
        onContextMenu={(event) => {
          event.preventDefault()
          setAt({ x: event.clientX, y: event.clientY })
        }}
      >
        Layer 1
      </div>
      <button type="button" data-testid="outside">
        Outside
      </button>
      <ContextMenu at={at} onClose={() => setAt(null)} label="Layer" testId="menu">
        <MenuItem label="Rename" onSelect={onRename} testId="rename" uiId="control:layers.rename" />
        <MenuSeparator />
        <MenuItem label="Delete" onSelect={onDelete} testId="delete" disabled />
      </ContextMenu>
    </>
  )
}

const find = (testId: string) => document.querySelector<HTMLElement>(`[data-testid="${testId}"]`)

/** A key as a person presses it: on whatever has the focus. */
function pressKey(key: string) {
  act(() => {
    ;(document.activeElement ?? document.body).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })
}

function rightClick(element: HTMLElement, x: number, y: number) {
  act(() => {
    element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }))
  })
}

describe('ContextMenu', () => {
  it('opens at the point, as a menu of its items, and draws nothing while closed', () => {
    render(<Row onRename={vi.fn()} onDelete={vi.fn()} />)
    expect(find('menu')).toBeNull()
    rightClick(find('row')!, 40, 60)
    const menu = find('menu')!
    expect(menu.getAttribute('role')).toBe('menu')
    expect(menu.getAttribute('aria-label')).toBe('Layer')
    expect(menu.style.left).toBe('40px')
    expect(menu.style.top).toBe('60px')
    expect(find('rename')?.getAttribute('data-kit-ui-id')).toBe('control:layers.rename')
    expect((find('delete') as HTMLButtonElement).disabled).toBe(true)
  })

  it('keeps itself inside the window', () => {
    render(<Row onRename={vi.fn()} onDelete={vi.fn()} />)
    rightClick(find('row')!, window.innerWidth + 500, window.innerHeight + 500)
    const menu = find('menu')!
    expect(Number.parseFloat(menu.style.left)).toBeLessThanOrEqual(window.innerWidth)
    expect(Number.parseFloat(menu.style.top)).toBeLessThanOrEqual(window.innerHeight)
  })

  it('moves back inside the window when it grows after opening', () => {
    const observers: Array<() => void> = []
    const Original = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      constructor(callback: () => void) {
        observers.push(callback)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
    try {
      render(<Row onRename={vi.fn()} onDelete={vi.fn()} />)
      rightClick(find('row')!, window.innerWidth - 220, 10)
      const menu = find('menu')!
      Object.defineProperty(menu, 'offsetWidth', { configurable: true, value: 200 })
      act(() => observers.forEach((callback) => callback()))
      expect(menu.style.left).toBe(`${window.innerWidth - 220}px`)
      // Its rows widen it by 40 px: it moves left to stay 4 px inside.
      Object.defineProperty(menu, 'offsetWidth', { configurable: true, value: 240 })
      act(() => observers.forEach((callback) => callback()))
      expect(menu.style.left).toBe(`${window.innerWidth - 244}px`)
    } finally {
      globalThis.ResizeObserver = Original
    }
  })

  it('runs a chosen item once and closes', () => {
    const onRename = vi.fn()
    render(<Row onRename={onRename} onDelete={vi.fn()} />)
    rightClick(find('row')!, 10, 10)
    act(() => find('rename')!.click())
    expect(onRename).toHaveBeenCalledTimes(1)
    expect(find('menu')).toBeNull()
  })

  it('closes on Escape and on a press outside it, but not on a press inside it', () => {
    render(<Row onRename={vi.fn()} onDelete={vi.fn()} />)
    rightClick(find('row')!, 10, 10)
    act(() => {
      find('menu')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })
    expect(find('menu')).not.toBeNull()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(find('menu')).toBeNull()
    rightClick(find('row')!, 10, 10)
    act(() => {
      find('outside')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })
    expect(find('menu')).toBeNull()
  })

  it('focuses its first enabled row and moves through the rows with the arrow keys', () => {
    render(<Row onRename={vi.fn()} onDelete={vi.fn()} />)
    rightClick(find('row')!, 10, 10)
    expect(document.activeElement).toBe(find('rename'))
    // Delete is disabled: Down wraps back to Rename, the only enabled row.
    pressKey('ArrowDown')
    expect(document.activeElement).toBe(find('rename'))
    pressKey('End')
    expect(document.activeElement).toBe(find('rename'))
  })

  it('gives the focus back to what had it, after Escape or a choice', () => {
    render(<Row onRename={vi.fn()} onDelete={vi.fn()} />)
    const outside = find('outside')!
    act(() => outside.focus())
    rightClick(find('row')!, 10, 10)
    expect(document.activeElement).toBe(find('rename'))
    pressKey('Escape')
    expect(find('menu')).toBeNull()
    expect(document.activeElement).toBe(outside)
    rightClick(find('row')!, 10, 10)
    act(() => find('rename')!.click())
    expect(document.activeElement).toBe(outside)
  })
})

describe('MenuButton', () => {
  it("is entered by keyboard and shares the context menu's closing", () => {
    render(
      <>
        <MenuButton trigger={({ toggle }) => <button type="button" data-testid="open" onClick={toggle}>Open</button>}>
          <MenuItem label="One" onSelect={vi.fn()} testId="one" />
          <MenuItem label="Two" onSelect={vi.fn()} testId="two" />
        </MenuButton>
        <button type="button" data-testid="elsewhere">Elsewhere</button>
      </>,
    )
    const open = find('open')!
    act(() => open.focus())
    act(() => open.click())
    // The menu takes the focus; the arrows land where a person's keys do.
    expect(document.activeElement).toBe(find('one'))
    pressKey('ArrowDown')
    expect(document.activeElement).toBe(find('two'))
    pressKey('Escape')
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(open)
    act(() => open.click())
    act(() => {
      find('elsewhere')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })
    expect(document.querySelector('[role="menu"]')).toBeNull()
  })

  it('with placement "auto", opens above its button when the room below is too small, and below otherwise', () => {
    const rect = HTMLElement.prototype.getBoundingClientRect
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    const inner = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 200 })
    let buttonTop = 650
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      if (this.tagName === 'SPAN') return { left: 10, right: 40, top: buttonTop, bottom: buttonTop + 22, width: 30, height: 22, x: 10, y: buttonTop, toJSON: () => ({}) } as DOMRect
      return rect.call(this)
    }
    try {
      const menu = (placement?: 'below' | 'auto') => (
        <MenuButton placement={placement} trigger={({ toggle }) => <button type="button" data-testid="open" onClick={toggle}>Open</button>}>
          <MenuItem label="One" onSelect={vi.fn()} testId="one" />
        </MenuButton>
      )
      render(menu('auto'))
      act(() => find('open')!.click())
      const above = document.querySelector<HTMLElement>('[role="menu"]')!
      expect(parseFloat(above.style.top)).toBe(650 - 4 - 200)
      act(() => find('open')!.click())
      for (const root of roots) act(() => root.unmount())
      roots = []
      // Without it, the menu keeps opening below, however little room there is.
      render(menu())
      act(() => find('open')!.click())
      expect(parseFloat(document.querySelector<HTMLElement>('[role="menu"]')!.style.top)).toBe(650 + 22 + 4)
      for (const root of roots) act(() => root.unmount())
      roots = []
      // With room below, "auto" opens below too.
      buttonTop = 100
      render(menu('auto'))
      act(() => find('open')!.click())
      expect(parseFloat(document.querySelector<HTMLElement>('[role="menu"]')!.style.top)).toBe(100 + 22 + 4)
    } finally {
      HTMLElement.prototype.getBoundingClientRect = rect
      if (height) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', height)
      else delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: inner })
    }
  })

  it('opened above, sits on its button by its whole height, borders included', () => {
    const rect = HTMLElement.prototype.getBoundingClientRect
    const scroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
    const offset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    const inner = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 })
    // Its content is 200 px; with its 1 px borders the menu is 202 px tall.
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => 200 })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 202 })
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      if (this.tagName === 'SPAN') return { left: 10, right: 40, top: 650, bottom: 672, width: 30, height: 22, x: 10, y: 650, toJSON: () => ({}) } as DOMRect
      return rect.call(this)
    }
    try {
      render(
        <MenuButton placement="auto" trigger={({ toggle }) => <button type="button" data-testid="open" onClick={toggle}>Open</button>}>
          <MenuItem label="One" onSelect={vi.fn()} testId="one" />
        </MenuButton>,
      )
      act(() => find('open')!.click())
      expect(parseFloat(document.querySelector<HTMLElement>('[role="menu"]')!.style.top)).toBe(650 - 4 - 202)
    } finally {
      HTMLElement.prototype.getBoundingClientRect = rect
      for (const [name, descriptor] of [['scrollHeight', scroll], ['offsetHeight', offset]] as const) {
        if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor)
        else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[name]
      }
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: inner })
    }
  })
})
