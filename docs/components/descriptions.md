# Descriptions

Labelled values of one record, in columns; with Breadcrumb, Avatar, and Divider for a detail page.

Category: Data display · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/descriptions/)

```ts
import { Descriptions, Breadcrumb, Avatar, Divider } from '@kition/tessera-ui'
```

## Example: A user’s detail page

```tsx
import { Avatar, Breadcrumb, Descriptions, Divider, Tag } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div>
      <Breadcrumb items={[{ title: <a href="#users">Users</a> }, { title: 'Ada Lovelace' }]} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
        <Avatar name="Ada Lovelace" size={36} />
        <strong>Ada Lovelace</strong>
        <Tag tone="success">active</Tag>
      </div>
      <Divider>Account</Divider>
      <Descriptions
        columns={3}
        items={[
          { label: 'Email', children: 'ada@example.com' },
          { label: 'Plan', children: 'Pro (yearly)' },
          { label: 'Credits', children: '12,400' },
          { label: 'Signed up', children: '2026-03-14 09:21' },
          { label: 'Last active', children: '2 hours ago' },
          { label: 'Notes', children: 'Moved from the Team plan after the trial.', span: 3 },
        ]}
      />
    </div>
  )
}
```

## Descriptions props

Labelled values of one record (an order, a user), laid out in `columns` columns.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` (required) | `readonly DescriptionItem[]` |  |  |
| `columns` | `number` | `3` |  |
| `title` | `ReactNode` |  |  |
| `className` | `string` |  |  |

## Breadcrumb props

Where the page sits: its parents (links in `title`) and then itself.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` (required) | `readonly BreadcrumbItem[]` |  |  |
| `className` | `string` |  |  |

## Avatar props

A person's picture, or their initial on a tint when there is none.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` |  |  |
| `name` (required) | `string` |  |  |
| `size` | `number` | `28` |  |
| `className` | `string` |  |  |

## Divider props

A hairline between sections, with an optional label in it.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` |  |  |
| `className` | `string` |  |  |

## See also

- [Table](table.md): Records in rows and columns: columns say what each shows, dataSource holds the records; pages, pinned columns, loading and empty states.
- [Tag](tag.md): A short status or category label on a soft tint of its tone.
- [Alert](alert.md): A message in the page, in its tone, with an optional action or close.
- [Empty and Result](empty-result.md): Nothing to show yet, and the outcome of a whole page or flow, each with what to do next.
- [Skeleton](skeleton.md): A placeholder in the shape of content that is loading.
- [Charts](line-chart.md): LineChart and BarChart draw one or more series over ordered categories; PieChart draws parts of a whole, as a pie or a donut. A legend, a readout under the pointer, the chart palette tokens or a colour of yours; height="fill" takes the height of its box.
