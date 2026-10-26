import { useState } from 'react'
import { Button, Field, Sheet, TextInput } from '@kition/tessera-ui'

export default function Demo() {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('Status')
  const [saved, setSaved] = useState('Status')
  const dirty = label !== saved
  return (
    <>
      <Button variant="secondary" size="md" onClick={() => setOpen(true)}>Edit field…</Button>
      <Sheet
        open={open}
        title="Edit field"
        dirty={dirty}
        onRequestClose={() => {
          if (window.confirm('Discard your changes?')) {
            setLabel(saved)
            setOpen(false)
          }
        }}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setOpen(false)}>Close</Button>
            <Button variant="primary" size="md" disabled={!dirty} onClick={() => setSaved(label)}>Save</Button>
          </>
        }
      >
        <Field label="Field name">{({ id }) => <TextInput id={id} size="lg" value={label} onChange={(event) => setLabel(event.target.value)} />}</Field>
      </Sheet>
    </>
  )
}
