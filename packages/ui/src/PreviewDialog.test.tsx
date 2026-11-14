// @vitest-environment jsdom
import { act, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStrings, StringsProvider, TESSERA_CATALOGS } from './context'
import { NumberField } from './index'
import { RenameField } from './index'
import { Dialog, MenuButton, MenuItem } from './index'
import { PreviewDialog, type PreviewDialogProps, type PreviewStatus } from './index'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom has no PointerEvent (https://github.com/jsdom/jsdom/issues/2527); a MouseEvent with the
// right type reaches React's pointer handlers just the same (see DockArea.test.tsx).
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
beforeEach(() => {
  // jsdom lays nothing out: every element has boxes, except inside [data-invisible] (display: none).
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function (this: HTMLElement) {
    return (this.closest('[data-invisible]') ? [] : [{}]) as unknown as DOMRectList
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  for (const root of roots) act(() => root.unmount())
  roots = []
  host?.remove()
  document.body.innerHTML = ''
})

function render(node: ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  act(() => root.render(node))
  return root
}

/** A promise the test settles by hand. */
function deferred() {
  let resolve!: () => void
  let reject!: (error: unknown) => void
  const promise = new Promise<void>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

/** Lets every settled promise run its continuations. */
const flush = () => act(async () => {
  for (let i = 0; i < 10; i += 1) await Promise.resolve()
})

/** A fake preview API that records each call with the draft it saw, and settles at once unless told to wait. */
function fakePreview() {
  const calls: string[] = []
  const waits: ReturnType<typeof deferred>[] = []
  let hold = false
  let failNext: string | null = null
  const step = (name: string, draft: string) => {
    calls.push(`${name}:${draft}`)
    if (failNext) {
      const message = failNext
      failNext = null
      return Promise.reject(new Error(message))
    }
    if (!hold) return undefined
    const wait = deferred()
    waits.push(wait)
    return wait.promise
  }
  return {
    calls,
    waits,
    hold(on: boolean) {
      hold = on
    },
    fail(message: string) {
      failNext = message
    },
    step,
  }
}

const field = () => host.querySelector('[data-testid="draft"]') as HTMLInputElement
const notes = () => host.querySelector('[data-testid="notes"]') as HTMLTextAreaElement
const byTest = (id: string) => document.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
const ok = () => byTest('preview-dialog-ok') as HTMLButtonElement
const cancel = () => byTest('preview-dialog-cancel') as HTMLButtonElement
const toggle = () => byTest('preview-dialog-preview') as HTMLInputElement | null

function type(input: HTMLInputElement, text: string) {
  act(() => {
    nativeInputValue.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function key(target: EventTarget, name: string, init: KeyboardEventInit = {}) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }))
  })
}

type HarnessProps = Partial<PreviewDialogProps> & {
  api?: ReturnType<typeof fakePreview>
  status?: PreviewStatus
  withPreview?: boolean
  onOk?: PreviewDialogProps['onOk']
  /** More of the dialog's own controls, after its fields. */
  extra?: ReactNode
}

/** A dialog with one text field (the draft), as a kit's dialog host would draw it. */
function Harness({ api, status, withPreview = true, onOk = () => undefined, onCancel = () => undefined, extra, ...rest }: HarnessProps) {
  const [draft, setDraft] = useState('a')
  return (
    <PreviewDialog
      title="Speed/Duration"
      onOk={onOk}
      onCancel={onCancel}
      preview={
        withPreview && api
          ? {
              begin: () => api.step('begin', draft),
              update: () => api.step('update', draft),
              end: () => api.step('end', draft),
              draft,
              strip: <span data-testid="strip-content">strip {draft}</span>,
              status,
            }
          : undefined
      }
      {...rest}
    >
      <input data-testid="draft" value={draft} onChange={(event) => setDraft(event.target.value)} />
      <textarea data-testid="notes" defaultValue="" />
      {rest.onReset ? <button type="button" data-testid="set-default" onClick={() => setDraft('a')} /> : null}
      {extra}
    </PreviewDialog>
  )
}

