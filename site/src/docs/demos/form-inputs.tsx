import { useState } from 'react'
import { Button, DateTimeInput, NumberInput, Popconfirm, toast } from '@kition/tessera'

export default function Demo() {
  const [price, setPrice] = useState<number | null>(0.25)
  const [start, setStart] = useState<string | null>('2026-10-25T09:00')
  return (
    <div className="demo-row" style={{ alignItems: 'flex-end' }}>
      <label style={{ display: 'grid', gap: 6 }}>
        Price per call
        <NumberInput value={price} onChange={setPrice} min={0} step={0.05} precision={2} style={{ width: 140 }} />
      </label>
      <label style={{ display: 'grid', gap: 6 }}>
        From
        <DateTimeInput withTime value={start} onChange={setStart} />
      </label>
      <Popconfirm title="Delete this pricing rule?" description="Calls are charged by the default rule afterwards." danger okText="Delete" onConfirm={() => toast('success', 'Rule deleted')}>
        <Button variant="danger">Delete rule</Button>
      </Popconfirm>
    </div>
  )
}
