// @vitest-environment jsdom
import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStrings, StringsProvider, TESSERA_CATALOGS } from './context'
import { Card, CardContent, CardHeader, Disclosure, Field, PasswordInput, Select, TextInput, Textarea } from './forms'
import { Button, ButtonLink } from './ui'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

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

describe('Button', () => {
  it('keeps the editor chrome default and adds sizes and variants', () => {
    const out = render(
      <>
        <Button>Plain</Button>
        <Button variant="danger" size="lg">
          Delete
        </Button>
      </>,
    )
    const [plain, danger] = out.querySelectorAll('button')
    expect(plain.getAttribute('data-variant')).toBeNull()
    expect(plain.getAttribute('data-size')).toBeNull()
    expect(plain.type).toBe('button')
    expect(danger.getAttribute('data-variant')).toBe('danger')
    expect(danger.getAttribute('data-size')).toBe('lg')
  })
})

describe('TextInput', () => {
  it('forwards its ref and props, defaults to the dense size, and marks invalid', () => {
    const ref = createRef<HTMLInputElement>()
    const out = render(<TextInput ref={ref} placeholder="Name" invalid className="extra" />)
    const input = out.querySelector('input')!
    expect(ref.current).toBe(input)
    expect(input.className).toBe('kui-input extra')
    expect(input.getAttribute('data-size')).toBe('sm')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })
})

describe('PasswordInput', () => {
  it('shows and hides the password with a labelled button outside the tab order', () => {
    const out = render(<PasswordInput defaultValue="secret" />)
    const input = out.querySelector('input')!
    const toggle = out.querySelector('button')!
    expect(input.type).toBe('password')
    expect(toggle.getAttribute('aria-label')).toBe('Show password')
    expect(toggle.tabIndex).toBe(-1)
    act(() => toggle.click())
    expect(input.type).toBe('text')
    expect(toggle.getAttribute('aria-label')).toBe('Hide password')
  })

  it('takes its labels from the editor strings', () => {
    const out = render(
      <StringsProvider strings={createStrings(TESSERA_CATALOGS, 'zh-CN')}>
        <PasswordInput />
      </StringsProvider>,
    )
    expect(out.querySelector('button')!.getAttribute('aria-label')).toBe(TESSERA_CATALOGS['zh-CN'].passwordShow)
  })

  it('puts className on the field, like TextInput, and wrapperClassName on the box around it', () => {
    const out = render(<PasswordInput className="field-look" wrapperClassName="row-width" />)
    expect(out.querySelector('input')!.className).toBe('kui-input field-look')
    expect(out.querySelector('.kui-password')!.className).toBe('kui-password row-width')
  })
})

describe('Select and Textarea', () => {
  it('is a native select that reports changes', () => {
    const onChange = vi.fn()
    const out = render(
      <Select size="lg" value="b" onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    )
    const select = out.querySelector('select')!
    expect(select.value).toBe('b')
    expect(out.querySelector('.kui-select')?.getAttribute('data-size')).toBe('lg')
    act(() => {
      select.value = 'a'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('draws a textarea', () => {
    expect(render(<Textarea rows={3} />).querySelector('textarea')?.className).toBe('kui-textarea')
  })
})

describe('Field', () => {
  it('labels the control and describes it with the hint, or the error instead', () => {
    const out = render(
      <Field label="Email" hint="We never share it." error="Enter an email address.">
        {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} />}
      </Field>,
    )
    const input = out.querySelector('input')!
    const label = out.querySelector('label')!
    const note = out.querySelector('.kui-form-note')!
    expect(label.htmlFor).toBe(input.id)
    expect(input.getAttribute('aria-describedby')).toBe(note.id)
    expect(note.textContent).toBe('Enter an email address.')
    expect(note.getAttribute('role')).toBe('alert')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })
})

describe('Card and Disclosure', () => {
  it('draws a card', () => {
    const out = render(
      <Card>
        <CardHeader>Title</CardHeader>
        <CardContent>Body</CardContent>
      </Card>,
    )
    expect(out.querySelector('.kui-card .kui-card-header')?.textContent).toBe('Title')
  })

  it('opens and closes, and reports closing', () => {
    const onClose = vi.fn()
    const out = render(
      <Disclosure title="Advanced" onClose={onClose}>
        Body
      </Disclosure>,
    )
    const trigger = out.querySelector('button')!
    expect(out.textContent).not.toContain('Body')
    act(() => trigger.click())
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)?.textContent).toBe('Body')
    act(() => trigger.click())
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(out.textContent).not.toContain('Body')
  })
})

describe('ButtonLink and TextInput prefix', () => {
  it('draws a link as a button, or through a router’s own link', () => {
    const out = render(
      <>
        <ButtonLink variant="primary" size="md" href="/sign-in">
          Sign in
        </ButtonLink>
        <ButtonLink render={(props) => <a data-router="yes" href="/home" {...props} />}>Home</ButtonLink>
      </>,
    )
    const [plain, routed] = out.querySelectorAll('a')
    expect(plain.className).toBe('kui-button')
    expect(plain.getAttribute('data-variant')).toBe('primary')
    expect(plain.getAttribute('href')).toBe('/sign-in')
    expect(routed.dataset.router).toBe('yes')
    expect(routed.className).toBe('kui-button')
  })

  it('puts a prefix inside the field, keeping the field itself the input', () => {
    const ref = createRef<HTMLInputElement>()
    const out = render(<TextInput ref={ref} prefix={<span>@</span>} wrapperClassName="w-60" aria-label="Handle" />)
    const box = out.querySelector('.kui-input-affix')!
    expect(box.className).toBe('kui-input-affix w-60')
    expect(box.querySelector('.kui-input-prefix')?.getAttribute('aria-hidden')).toBe('true')
    expect(ref.current).toBe(out.querySelector('input.kui-input'))
    expect(render(<PasswordInput prefix={<span>k</span>} aria-label="Key" />).querySelector('.kui-password .kui-input-affix input')).not.toBeNull()
  })
})

describe('Disclosure held open from outside', () => {
  it('follows open and reports the person’s toggles', () => {
    const seen: boolean[] = []
    const out = render(
      <Disclosure title="Advanced filters" open onOpenChange={(open) => seen.push(open)}>
        Filters
      </Disclosure>,
    )
    expect(out.textContent).toContain('Filters')
    act(() => (out.querySelector('.kui-disclosure-trigger') as HTMLButtonElement).click())
    expect(seen).toEqual([false])
    expect(out.textContent).toContain('Filters')
  })
})

describe('danger-outline', () => {
  it('marks a quiet destructive button', () => {
    const out = render(<Button variant="danger-outline">Disable</Button>)
    expect(out.querySelector('button')?.getAttribute('data-variant')).toBe('danger-outline')
  })
})
