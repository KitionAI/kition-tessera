import { Button, Card, CardContent, CardHeader } from '@kition/tessera'

export default function Demo() {
  return (
    <Card style={{ maxWidth: 360 }}>
      <CardHeader>
        <strong>Model</strong>
        <Button size="sm">Change</Button>
      </CardHeader>
      <CardContent>Claude Opus · 1,240 credits this month</CardContent>
    </Card>
  )
}
