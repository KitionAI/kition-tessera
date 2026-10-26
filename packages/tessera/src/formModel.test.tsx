// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Checkbox } from './BarControls'
import { createStrings, TESSERA_CATALOGS } from './context'
import { TextInput } from './forms'
import { checkRules, DateTimeInput, Form, FormItem, NumberInput, Popconfirm, useForm, useWatch, type FormInstance } from './formModel'
import { Switch } from './overlays'
import { Button } from './ui'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
// Radix's switch measures with ResizeObserver, which jsdom lacks.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

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

/** Types into an input as React hears it. */
function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const flush = () => act(async () => await new Promise((resolve) => setTimeout(resolve, 0)))
const t = createStrings(TESSERA_CATALOGS, 'en-US')

describe('checkRules', () => {
  const form = {} as FormInstance
  it('reports the first broken rule in words', async () => {
    expect(await checkRules('', [{ required: true }], 'Email', form, t)).toBe('Email is required')
    expect(await checkRules('   ', [{ required: true, whitespace: true }], 'Name', form, t)).toBe('Name is required')
    expect(await checkRules('ada', [{ type: 'email' }], 'Email', form, t)).toBe('Email must be an email address')
    expect(await checkRules('abc', [{ min: 8 }], 'Password', form, t)).toBe('Password needs at least 8 characters')
    expect(await checkRules(0, [{ min: 1 }], 'Credits', form, t)).toBe('Credits must be at least 1')
    expect(await checkRules('x', [{ validator: () => 'Taken' }], 'Name', form, t)).toBe('Taken')
    expect(await checkRules('', [{ min: 3 }], 'Optional', form, t)).toBeUndefined()
    expect(await checkRules('ada@example.com', [{ required: true, type: 'email', message: 'Need an email' }], 'Email', form, t)).toBeUndefined()
  })
})

describe('Form types', () => {
  it('takes an interface for its values, without an index signature', () => {
    interface Credits {
      amount: number
      reason: string
    }
    function CreditsForm() {
      const form = useForm<Credits>()
      return (
        <Form<Credits> form={form} initialValues={{ amount: 1 }} onFinish={(values) => values.amount + values.reason.length}>
          <FormItem name="reason" label="Reason">
            <TextInput />
          </FormItem>
        </Form>
      )
    }
    expect(render(<CreditsForm />).querySelector('form')).not.toBeNull()
  })
})

describe('Form', () => {
  function Signup({ onFinish, watch }: { onFinish: (values: Record<string, unknown>) => void; watch?: (value: unknown) => void }) {
    const form = useForm()
    watch?.(useWatch('email', form))
    return (
      <>
        <Form form={form} initialValues={{ email: '', terms: false }} onFinish={onFinish}>
          <FormItem name="email" label="Email" rules={[{ required: true }, { type: 'email' }]} extra="We send the receipt here.">
            <TextInput />
          </FormItem>
          <FormItem name="password" label="Password" rules={[{ required: true }]}>
            <TextInput type="password" />
          </FormItem>
          <FormItem
            name="confirm"
            label="Confirm"
            dependencies={['password']}
            rules={[{ validator: (value, instance) => (value === instance.getFieldValue('password') ? undefined : 'Passwords differ') }]}
          >
            <TextInput type="password" />
          </FormItem>
          <FormItem name="terms" valuePropName="checked">
            <Checkbox label="I agree" />
          </FormItem>
          <FormItem name="news" valuePropName="checked" trigger="onCheckedChange">
            <Switch aria-label="News" />
          </FormItem>
        </Form>
        <Button onClick={() => form.submit()}>Create</Button>
        <Button onClick={() => form.resetFields()}>Reset</Button>
      </>
    )
  }

  it('checks every field on submit, shows the errors, and calls onFinish once they pass', async () => {
    const onFinish = vi.fn()
    const out = render(<Signup onFinish={onFinish} />)
    const [email, password, confirm] = out.querySelectorAll<HTMLInputElement>('input.kui-input')
    expect(out.querySelector('label[for]')?.textContent).toBe('Email*')
    expect(out.querySelector('.kui-form-note')?.textContent).toBe('We send the receipt here.')
    act(() => out.querySelectorAll('button')[out.querySelectorAll('button').length - 2].click())
    await flush()
    expect(onFinish).not.toHaveBeenCalled()
    expect([...out.querySelectorAll('[role="alert"]')].map((note) => note.textContent)).toEqual(['Email is required', 'Password is required'])
    expect(email.getAttribute('aria-invalid')).toBe('true')
    type(email, 'ada@example.com')
    await flush()
    expect(email.getAttribute('aria-invalid')).toBeNull()
    type(password, 'secret-1')
    type(confirm, 'secret-2')
    await flush()
    expect(out.textContent).toContain('Passwords differ')
    // Changing the password re-checks its confirmation.
    type(password, 'secret-2')
    await flush()
    expect(out.textContent).not.toContain('Passwords differ')
    act(() => (out.querySelector('input[type="checkbox"]') as HTMLInputElement).click())
    act(() => (out.querySelector('[role="switch"]') as HTMLButtonElement).click())
    act(() => out.querySelectorAll('button')[out.querySelectorAll('button').length - 2].click())
    await flush()
    expect(onFinish).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secret-2', confirm: 'secret-2', terms: true, news: true })
  })

  it('resets to its initial values and reports a field to useWatch', async () => {
    const seen: unknown[] = []
    const out = render(<Signup onFinish={() => undefined} watch={(value) => seen.push(value)} />)
    const email = out.querySelector('input.kui-input') as HTMLInputElement
    type(email, 'a@b.co')
    expect(seen.at(-1)).toBe('a@b.co')
    act(() => out.querySelectorAll('button')[out.querySelectorAll('button').length - 1].click())
    expect(email.value).toBe('')
    expect(seen.at(-1)).toBe('')
  })
})

describe('inputs', () => {
  it('NumberInput reports numbers, null when empty, and clamps and rounds when left', () => {
    const changes: (number | null)[] = []
    const out = render(<NumberInput aria-label="Credits" value={5} min={0} max={100} precision={1} onChange={(value) => changes.push(value)} />)
    const input = out.querySelector('input') as HTMLInputElement
    type(input, '12.345')
    type(input, '')
    type(input, '250')
    act(() => input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })))
    expect(changes).toEqual([12.345, null, 250, 100])
  })

  it('DateTimeInput asks for a time when told, and clears to null', () => {
    const changes: (string | null)[] = []
    const out = render(<DateTimeInput aria-label="Start" withTime value="2026-10-25T09:30" onChange={(value) => changes.push(value)} />)
    const input = out.querySelector('input') as HTMLInputElement
    expect(input.type).toBe('datetime-local')
    type(input, '')
    expect(changes).toEqual([null])
  })

  it('Popconfirm asks before acting, and acts only on confirm', () => {
    const onConfirm = vi.fn()
    const out = render(
      <Popconfirm title="Delete this template?" danger onConfirm={onConfirm}>
        <Button>Delete</Button>
      </Popconfirm>,
    )
    act(() => out.querySelector('button')!.click())
    const dialog = document.querySelector('[role="alertdialog"]')!
    expect(dialog.textContent).toContain('Delete this template?')
    const [cancel, ok] = dialog.querySelectorAll('button')
    expect(ok.getAttribute('data-variant')).toBe('danger')
    act(() => cancel.click())
    expect(onConfirm).not.toHaveBeenCalled()
    act(() => out.querySelector('button')!.click())
    act(() => document.querySelector('[role="alertdialog"]')!.querySelectorAll('button')[1].click())
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
