import { useState } from 'react'
import { Button, Field, Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, TextInput } from '@kition/tessera'

export default function Demo() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Quarterly plan')
  return (
    <>
      <Button variant="secondary" size="md" onClick={() => setOpen(true)}>Rename…</Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>Rename document</ModalTitle>
            <ModalDescription>The name shows in the tab and the file tree.</ModalDescription>
          </ModalHeader>
          <Field label="Name">{({ id }) => <TextInput id={id} size="lg" value={name} onChange={(event) => setName(event.target.value)} />}</Field>
          <ModalFooter>
            <Button variant="secondary" size="md" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={() => setOpen(false)}>Rename</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
