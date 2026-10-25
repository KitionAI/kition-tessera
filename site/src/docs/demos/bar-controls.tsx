import { useState } from 'react'
import { BarSeparator, Checkbox, Choice, Hint, Segmented } from '@kition/tessera'
import { TextAlignCenterIcon, TextAlignEndIcon, TextAlignStartIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('start')
  const [snap, setSnap] = useState(true)
  const [mode, setMode] = useState<'normal' | 'multiply' | 'screen'>('normal')
  return (
    <div className="demo-row">
      <Segmented
        label="Alignment"
        value={align}
        onChange={setAlign}
        segments={[
          { value: 'start', icon: TextAlignStartIcon, label: 'Left' },
          { value: 'center', icon: TextAlignCenterIcon, label: 'Center' },
          { value: 'end', icon: TextAlignEndIcon, label: 'Right' },
        ]}
      />
      <BarSeparator />
      <Choice label="Mode" value={mode} onChange={setMode} choices={[['normal', 'Normal'], ['multiply', 'Multiply'], ['screen', 'Screen']]} />
      <Checkbox label="Snap" checked={snap} onChange={setSnap} />
      <Hint>Alt-drag to copy</Hint>
    </div>
  )
}
