import { Button, toast } from '@kition/tessera'

// Render <Toaster /> once near the root of the editor; toast() can then be called from anywhere.
export default function Demo() {
  return (
    <div className="demo-row">
      <Button onClick={() => toast('success', 'Saved', 'Budget 2027.xlsx')}>Success</Button>
      <Button onClick={() => toast('info', 'Agent is working', 'Rewriting slide 3')}>Info</Button>
      <Button onClick={() => toast('error', 'Could not save', 'The disk is full')}>Error</Button>
    </div>
  )
}
