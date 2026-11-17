// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { Combobox, MultiSelect, type ComboboxOption } from './Combobox'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
// cmdk and Radix measure with ResizeObserver and scroll items into view, which jsdom lacks.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver
Element.prototype.scrollIntoView ??= function scrollIntoView() {}

let root: Root | null = null
let host: HTMLElement | null = null

function render(node: React.ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() => root!.render(node))
  return host
}

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = null
  host = null
})

const USERS: ComboboxOption<number>[] = [
  { value: 1, label: 'Ada Lovelace' },
  { value: 2, label: 'Grace Hopper' },
  { value: 3, label: 'Alan Turing (GitHub not connected)', disabled: true },
]

function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('Combobox', () => {
  it('shows the choice, opens a searchable list, picks, and clears', () => {
    const seen: (number | undefined)[] = []
    const out = render(<Combobox label="User" placeholder="Search users" value={2} options={USERS} onChange={(value) => seen.push(value)} />)
    const trigger = out.querySelector('[role="combobox"]') as HTMLButtonElement
    expect(trigger.textContent).toBe('Grace Hopper')
    act(() => trigger.click())
    const items = [...document.querySelectorAll('.kui-command-item')]
    expect(items.map((item) => item.textContent)).toEqual(['Ada Lovelace', 'Grace Hopper', 'Alan Turing (GitHub not connected)'])
    expect(items[2].getAttribute('data-disabled')).toBe('true')
    type(document.querySelector('.kui-combobox-panel input') as HTMLInputElement, 'ada')
    expect([...document.querySelectorAll('.kui-command-item')].map((item) => item.textContent)).toEqual(['Ada Lovelace'])
    act(() => (document.querySelector('.kui-command-item') as HTMLElement).click())
    expect(seen).toEqual([1])
    act(() => (out.querySelector('.kui-combobox-clear') as HTMLButtonElement).click())
    expect(seen).toEqual([1, undefined])
  })

  it('asks the caller to search when onSearch is given, and shows its loading state', () => {
    const queries: string[] = []
    const out = render(<Combobox label="User" value={undefined} options={USERS} loading onSearch={(query) => queries.push(query)} onChange={() => undefined} />)
    expect(out.querySelector('.kui-combobox-clear')).toBeNull()
    act(() => (out.querySelector('[role="combobox"]') as HTMLButtonElement).click())
    type(document.querySelector('.kui-combobox-panel input') as HTMLInputElement, 'zz')
    expect(queries).toEqual(['zz'])
    // The caller's options stay: the server matched them.
    expect(document.querySelectorAll('.kui-command-item')).toHaveLength(3)
    expect(document.querySelector('.kui-combobox-loading [role="status"]')).not.toBeNull()
  })
})

describe('MultiSelect', () => {
  it('lists the choices in the field and toggles them in list order', () => {
    const seen: string[][] = []
    const modes = ['free', 'reward', 'paid', 'hosted'].map((value) => ({ value, label: value }))
    const out = render(<MultiSelect label="Mode" values={['paid', 'free']} options={modes} onChange={(values) => seen.push(values)} />)
    const trigger = out.querySelector('[aria-haspopup="listbox"]') as HTMLButtonElement
    expect(trigger.textContent).toBe('free, paid')
    act(() => trigger.click())
    expect(document.querySelector('.kui-combobox-panel input')).toBeNull()
    act(() => (document.querySelectorAll('.kui-command-item')[1] as HTMLElement).click())
    act(() => (document.querySelectorAll('.kui-command-item')[2] as HTMLElement).click())
    expect(seen).toEqual([['free', 'reward', 'paid'], ['free']])
    act(() => root!.render(<MultiSelect label="Mode" values={['free', 'reward', 'paid', 'hosted']} options={modes} onChange={() => undefined} />))
    expect(host!.querySelector('.kui-combobox-value')?.textContent).toBe('All')
  })
})
