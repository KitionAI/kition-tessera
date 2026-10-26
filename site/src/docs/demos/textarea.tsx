import { useState } from 'react'
import { Textarea } from '@kition/tessera-ui'

export default function Demo() {
  const [note, setNote] = useState('Grows as you type, up to five lines.')
  return (
    <div className="demo-stack">
      <Textarea rows={3} placeholder="Describe the change for the agent…" />
      <Textarea aria-label="Note" autoSize={{ minRows: 2, maxRows: 5 }} value={note} onChange={(event) => setNote(event.target.value)} />
    </div>
  )
}
