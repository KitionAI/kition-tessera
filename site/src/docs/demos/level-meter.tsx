import { useEffect, useState } from 'react'
import { LevelMeter } from '@kition/tessera'

export default function Demo() {
  const [peaks, setPeaks] = useState([-12, -9])
  useEffect(() => {
    const timer = setInterval(() => setPeaks([-6 - Math.random() * 30, -4 - Math.random() * 30]), 100)
    return () => clearInterval(timer)
  }, [])
  return (
    <div style={{ height: 180 }}>
      <LevelMeter peaks={peaks} labels={['L', 'R']} />
    </div>
  )
}
