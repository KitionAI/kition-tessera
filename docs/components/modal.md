# Modal

A composable modal dialog for host apps: header, content, footer; it traps focus and closes on Escape or an outside press.

Category: Menus and overlays · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/modal/)

```ts
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter, ModalCloseButton } from '@kition/tessera-ui'
```

## When to use

- Confirming details or collecting a few values in an app (rename, share, create).

## When not to

- A kit tool’s settings: use Dialog.
- Editing beside the work: use Sheet.

## Example: Rename

```tsx
import { useState } from 'react'
import { Button, Field, Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, TextInput } from '@kition/tessera-ui'

export default function Demo() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Quarterly plan')
  return (
    <>
      <Button variant="secondary" size="md" onClick={() => setOpen(true)}>Rename…</Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>Rename document</ModalTitle>
            <ModalDescription>The name shows in the tab and the file tree.</ModalDescription>
          </ModalHeader>
          <Field label="Name">{({ id }) => <TextInput id={id} size="lg" value={name} onChange={(event) => setName(event.target.value)} />}</Field>
          <ModalFooter>
            <Button variant="secondary" size="md" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={() => setOpen(false)}>Rename</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
```

## Example: A long dialog

With `fixed` the header and footer stay put and ModalBody scrolls; a ModalCloseButton of your own can be disabled while work runs.

```tsx
import { useState } from 'react'
import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@kition/tessera-ui'

export default function Demo() {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  return (
    <>
      <Button variant="secondary" size="md" onClick={() => setOpen(true)}>Import file…</Button>
      <Modal open={open} onOpenChange={(next) => (running ? undefined : setOpen(next))}>
        <ModalContent size="xl" fixed hideClose>
          <ModalHeader>
            <ModalTitle>Import a file</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {Array.from({ length: 24 }, (_, i) => (
              <p key={i} style={{ margin: 0, fontSize: 14 }}>Column {i + 1}: text</p>
            ))}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="md" disabled={running} onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="md"
              loading={running}
              onClick={() => {
                setRunning(true)
                setTimeout(() => {
                  setRunning(false)
                  setOpen(false)
                }, 1200)
              }}
            >
              Import
            </Button>
          </ModalFooter>
          <ModalCloseButton disabled={running} />
        </ModalContent>
      </Modal>
    </>
  )
}
```

## Modal props

A modal dialog. Controlled with `open` and `onOpenChange`; Escape and an outside press close it.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## ModalContent props

The dialog's panel, over a dimmed page: 12px radius, a hairline, the modal shadow.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `ModalSize`: `'sm'`, `'md'`, `'lg'`, `'none'`, `'xs'`, `'xl'`, `'2xl'`, `'3xl'`, `'4xl'` | `'lg'` | Its widest: `xs` 320px to `4xl` 896px; `none` leaves the width to `className`. |
| `hideClose` | `boolean` |  | No close button in the corner (the footer has its own way out). |
| `dismissible` | `boolean` | `true` | When false, an outside press does not close it (Escape still does). |
| `disableAutoFocus` | `boolean` |  | Keeps focus where it was instead of moving it into the dialog when it opens. |
| `fixed` | `boolean` |  | A long dialog: the header and footer stay put with hairlines, and `ModalBody` scrolls between them. |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## ModalHeader props

The title and description at the top of a modal.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## ModalTitle props

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## ModalDescription props

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## ModalBody props

The content between a modal's header and footer; it scrolls in a `fixed` modal.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## ModalFooter props

The actions at the bottom of a modal, right-aligned; full width on a narrow window.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## ModalCloseButton props

The close button in a modal's corner. ModalContent draws one; with `hideClose`, place your own,
for one you can disable (`disabled` while an import runs).

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [MenuButton](menu-button.md): A button that opens a menu of MenuItems, with shortcuts and check marks.
- [ContextMenu](context-menu.md): A menu at a point, for right-clicks.
- [Dialog](dialog.md): A modal (or modeless) dialog with a title, content, and actions; it traps focus and closes on Escape.
- [PreviewDialog](preview-dialog.md): A dialog whose values preview live in the document: the kit supplies begin, update and end.
- [Toast](toast.md): A short notice at the top. Render Toaster once; call toast() or toast.success(), .error(), .loading(), .promise() anywhere, with an id to replace a notice and an action button.
- [Tooltip](tooltip.md): A short label shown on hover or keyboard focus, for an icon or a status that needs a word.
- [Popover](popover.md): Floating content anchored to a trigger, positioned to stay on screen: filters, pickers, small forms.
- [Sheet](sheet.md): A panel that slides in from the right to edit one thing beside the work, guarding unsaved changes; from the left, it holds an app’s navigation on a phone.
- [Confirm](confirm.md): `useConfirm()` asks a yes-or-no question and resolves a promise; asks queue one at a time.
- [Command](command.md): A searchable list of commands or choices: type to filter, arrows and Enter to pick.
- [DropPanel](drop-panel.md): A popover anchored to an element, closing on a press outside or Escape.
