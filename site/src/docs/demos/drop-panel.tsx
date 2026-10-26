import { useRef, useState } from 'react'
import { Button, DropPanel, NumberField } from '@kition/tessera-ui'

export default function Demo() {
  const anchor = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [radius, setRadius] = useState(8)
  return (
    <span ref={anchor}>
      <Button onClick={() => setOpen(!open)}>Corner radius ▾</Button>
      <DropPanel open={open} anchor={anchor} onClose={() => setOpen(false)} label="Corner radius">
        <div style={{ padding: 12, width: 220 }}>
          <NumberField label="Radius" value={radius} min={0} max={64} unit="px" onChange={(value) => setRadius(value)} />
        </div>
      </DropPanel>
    </span>
  )
}
