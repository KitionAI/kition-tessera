import { Button } from '@kition/tessera'

export default function Demo() {
  return (
    <div className="demo-row">
      <Button variant="primary" size="md">Save</Button>
      <Button variant="secondary" size="md">Cancel</Button>
      <Button variant="ghost" size="md">More</Button>
      <Button variant="danger" size="md">Delete</Button>
      <Button size="md" disabled>Disabled</Button>
    </div>
  )
}
