import { useState } from 'react'
import { DockArea } from '@kition/tessera'

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
