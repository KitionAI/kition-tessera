# FloatingPanels

Movable, resizable windows over the workspace, remembered per kit.

Category: Workspace · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/floating-panels/)

```ts
import { FloatingPanels } from '@kition/tessera-ui'
```

## Example: A floating bin

```tsx
import { useState } from 'react'
import { Button, FloatingPanels } from '@kition/tessera-ui'

export default function Demo() {
  const [open, setOpen] = useState<string[]>(['bin'])
  const [focused, setFocused] = useState<string | null>('bin')
  return (
    <div style={{ position: 'relative', height: 300 }}>
      <Button onClick={() => setOpen(['bin'])}>Open the bin</Button>
      <FloatingPanels
        kit="tessera-docs"
        store="floating"
        panels={open.map((id) => ({ id, title: 'Bin: Interviews', render: () => <div className="demo-pane">12 clips</div> }))}
        onClose={(id) => setOpen(open.filter((item) => item !== id))}
        focused={focused}
        onFocus={setFocused}
        defaultSize={{ width: 280, height: 180 }}
      />
    </div>
  )
}
```

## FloatingPanels props

The floating windows layer (see the module's comment). Render it inside an element with a
non-static `position` (`relative`) that covers the area the windows may use: the layer fills
that element and keeps every window inside it.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `kit` (required) | `string` |  |  |
| `store` (required) | `string` |  | Store name for positions and sizes (`useKitStore`). It holds the windows' rectangles only: anything else under it is dropped on read, so a kit keeps its own list of open windows under a different name. |
| `panels` (required) | `readonly FloatingPanel[]` |  | The open windows, bottom to top as first opened. Keep the array and each `render` stable (`useMemo`, `useCallback`). |
| `onClose` (required) | `(id: string) => void` |  |  |
| `focused` (required) | `string \| null` |  | The window the kit treats as focused (drawn as such and raised); null for none. |
| `onFocus` (required) | `(id: string) => void` |  | A press or focus inside a window. |
| `defaultSize` | `FloatingSize` |  | A new window's size (upstream's `default_size`, 520 × 360). |
| `minSize` | `FloatingSize` |  | The smallest a window resizes to (upstream's `min_size`, 320 × 220). |
| `testId` | `string` |  |  |

## See also

- [WorkspaceLayout](workspace-layout.md): Split, tabbed, resizable panels in a tree, as video and photo editors lay out their workspaces.
- [DockArea](dock-area.md): A column of collapsible, resizable panel groups, remembered per kit.
