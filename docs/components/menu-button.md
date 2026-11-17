# MenuButton

A button that opens a menu of MenuItems, with shortcuts and check marks.

Category: Menus and overlays · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/menu-button/)

```ts
import { MenuButton, MenuItem, MenuSeparator } from '@kition/tessera-ui'
```

## Example: Edit menu

```tsx
import { useState } from 'react'
import { Button, MenuButton, MenuItem, MenuSeparator, toast } from '@kition/tessera-ui'
import { ClipboardPasteIcon, CopyIcon, ScissorsIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [snap, setSnap] = useState(true)
  return (
    <MenuButton trigger={({ toggle }) => <Button onClick={toggle}>Edit ▾</Button>}>
      <MenuItem icon={ScissorsIcon} label="Cut" shortcut="⌘X" onSelect={() => toast('info', 'Cut')} />
      <MenuItem icon={CopyIcon} label="Copy" shortcut="⌘C" onSelect={() => toast('info', 'Copy')} />
      <MenuItem icon={ClipboardPasteIcon} label="Paste" shortcut="⌘V" onSelect={() => toast('info', 'Paste')} />
      <MenuSeparator />
      <MenuItem label="Snap to grid" checked={snap} onSelect={() => setSnap(!snap)} />
    </MenuButton>
  )
}
```

## MenuButton props

A button that opens a menu below it; the menu takes the focus, and gives it back to the button
when it closes. With `placement` `auto` (a button along a panel's bottom), the menu opens above
the button when it does not fit below and there is more room above.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `trigger` (required) | `(props: { open: boolean; toggle: () => void }) => ReactNode` |  |  |
| `children` (required) | `ReactNode` |  |  |
| `align` | `'start' \| 'end'` | `'start'` |  |
| `placement` | `'below' \| 'auto'` | `'below'` |  |

## MenuItem props

A menu row. With `checked` set (true or false) it is a toggle: a check mark shows in the icon's
place while it is on (the state wins over the icon), and assistive technology hears it as a
checkbox item.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | `IconComponent` |  |  |
| `label` (required) | `string` |  |  |
| `shortcut` | `string \| null` |  |  |
| `onSelect` (required) | `() => void` |  |  |
| `disabled` | `boolean` |  |  |
| `checked` | `boolean` |  |  |
| `testId` | `string` |  |  |
| `uiId` | `string` |  |  |

## MenuSeparator props

## See also

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
- [DropPanel](drop-panel.md): A popover anchored to an element, closing on a press outside or Escape.
