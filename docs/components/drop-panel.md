# DropPanel

A popover anchored to an element, closing on a press outside or Escape.

Category: Menus and overlays · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/drop-panel/)

```ts
import { DropPanel } from '@kition/tessera-ui'
```

## Example: A setting under a button

```tsx
import { useRef, useState } from 'react'
import { Button, DropPanel, NumberField } from '@kition/tessera-ui'

export default function Demo() {
  const anchor = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [radius, setRadius] = useState(8)
  return (
    <span ref={anchor}>
      <Button onClick={() => setOpen(!open)}>Corner radius ▾</Button>
      <DropPanel open={open} anchor={anchor} onClose={() => setOpen(false)} label="Corner radius">
        <div style={{ padding: 12, width: 220 }}>
          <NumberField label="Radius" value={radius} min={0} max={64} unit="px" onChange={(value) => setRadius(value)} />
        </div>
      </DropPanel>
    </span>
  )
}
```

## DropPanel props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` (required) | `boolean` |  |  |
| `anchor` (required) | `RefObject<HTMLElement \| null>` |  |  |
| `onClose` (required) | `() => void` |  |  |
| `label` (required) | `string` |  |  |
| `className` | `string` | `''` |  |
| `testId` | `string` |  |  |
| `children` (required) | `ReactNode` |  |  |

## See also

- [MenuButton](menu-button.md): A button that opens a menu of MenuItems, with shortcuts and check marks.
- [ContextMenu](context-menu.md): A menu at a point, for right-clicks.
- [Dialog](dialog.md): A modal (or modeless) dialog with a title, content, and actions; it traps focus and closes on Escape.
- [PreviewDialog](preview-dialog.md): A dialog whose values preview live in the document: the kit supplies begin, update and end.
- [Toast](toast.md): A short notice at the top. Render Toaster once; call toast() or toast.success(), .error(), .loading(), .promise() anywhere, with an id to replace a notice and an action button.
- [Modal](modal.md): A composable modal dialog for host apps: header, content, footer; it traps focus and closes on Escape or an outside press.
- [Tooltip](tooltip.md): A short label shown on hover or keyboard focus, for an icon or a status that needs a word.
- [Popover](popover.md): Floating content anchored to a trigger, positioned to stay on screen: filters, pickers, small forms.
- [Sheet](sheet.md): A panel that slides in from the right to edit one thing beside the work, guarding unsaved changes; from the left, it holds an app’s navigation on a phone.
- [Confirm](confirm.md): `useConfirm()` asks a yes-or-no question and resolves a promise; asks queue one at a time.
- [Command](command.md): A searchable list of commands or choices: type to filter, arrows and Enter to pick.
