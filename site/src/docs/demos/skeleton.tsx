import { Skeleton } from '@kition/tessera'

export default function Demo() {
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <Skeleton width={180} height={20} />
      <Skeleton lines={3} />
    </div>
  )
}
