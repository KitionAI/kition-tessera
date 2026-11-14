import { useState } from 'react'
import { KeyframeLane, type Keyframe } from '@kition/tessera-ui'

export default function Demo() {
  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    { id: 'a', time: 1 },
    { id: 'b', time: 3.5, interpolation: 'bezier' },
    { id: 'c', time: 6, interpolation: 'hold' },
  ])
  return (
    <div style={{ width: 360 }}>
      <KeyframeLane
        keyframes={keyframes}
        start={0}
        end={8}
        onSelect={(ids) => setKeyframes((list) => list.map((key) => ({ ...key, selected: ids.includes(key.id) })))}
        onMove={(ids, delta) => setKeyframes((list) => list.map((key) => (ids.includes(key.id) ? { ...key, time: Math.max(0, key.time + delta) } : key)))}
      />
    </div>
  )
}
