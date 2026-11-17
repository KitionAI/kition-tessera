# Badge

A small count or status beside a label.

Category: General · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/badge/)

```ts
import { Badge } from '@kition/tessera-ui'
```

## When to use

- The number of records in a view.
- A Beta or New mark.

## When not to

- An action: use a Button.

## Example: Count and status

```tsx
import { Badge } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div className="demo-row">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        Grid view <Badge>128</Badge>
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        AI fields <Badge>Beta</Badge>
      </span>
    </div>
  )
}
```

## Badge props

A small count or status beside a label (records in a view, a beta mark).

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [Button](button.md): Starts an action. One primary button per view; the rest secondary or ghost.
- [Spinner](spinner.md): A spinning circle for work in progress.
- [IconButton](icon-button.md): An icon-only button with an accessible label; `pressed` makes it a toggle.
- [Card](card.md): A product card: 12px radius, a hairline, a light shadow.
- [Disclosure](disclosure.md): A section that opens and closes under its title.
