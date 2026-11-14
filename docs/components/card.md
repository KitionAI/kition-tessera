# Card

A product card: 12px radius, a hairline, a light shadow.

Category: General · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/card/)

```ts
import { Card, CardHeader, CardContent } from '@kition/tessera-ui'
```

## When to use

- Grouping settings or a summary on a page.

## Example: Header and content

```tsx
import { Button, Card, CardContent, CardHeader } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <Card style={{ maxWidth: 360 }}>
      <CardHeader>
        <strong>Model</strong>
        <Button size="sm">Change</Button>
      </CardHeader>
      <CardContent>Claude Opus · 1,240 credits this month</CardContent>
    </Card>
  )
}
```

## Card props

A product card: 12px radius, a hairline, a light shadow.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## CardHeader props

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## CardContent props

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [Button](button.md): Starts an action. One primary button per view; the rest secondary or ghost.
- [Spinner](spinner.md): A spinning circle for work in progress.
- [IconButton](icon-button.md): An icon-only button with an accessible label; `pressed` makes it a toggle.
- [Badge](badge.md): A small count or status beside a label.
- [Disclosure](disclosure.md): A section that opens and closes under its title.
