# StatusBar

The bottom bar: document facts on the left, zoom on the right.

Category: Editor chrome · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/status-bar/)

```ts
import { StatusBar, StatusSpacer, ZoomControl } from '@kition/tessera-ui'
```

## Example: Zoom

```tsx
import { useState } from 'react'
import { StatusBar, StatusSpacer, ZoomControl } from '@kition/tessera-ui'

export default function Demo() {
  const [zoom, setZoom] = useState(1)
  return (
    <div className="demo-frame">
      <StatusBar>
        <span>Slide 3 of 12</span>
        <StatusSpacer />
        <ZoomControl zoom={zoom} onZoom={setZoom} onFit={() => setZoom(1)} labels={{ out: 'Zoom out', in: 'Zoom in', fit: 'Fit' }} />
      </StatusBar>
    </div>
  )
}
```

## StatusBar props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` |  |  |
| `onClick` | `(event: ReactMouseEvent<HTMLElement>) => void` |  |  |

## StatusSpacer props

## ZoomControl props

Zoom out, a slider from `min` to `max`, zoom in, the value, and fit.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `zoom` (required) | `number` |  |  |
| `onZoom` (required) | `(zoom: number) => void` |  |  |
| `onFit` (required) | `() => void` |  |  |
| `min` | `number` | `0.1` |  |
| `max` | `number` | `4` |  |
| `labels` (required) | `{ out: string; in: string; fit: string }` |  |  |

## See also

- [Scrollbar](scrollbar.md): A persistent scrollbar for a virtual document viewport, with a proportional thumb, dragging, track clicks and keyboard navigation.
- [Ribbon](ribbon.md): Office-style command groups: large and small buttons, stacks, rows, and swatches; it collapses to Single line, and a ribbon too wide for its window gives way in steps (RibbonFit): small buttons, icons alone, then groups collapsed to one button each.
- [OverflowStrip](overflow-strip.md): A row that scrolls sideways when it does not fit: the cut edge fades, and a button there scrolls.
- [TableSizePicker](table-size-picker.md): Pick a table size by hovering a grid.
- [Panel parts](panel-parts.md): Pieces of list panels: visibility eyes, in-place rename, footers, thumbnails.
