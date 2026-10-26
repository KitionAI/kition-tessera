import { Badge } from '@kition/tessera'

export default function Demo() {
  return (
    <div className="demo-row">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        Grid view <Badge>128</Badge>
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        AI fields <Badge>Beta</Badge>
      </span>
    </div>
  )
}
