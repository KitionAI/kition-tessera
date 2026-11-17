# Charts

LineChart and BarChart draw one or more series over ordered categories; PieChart draws parts of a whole, as a pie or a donut. A legend, a readout under the pointer, the chart palette tokens or a colour of yours; height="fill" takes the height of its box.

Category: Data display · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/line-chart/)

```ts
import { LineChart, BarChart, PieChart } from '@kition/tessera-ui'
```

## Example: Growth by day

```tsx
import { LineChart } from '@kition/tessera-ui'

const days = Array.from({ length: 14 }, (_, index) => `10-${String(index + 10).padStart(2, '0')}`)
const DATA = days.flatMap((date, index) => [
  { date, metric: 'Visitors', value: Math.round(420 + Math.sin(index / 2) * 90 + index * 12) },
  { date, metric: 'Downloads', value: Math.round(120 + Math.cos(index / 3) * 30 + index * 6) },
  { date, metric: 'Sign-ups', value: Math.round(40 + Math.sin(index) * 8 + index * 2) },
])

export default function Demo() {
  return <LineChart label="Growth by day" data={DATA} xField="date" yField="value" seriesField="metric" height={260} />
}
```

## Example: Bars and a donut

```tsx
import { BarChart, PieChart } from '@kition/tessera-ui'

const STAGES = [
  { stage: 'Backlog', tasks: 14 },
  { stage: 'To do', tasks: 9 },
  { stage: 'Doing', tasks: 6 },
  { stage: 'Review', tasks: 4 },
  { stage: 'Done', tasks: 21 },
]

export default function Demo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
      <BarChart label="Tasks by stage" data={STAGES} xField="stage" yField="tasks" height={240} />
      <PieChart label="Share of tasks" data={STAGES} labelField="stage" valueField="tasks" innerRadius={0.6} height={200} />
    </div>
  )
}
```

## LineChart props

Lines of one or more series over ordered categories, with a legend and a hover readout.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` (required) | `readonly T[]` |  |  |
| `xField` (required) | `keyof T & string` |  | The field of each datum on the horizontal axis (categories in order of first appearance). |
| `yField` (required) | `keyof T & string` |  | The field holding the number. |
| `seriesField` | `keyof T & string` |  | The field naming the series a datum belongs to; one series without it. |
| `height` | `ChartHeight` |  |  |
| `color` | `string` |  | The colour of a single series (the palette's first by default). |
| `integers` | `boolean` |  | Counts: the axis steps only by whole numbers. |
| `formatX` | `(value: string) => string` |  |  |
| `formatY` | `(value: number) => string` |  |  |
| `label` (required) | `string` |  | The chart's accessible name. |
| `className` | `string` |  |  |
| `testId` | `string` |  |  |
| `dots` | `boolean` |  | Marks each point with a dot. |

## BarChart props

Bars of one or more series per category, side by side, with rounded tops.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` (required) | `readonly T[]` |  |  |
| `xField` (required) | `keyof T & string` |  | The field of each datum on the horizontal axis (categories in order of first appearance). |
| `yField` (required) | `keyof T & string` |  | The field holding the number. |
| `seriesField` | `keyof T & string` |  | The field naming the series a datum belongs to; one series without it. |
| `height` | `ChartHeight` |  |  |
| `color` | `string` |  | The colour of a single series (the palette's first by default). |
| `integers` | `boolean` |  | Counts: the axis steps only by whole numbers. |
| `formatX` | `(value: string) => string` |  |  |
| `formatY` | `(value: number) => string` |  |  |
| `label` (required) | `string` |  | The chart's accessible name. |
| `className` | `string` |  |  |
| `testId` | `string` |  |  |
| `maxBarWidth` | `number` |  | The widest a bar draws, in px. |

## PieChart props

Parts of a whole as slices of a pie (or a donut), with a legend and a readout of the slice under the pointer.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` (required) | `readonly T[]` |  |  |
| `labelField` (required) | `keyof T & string` |  | The field naming each slice. |
| `valueField` (required) | `keyof T & string` |  | The field holding each slice's number. |
| `height` | `ChartHeight` | `240` |  |
| `innerRadius` | `number` | `0` | The hole's size as a share of the radius (0.6 for a donut); a full pie by default. |
| `colors` | `readonly string[]` |  | Colours for the slices, in order; the chart palette by default. |
| `formatValue` | `(value: number) => string` | `(value) => value.toLocaleString()` |  |
| `label` (required) | `string` |  | The chart's accessible name. |
| `className` | `string` |  |  |
| `testId` | `string` |  |  |

## See also

- [Table](table.md): Records in rows and columns: columns say what each shows, dataSource holds the records; pages, pinned columns, loading and empty states.
- [Tag](tag.md): A short status or category label on a soft tint of its tone.
- [Alert](alert.md): A message in the page, in its tone, with an optional action or close.
- [Descriptions](descriptions.md): Labelled values of one record, in columns; with Breadcrumb, Avatar, and Divider for a detail page.
- [Empty and Result](empty-result.md): Nothing to show yet, and the outcome of a whole page or flow, each with what to do next.
- [Skeleton](skeleton.md): A placeholder in the shape of content that is loading.
