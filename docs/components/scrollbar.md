# Scrollbar

A persistent scrollbar for a virtual document viewport, with a proportional thumb, dragging, track clicks and keyboard navigation.

Category: Editor chrome · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/scrollbar/)

```ts
import { Scrollbar } from '@kition/tessera-ui'
```

## When to use

- A canvas pans through a bounded document instead of scrolling DOM content.

## When not to

- An ordinary DOM list: use native overflow scrolling.

## Example: Page sections

```tsx
import { useState } from 'react'
import { Scrollbar } from '@kition/tessera-ui'

export default function Demo() {
  const [offset, setOffset] = useState(0)
  return (
    <div style={{ display: 'flex', height: 200, width: 300, border: '1px solid var(--kit-border)' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ transform: `translateY(${-offset}px)` }}>
          {Array.from({ length: 20 }, (_, index) => <div key={index} style={{ height: 40, paddingLeft: 12 }}>Page section {index + 1}</div>)}
        </div>
      </div>
      <Scrollbar label="Page sections" value={offset} max={600} page={200} onChange={setOffset} />
    </div>
  )
}
```

## Scrollbar props

A persistent scrollbar for virtual viewports, with proportional thumb, pointer capture and keyboard navigation.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | Accessible name supplied by the editor's locale. |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` |  |
| `value` (required) | `number` |  | Distance from the start of the content, in the caller's coordinates. |
| `max` (required) | `number` |  | Maximum scroll distance (content length minus visible length). |
| `page` (required) | `number` |  | Visible content length, in the same coordinates as value. |
| `onChange` (required) | `(value: number) => void` |  |  |
| `controls` | `string` |  |  |

## See also

- [Ribbon](ribbon.md): Office-style command groups: large and small buttons, stacks, rows, and swatches; it collapses to Single line, and a ribbon too wide for its window gives way in steps (RibbonFit): small buttons, icons alone, then groups collapsed to one button each.
- [OverflowStrip](overflow-strip.md): A row that scrolls sideways when it does not fit: the cut edge fades, and a button there scrolls.
- [StatusBar](status-bar.md): The bottom bar: document facts on the left, zoom on the right.
- [TableSizePicker](table-size-picker.md): Pick a table size by hovering a grid.
- [Panel parts](panel-parts.md): Pieces of list panels: visibility eyes, in-place rename, footers, thumbnails.
