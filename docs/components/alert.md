# Alert

A message in the page, in its tone, with an optional action or close.

Category: Data display · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/alert/)

```ts
import { Alert } from '@kition/tessera-ui'
```

## When to use

- A state of the account or page the person should know about.

## When not to

- A short confirmation after an action: use a toast.

## Example: Tones, action, close

```tsx
import { useState } from 'react'
import { Alert, Button } from '@kition/tessera-ui'

export default function Demo() {
  const [shown, setShown] = useState(true)
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <Alert title="Password sign-in is turned off" description="People sign in with GitHub or Google until you turn it back on." />
      <Alert tone="success" title="Credits added" />
      <Alert tone="warning" title="Your plan renews in 3 days" action={<Button size="sm">Manage</Button>} />
      {shown ? <Alert tone="danger" title="The last payment failed" description="Update the card to keep syncing." onClose={() => setShown(false)} /> : null}
    </div>
  )
}
```

## Alert props

A message in the page: what happened or what to know, in its tone, with an optional action.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tone` | `Exclude<Tone, 'neutral'>` | `'info'` |  |
| `title` (required) | `ReactNode` |  |  |
| `description` | `ReactNode` |  |  |
| `action` | `ReactNode` |  | A button or link at the end (Retry, Upgrade). |
| `onClose` | `() => void` |  | Shows a close button that calls it. |
| `className` | `string` |  |  |
| `testId` | `string` |  |  |

## See also

- [Table](table.md): Records in rows and columns: columns say what each shows, dataSource holds the records; pages, pinned columns, loading and empty states.
- [Tag](tag.md): A short status or category label on a soft tint of its tone.
- [Descriptions](descriptions.md): Labelled values of one record, in columns; with Breadcrumb, Avatar, and Divider for a detail page.
- [Empty and Result](empty-result.md): Nothing to show yet, and the outcome of a whole page or flow, each with what to do next.
- [Skeleton](skeleton.md): A placeholder in the shape of content that is loading.
- [Charts](line-chart.md): LineChart and BarChart draw one or more series over ordered categories; PieChart draws parts of a whole, as a pie or a donut. A legend, a readout under the pointer, the chart palette tokens or a colour of yours; height="fill" takes the height of its box.
