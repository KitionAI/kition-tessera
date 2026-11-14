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
