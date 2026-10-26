import { Button, toast } from '@kition/tessera-ui'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function Demo() {
  return (
    <div className="demo-row">
      <Button onClick={() => toast.info('Row deleted', { action: { label: 'Undo', onClick: () => toast.success('Row restored') } })}>With an action</Button>
      <Button onClick={() => void toast.promise(wait(1500).then(() => 3), { loading: 'Exporting…', success: (count) => `Exported ${count} files`, error: 'Export failed' })}>A promise</Button>
      <Button onClick={() => toast.error('Offline', { id: 'network', duration: Number.POSITIVE_INFINITY, description: 'Changes are kept until you reconnect.' })}>Sticky</Button>
      <Button variant="ghost" onClick={() => toast.dismiss()}>Dismiss all</Button>
    </div>
  )
}
