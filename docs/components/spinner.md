# Spinner

A spinning circle for work in progress.

Category: General · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/spinner/)

```ts
import { Spinner } from '@kition/tessera-ui'
```

## When to use

- Inside a button while its action runs (Button `loading`).
- Next to a status that is still updating.

## When not to

- Long work with known progress: show the progress.

## Example: Sizes and a label

```tsx
import { Spinner } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div className="demo-row">
      <Spinner />
      <Spinner size={24} label="Loading the workspace" />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--kit-text-muted)' }}>
        <Spinner size={14} /> Syncing…
      </span>
    </div>
  )
}
```

## Spinner props

A spinning circle for work in progress; `label` names it for screen readers (otherwise it is decorative).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `number` | `16` |  |
| `label` | `string` |  |  |
| `className` | `string` |  |  |

## See also

- [Button](button.md): Starts an action. One primary button per view; the rest secondary or ghost.
- [IconButton](icon-button.md): An icon-only button with an accessible label; `pressed` makes it a toggle.
- [Badge](badge.md): A small count or status beside a label.
- [Card](card.md): A product card: 12px radius, a hairline, a light shadow.
- [Disclosure](disclosure.md): A section that opens and closes under its title.
