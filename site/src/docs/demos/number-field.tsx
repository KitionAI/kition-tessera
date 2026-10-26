import { useState } from 'react'
import { NumberField } from '@kition/tessera-ui'

export default function Demo() {
  const [opacity, setOpacity] = useState(80)
  const [angle, setAngle] = useState(15)
  return (
    <div className="demo-stack">
      <NumberField label="Opacity" value={opacity} min={0} max={100} unit="%" onChange={(value) => setOpacity(value)} />
      <NumberField label="Angle" value={angle} min={-180} max={180} step={1} unit="°" onChange={(value) => setAngle(value)} />
    </div>
  )
}
