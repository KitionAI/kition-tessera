// @vitest-environment jsdom
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MinusIcon as Minus, PlusIcon as Plus } from '@kition/tessera-icons/react'
import { BarSeparator, Checkbox, Choice, Hint, Segmented } from './BarControls'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

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
}

describe('Checkbox', () => {
  it('shows its label and reports a change', () => {
    const onChange = vi.fn()
    render(<Checkbox label="Contiguous" checked={false} onChange={onChange} testId="c" />)
    const box = host.querySelector('[data-testid="c"]') as HTMLInputElement
    expect(host.textContent).toBe('Contiguous')
    act(() => box.click())
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('does nothing while disabled', () => {
    const onChange = vi.fn()
    render(<Checkbox label="Anti-alias" checked disabled onChange={onChange} />)
    const box = host.querySelector('input') as HTMLInputElement
    expect(box.disabled).toBe(true)
    expect(host.querySelector('.kui-checkbox')?.getAttribute('data-disabled')).toBe('true')
  })
})

describe('Choice', () => {
  it('shows the value and reports another', () => {
    const onChange = vi.fn()
    render(
      <Choice
        label="Mode"
        value="b"
        choices={[
          ['a', 'First'],
          ['b', 'Second'],
        ]}
        onChange={onChange}
      />,
    )
    const select = host.querySelector('select') as HTMLSelectElement
    expect(select.value).toBe('b')
    expect(select.getAttribute('aria-label')).toBe('Mode')
    expect(host.querySelector('span')?.textContent).toBe('Mode')
    act(() => {
      select.value = 'a'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('keeps its name but draws no label when quiet', () => {
    render(<Choice label="Font" quiet value="x" choices={[['x', 'X']]} onChange={() => undefined} />)
    expect(host.querySelector('span')).toBeNull()
    expect(host.querySelector('select')?.getAttribute('aria-label')).toBe('Font')
  })
})

describe('Segmented', () => {
  it('presses the value and reports another', () => {
    const onChange = vi.fn()
    render(
      <Segmented
        label="Selection mode"
        value="add"
        segments={[
          { value: 'add', icon: Plus, label: 'Add' },
          { value: 'subtract', icon: Minus, label: 'Subtract' },
        ]}
        onChange={onChange}
        testId="mode"
      />,
    )
    const add = host.querySelector('[data-testid="mode-add"]') as HTMLButtonElement
    const subtract = host.querySelector('[data-testid="mode-subtract"]') as HTMLButtonElement
    expect(host.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Selection mode')
    expect(add.getAttribute('aria-pressed')).toBe('true')
    expect(subtract.getAttribute('aria-pressed')).toBe('false')
    expect(subtract.getAttribute('aria-label')).toBe('Subtract')
    act(() => subtract.click())
    expect(onChange).toHaveBeenCalledWith('subtract')
  })
})

describe('BarSeparator and Hint', () => {
  it('draws a hidden hairline and a hint', () => {
    render(
      <>
        <BarSeparator />
        <Hint testId="h">Drag to pan</Hint>
      </>,
    )
    expect(host.querySelector('.kui-bar-separator')?.getAttribute('aria-hidden')).toBe('true')
    expect(host.querySelector('[data-testid="h"]')?.textContent).toBe('Drag to pan')
  })
})
