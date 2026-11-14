# OverflowStrip

A row that scrolls sideways when it does not fit: the cut edge fades, and a button there scrolls.

Category: Editor chrome · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/overflow-strip/)

```ts
import { OverflowStrip } from '@kition/tessera-ui'
```

## When to use

- A ribbon’s groups or a tool’s options bar in a narrow window.

## When not to

- Vertical lists: let the panel scroll.

## Example: Options bar

The row is wider than its box; use the arrows at the faded edges.

```tsx
import { Button, OverflowStrip } from '@kition/tessera-ui'

const TOOLS = ['Brush', 'Eraser', 'Clone', 'Heal', 'Dodge', 'Burn', 'Sponge', 'Smudge', 'Blur', 'Sharpen', 'Gradient', 'Fill', 'Text', 'Shape', 'Crop', 'Slice']

export default function Demo() {
  return (
    <div style={{ width: 'min(100%, 420px)', border: '1px solid var(--kit-border)', borderRadius: 8, background: 'var(--kit-surface)' }}>
      <OverflowStrip className="" panelClassName="demo-strip" labels={{ start: 'Scroll left', end: 'Scroll right' }} testId="tools">
        {TOOLS.map((tool) => (
          <Button key={tool}>{tool}</Button>
        ))}
      </OverflowStrip>
    </div>
  )
}
```

## OverflowStrip props

A row that scrolls sideways when its content does not fit (the ribbon's groups, a tool's options
bar): the cut edge fades, and a button there scrolls by most of a width. `className` and
`panelClassName` add to the outer box and the scrolled row; `resetKey` (the shown tab, the active
tool) re-measures; the buttons' test ids are `${testId}-start` and `${testId}-end`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `className` (required) | `string` |  |  |
| `panelClassName` (required) | `string` |  |  |
| `role` | `string` |  |  |
| `resetKey` | `unknown` |  |  |
| `labels` (required) | `{ start: string; end: string }` |  |  |
| `testId` (required) | `string` |  |  |
| `panelRef` | `RefObject<HTMLDivElement \| null>` |  | The scrolled row, for a caller that measures it (the frame's step-down). |
| `children` (required) | `ReactNode` |  |  |

## See also

- [Scrollbar](scrollbar.md): A persistent scrollbar for a virtual document viewport, with a proportional thumb, dragging, track clicks and keyboard navigation.
- [Ribbon](ribbon.md): Office-style command groups: large and small buttons, stacks, rows, and swatches; it collapses to Single line, and a ribbon too wide for its window gives way in steps (RibbonFit): small buttons, icons alone, then groups collapsed to one button each.
- [StatusBar](status-bar.md): The bottom bar: document facts on the left, zoom on the right.
- [TableSizePicker](table-size-picker.md): Pick a table size by hovering a grid.
- [Panel parts](panel-parts.md): Pieces of list panels: visibility eyes, in-place rename, footers, thumbnails.
