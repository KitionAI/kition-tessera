import { Button } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div className="demo-row">
      <Button variant="primary" size="md">Save</Button>
      <Button variant="secondary" size="md">Cancel</Button>
      <Button variant="subtle" size="md">Duplicate</Button>
      <Button variant="ghost" size="md">More</Button>
      <Button variant="danger" size="md">Delete</Button>
      <Button variant="danger-outline" size="md">Disable</Button>
      <Button variant="primary" size="md" disabled>Disabled</Button>
    </div>
  )
}
