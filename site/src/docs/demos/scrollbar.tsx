import { useState } from 'react'
import { Scrollbar } from '@kition/tessera-ui'

export default function Demo() {
  const [offset, setOffset] = useState(0)
  return (
    <div style={{ display: 'flex', height: 200, width: 300, border: '1px solid var(--kit-border)' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ transform: `translateY(${-offset}px)` }}>
          {Array.from({ length: 20 }, (_, index) => <div key={index} style={{ height: 40, paddingLeft: 12 }}>Page section {index + 1}</div>)}
        </div>
      </div>
      <Scrollbar label="Page sections" value={offset} max={600} page={200} onChange={setOffset} />
    </div>
  )
}
