import { useState } from 'react'
import { EyeButton, PanelFooter, RenameField } from '@kition/tessera-ui'

export default function Demo() {
  const [visible, setVisible] = useState(true)
  const [name, setName] = useState('Background')
  const [editing, setEditing] = useState(false)
  return (
    <div className="demo-frame" style={{ width: 280 }}>
      <div className="demo-layer-row">
        <EyeButton visible={visible} label={`Show ${name}`} onPress={() => setVisible(!visible)} />
        {editing ? (
          <RenameField value={name} label="Layer name" onChange={setName} onDone={() => setEditing(false)} />
        ) : (
          <span onDoubleClick={() => setEditing(true)}>{name}</span>
        )}
      </div>
      <PanelFooter start={<span>1 layer</span>} end={<span>Double-click to rename</span>} />
    </div>
  )
}
