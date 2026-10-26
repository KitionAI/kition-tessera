import { useState } from 'react'
import { Alert, Button } from '@kition/tessera'

export default function Demo() {
  const [shown, setShown] = useState(true)
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <Alert title="Password sign-in is turned off" description="People sign in with GitHub or Google until you turn it back on." />
      <Alert tone="success" title="Credits added" />
      <Alert tone="warning" title="Your plan renews in 3 days" action={<Button size="sm">Manage</Button>} />
      {shown ? <Alert tone="danger" title="The last payment failed" description="Update the card to keep syncing." onClose={() => setShown(false)} /> : null}
    </div>
  )
}
