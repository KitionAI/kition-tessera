// @vitest-environment jsdom
import { act, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StringsProvider } from './context'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, Popover, PopoverContent, PopoverTrigger, Switch } from './overlays'
import { Button } from './ui'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// cmdk and Radix measure with ResizeObserver and scroll items into view, which jsdom lacks.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver
Element.prototype.scrollIntoView ??= function scrollIntoView() {}

let root: Root | null = null
let host: HTMLDivElement | null = null

function render(node: ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() => root!.render(node))
}

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = null
  document.body.innerHTML = ''
})

describe('Button', () => {
  it('adds its className to Tessera’s and marks size, variant, and icon-only', () => {
    render(
      <Button variant="subtle" size="sm" iconOnly className="extra" aria-label="Add">
        +
      </Button>,
    )
    const button = document.querySelector('button')!
    expect(button.className).toBe('kui-button extra')
    expect(button.dataset.variant).toBe('subtle')
    expect(button.dataset.size).toBe('sm')
    expect(button.hasAttribute('data-icon-only')).toBe(true)
  })

  it('shows a spinner and marks itself busy while loading', () => {
    render(<Button loading>Save</Button>)
    const button = document.querySelector('button')!
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.querySelector('.kui-spinner')).not.toBeNull()
  })
})

describe('Modal', () => {
  function Harness({ onOpenChange, dismissible }: { onOpenChange?: (open: boolean) => void; dismissible?: boolean }) {
    const [open, setOpen] = useState(true)
    return (
      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          onOpenChange?.(next)
        }}
      >
        <ModalContent size="sm" dismissible={dismissible} data-testid="modal">
          <ModalHeader>
            <ModalTitle>Rename</ModalTitle>
            <ModalDescription>Give it a new name.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="primary">Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }

  it('draws a labelled dialog of its size with a close button that closes it', () => {
    const onOpenChange = vi.fn()
    render(<Harness onOpenChange={onOpenChange} />)
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement
    expect(dialog.dataset.size).toBe('sm')
    expect(dialog.classList.contains('kui-modal')).toBe(true)
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)!.textContent).toBe('Rename')
    const close = document.querySelector('.kui-modal-close') as HTMLButtonElement
    expect(close.getAttribute('aria-label')).toBe('Close')
    act(() => close.click())
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('takes the close label from the editor’s strings', () => {
    render(
      <StringsProvider strings={(key) => (key === 'close' ? 'Fermer' : key)}>
        <Harness />
      </StringsProvider>,
    )
    expect(document.querySelector('.kui-modal-close')!.getAttribute('aria-label')).toBe('Fermer')
  })

  it('closes on Escape', () => {
    const onOpenChange = vi.fn()
    render(<Harness onOpenChange={onOpenChange} />)
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement
    act(() => {
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('Popover', () => {
  it('opens its panel from the trigger', () => {
    render(
      <Popover>
        <PopoverTrigger>Filter</PopoverTrigger>
        <PopoverContent data-testid="panel">Conditions</PopoverContent>
      </Popover>,
    )
    expect(document.querySelector('[data-testid="panel"]')).toBeNull()
    const trigger = document.querySelector('button')!
    act(() => trigger.click())
    const panel = document.querySelector('[data-testid="panel"]')!
    expect(panel.classList.contains('kui-popover')).toBe(true)
    expect(panel.textContent).toBe('Conditions')
  })
})

describe('Switch', () => {
  it('is a switch that reports its new state', () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Sync" defaultChecked={false} onCheckedChange={onCheckedChange} />)
    const control = document.querySelector('[role="switch"]') as HTMLButtonElement
    expect(control.getAttribute('aria-checked')).toBe('false')
    act(() => control.click())
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(control.getAttribute('aria-checked')).toBe('true')
    expect(control.classList.contains('kui-switch')).toBe(true)
  })
})

describe('Command', () => {
  it('filters its items as the person types', () => {
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandEmpty>Nothing found</CommandEmpty>
          <CommandItem>Open file</CommandItem>
          <CommandItem>Close tab</CommandItem>
        </CommandList>
      </Command>,
    )
    expect(document.querySelectorAll('.kui-command-item')).toHaveLength(2)
    const input = document.querySelector('input')!
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(input, 'close')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const items = [...document.querySelectorAll('.kui-command-item')].map((item) => item.textContent)
    expect(items).toEqual(['Close tab'])
  })
})
