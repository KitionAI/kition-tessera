# DockArea

A column of collapsible, resizable panel groups, remembered per kit.

Category: Workspace · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/dock-area/)

```ts
import { DockArea } from '@kition/tessera-ui'
```

## Example: Right dock

```tsx
import { useState } from 'react'
import { DockArea } from '@kition/tessera-ui'

export default function Demo() {
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set(['color', 'layers']))
  return (
    <div style={{ height: 320, display: 'flex', justifyContent: 'flex-end' }}>
      <DockArea
        kit="tessera-docs"
        width={260}
        shown={shown}
        onShownChange={setShown}
        groups={[
          { id: 'color', defaultHeight: 140, tabs: [{ id: 'color', label: 'Color', render: () => <div className="demo-pane">Color</div> }, { id: 'swatches', label: 'Swatches', render: () => <div className="demo-pane">Swatches</div> }] },
          { id: 'layers', defaultHeight: 160, tabs: [{ id: 'layers', label: 'Layers', render: () => <div className="demo-pane">Layers</div> }] },
        ]}
      />
    </div>
  )
}
```

## DockArea props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `kit` (required) | `string` |  | Remembers the layout per kit, in the kit's store (`kit:<kit>:dock`, see `kitStore`). |
| `groups` (required) | `readonly DockGroup[]` |  |  |
| `shown` (required) | `ReadonlySet<string>` |  | Groups the Window menu shows; others are not drawn. |
| `onShownChange` | `(shown: ReadonlySet<string>) => void` |  |  |
| `width` | `number` |  |  |
| `handle` | `Ref<DockAreaHandle>` |  | Receives the dock's `DockAreaHandle`. |
| `testId` | `string` | `'dock'` |  |

## See also

- [WorkspaceLayout](workspace-layout.md): Split, tabbed, resizable panels in a tree, as video and photo editors lay out their workspaces.
- [FloatingPanels](floating-panels.md): Movable, resizable windows over the workspace, remembered per kit.
