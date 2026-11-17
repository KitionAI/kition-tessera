# Empty and Result

Nothing to show yet, and the outcome of a whole page or flow, each with what to do next.

Category: Data display · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/empty-result/)

```ts
import { Empty, Result } from '@kition/tessera-ui'
```

## Example: No feedback, access denied

```tsx
import { Button, Empty, Result } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Empty title="No feedback yet" description="Messages people send from the app arrive here.">
        <Button size="sm">Refresh</Button>
      </Empty>
      <Result status="forbidden" title="Access denied" description="Your account cannot open the admin console." extra={<Button size="sm" variant="primary">Sign in again</Button>} />
    </div>
  )
}
```

## Empty props

Nothing to show yet: a quiet drawing, what is missing, and what to do about it.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `ReactNode` |  |  |
| `description` | `ReactNode` |  |  |
| `image` | `ReactNode` |  | Replaces the inbox drawing (an icon of the situation). |
| `children` | `ReactNode` |  | Actions under the text (Create, Retry). |
| `className` | `string` |  |  |

## Result props

The outcome of a whole page or flow (paid, access denied, page not found), with what to do next.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `status` | `ResultStatus`: `'info'`, `'success'`, `'warning'`, `'error'`, `'forbidden'`, `'notFound'` | `'info'` |  |
| `title` (required) | `ReactNode` |  |  |
| `description` | `ReactNode` |  |  |
| `extra` | `ReactNode` |  |  |
| `className` | `string` |  |  |

## See also

- [Table](table.md): Records in rows and columns: columns say what each shows, dataSource holds the records; pages, pinned columns, loading and empty states.
- [Tag](tag.md): A short status or category label on a soft tint of its tone.
- [Alert](alert.md): A message in the page, in its tone, with an optional action or close.
- [Descriptions](descriptions.md): Labelled values of one record, in columns; with Breadcrumb, Avatar, and Divider for a detail page.
- [Skeleton](skeleton.md): A placeholder in the shape of content that is loading.
- [Charts](line-chart.md): LineChart and BarChart draw one or more series over ordered categories; PieChart draws parts of a whole, as a pie or a donut. A legend, a readout under the pointer, the chart palette tokens or a colour of yours; height="fill" takes the height of its box.
