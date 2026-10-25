import { useState } from 'react'
import { Switch } from '@kition/tessera'

export default function Demo() {
  const [sync, setSync] = useState(true)
  return (
    <div className="demo-stack">
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
        <Switch checked={sync} onCheckedChange={setSync} aria-label="Sync across devices" /> Sync across devices: {sync ? 'on' : 'off'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--kit-text-muted)' }}>
        <Switch disabled aria-label="Beta features" /> Beta features (unavailable)
      </label>
    </div>
  )
}
