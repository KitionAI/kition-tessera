# IconButton

An icon-only button with an accessible label; `pressed` makes it a toggle.

Category: General · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/icon-button/)

```ts
import { IconButton } from '@kition/tessera-ui'
```

## When to use

- Toolbars, tool rails, panel headers.

## When not to

- An action whose icon is not obvious: use a Button with a label.

## Example: Toggles in a bar

```tsx
import { useState } from 'react'
import { IconButton } from '@kition/tessera-ui'
import { BoldIcon, ItalicIcon, UnderlineIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [bold, setBold] = useState(true)
  return (
    <div className="demo-row">
      <IconButton icon={BoldIcon} label="Bold" pressed={bold} onClick={() => setBold(!bold)} />
      <IconButton icon={ItalicIcon} label="Italic" />
      <IconButton icon={UnderlineIcon} label="Underline" disabled />
    </div>
  )
}
```

## IconButton props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` (required) | `IconComponent` |  |  |
| `label` (required) | `string` |  |  |
| `pressed` | `boolean` |  |  |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [Button](button.md): Starts an action. One primary button per view; the rest secondary or ghost.
- [Spinner](spinner.md): A spinning circle for work in progress.
- [Badge](badge.md): A small count or status beside a label.
- [Card](card.md): A product card: 12px radius, a hairline, a light shadow.
- [Disclosure](disclosure.md): A section that opens and closes under its title.
