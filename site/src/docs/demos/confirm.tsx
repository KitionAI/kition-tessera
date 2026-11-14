import { useState } from 'react'
import { Button, ConfirmProvider, useConfirm } from '@kition/tessera-ui'

function DeleteButton() {
  const confirm = useConfirm()
  const [result, setResult] = useState('')
  return (
    <div className="demo-row">
      <Button
        variant="danger"
        size="md"
        onClick={async () => {
          const ok = await confirm({ title: 'Delete this table?', message: 'Its 240 records go to the trash for 30 days.', confirmLabel: 'Delete', variant: 'danger' })
          setResult(ok ? 'Deleted' : 'Kept')
        }}
      >
        Delete table
      </Button>
      <span>{result}</span>
    </div>
  )
}

export default function Demo() {
  return (
    <ConfirmProvider>
      <DeleteButton />
    </ConfirmProvider>
  )
}
