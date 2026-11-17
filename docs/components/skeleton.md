# Skeleton

A placeholder in the shape of content that is loading.

Category: Data display · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/skeleton/)

```ts
import { Skeleton } from '@kition/tessera-ui'
```

## Example: Title and paragraph

```tsx
import { Skeleton } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <Skeleton width={180} height={20} />
      <Skeleton lines={3} />
    </div>
  )
}
```

## Skeleton props

A placeholder in the shape of content that is loading; `lines` draws a paragraph. Size it with `width` and `height`, or with classes (16px tall by default).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number \| string` |  |  |
| `height` | `number \| string` |  |  |
| `lines` | `number` |  |  |
| `className` | `string` |  |  |

## See also

- [Table](table.md): Records in rows and columns: columns say what each shows, dataSource holds the records; pages, pinned columns, loading and empty states.
- [Tag](tag.md): A short status or category label on a soft tint of its tone.
- [Alert](alert.md): A message in the page, in its tone, with an optional action or close.
- [Descriptions](descriptions.md): Labelled values of one record, in columns; with Breadcrumb, Avatar, and Divider for a detail page.
- [Empty and Result](empty-result.md): Nothing to show yet, and the outcome of a whole page or flow, each with what to do next.
- [Charts](line-chart.md): LineChart and BarChart draw one or more series over ordered categories; PieChart draws parts of a whole, as a pie or a donut. A legend, a readout under the pointer, the chart palette tokens or a colour of yours; height="fill" takes the height of its box.
