# Disclosure

A section that opens and closes under its title.

Category: General · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/disclosure/)

```ts
import { Disclosure } from '@kition/tessera-ui'
```

## When to use

- Advanced settings most people do not need.

## Example: Closed and open

```tsx
import { Disclosure, TextInput } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div style={{ maxWidth: 360 }}>
      <Disclosure title="Advanced settings">
        <TextInput size="md" defaultValue="0.7" aria-label="Temperature" />
      </Disclosure>
      <Disclosure title="Usage" defaultOpen>
        1,240 credits this month
      </Disclosure>
    </div>
  )
}
```

## Disclosure props

A section that opens and closes under its title.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` (required) | `ReactNode` |  |  |
| `defaultOpen` | `boolean` | `false` |  |
| `open` | `boolean` |  | Open, when the screen holds the state (with `onOpenChange`). |
| `onOpenChange` | `(open: boolean) => void` |  |  |
| `onClose` | `() => void` |  | Called when the person closes it. |
| `children` | `ReactNode` |  |  |
| `className` | `string` |  |  |

## See also

- [Button](button.md): Starts an action. One primary button per view; the rest secondary or ghost.
- [Spinner](spinner.md): A spinning circle for work in progress.
- [IconButton](icon-button.md): An icon-only button with an accessible label; `pressed` makes it a toggle.
- [Badge](badge.md): A small count or status beside a label.
- [Card](card.md): A product card: 12px radius, a hairline, a light shadow.
