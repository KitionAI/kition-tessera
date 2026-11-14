# Button

Starts an action. One primary button per view; the rest secondary or ghost.

Category: General · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/button/)

```ts
import { Button, ButtonLink } from '@kition/tessera-ui'
```

## When to use

- The main action of a dialog or panel (primary).
- Other actions beside it (secondary, ghost).
- Destructive actions after a choice (danger).

## When not to

- Navigation to another page: use a link.
- Toolbar commands: use IconButton or a ribbon button.

## Example: Variants

Secondary is outlined; subtle is a quiet filled button; a disabled filled button turns muted, not faint.

```tsx
import { Button } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div className="demo-row">
      <Button variant="primary" size="md">Save</Button>
      <Button variant="secondary" size="md">Cancel</Button>
      <Button variant="subtle" size="md">Duplicate</Button>
      <Button variant="ghost" size="md">More</Button>
      <Button variant="danger" size="md">Delete</Button>
      <Button variant="danger-outline" size="md">Disable</Button>
      <Button variant="primary" size="md" disabled>Disabled</Button>
    </div>
  )
}
```

## Example: Sizes

Without a size the button keeps the 30px of editor chrome.

```tsx
import { Button } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div className="demo-row">
      <Button variant="primary" size="sm">Small (32)</Button>
      <Button variant="primary" size="md">Medium (36)</Button>
      <Button variant="primary" size="lg">Large (40)</Button>
      <Button>Editor chrome (30)</Button>
    </div>
  )
}
```

## Example: Loading, icons, icon only

Icons inside a button draw at 16px; an icon-only button is square and needs an aria-label.

```tsx
import { useState } from 'react'
import { Button } from '@kition/tessera-ui'
import { PlusIcon, SettingsIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [saving, setSaving] = useState(false)
  return (
    <div className="demo-row">
      <Button
        variant="primary"
        size="md"
        loading={saving}
        onClick={() => {
          setSaving(true)
          setTimeout(() => setSaving(false), 1500)
        }}
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
      <Button variant="secondary" size="md">
        <PlusIcon /> New record
      </Button>
      <Button variant="ghost" size="md" iconOnly aria-label="Settings">
        <SettingsIcon />
      </Button>
      <Button variant="secondary" size="sm" iconOnly aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
  )
}
```

## Example: Links drawn as buttons

```tsx
import { ButtonLink } from '@kition/tessera-ui'
import { ArrowLeftIcon, MailIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  return (
    <div className="demo-row">
      <ButtonLink variant="primary" size="md" href="#sign-in">
        Sign in again
      </ButtonLink>
      <ButtonLink size="md" href="#home">
        <ArrowLeftIcon size={16} />
        Back to the console
      </ButtonLink>
      <ButtonLink variant="ghost" size="md" href="mailto:hello@example.com">
        <MailIcon size={16} />
        Contact support
      </ButtonLink>
    </div>
  )
}
```

## Button props

A button. Its `className` adds to Tessera's, so a host can adjust one button's layout.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `ButtonVariant`: `'danger'`, `'primary'`, `'secondary'`, `'subtle'`, `'ghost'`, `'danger-outline'` |  |  |
| `size` | `ControlSize`: `'sm'`, `'md'`, `'lg'` |  | Without `size` a button keeps the editor chrome's 30px. |
| `iconOnly` | `boolean` |  | A square button holding only an icon; give it an `aria-label`. |
| `loading` | `boolean` |  | Shows a spinner before the label and marks the button busy, while its action runs. |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## ButtonLink props

A link that looks like a button: for navigation (another page, a sign-in URL, a mail link) drawn as an action.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `ButtonVariant`: `'danger'`, `'primary'`, `'secondary'`, `'subtle'`, `'ghost'`, `'danger-outline'` |  |  |
| `size` | `ControlSize`: `'sm'`, `'md'`, `'lg'` |  |  |
| `render` | `(props: AnchorHTMLAttributes<HTMLAnchorElement> & { className: string; children?: ReactNode }) => ReactNode` |  | Draws the link another way: a router passes its own (`(props) => <Link to="/" {...props} />`). |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [Spinner](spinner.md): A spinning circle for work in progress.
- [IconButton](icon-button.md): An icon-only button with an accessible label; `pressed` makes it a toggle.
- [Badge](badge.md): A small count or status beside a label.
- [Card](card.md): A product card: 12px radius, a hairline, a light shadow.
- [Disclosure](disclosure.md): A section that opens and closes under its title.
