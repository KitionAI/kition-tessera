# ContextMenu

A menu at a point, for right-clicks.

Category: Menus and overlays · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/context-menu/)

```ts
import { ContextMenu } from '@kition/tessera-ui'
```

## Example: Right-click

```tsx
import { useState } from 'react'
import { ContextMenu, MenuItem, type ContextMenuPoint } from '@kition/tessera-ui'
import { CopyIcon, TrashIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [at, setAt] = useState<ContextMenuPoint | null>(null)
  return (
    <>
      <div
        className="demo-target"
        onContextMenu={(event) => {
          event.preventDefault()
          setAt({ x: event.clientX, y: event.clientY })
        }}
      >
        Right-click here
      </div>
      <ContextMenu at={at} onClose={() => setAt(null)} label="Layer">
        <MenuItem icon={CopyIcon} label="Duplicate layer" onSelect={() => setAt(null)} />
        <MenuItem icon={TrashIcon} label="Delete layer" onSelect={() => setAt(null)} />
      </ContextMenu>
    </>
  )
}
```

## ContextMenu props

A menu at a point (a row's right-click menu): open while `at` is set, kept inside the window,
its first row focused (Up, Down, Home, and End move through the rows; the focus goes back where
it was when it closes), and closed through
`onClose` by a press outside it, Escape, or a choice in it (a `MenuItem`, any button). Its rows
are `MenuItem`s and `MenuSeparator`s, as in `MenuButton`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `at` (required) | `ContextMenuPoint \| null` |  |  |
| `onClose` (required) | `() => void` |  |  |
| `label` | `string` |  |  |
| `children` (required) | `ReactNode` |  |  |
| `testId` | `string` |  |  |

## See also

- [MenuButton](menu-button.md): A button that opens a menu of MenuItems, with shortcuts and check marks.
- [Dialog](dialog.md): A modal (or modeless) dialog with a title, content, and actions; it traps focus and closes on Escape.
- [PreviewDialog](preview-dialog.md): A dialog whose values preview live in the document: the kit supplies begin, update and end.
- [Toast](toast.md): A short notice at the top. Render Toaster once; call toast() or toast.success(), .error(), .loading(), .promise() anywhere, with an id to replace a notice and an action button.
- [Modal](modal.md): A composable modal dialog for host apps: header, content, footer; it traps focus and closes on Escape or an outside press.
- [Tooltip](tooltip.md): A short label shown on hover or keyboard focus, for an icon or a status that needs a word.
- [Popover](popover.md): Floating content anchored to a trigger, positioned to stay on screen: filters, pickers, small forms.
- [Sheet](sheet.md): A panel that slides in from the right to edit one thing beside the work, guarding unsaved changes; from the left, it holds an app’s navigation on a phone.
- [Confirm](confirm.md): `useConfirm()` asks a yes-or-no question and resolves a promise; asks queue one at a time.
- [Command](command.md): A searchable list of commands or choices: type to filter, arrows and Enter to pick.
- [DropPanel](drop-panel.md): A popover anchored to an element, closing on a press outside or Escape.
