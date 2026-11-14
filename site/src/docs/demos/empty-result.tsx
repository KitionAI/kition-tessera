import { Button, Empty, Result } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Empty title="No feedback yet" description="Messages people send from the app arrive here.">
        <Button size="sm">Refresh</Button>
      </Empty>
      <Result status="forbidden" title="Access denied" description="Your account cannot open the admin console." extra={<Button size="sm" variant="primary">Sign in again</Button>} />
    </div>
  )
}
