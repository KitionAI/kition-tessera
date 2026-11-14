# Panel parts

Pieces of list panels: visibility eyes, in-place rename, footers, thumbnails.

Category: Editor chrome · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/panel-parts/)

```ts
import { EyeButton, RenameField, PanelFooter, Thumbnail, Panel } from '@kition/tessera-ui'
```

## When to use

- Layers, tracks, pages panels.

## Example: A layer row

```tsx
import { useState } from 'react'
import { EyeButton, PanelFooter, RenameField } from '@kition/tessera-ui'

export default function Demo() {
  const [visible, setVisible] = useState(true)
  const [name, setName] = useState('Background')
  const [editing, setEditing] = useState(false)
  return (
    <div className="demo-frame" style={{ width: 280 }}>
      <div className="demo-layer-row">
        <EyeButton visible={visible} label={`Show ${name}`} onPress={() => setVisible(!visible)} />
        {editing ? (
          <RenameField value={name} label="Layer name" onChange={setName} onDone={() => setEditing(false)} />
        ) : (
          <span onDoubleClick={() => setEditing(true)}>{name}</span>
        )}
      </div>
      <PanelFooter start={<span>1 layer</span>} end={<span>Double-click to rename</span>} />
    </div>
  )
}
```

## EyeButton props

A row's eye: the eye icon while shown, an empty box while hidden (as Photoshop draws it).
A press toggles at once (`onPress` hears whether Alt was held); with `sweep`, dragging on from
the press down the eye column (mouse, pen, or touch) reaches every other eye of the group the
pointer crosses, through `sweep.onOver`, so the panel gives each the visibility the first press
set. A keyboard click toggles too. It is pressed while its row shows; `tabIndex` takes it out of
the tab order where a list moves the focus itself.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `visible` (required) | `boolean` |  |  |
| `label` (required) | `string` |  |  |
| `onPress` (required) | `(alt: boolean) => void` |  |  |
| `sweep` | `EyeSweep` |  |  |
| `tabIndex` | `number` |  |  |
| `testId` | `string` |  |  |

## RenameField props

A row name's in-place editor, focused with its text selected: Enter or leaving it commits,
Escape cancels (`onDone` once, with which); a composing input method keeps Enter for itself.
It keeps its presses and keys from the row (no selection change, no editor shortcut).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` (required) | `string` |  |  |
| `label` (required) | `string` |  |  |
| `onChange` (required) | `(text: string) => void` |  |  |
| `onDone` (required) | `(commit: boolean) => void` |  |  |
| `testId` | `string` |  |  |

## PanelFooter props

The buttons along a list panel's bottom, as Photoshop's: `start` on the left, `end` on the right.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `start` | `ReactNode` |  |  |
| `end` | `ReactNode` |  |  |

## Thumbnail props

A thumbnail: `image` fitted in a `size` × `size` cell at its own aspect, over a checkerboard
where it is transparent, with a thin frame; an empty cell while there is no image (not drawn
yet, or its source could not draw one).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `image` (required) | `ThumbnailImage \| null` |  |  |
| `size` (required) | `number` |  |  |
| `testId` | `string` |  |  |

## Panel props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `side` (required) | `'left' \| 'right'` |  |  |
| `width` (required) | `number` |  |  |
| `title` | `string` |  |  |
| `children` (required) | `ReactNode` |  |  |
| `testId` | `string` |  |  |

## See also

- [Scrollbar](scrollbar.md): A persistent scrollbar for a virtual document viewport, with a proportional thumb, dragging, track clicks and keyboard navigation.
- [Ribbon](ribbon.md): Office-style command groups: large and small buttons, stacks, rows, and swatches; it collapses to Single line, and a ribbon too wide for its window gives way in steps (RibbonFit): small buttons, icons alone, then groups collapsed to one button each.
- [OverflowStrip](overflow-strip.md): A row that scrolls sideways when it does not fit: the cut edge fades, and a button there scrolls.
- [StatusBar](status-bar.md): The bottom bar: document facts on the left, zoom on the right.
- [TableSizePicker](table-size-picker.md): Pick a table size by hovering a grid.
