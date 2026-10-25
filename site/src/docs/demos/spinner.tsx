import { Spinner } from '@kition/tessera'

export default function Demo() {
  return (
    <div className="demo-row">
      <Spinner />
      <Spinner size={24} label="Loading the workspace" />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--kit-text-muted)' }}>
        <Spinner size={14} /> Syncing…
      </span>
    </div>
  )
}
