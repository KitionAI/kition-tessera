# Command

A searchable list of commands or choices: type to filter, arrows and Enter to pick.

Category: Menus and overlays · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/command/)

```ts
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from '@kition/tessera-ui'
```

## When to use

- A command palette, a searchable picker inside a popover.

## Example: A command palette

```tsx
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, toast } from '@kition/tessera-ui'
import { FileTextIcon, SettingsIcon, TableIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const run = (name: string) => toast('info', name)
  return (
    <div style={{ width: 'min(100%, 420px)', border: '1px solid var(--kit-border)', borderRadius: 12, background: 'var(--kit-surface)' }}>
      <Command>
        <CommandInput placeholder="Type a command…" />
        <CommandList>
          <CommandEmpty>No matching command.</CommandEmpty>
          <CommandGroup heading="Create">
            <CommandItem onSelect={() => run('New document')}>
              <FileTextIcon size={16} /> New document <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run('New table')}>
              <TableIcon size={16} /> New table
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="App">
            <CommandItem onSelect={() => run('Settings')}>
              <SettingsIcon size={16} /> Settings <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
```

## Command props

A searchable list of commands or choices (cmdk): type to filter, arrows and Enter to pick.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## CommandInput props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `wrapClassName` | `string` |  |  |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## CommandList props

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## CommandEmpty props

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## CommandGroup props

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## CommandItem props

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## CommandSeparator props

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## CommandShortcut props

A shortcut at the end of a command item.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

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
- [DropPanel](drop-panel.md): A popover anchored to an element, closing on a press outside or Escape.
