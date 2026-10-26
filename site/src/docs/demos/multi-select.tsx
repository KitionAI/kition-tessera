import { useState } from 'react'
import { MultiSelect } from '@kition/tessera-ui'

const MODES = ['free', 'reward', 'paid', 'hosted'].map((value) => ({ value, label: value }))

export default function Demo() {
  const [modes, setModes] = useState(['paid', 'hosted'])
  return (
    <div style={{ maxWidth: 280 }}>
      <MultiSelect label="Mode" placeholder="Any mode" size="md" values={modes} onChange={setModes} options={MODES} />
    </div>
  )
}
