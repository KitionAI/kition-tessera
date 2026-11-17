# Toast

A short notice at the top. Render Toaster once; call toast() or toast.success(), .error(), .loading(), .promise() anywhere, with an id to replace a notice and an action button.

Category: Menus and overlays · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/toast/)

```ts
import { Toaster } from '@kition/tessera-ui'
```

## Example: Levels

```tsx
import { Button, toast } from '@kition/tessera-ui'

// Render <Toaster /> once near the root of the editor; toast() can then be called from anywhere.
export default function Demo() {
  return (
    <div className="demo-row">
      <Button onClick={() => toast('success', 'Saved', 'Budget 2027.xlsx')}>Success</Button>
      <Button onClick={() => toast('info', 'Agent is working', 'Rewriting slide 3')}>Info</Button>
      <Button onClick={() => toast('error', 'Could not save', 'The disk is full')}>Error</Button>
    </div>
  )
}
```

## Example: Actions, promises, sticky notices

```tsx
import { Button, toast } from '@kition/tessera-ui'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function Demo() {
  return (
    <div className="demo-row">
      <Button onClick={() => toast.info('Row deleted', { action: { label: 'Undo', onClick: () => toast.success('Row restored') } })}>With an action</Button>
      <Button onClick={() => void toast.promise(wait(1500).then(() => 3), { loading: 'Exporting…', success: (count) => `Exported ${count} files`, error: 'Export failed' })}>A promise</Button>
      <Button onClick={() => toast.error('Offline', { id: 'network', duration: Number.POSITIVE_INFINITY, description: 'Changes are kept until you reconnect.' })}>Sticky</Button>
      <Button variant="ghost" onClick={() => toast.dismiss()}>Dismiss all</Button>
    </div>
  )
}
```

## Toaster props

Where notices appear: centred at the top, `offset` px down (below a host's tab strip).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `offset` | `number` | `12` |  |
| `closeButton` | `boolean` | `true` |  |

## See also

- [MenuButton](menu-button.md): A button that opens a menu of MenuItems, with shortcuts and check marks.
- [ContextMenu](context-menu.md): A menu at a point, for right-clicks.
- [Dialog](dialog.md): A modal (or modeless) dialog with a title, content, and actions; it traps focus and closes on Escape.
- [PreviewDialog](preview-dialog.md): A dialog whose values preview live in the document: the kit supplies begin, update and end.
- [Modal](modal.md): A composable modal dialog for host apps: header, content, footer; it traps focus and closes on Escape or an outside press.
- [Tooltip](tooltip.md): A short label shown on hover or keyboard focus, for an icon or a status that needs a word.
- [Popover](popover.md): Floating content anchored to a trigger, positioned to stay on screen: filters, pickers, small forms.
- [Sheet](sheet.md): A panel that slides in from the right to edit one thing beside the work, guarding unsaved changes; from the left, it holds an app’s navigation on a phone.
- [Confirm](confirm.md): `useConfirm()` asks a yes-or-no question and resolves a promise; asks queue one at a time.
- [Command](command.md): A searchable list of commands or choices: type to filter, arrows and Enter to pick.
- [DropPanel](drop-panel.md): A popover anchored to an element, closing on a press outside or Escape.
