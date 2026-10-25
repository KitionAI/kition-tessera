import { useState } from 'react'
import { CurveEditor, RGB_IDENTITY, type CurvePoint } from '@kition/tessera'

export default function Demo() {
  const [points, setPoints] = useState<CurvePoint[]>([RGB_IDENTITY[0], [0.3, 0.22], [0.7, 0.8], RGB_IDENTITY[1]])
  return (
    <div style={{ width: 240 }}>
      <CurveEditor kind="rgb" points={points} onChange={(next) => setPoints(next)} />
    </div>
  )
}
