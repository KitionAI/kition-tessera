import { useState } from 'react'
import { Button, Empty, Table, type TableColumn } from '@kition/tessera'

type Key = { id: string; name: string }
const columns: TableColumn<Key>[] = [
  { key: 'name', title: 'Name', dataIndex: 'name' },
  { key: 'id', title: 'ID', dataIndex: 'id', width: 160 },
]

export default function Demo() {
  const [loading, setLoading] = useState(false)
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Table columns={columns} dataSource={[]} rowKey="id" emptyText={<Empty title="No API keys" description="Create a key to call the API from your own code."><Button size="sm" variant="primary">Create key</Button></Empty>} />
      <Button size="sm" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500) }}>Load for 1.5s</Button>
      <Table columns={columns} dataSource={[{ id: 'key_1', name: 'Build server' }]} rowKey="id" loading={loading} />
    </div>
  )
}
