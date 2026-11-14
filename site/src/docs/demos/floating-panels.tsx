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
