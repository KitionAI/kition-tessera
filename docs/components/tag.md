# Tag

A short status or category label on a soft tint of its tone.

Category: Data display · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/tag/)

```ts
import { Tag } from '@kition/tessera-ui'
```

## When to use

- A record’s status in a table or header.

## When not to

- A count beside a label: use Badge.

## Example: Tones

```tsx
import { Tag } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div className="demo-row">
      <Tag>Draft</Tag>
      <Tag tone="info">Processing</Tag>
      <Tag tone="success">Paid</Tag>
      <Tag tone="warning">Pending</Tag>
      <Tag tone="danger">Failed</Tag>
    </div>
  )
}
```

## Tag props

A short status or category label on a soft tint of its tone.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tone` | `Tone`: `'neutral'`, `'info'`, `'success'`, `'warning'`, `'danger'` | `'neutral'` |  |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [Table](table.md): Records in rows and columns: columns say what each shows, dataSource holds the records; pages, pinned columns, loading and empty states.
- [Alert](alert.md): A message in the page, in its tone, with an optional action or close.
- [Descriptions](descriptions.md): Labelled values of one record, in columns; with Breadcrumb, Avatar, and Divider for a detail page.
- [Empty and Result](empty-result.md): Nothing to show yet, and the outcome of a whole page or flow, each with what to do next.
- [Skeleton](skeleton.md): A placeholder in the shape of content that is loading.
- [Charts](line-chart.md): LineChart and BarChart draw one or more series over ordered categories; PieChart draws parts of a whole, as a pie or a donut. A legend, a readout under the pointer, the chart palette tokens or a colour of yours; height="fill" takes the height of its box.
