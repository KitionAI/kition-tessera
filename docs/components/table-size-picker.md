# TableSizePicker

Pick a table size by hovering a grid.

Category: Editor chrome · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/table-size-picker/)

```ts
import { TableSizePicker } from '@kition/tessera-ui'
```

## Example: Insert a table

```tsx
import { useState } from 'react'
import { TableSizePicker } from '@kition/tessera-ui'

export default function Demo() {
  const [picked, setPicked] = useState('')
  return (
    <div className="demo-stack">
      <TableSizePicker onPick={(rows, columns) => setPicked(`${rows} × ${columns}`)} label={(rows, columns) => `${columns} × ${rows} table`} />
      <span>{picked ? `Inserted a ${picked} table` : 'Pick a size'}</span>
    </div>
  )
}
```

## TableSizePicker props

Choosing a table's size by pointing at a grid of cells (Insert > Table).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `rows` | `number` | `8` |  |
| `columns` | `number` | `10` |  |
| `onPick` (required) | `(rows: number, columns: number) => void` |  |  |
| `label` (required) | `(rows: number, columns: number) => string` |  |  |

## See also

- [Scrollbar](scrollbar.md): A persistent scrollbar for a virtual document viewport, with a proportional thumb, dragging, track clicks and keyboard navigation.
- [Ribbon](ribbon.md): Office-style command groups: large and small buttons, stacks, rows, and swatches; it collapses to Single line, and a ribbon too wide for its window gives way in steps (RibbonFit): small buttons, icons alone, then groups collapsed to one button each.
- [OverflowStrip](overflow-strip.md): A row that scrolls sideways when it does not fit: the cut edge fades, and a button there scrolls.
- [StatusBar](status-bar.md): The bottom bar: document facts on the left, zoom on the right.
- [Panel parts](panel-parts.md): Pieces of list panels: visibility eyes, in-place rename, footers, thumbnails.
