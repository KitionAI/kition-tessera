# Popover

Floating content anchored to a trigger, positioned to stay on screen: filters, pickers, small forms.

Category: Menus and overlays · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/popover/)

```ts
import { Popover, PopoverContent } from '@kition/tessera-ui'
```

## When to use

- Filter, sort, and group controls of a table.
- A picker under a button.

## When not to

- A list of commands: use MenuButton.

## Example: A filter

```tsx
import { Button, Popover, PopoverContent, PopoverTrigger, Select, Switch } from '@kition/tessera-ui'
import { FunnelIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm">
          <FunnelIcon /> Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <div style={{ display: 'grid', gap: 12, padding: 14 }}>
          <strong style={{ fontSize: 13 }}>Show records where</strong>
          <Select size="md" defaultValue="open">
            <option value="open">Status is Open</option>
            <option value="done">Status is Done</option>
          </Select>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
            Include archived <Switch aria-label="Include archived" />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

## Popover props

Floating content anchored to a trigger: filters, pickers, small forms.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## PopoverContent props

The popover's panel: 12px radius, a hairline, the floating shadow; 288px wide unless `className` says otherwise.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [MenuButton](menu-button.md): A button that opens a menu of MenuItems, with shortcuts and check marks.
- [ContextMenu](context-menu.md): A menu at a point, for right-clicks.
- [Dialog](dialog.md): A modal (or modeless) dialog with a title, content, and actions; it traps focus and closes on Escape.
- [PreviewDialog](preview-dialog.md): A dialog whose values preview live in the document: the kit supplies begin, update and end.
- [Toast](toast.md): A short notice at the top. Render Toaster once; call toast() or toast.success(), .error(), .loading(), .promise() anywhere, with an id to replace a notice and an action button.
- [Modal](modal.md): A composable modal dialog for host apps: header, content, footer; it traps focus and closes on Escape or an outside press.
- [Tooltip](tooltip.md): A short label shown on hover or keyboard focus, for an icon or a status that needs a word.
- [Sheet](sheet.md): A panel that slides in from the right to edit one thing beside the work, guarding unsaved changes; from the left, it holds an app’s navigation on a phone.
- [Confirm](confirm.md): `useConfirm()` asks a yes-or-no question and resolves a promise; asks queue one at a time.
- [Command](command.md): A searchable list of commands or choices: type to filter, arrows and Enter to pick.
- [DropPanel](drop-panel.md): A popover anchored to an element, closing on a press outside or Escape.
