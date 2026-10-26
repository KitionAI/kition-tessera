import { Tag } from '@kition/tessera'

export default function Demo() {
  return (
    <div className="demo-row">
      <Tag>Draft</Tag>
      <Tag tone="info">Processing</Tag>
      <Tag tone="success">Paid</Tag>
      <Tag tone="warning">Pending</Tag>
      <Tag tone="danger">Failed</Tag>
    </div>
  )
}
