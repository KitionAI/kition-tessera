# Sheet

A panel that slides in from the right to edit one thing beside the work, guarding unsaved changes; from the left, it holds an app’s navigation on a phone.

Category: Menus and overlays · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/sheet/)

```ts
import { Sheet } from '@kition/tessera-ui'
```

## When to use

- Editing a record’s field, a connection, a rule.

## When not to

- A quick question: use Modal or Confirm.

## Example: Edit a field

With unsaved changes, Escape, the backdrop, and the close button ask first.

```tsx
import { useState } from 'react'
import { Button, Field, Sheet, TextInput } from '@kition/tessera-ui'

export default function Demo() {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('Status')
  const [saved, setSaved] = useState('Status')
  const dirty = label !== saved
  return (
    <>
      <Button variant="secondary" size="md" onClick={() => setOpen(true)}>Edit field…</Button>
      <Sheet
        open={open}
        title="Edit field"
        dirty={dirty}
        onRequestClose={() => {
          if (window.confirm('Discard your changes?')) {
            setLabel(saved)
            setOpen(false)
          }
        }}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setOpen(false)}>Close</Button>
            <Button variant="primary" size="md" disabled={!dirty} onClick={() => setSaved(label)}>Save</Button>
          </>
        }
      >
        <Field label="Field name">{({ id }) => <TextInput id={id} size="lg" value={label} onChange={(event) => setLabel(event.target.value)} />}</Field>
      </Sheet>
    </>
  )
}
```

## Sheet props

A panel that slides in from the right over a dimmed page, for editing one thing beside the work.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` (required) | `boolean` |  |  |
| `onClose` (required) | `() => void` |  |  |
| `title` (required) | `ReactNode` |  |  |
| `children` (required) | `ReactNode` |  |  |
| `footer` | `ReactNode` |  | Actions at the bottom, right-aligned. |
| `dirty` | `boolean` | `false` | With unsaved changes, closing (Escape, the backdrop, the close button) calls `onRequestClose` instead. |
| `onRequestClose` | `() => void` |  |  |
| `width` | `number` | `400` | Its width in pixels. |
| `label` | `string` |  | Its accessible name, when `title` is not plain text (a logo and a name). |
| `side` | `'left' \| 'right'` | `'right'` | The edge it slides in from: `right` (default, editing beside the work) or `left` (an app's navigation on a phone). |
| `testId` | `string` | `'sheet'` | Test id of the sheet; its parts take `${testId}-backdrop`, `-header`, `-close`, `-footer`. |

## See also

- [MenuButton](menu-button.md): A button that opens a menu of MenuItems, with shortcuts and check marks.
- [ContextMenu](context-menu.md): A menu at a point, for right-clicks.
- [Dialog](dialog.md): A modal (or modeless) dialog with a title, content, and actions; it traps focus and closes on Escape.
- [PreviewDialog](preview-dialog.md): A dialog whose values preview live in the document: the kit supplies begin, update and end.
- [Toast](toast.md): A short notice at the top. Render Toaster once; call toast() or toast.success(), .error(), .loading(), .promise() anywhere, with an id to replace a notice and an action button.
- [Modal](modal.md): A composable modal dialog for host apps: header, content, footer; it traps focus and closes on Escape or an outside press.
- [Tooltip](tooltip.md): A short label shown on hover or keyboard focus, for an icon or a status that needs a word.
- [Popover](popover.md): Floating content anchored to a trigger, positioned to stay on screen: filters, pickers, small forms.
- [Confirm](confirm.md): `useConfirm()` asks a yes-or-no question and resolves a promise; asks queue one at a time.
- [Command](command.md): A searchable list of commands or choices: type to filter, arrows and Enter to pick.
- [DropPanel](drop-panel.md): A popover anchored to an element, closing on a press outside or Escape.
