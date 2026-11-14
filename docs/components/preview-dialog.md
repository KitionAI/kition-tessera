# PreviewDialog

A dialog whose values preview live in the document: the kit supplies begin, update and end.

Category: Menus and overlays · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/preview-dialog/)

```ts
import { PreviewDialog } from '@kition/tessera-ui'
```

## When to use

- Filters and adjustments (blur, levels) people tune by eye.

## Example: A filter

```tsx
import { useState } from 'react'
import { Button, GradientSlider, PreviewDialog } from '@kition/tessera-ui'

// A dialog whose changes preview live in the document; the kit supplies begin, update and end.
export default function Demo() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(40)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Gaussian Blur…</Button>
      {open ? (
        <PreviewDialog
          title="Gaussian Blur"
          preview={{ begin: () => undefined, update: () => undefined, end: () => undefined, draft: amount }}
          onOk={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          onReset={() => setAmount(40)}
        >
          <GradientSlider label="Radius" value={amount} min={0} max={250} onChange={(value) => setAmount(value)} />
        </PreviewDialog>
      ) : null}
    </>
  )
}
```

## PreviewDialog props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` (required) | `string` |  |  |
| `preview` | `PreviewDialogPreview` |  | Shows the Preview check box (on at first) when given; without it the dialog behaves as `Dialog`. |
| `okLabel` | `string` |  |  |
| `okDisabled` | `boolean` | `false` |  |
| `hideOk` | `boolean` | `false` | Draws no OK: one button (Cancel, named by `cancelLabel`) for a dialog that only shows information. |
| `onOk` (required) | `() => Promise<void> \| void` |  | Runs the command. The dialog does not close itself: once this resolves, the kit unmounts it (unless `keepOpen`). A failure shows in the dialog and leaves it open, previewing again. |
| `onCancel` (required) | `() => void` |  | Cancel, Escape, or a press outside (when modal). The kit unmounts the dialog. Not while OK runs. |
| `cancelLabel` | `string` |  | The Cancel button's label ("Done" in upstream's Find, "Close" for information). |
| `onReset` | `() => void` |  | Alt turns Cancel into Reset, which calls this (restores the dialog's defaults). |
| `keepOpen` | `boolean` | `false` | OK runs without closing, and the preview stays open (upstream's Find). |
| `modal` | `boolean` | `true` | Blocks the page (the default). With `false` there is no backdrop: a press outside does not cancel, Tab may leave the dialog, and the editor keeps its keys (to move the playhead under a picture preview). Escape still cancels. |
| `children` (required) | `ReactNode` |  |  |
| `uiId` | `string` |  | The dialog's Kit UI id. |
| `ids` | `{ ok?: string; cancel?: string; preview?: string }` |  | The buttons' Kit UI ids; Reset is the Cancel button. |
| `testId` | `string` | `'preview-dialog'` |  |
| `position` | `{ x: number; y: number } \| null` |  | Where the dialog sits (with `onMove`), as `Dialog`'s; absent: where the layout puts it. |
| `onMove` | `(position: { x: number; y: number }) => void` |  | Makes the dialog movable by its title, as `Dialog`'s (a kit keeps the place); absent, it does not move. |

## See also

- [MenuButton](menu-button.md): A button that opens a menu of MenuItems, with shortcuts and check marks.
- [ContextMenu](context-menu.md): A menu at a point, for right-clicks.
- [Dialog](dialog.md): A modal (or modeless) dialog with a title, content, and actions; it traps focus and closes on Escape.
- [Toast](toast.md): A short notice at the top. Render Toaster once; call toast() or toast.success(), .error(), .loading(), .promise() anywhere, with an id to replace a notice and an action button.
- [Modal](modal.md): A composable modal dialog for host apps: header, content, footer; it traps focus and closes on Escape or an outside press.
- [Tooltip](tooltip.md): A short label shown on hover or keyboard focus, for an icon or a status that needs a word.
- [Popover](popover.md): Floating content anchored to a trigger, positioned to stay on screen: filters, pickers, small forms.
- [Sheet](sheet.md): A panel that slides in from the right to edit one thing beside the work, guarding unsaved changes; from the left, it holds an app’s navigation on a phone.
- [Confirm](confirm.md): `useConfirm()` asks a yes-or-no question and resolves a promise; asks queue one at a time.
- [Command](command.md): A searchable list of commands or choices: type to filter, arrows and Enter to pick.
- [DropPanel](drop-panel.md): A popover anchored to an element, closing on a press outside or Escape.
