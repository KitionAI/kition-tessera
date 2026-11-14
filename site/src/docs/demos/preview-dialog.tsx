import { useState } from 'react'
import { Button, GradientSlider, PreviewDialog } from '@kition/tessera-ui'

// A dialog whose changes preview live in the document; the kit supplies begin, update and end.
export default function Demo() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(40)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Gaussian Blur…</Button>
      {open ? (
        <PreviewDialog
          title="Gaussian Blur"
          preview={{ begin: () => undefined, update: () => undefined, end: () => undefined, draft: amount }}
          onOk={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          onReset={() => setAmount(40)}
        >
          <GradientSlider label="Radius" value={amount} min={0} max={250} onChange={(value) => setAmount(value)} />
        </PreviewDialog>
      ) : null}
    </>
  )
}
