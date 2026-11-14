# Dialog

A modal (or modeless) dialog with a title, content, and actions; it traps focus and closes on Escape.

Category: Menus and overlays · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/dialog/)

```ts
import { Dialog } from '@kition/tessera-ui'
```

## When to use

- A short task that needs values before it runs.

## When not to

- Long forms: use a panel or a page.

## Example: Image size

```tsx
import { useState } from 'react'
import { Button, Dialog, NumberField } from '@kition/tessera-ui'

export default function Demo() {
  const [open, setOpen] = useState(false)
  const [width, setWidth] = useState(1920)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Image size…</Button>
      {open ? (
        <Dialog
          title="Image size"
          onClose={() => setOpen(false)}
          actions={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setOpen(false)}>OK</Button>
            </>
          }
        >
          <NumberField label="Width" value={width} min={1} max={10000} unit="px" onChange={(value) => setWidth(value)} />
        </Dialog>
      ) : null}
    </>
  )
}
```

## Dialog props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` (required) | `string` |  |  |
| `children` (required) | `ReactNode` |  |  |
| `actions` (required) | `ReactNode` |  |  |
| `onClose` (required) | `() => void` |  |  |
| `onEscape` | `(event: KeyboardEvent) => void` |  | Called for Escape in place of `onClose` (a dialog that lets a field keep its own Escape). |
| `modal` | `boolean` | `true` | Blocks the page behind a backdrop (the default), where a press outside closes it. With `false` the page stays usable: no backdrop, and the editor keeps its keys. |
| `uiId` | `string` |  |  |
| `testId` | `string` |  |  |
| `position` | `{ x: number; y: number } \| null` |  | Where the dialog's top left sits in the window (with `onMove`); null or absent: where the layout puts it. |
| `onMove` | `(position: { x: number; y: number }) => void` |  | Makes the dialog movable by its title: a drag moves it, and its place is reported once, on release (keep it, and give it back as `position`). Absent, the title does not move it. |

## See also

- [MenuButton](menu-button.md): A button that opens a menu of MenuItems, with shortcuts and check marks.
- [ContextMenu](context-menu.md): A menu at a point, for right-clicks.
- [PreviewDialog](preview-dialog.md): A dialog whose values preview live in the document: the kit supplies begin, update and end.
- [Toast](toast.md): A short notice at the top. Render Toaster once; call toast() or toast.success(), .error(), .loading(), .promise() anywhere, with an id to replace a notice and an action button.
- [Modal](modal.md): A composable modal dialog for host apps: header, content, footer; it traps focus and closes on Escape or an outside press.
- [Tooltip](tooltip.md): A short label shown on hover or keyboard focus, for an icon or a status that needs a word.
- [Popover](popover.md): Floating content anchored to a trigger, positioned to stay on screen: filters, pickers, small forms.
- [Sheet](sheet.md): A panel that slides in from the right to edit one thing beside the work, guarding unsaved changes; from the left, it holds an app’s navigation on a phone.
- [Confirm](confirm.md): `useConfirm()` asks a yes-or-no question and resolves a promise; asks queue one at a time.
- [Command](command.md): A searchable list of commands or choices: type to filter, arrows and Enter to pick.
- [DropPanel](drop-panel.md): A popover anchored to an element, closing on a press outside or Escape.
