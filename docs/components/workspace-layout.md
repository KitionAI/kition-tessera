# WorkspaceLayout

Split, tabbed, resizable panels in a tree, as video and photo editors lay out their workspaces.

Category: Workspace · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/workspace-layout/)

```ts
import { WorkspaceLayout } from '@kition/tessera-ui'
```

## Example: Editing workspace

Drag the gutters; drag tabs between groups.

```tsx
import { useState } from 'react'
import { WorkspaceLayout, type WorkspaceNode } from '@kition/tessera-ui'

const START: WorkspaceNode = {
  split: 'row',
  size: { ratio: 0.32 },
  a: { tabs: ['project', 'effects'], active: 0 },
  b: { split: 'column', size: { ratio: 0.6 }, a: { tabs: ['program'], active: 0 }, b: { tabs: ['timeline'], active: 0 } },
}

export default function Demo() {
  const [tree, setTree] = useState(START)
  const [focused, setFocused] = useState<string | null>('program')
  const [maximized, setMaximized] = useState<string | null>(null)
  const panel = (id: string, label: string) => ({ id, label, render: () => <div className="demo-pane">{label}</div> })
  return (
    <div style={{ height: 320 }}>
      <WorkspaceLayout
        tree={tree}
        onTree={setTree}
        panels={[panel('project', 'Project'), panel('effects', 'Effects'), panel('program', 'Program'), panel('timeline', 'Timeline')]}
        focused={focused}
        onFocus={setFocused}
        maximized={maximized}
        onMaximized={setMaximized}
        onRestore={() => setTree(START)}
      />
    </div>
  )
}
```

## WorkspaceLayout props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tree` (required) | `WorkspaceNode` |  |  |
| `onTree` (required) | `(tree: WorkspaceNode) => void` |  |  |
| `panels` (required) | `readonly WorkspacePanel[]` |  | Keep this array, and each panel's `render`, stable across renders (see above). |
| `focused` (required) | `string \| null` |  |  |
| `onFocus` (required) | `(panel: string) => void` |  |  |
| `maximized` (required) | `string \| null` |  | The maximized panel fills the area without changing the tree (upstream `keys.maximized`, the ` and Shift+` keys). The panel menu's Maximize Frame, as upstream, replaces the tree instead. |
| `onMaximized` (required) | `(panel: string \| null) => void` |  |  |
| `onRestore` (required) | `() => void` |  | Restore Workspace in the panel menu. |
| `testId` | `string` |  |  |

## See also

- [DockArea](dock-area.md): A column of collapsible, resizable panel groups, remembered per kit.
- [FloatingPanels](floating-panels.md): Movable, resizable windows over the workspace, remembered per kit.
