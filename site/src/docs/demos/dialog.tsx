import { useState } from 'react'
import { Button, Dialog, NumberField } from '@kition/tessera-ui'

export default function Demo() {
  const [open, setOpen] = useState(false)
  const [width, setWidth] = useState(1920)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Image size…</Button>
      {open ? (
        <Dialog
          title="Image size"
          onClose={() => setOpen(false)}
          actions={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setOpen(false)}>OK</Button>
            </>
          }
        >
          <NumberField label="Width" value={width} min={1} max={10000} unit="px" onChange={(value) => setWidth(value)} />
        </Dialog>
      ) : null}
    </>
  )
}
