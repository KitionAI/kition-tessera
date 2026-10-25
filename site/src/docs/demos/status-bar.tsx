import { useState } from 'react'
import { StatusBar, StatusSpacer, ZoomControl } from '@kition/tessera'

export default function Demo() {
  const [zoom, setZoom] = useState(1)
  return (
    <div className="demo-frame">
      <StatusBar>
        <span>Slide 3 of 12</span>
        <StatusSpacer />
        <ZoomControl zoom={zoom} onZoom={setZoom} onFit={() => setZoom(1)} labels={{ out: 'Zoom out', in: 'Zoom in', fit: 'Fit' }} />
      </StatusBar>
    </div>
  )
}
