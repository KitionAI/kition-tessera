import { useState } from 'react'
import { ColorPicker, rgbToHex, type RGB } from '@kition/tessera-ui'

export default function Demo() {
  const [rgb, setRgb] = useState<RGB>([86, 69, 212])
  return (
    <div className="demo-row" style={{ alignItems: 'flex-start' }}>
      <div style={{ width: 240 }}>
        <ColorPicker value={rgb} onChange={(value) => setRgb(value)} />
      </div>
      <div className="demo-swatch" style={{ background: rgbToHex(rgb) }}>{rgbToHex(rgb)}</div>
    </div>
  )
}
