import { useState } from 'react'
import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@kition/tessera-ui'

export default function Demo() {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  return (
    <>
      <Button variant="secondary" size="md" onClick={() => setOpen(true)}>Import file…</Button>
      <Modal open={open} onOpenChange={(next) => (running ? undefined : setOpen(next))}>
        <ModalContent size="xl" fixed hideClose>
          <ModalHeader>
            <ModalTitle>Import a file</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {Array.from({ length: 24 }, (_, i) => (
              <p key={i} style={{ margin: 0, fontSize: 14 }}>Column {i + 1}: text</p>
            ))}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="md" disabled={running} onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="md"
              loading={running}
              onClick={() => {
                setRunning(true)
                setTimeout(() => {
                  setRunning(false)
                  setOpen(false)
                }, 1200)
              }}
            >
              Import
            </Button>
          </ModalFooter>
          <ModalCloseButton disabled={running} />
        </ModalContent>
      </Modal>
    </>
  )
}
