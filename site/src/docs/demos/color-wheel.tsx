import { useState } from 'react'
import { ColorWheel } from '@kition/tessera'

export default function Demo() {
  const [shadows, setShadows] = useState<[number, number]>([0.2, -0.1])
  const [lightness, setLightness] = useState(0)
  return <ColorWheel label="Shadows" value={shadows} lightness={lightness} onChange={(value) => setShadows(value)} onLightness={(value) => setLightness(value)} />
}
