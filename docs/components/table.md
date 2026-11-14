# Table

Records in rows and columns: columns say what each shows, dataSource holds the records; pages, pinned columns, loading and empty states.

Category: Data display · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/table/)

```ts
import { Table, SelectionBar, Pagination } from '@kition/tessera-ui'
```

## When to use

- Lists of orders, users, events: anything scanned and compared row by row.

## When not to

- A spreadsheet the person edits: that is a kit.

## Example: Pages, pinned column, tags

```tsx
import { Table, Tag, type TableColumn } from '@kition/tessera-ui'

type Order = { id: string; customer: string; plan: string; amount: number; status: 'paid' | 'pending' | 'refunded' }

const ORDERS: Order[] = Array.from({ length: 23 }, (_, index) => ({
  id: `ord_${1040 + index}`,
  customer: ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson'][index % 4],
  plan: index % 3 ? 'Pro' : 'Team',
  amount: 19 + (index % 5) * 10,
  status: (['paid', 'pending', 'refunded'] as const)[index % 3],
}))

const TONES = { paid: 'success', pending: 'warning', refunded: 'neutral' } as const

const columns: TableColumn<Order>[] = [
  { key: 'id', title: 'Order', dataIndex: 'id', width: 120, fixed: 'left' },
  { key: 'customer', title: 'Customer', dataIndex: 'customer', ellipsis: true },
  { key: 'plan', title: 'Plan', dataIndex: 'plan', width: 90 },
  { key: 'amount', title: 'Amount', dataIndex: 'amount', align: 'right', width: 100, render: (amount: number) => `$${amount}.00` },
  { key: 'status', title: 'Status', dataIndex: 'status', width: 110, render: (status: Order['status']) => <Tag tone={TONES[status]}>{status}</Tag> },
]

export default function Demo() {
  return <Table columns={columns} dataSource={ORDERS} rowKey="id" size="small" pagination={{ defaultPageSize: 8, showSizeChanger: true, pageSizeOptions: [8, 16, 32] }} />
}
```

## Example: Selection, row actions, SelectionBar

Row actions show while the pointer is over a row or focus is in it. SelectionBar floats at the bottom of the nearest positioned box; Escape in it clears the selection.

```tsx
import { useState, type Key } from 'react'
import { Button, IconButton, SelectionBar, Table, type TableColumn } from '@kition/tessera-ui'
import { CopyIcon, DownloadIcon, EllipsisIcon, FolderInputIcon, Share2Icon, StarIcon, TrashIcon } from '@kition/tessera-icons/react'

type File = { id: string; name: string; owner: string; modified: string }

const FILES: File[] = [
  { id: 'f1', name: 'Q4 plan.docx', owner: 'Ada', modified: 'Today 10:12' },
  { id: 'f2', name: 'Backlog.ktable', owner: 'Me', modified: 'Today 09:30' },
  { id: 'f3', name: 'Roadmap review.pptx', owner: 'Grace', modified: 'Yesterday' },
  { id: 'f4', name: 'Budget 2026.xlsx', owner: 'Me', modified: 'Yesterday' },
  { id: 'f5', name: 'User research.pdf', owner: 'Alan', modified: 'Oct 28' },
]

const columns: TableColumn<File>[] = [
  { key: 'name', title: 'Name', dataIndex: 'name', ellipsis: true },
  { key: 'owner', title: 'Owner', dataIndex: 'owner', width: 110 },
  { key: 'modified', title: 'Modified', dataIndex: 'modified', width: 140 },
]

export default function Demo() {
  const [selected, setSelected] = useState<Key[]>(['f2'])
  return (
    <div style={{ position: 'relative', minHeight: 360 }}>
      <Table
        columns={columns}
        dataSource={FILES}
        rowKey="id"
        pagination={false}
        rowSelection={{ selectedKeys: selected, onChange: setSelected, rowLabel: (file) => `Select ${file.name}` }}
        rowActions={(file) => (
          <>
            <IconButton icon={Share2Icon} label={`Share ${file.name}`} />
            <IconButton icon={DownloadIcon} label={`Download ${file.name}`} />
            <IconButton icon={StarIcon} label={`Star ${file.name}`} />
            <IconButton icon={EllipsisIcon} label={`More for ${file.name}`} />
          </>
        )}
      />
      <SelectionBar count={selected.length} onClear={() => setSelected([])}>
        <Button variant="ghost" size="sm"><Share2Icon size={16} />Share</Button>
        <Button variant="ghost" size="sm"><DownloadIcon size={16} />Download</Button>
        <Button variant="ghost" size="sm"><FolderInputIcon size={16} />Move</Button>
        <Button variant="ghost" size="sm"><CopyIcon size={16} />Copy</Button>
        <Button variant="ghost" size="sm"><TrashIcon size={16} />Delete</Button>
      </SelectionBar>
    </div>
  )
}
```

