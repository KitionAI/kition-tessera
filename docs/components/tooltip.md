# Tooltip

A short label shown on hover or keyboard focus, for an icon or a status that needs a word.

Category: Menus and overlays · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/tooltip/)

```ts
import { Tooltip, TooltipProvider, TooltipContent } from '@kition/tessera-ui'
```

## When to use

- Naming an icon-only control.
- Explaining a status mark (an error in a cell).

## When not to

- Anything the person must read to act: put it on the page.

## Example: Icon and button

```tsx
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@kition/tessera-ui'
import { CircleAlertIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  return (
    <TooltipProvider>
      <div className="demo-row">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" iconOnly aria-label="Invalid value">
              <CircleAlertIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>The value is not a date</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm">Hover or focus me</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltips name a control; they never hold the only copy of something.</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
```

## Tooltip props

A short label shown on hover or keyboard focus. Works on its own; a TooltipProvider above it shares one delay among several.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## TooltipProvider props

Shares one hover delay among the tooltips inside it (`delayDuration`, 200 ms by default), so moving between them skips the wait.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## TooltipContent props

The tooltip's bubble: dark, small, above the page.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [MenuButton](menu-button.md): A button that opens a menu of MenuItems, with shortcuts and check marks.
- [ContextMenu](context-menu.md): A menu at a point, for right-clicks.
- [Dialog](dialog.md): A modal (or modeless) dialog with a title, content, and actions; it traps focus and closes on Escape.
- [PreviewDialog](preview-dialog.md): A dialog whose values preview live in the document: the kit supplies begin, update and end.
- [Toast](toast.md): A short notice at the top. Render Toaster once; call toast() or toast.success(), .error(), .loading(), .promise() anywhere, with an id to replace a notice and an action button.
- [Modal](modal.md): A composable modal dialog for host apps: header, content, footer; it traps focus and closes on Escape or an outside press.
- [Popover](popover.md): Floating content anchored to a trigger, positioned to stay on screen: filters, pickers, small forms.
- [Sheet](sheet.md): A panel that slides in from the right to edit one thing beside the work, guarding unsaved changes; from the left, it holds an app’s navigation on a phone.
- [Confirm](confirm.md): `useConfirm()` asks a yes-or-no question and resolves a promise; asks queue one at a time.
- [Command](command.md): A searchable list of commands or choices: type to filter, arrows and Enter to pick.
- [DropPanel](drop-panel.md): A popover anchored to an element, closing on a press outside or Escape.