describe('PreviewDialog', () => {
  it('begins the preview on open, and updates it after the draft changes', async () => {
    const api = fakePreview()
    render(<Harness api={api} />)
    await flush()
    expect(api.calls).toEqual(['begin:a'])
    expect(toggle()?.checked).toBe(true)
    type(field(), 'ab')
    await flush()
    expect(api.calls).toEqual(['begin:a', 'update:ab'])
  })

  it('runs one update at a time, and the latest draft wins while it changes quickly', async () => {
    const api = fakePreview()
    api.hold(true)
    render(<Harness api={api} />)
    await flush()
    expect(api.calls).toEqual(['begin:a'])
    // Changes while begin is still in flight wait for it, and only the latest runs.
    type(field(), 'ab')
    type(field(), 'abc')
    await flush()
    expect(api.calls).toEqual(['begin:a'])
    api.waits[0].resolve()
    await flush()
    expect(api.calls).toEqual(['begin:a', 'update:abc'])
    type(field(), 'abcd')
    type(field(), 'abcde')
    type(field(), 'abcdef')
    await flush()
    expect(api.calls).toEqual(['begin:a', 'update:abc'])
    api.waits[1].resolve()
    await flush()
    expect(api.calls).toEqual(['begin:a', 'update:abc', 'update:abcdef'])
    api.waits[2].resolve()
    await flush()
    expect(api.calls).toEqual(['begin:a', 'update:abc', 'update:abcdef'])
  })

  it('does not update when the dialog redraws with the same draft', async () => {
    const api = fakePreview()
    const root = render(<Harness api={api} okLabel="OK" />)
    await flush()
    act(() => root.render(<Harness api={api} okLabel="Apply" />))
    await flush()
    expect(api.calls).toEqual(['begin:a'])
  })

  it('draws the strip under the fields, and shows a pending update and a failed one', async () => {
    const api = fakePreview()
    api.hold(true)
    render(<Harness api={api} />)
    await flush()
    const strip = byTest('preview-dialog-strip')!
    expect(strip.textContent).toContain('strip a')
    // The strip comes after the fields.
    expect(field().compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(byTest('preview-dialog-status')?.dataset.status).toBe('pending')
    api.waits[0].resolve()
    await flush()
    expect(byTest('preview-dialog-status')).toBeNull()
    api.hold(false)
    api.fail('Speed must be positive')
    type(field(), 'ab')
    await flush()
    const status = byTest('preview-dialog-status')!
    expect(status.dataset.status).toBe('error')
    expect(status.textContent).toContain('Speed must be positive')
    // The preview stays on after a failed update, and the next change tries again.
    expect(toggle()?.checked).toBe(true)
    type(field(), 'abc')
    await flush()
    expect(api.calls.at(-1)).toBe('update:abc')
    expect(byTest('preview-dialog-status')).toBeNull()
  })

  it("shows the kit's own status when it gives one", async () => {
    const api = fakePreview()
    const root = render(<Harness api={api} status="pending" />)
    await flush()
    expect(byTest('preview-dialog-status')?.dataset.status).toBe('pending')
    act(() => root.render(<Harness api={api} status={{ error: 'Scene detection failed' }} />))
    expect(byTest('preview-dialog-status')?.textContent).toContain('Scene detection failed')
    act(() => root.render(<Harness api={api} status="idle" />))
    expect(byTest('preview-dialog-status')).toBeNull()
  })

  it("shows the dialog's own pending and error while the kit's status is idle", async () => {
    const api = fakePreview()
    api.hold(true)
    render(<Harness api={api} status="idle" />)
    await flush()
    expect(byTest('preview-dialog-status')?.dataset.status).toBe('pending')
    api.waits[0].resolve()
    await flush()
    api.hold(false)
    api.fail('Out of range')
    type(field(), 'ab')
    await flush()
    expect(byTest('preview-dialog-status')?.textContent).toContain('Out of range')
  })

  it('ends the preview when Preview is turned off, and begins it again when turned on', async () => {
    const api = fakePreview()
    render(<Harness api={api} />)
    await flush()
    act(() => toggle()!.click())
    await flush()
    expect(api.calls).toEqual(['begin:a', 'end:a'])
    expect(toggle()!.checked).toBe(false)
    expect(byTest('preview-dialog-strip')).toBeNull()
    // While off, changes do not preview.
    type(field(), 'ab')
    await flush()
    expect(api.calls).toEqual(['begin:a', 'end:a'])
    act(() => toggle()!.click())
    await flush()
    expect(api.calls).toEqual(['begin:a', 'end:a', 'begin:ab'])
  })

  it('turns Preview off with a notice when begin fails, and still allows OK', async () => {
    const api = fakePreview()
    api.fail('Nothing to preview')
    const onOk = vi.fn()
    render(<Harness api={api} onOk={onOk} />)
    await flush()
    expect(toggle()!.checked).toBe(false)
    expect(byTest('preview-dialog-notice')?.textContent).toContain('Nothing to preview')
    expect(ok().disabled).toBe(false)
    act(() => ok().click())
    await flush()
    // Begin failed, so there is no preview to end.
    expect(api.calls).toEqual(['begin:a'])
    expect(onOk).toHaveBeenCalledTimes(1)
  })

  it('ends the preview on Cancel and runs nothing', async () => {
    const api = fakePreview()
    const onOk = vi.fn()
    const onCancel = vi.fn()
    render(<Harness api={api} onOk={onOk} onCancel={onCancel} />)
    await flush()
    act(() => cancel().click())
    await flush()
    expect(api.calls).toEqual(['begin:a', 'end:a'])
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onOk).not.toHaveBeenCalled()
    // The kit unmounts it after Cancel: the preview is not ended twice.
    act(() => roots[0].unmount())
    roots = []
    await flush()
    expect(api.calls).toEqual(['begin:a', 'end:a'])
  })

  it('treats Escape as Cancel, unless a field in typing mode takes it (a hot NumberField reverts)', async () => {
    const api = fakePreview()
    const onCancel = vi.fn()
    const onChange = vi.fn()
    render(<Harness api={api} onCancel={onCancel} extra={<NumberField label="Speed" value={100} min={0} max={1000} onChange={onChange} hot testId="speed" />} />)
    await flush()
    // Enter on the hot number opens its field; Enter on it is not OK.
    key(byTest('speed-value')!, 'Enter')
    const typing = byTest('speed-input') as HTMLInputElement
    expect(typing).not.toBeNull()
    key(typing, 'Escape')
    await flush()
    expect(onCancel).not.toHaveBeenCalled()
    expect(byTest('speed-input')).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
    key(field(), 'Escape')
    await flush()
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(api.calls).toEqual(['begin:a', 'end:a'])
  })

  it('leaves Enter and Escape to an input method while it composes (WebKit: keyCode 229)', async () => {
    const onOk = vi.fn()
    const onCancel = vi.fn()
    render(<Harness api={fakePreview()} onOk={onOk} onCancel={onCancel} />)
    await flush()
    key(field(), 'Enter', { keyCode: 229 } as KeyboardEventInit)
    key(field(), 'Enter', { isComposing: true })
    key(field(), 'Escape', { keyCode: 229 } as KeyboardEventInit)
    key(field(), 'Escape', { isComposing: true })
    await flush()
    expect(onOk).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('lets Escape in a menu inside the dialog close only the menu', async () => {
    const onCancel = vi.fn()
    const onSelect = vi.fn()
    render(
      <Harness
        api={fakePreview()}
        onCancel={onCancel}
        extra={
          <MenuButton trigger={({ toggle: open }) => <button type="button" data-testid="menu-trigger" onClick={open} />}>
            <MenuItem label="Ripple" onSelect={onSelect} testId="menu-row" />
          </MenuButton>
        }
      />,
    )
    await flush()
    act(() => byTest('menu-trigger')!.click())
    const row = byTest('menu-row')!
    expect(row).not.toBeNull()
    expect(document.activeElement).toBe(row)
    key(row, 'Escape')
    await flush()
    expect(byTest('menu-row')).toBeNull()
    expect(onCancel).not.toHaveBeenCalled()
    expect(byTest('preview-dialog-ok')).not.toBeNull()
  })

  it('leaves Enter to fields that own it: a rename field, a menu, a list, a drop-down, an expanded combo box, and marked ones', async () => {
    const onOk = vi.fn()
    const onDone = vi.fn()
    render(
      <Harness
        api={fakePreview()}
        onOk={onOk}
        extra={
          <>
            <RenameField value="Clip" label="Name" onChange={() => undefined} onDone={onDone} testId="rename" />
            <select data-testid="choice" defaultValue="a">
              <option value="a">A</option>
            </select>
            <div role="listbox">
              <input data-testid="in-list" />
            </div>
            <div className="kui-popover">
              <input data-testid="in-popover" />
            </div>
            <input data-testid="combo" role="combobox" aria-expanded="true" />
            <div data-kui-own-enter="">
              <input data-testid="own" />
            </div>
          </>
        }
      />,
    )
    await flush()
    for (const id of ['rename', 'choice', 'in-list', 'in-popover', 'combo', 'own']) key(byTest(id)!, 'Enter')
    await flush()
    expect(onOk).not.toHaveBeenCalled()
    expect(onDone).toHaveBeenCalledWith(true)
  })

  it('leaves Enter alone in a field outside the dialog that a portal draws from inside it', async () => {
    const onOk = vi.fn()
    const outside = document.createElement('div')
    document.body.append(outside)
    const { createPortal } = await import('react-dom')
    render(<Harness api={fakePreview()} onOk={onOk} extra={createPortal(<input data-testid="portaled" />, outside)} />)
    await flush()
    key(byTest('portaled')!, 'Enter')
    await flush()
    expect(onOk).not.toHaveBeenCalled()
  })

  it('runs OK on Enter in a NumberField with the value it committed', async () => {
    const seen: number[] = []
    function Speed() {
      const [speed, setSpeed] = useState(100)
      return (
        <PreviewDialog title="Speed" onOk={() => void seen.push(speed)} onCancel={() => undefined}>
          <NumberField label="Speed" value={speed} min={0} max={1000} onChange={(value) => setSpeed(value)} testId="speed" />
        </PreviewDialog>
      )
    }
    render(<Speed />)
    const input = document.querySelector('[data-testid="speed"] input') as HTMLInputElement
    type(input, '50')
    key(input, 'Enter')
    await flush()
    expect(seen).toEqual([50])
  })

  it('ends the preview, then runs OK once', async () => {
    const api = fakePreview()
    const order: string[] = []
    const onOk = vi.fn(() => {
      order.push(`ok after ${api.calls.at(-1)}`)
    })
    render(<Harness api={api} onOk={onOk} />)
    await flush()
    type(field(), 'ab')
    await flush()
    act(() => ok().click())
    act(() => ok().click())
    await flush()
    expect(onOk).toHaveBeenCalledTimes(1)
    expect(order).toEqual(['ok after end:ab'])
    expect(api.calls).toEqual(['begin:a', 'update:ab', 'end:ab'])
    // Once OK ran, the dialog does not run it again before the kit closes it.
    act(() => ok().click())
    await flush()
    expect(onOk).toHaveBeenCalledTimes(1)
  })

  it('waits for an update in flight before it ends the preview for OK', async () => {
    const api = fakePreview()
    const onOk = vi.fn()
    render(<Harness api={api} onOk={onOk} />)
    await flush()
    api.hold(true)
    type(field(), 'ab')
    await flush()
    act(() => ok().click())
    await flush()
    expect(api.calls).toEqual(['begin:a', 'update:ab'])
    expect(onOk).not.toHaveBeenCalled()
    api.waits[0].resolve()
    await flush()
    expect(api.calls).toEqual(['begin:a', 'update:ab', 'end:ab'])
    api.waits[1].resolve()
    await flush()
    expect(onOk).toHaveBeenCalledTimes(1)
  })

  it('shows a failed OK in the dialog, keeps it open, and previews again', async () => {
    const api = fakePreview()
    const onOk = vi.fn().mockRejectedValueOnce(new Error('No clips selected'))
    render(<Harness api={api} onOk={onOk} />)
    await flush()
    act(() => ok().click())
    await flush()
    expect(byTest('preview-dialog-notice')?.textContent).toContain('No clips selected')
    expect(api.calls).toEqual(['begin:a', 'end:a', 'begin:a'])
    act(() => ok().click())
    await flush()
    expect(onOk).toHaveBeenCalledTimes(2)
  })

  it('keeps the failed OK in view when the preview cannot begin again', async () => {
    const api = fakePreview()
    const onOk = vi.fn(() => {
      api.fail('Nothing to preview')
      throw new Error('No clips selected')
    })
    render(<Harness api={api} onOk={onOk} />)
    await flush()
    act(() => ok().click())
    await flush()
    expect(api.calls).toEqual(['begin:a', 'end:a', 'begin:a'])
    expect(toggle()!.checked).toBe(false)
    expect(byTest('preview-dialog-notice')?.textContent).toContain('No clips selected')
  })

  it('cannot be cancelled while OK runs, and a failed OK after unmount begins nothing', async () => {
    const api = fakePreview()
    const running = deferred()
    const onCancel = vi.fn()
    render(<Harness api={api} onOk={() => running.promise} onCancel={onCancel} />)
    await flush()
    act(() => ok().click())
    await flush()
    expect(cancel().disabled).toBe(true)
    key(field(), 'Escape')
    act(() => {
      document.querySelector('.kui-dialog-backdrop')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    })
    expect(onCancel).not.toHaveBeenCalled()
    act(() => roots[0].unmount())
    roots = []
    running.reject(new Error('No clips selected'))
    await flush()
    expect(api.calls).toEqual(['begin:a', 'end:a'])
  })

  it('ends a preview whose begin was in flight at unmount, and ends nothing when that begin fails', async () => {
    const api = fakePreview()
    api.hold(true)
    render(<Harness api={api} />)
    await flush()
    act(() => roots[0].unmount())
    roots = []
    api.waits[0].resolve()
    await flush()
    expect(api.calls).toEqual(['begin:a', 'end:a'])
    const failing = fakePreview()
    failing.hold(true)
    const errors = vi.spyOn(console, 'error')
    render(<Harness api={failing} />)
    await flush()
    act(() => roots[0].unmount())
    roots = []
    failing.waits[0].reject(new Error('gone'))
    await flush()
    expect(failing.calls).toEqual(['begin:a'])
    expect(errors).not.toHaveBeenCalled()
  })

  it('keeps the dialog and its preview open after OK with keepOpen (Find)', async () => {
    const api = fakePreview()
    const onOk = vi.fn()
    render(<Harness api={api} onOk={onOk} keepOpen okLabel="Find" />)
    await flush()
    expect(ok().textContent).toBe('Find')
    act(() => ok().click())
    await flush()
    act(() => ok().click())
    await flush()
    expect(onOk).toHaveBeenCalledTimes(2)
    expect(api.calls).toEqual(['begin:a'])
    expect(toggle()!.checked).toBe(true)
    type(field(), 'ab')
    await flush()
    expect(api.calls).toEqual(['begin:a', 'update:ab'])
  })

  it('runs nothing while OK is disabled', async () => {
    const api = fakePreview()
    const onOk = vi.fn()
    render(<Harness api={api} onOk={onOk} okDisabled />)
    await flush()
    expect(ok().disabled).toBe(true)
    key(field(), 'Enter')
    await flush()
    expect(onOk).not.toHaveBeenCalled()
    expect(api.calls).toEqual(['begin:a'])
  })

  it('ends the preview when unmounted in the middle of an update', async () => {
    const api = fakePreview()
    render(<Harness api={api} />)
    await flush()
    api.hold(true)
    type(field(), 'ab')
    await flush()
    type(field(), 'abc')
    act(() => roots[0].unmount())
    roots = []
    await flush()
    expect(api.calls).toEqual(['begin:a', 'update:ab'])
    api.waits[0].resolve()
    await flush()
    // The pending change is dropped; the preview ends once.
    expect(api.calls).toEqual(['begin:a', 'update:ab', 'end:abc'])
    api.waits[1].resolve()
    await flush()
    expect(api.calls).toEqual(['begin:a', 'update:ab', 'end:abc'])
  })

  it('turns Cancel into Reset while Alt is held, and Reset calls onReset', async () => {
    const api = fakePreview()
    const onReset = vi.fn()
    const onCancel = vi.fn()
    render(<Harness api={api} onReset={onReset} onCancel={onCancel} />)
    await flush()
    expect(cancel().textContent).toBe('Cancel')
    key(window, 'Alt', { altKey: true })
    expect(cancel().textContent).toBe('Reset')
    act(() => cancel().click())
    await flush()
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
    expect(api.calls).toEqual(['begin:a'])
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt', bubbles: true }))
    })
    expect(cancel().textContent).toBe('Cancel')
  })

  it('keeps Cancel as Cancel under Alt without onReset', async () => {
    render(<Harness api={fakePreview()} />)
    await flush()
    key(window, 'Alt', { altKey: true })
    expect(cancel().textContent).toBe('Cancel')
  })

  it('runs OK on Enter in a field, after the field has committed, but not in a multi-line field', async () => {
    const api = fakePreview()
    const seen: string[] = []
    const onOk = vi.fn()
    function Committing() {
      const [value, setValue] = useState('1')
      return (
        <PreviewDialog
          title="Gain"
          onOk={() => {
            seen.push(value)
            onOk()
          }}
          onCancel={() => undefined}
        >
          {/* A field that commits its text on Enter and keeps the key to itself, as TimecodeField does. */}
          <input
            data-testid="draft"
            defaultValue="1"
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              event.stopPropagation()
              setValue((event.target as HTMLInputElement).value)
            }}
          />
          <textarea data-testid="notes" />
        </PreviewDialog>
      )
    }
    render(<Committing />)
    key(notes(), 'Enter')
    await flush()
    expect(onOk).not.toHaveBeenCalled()
    nativeInputValue.call(field(), '6')
    key(field(), 'Enter')
    await flush()
    expect(onOk).toHaveBeenCalledTimes(1)
    expect(seen).toEqual(['6'])
    expect(api.calls).toEqual([])
  })

  it('does not run OK on Enter on a checkbox or a radio button (Enter on a focused box must not apply the dialog)', async () => {
    const onOk = vi.fn()
    render(
      <Harness
        api={fakePreview()}
        onOk={onOk}
        extra={
          <>
            <input type="checkbox" data-testid="box" />
            <input type="radio" name="pick" data-testid="radio" />
          </>
        }
      />,
    )
    await flush()
    key(byTest('box')!, 'Enter')
    key(byTest('radio')!, 'Enter')
    await flush()
    expect(onOk).not.toHaveBeenCalled()
    // A one-line field still runs it.
    key(field(), 'Enter')
    await flush()
    expect(onOk).toHaveBeenCalledTimes(1)
  })

  it('does not run OK on Enter on a button', async () => {
    const onOk = vi.fn()
    const onReset = vi.fn()
    render(<Harness api={fakePreview()} onOk={onOk} onReset={onReset} />)
    key(byTest('set-default')!, 'Enter')
    await flush()
    expect(onOk).not.toHaveBeenCalled()
  })

  it('focuses its first field, keeps Tab inside, and gives focus back on close', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const root = render(<Harness api={fakePreview()} />)
    await flush()
    expect(document.activeElement).toBe(field())
    // Shift+Tab from the first control goes to the last (OK), Tab from the last back to the first.
    key(field(), 'Tab', { shiftKey: true })
    expect(document.activeElement).toBe(ok())
    key(ok(), 'Tab')
    expect(document.activeElement).toBe(field())
    act(() => root.unmount())
    roots = []
    expect(document.activeElement).toBe(opener)
  })

  it('skips controls that are not drawn when it focuses and keeps Tab inside', async () => {
    render(
      <PreviewDialog title="Gain" onOk={() => undefined} onCancel={() => undefined}>
        <div data-invisible="">
          <button type="button" data-testid="hidden-control" />
        </div>
        <input data-testid="draft" />
      </PreviewDialog>,
    )
    await flush()
    expect(document.activeElement).toBe(field())
    key(field(), 'Tab', { shiftKey: true })
    expect(document.activeElement).toBe(ok())
    key(ok(), 'Tab')
    expect(document.activeElement).toBe(field())
  })

  it('takes a Cancel label, and shows only that button for a dialog with nothing to run', async () => {
    const onCancel = vi.fn()
    const onOk = vi.fn()
    const root = render(<Harness api={fakePreview()} cancelLabel="Done" />)
    await flush()
    expect(cancel().textContent).toBe('Done')
    act(() => root.render(<Harness withPreview={false} hideOk cancelLabel="Close" onCancel={onCancel} onOk={onOk} />))
    expect(ok()).toBeNull()
    expect(cancel().textContent).toBe('Close')
    key(field(), 'Enter')
    await flush()
    expect(onOk).not.toHaveBeenCalled()
    act(() => cancel().click())
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('without modal, leaves the page usable: no backdrop, a press outside does not cancel, and Tab may leave', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const onCancel = vi.fn()
    render(<Harness api={fakePreview()} onCancel={onCancel} modal={false} />)
    await flush()
    expect(document.querySelector('.kui-dialog-backdrop')).toBeNull()
    const layer = document.querySelector('.kui-dialog-layer')!
    act(() => {
      layer.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    })
    expect(onCancel).not.toHaveBeenCalled()
    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('false')
    // Tab from the last control is the browser's: it is not pulled back to the first.
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    act(() => {
      ok().dispatchEvent(tab)
    })
    expect(tab.defaultPrevented).toBe(false)
  })

  it('leaves the focus alone on close when it went somewhere else', async () => {
    const opener = document.createElement('button')
    const other = document.createElement('input')
    document.body.append(opener, other)
    opener.focus()
    const root = render(<Harness api={fakePreview()} />)
    await flush()
    other.focus()
    act(() => root.unmount())
    roots = []
    expect(document.activeElement).toBe(other)
  })

  it('gives every pressable element a Kit UI id, and lets the kit choose them', async () => {
    const root = render(<Harness api={fakePreview()} uiId="dialog:clip.speedDuration" testId="preview-dialog" />)
    await flush()
    expect(document.querySelector('[role="dialog"]')?.getAttribute('data-kit-ui-id')).toBe('dialog:clip.speedDuration')
    expect(ok().dataset.kitUiId).toBe('control:dialog.ok')
    expect(cancel().dataset.kitUiId).toBe('control:dialog.cancel')
    expect(toggle()!.dataset.kitUiId).toBe('control:dialog.preview')
    act(() => root.render(<Harness api={fakePreview()} ids={{ ok: 'control:find.ok', cancel: 'control:find.done', preview: 'control:find.preview' }} />))
    expect(ok().dataset.kitUiId).toBe('control:find.ok')
    expect(cancel().dataset.kitUiId).toBe('control:find.done')
    expect(toggle()!.dataset.kitUiId).toBe('control:find.preview')
  })

  it('without preview, has no Preview check box and behaves as Dialog', async () => {
    const onOk = vi.fn()
    const onCancel = vi.fn()
    render(<Harness withPreview={false} onOk={onOk} onCancel={onCancel} />)
    await flush()
    expect(toggle()).toBeNull()
    expect(byTest('preview-dialog-strip')).toBeNull()
    expect(document.querySelector('.kui-dialog h2')?.textContent).toBe('Speed/Duration')
    expect(ok().textContent).toBe('OK')
    act(() => ok().click())
    await flush()
    expect(onOk).toHaveBeenCalledTimes(1)
    key(window, 'Escape')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('shows its labels in the editor locale', async () => {
    render(
      <StringsProvider strings={createStrings(TESSERA_CATALOGS, 'zh-CN')}>
        <Harness api={fakePreview()} />
      </StringsProvider>,
    )
    await flush()
    expect(ok().textContent).toBe('确定')
    expect(cancel().textContent).toBe('取消')
    expect(toggle()!.closest('label')?.textContent).toBe('预览')
  })

})

describe('Dialog', () => {
  it('closes on Escape by default, and gives Escape to onEscape when the dialog takes it', () => {
    const onClose = vi.fn()
    const root = render(
      <Dialog title="Plain" actions={null} onClose={onClose}>
        body
      </Dialog>,
    )
    key(window, 'Escape')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[role="dialog"]')?.hasAttribute('data-kit-ui-id')).toBe(false)
    const onEscape = vi.fn()
    act(() =>
      root.render(
        <Dialog title="Plain" actions={null} onClose={onClose} onEscape={onEscape} uiId="dialog:plain" testId="plain">
          body
        </Dialog>,
      ),
    )
    key(window, 'Escape')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onEscape).toHaveBeenCalledTimes(1)
    expect(onEscape.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent)
    expect(document.querySelector('[data-testid="plain"]')?.getAttribute('data-kit-ui-id')).toBe('dialog:plain')
  })
})