## Example: Empty and loading

```tsx
import { useState } from 'react'
import { Button, Empty, Table, type TableColumn } from '@kition/tessera-ui'

type Key = { id: string; name: string }
const columns: TableColumn<Key>[] = [
  { key: 'name', title: 'Name', dataIndex: 'name' },
  { key: 'id', title: 'ID', dataIndex: 'id', width: 160 },
]

export default function Demo() {
  const [loading, setLoading] = useState(false)
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Table columns={columns} dataSource={[]} rowKey="id" emptyText={<Empty title="No API keys" description="Create a key to call the API from your own code."><Button size="sm" variant="primary">Create key</Button></Empty>} />
      <Button size="sm" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500) }}>Load for 1.5s</Button>
      <Table columns={columns} dataSource={[{ id: 'key_1', name: 'Build server' }]} rowKey="id" loading={loading} />
    </div>
  )
}
```

## Table props

Records in rows and columns: `columns` say what each shows (`dataIndex`, `render`), `dataSource`
holds the records. Pages through long lists, shows a spinner while loading and `emptyText` when
empty, and can pin columns and the header.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` (required) | `readonly TableColumn<T>[]` |  |  |
| `dataSource` (required) | `readonly T[] \| undefined` |  |  |
| `rowKey` (required) | `string \| ((record: T) => Key)` |  | The field that identifies a record, or a function of it. |
| `loading` | `boolean` |  |  |
| `pagination` | `TablePagination \| false` |  | Pages of `defaultPageSize` rows (10 by default); `false` shows every row. |
| `size` | `'small' \| 'middle'` | `'middle'` | `small`: 36px rows for dense screens; `middle` (default): 44px. |
| `emptyText` | `ReactNode` |  | Shown when there are no rows (an `Empty`). |
| `sticky` | `boolean` |  | Keeps the header in view while the page scrolls. |
| `scrollX` | `number \| string` |  | The table's least width; it scrolls sideways in a narrower container. |
| `onRow` | `(record: T, index: number) => HTMLAttributes<HTMLTableRowElement>` |  |  |
| `rowSelection` | `TableSelection<T>` |  | Selects records with check boxes; selected rows are marked. Pair it with SelectionBar for their actions. |
| `rowActions` | `(record: T, index: number) => ReactNode` |  | A record's actions (icon buttons, a menu), at the row's end while the pointer is over the row or focus is in it. |
| `caption` | `ReactNode` |  | Caption above the table, for its accessible name. |
| `className` | `string` |  |  |
| `testId` | `string` |  |  |

## SelectionBar props

Actions on the selected records, floating at the bottom of the nearest positioned box: the count,
the actions, and a button that clears the selection. With Table's `rowSelection`, it replaces a
row of links on every record.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `count` (required) | `number` |  | How many records are selected; with none the bar is not drawn. |
| `children` (required) | `ReactNode` |  | The actions on the selection: Buttons (`variant="ghost"`) with an icon and a word. |
| `onClear` (required) | `() => void` |  | Clears the selection: the close button, and Escape while focus is in the bar. |
| `className` | `string` |  |  |
| `testId` | `string` |  |  |

## Pagination props

The pages of a long list: the range shown, page buttons, and an optional page size.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `page` (required) | `number` |  |  |
| `pageSize` (required) | `number` |  |  |
| `total` (required) | `number` |  |  |
| `onChange` (required) | `(page: number, pageSize: number) => void` |  |  |
| `pageSizeOptions` | `readonly number[]` |  | Offers these page sizes; without it the size is fixed. |
| `className` | `string` |  |  |

## See also

- [Tag](tag.md): A short status or category label on a soft tint of its tone.
- [Alert](alert.md): A message in the page, in its tone, with an optional action or close.
- [Descriptions](descriptions.md): Labelled values of one record, in columns; with Breadcrumb, Avatar, and Divider for a detail page.
- [Empty and Result](empty-result.md): Nothing to show yet, and the outcome of a whole page or flow, each with what to do next.
- [Skeleton](skeleton.md): A placeholder in the shape of content that is loading.
- [Charts](line-chart.md): LineChart and BarChart draw one or more series over ordered categories; PieChart draws parts of a whole, as a pie or a donut. A legend, a readout under the pointer, the chart palette tokens or a colour of yours; height="fill" takes the height of its box.
