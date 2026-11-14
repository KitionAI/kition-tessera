# Ribbon

Office-style command groups: large and small buttons, stacks, rows, and swatches; it collapses to Single line, and a ribbon too wide for its window gives way in steps (RibbonFit): small buttons, icons alone, then groups collapsed to one button each.

Category: Editor chrome · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/ribbon/)

```ts
import { RibbonGroup, RibbonButton, RibbonStack, RibbonRow, RibbonItem, ColorGrid } from '@kition/tessera-ui'
```

## When to use

- A kit’s Home, Insert, Format tabs.

## Example: Home tab

Give each group an icon: it is the button the group collapses to when the ribbon has no room.

```tsx
import { useState } from 'react'
import { ColorGrid, MenuButton, RibbonButton, RibbonGroup, RibbonStack } from '@kition/tessera-ui'
import { BoldIcon, ClipboardPasteIcon, CopyIcon, ItalicIcon, LayersIcon, ScissorsIcon, SquareIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [bold, setBold] = useState(false)
  const [fill, setFill] = useState('#5645d4')
  return (
    <div className="demo-ribbon">
      <RibbonGroup label="Clipboard">
        <RibbonButton icon={ClipboardPasteIcon} label="Paste" size="large" />
        <RibbonStack>
          <RibbonButton icon={ScissorsIcon} label="Cut" />
          <RibbonButton icon={CopyIcon} label="Copy" />
        </RibbonStack>
      </RibbonGroup>
      <RibbonGroup label="Font">
        <RibbonStack>
          <RibbonButton icon={BoldIcon} label="Bold" size="icon" pressed={bold} onClick={() => setBold(!bold)} />
          <RibbonButton icon={ItalicIcon} label="Italic" size="icon" />
        </RibbonStack>
      </RibbonGroup>
      <RibbonGroup label="Fill">
        <MenuButton trigger={({ toggle }) => <RibbonButton icon={SquareIcon} label="Fill" swatch={fill} onClick={toggle} />}>
          <ColorGrid onPick={setFill} />
        </MenuButton>
      </RibbonGroup>
      <RibbonGroup label="Arrange">
        <RibbonButton icon={LayersIcon} label="Layers" size="large" />
      </RibbonGroup>
    </div>
  )
}
```

## RibbonGroup props

A ribbon group. With an `id` (`group:<tab>/<group>`, or an engine menu path `menu:<Menu>/<Group>`
for groups built from commands) it follows the UI configuration and ends with the host's
buttons for it. In Single line it shows its primary items and a popover with the rest; `icon`
marks the one button a group without primary items becomes there, and the button a Classic
group collapses to when the ribbon has no room for it (`RibbonFit`).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `label` (required) | `string` |  |  |
| `icon` | `IconComponent` |  |  |
| `children` (required) | `ReactNode` |  |  |

## RibbonButton props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | `IconComponent` |  |  |
| `label` (required) | `string` |  |  |
| `size` | `'large' \| 'small' \| 'icon'` | `'small'` |  |
| `pressed` | `boolean` |  |  |
| `swatch` | `string` |  | A colored mark under the icon (font color, fill). |
| `primary` | `boolean` |  | Shown in Single line's row (small); the group's other items wait in its popover. |
| `lineLabel` | `boolean` |  | In Single line's row, keep the label beside the icon; a primary item with an icon otherwise shows the icon alone there (its label stays its name and tooltip). |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## RibbonStack props

Small buttons stacked in up to three rows; in a Single line group, its primary buttons in the row.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` |  |  |

## RibbonRow props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` |  |  |

## RibbonItem props

Any content in a ribbon group that is not a ribbon button (a field, a gallery): `primary` shows
it in Single line's row too; otherwise it waits in the group's popover there.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `primary` | `boolean` |  |  |
| `children` (required) | `ReactNode` |  |  |

## ColorGrid props

A grid of color swatches; `onPick` gets `#RRGGBB`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `colors` | `readonly string[]` | `[...PALETTE_COLORS, ...STANDARD_COLORS]` |  |
| `onPick` (required) | `(color: string) => void` |  |  |
| `testId` | `string` |  |  |

## See also

- [Scrollbar](scrollbar.md): A persistent scrollbar for a virtual document viewport, with a proportional thumb, dragging, track clicks and keyboard navigation.
- [OverflowStrip](overflow-strip.md): A row that scrolls sideways when it does not fit: the cut edge fades, and a button there scrolls.
- [StatusBar](status-bar.md): The bottom bar: document facts on the left, zoom on the right.
- [TableSizePicker](table-size-picker.md): Pick a table size by hovering a grid.
- [Panel parts](panel-parts.md): Pieces of list panels: visibility eyes, in-place rename, footers, thumbnails.
