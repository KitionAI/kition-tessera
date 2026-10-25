import { useState } from 'react'
import { GradientSlider, SLIDER_GRADIENTS } from '@kition/tessera'

export default function Demo() {
  const [temperature, setTemperature] = useState(10)
  const [tint, setTint] = useState(-5)
  return (
    <div className="demo-stack" style={{ width: 300 }}>
      <GradientSlider label="Temperature" value={temperature} min={-100} max={100} stops={SLIDER_GRADIENTS.temperature} onChange={(value) => setTemperature(value)} />
      <GradientSlider label="Tint" value={tint} min={-100} max={100} stops={SLIDER_GRADIENTS.tint} onChange={(value) => setTint(value)} />
    </div>
  )
}
