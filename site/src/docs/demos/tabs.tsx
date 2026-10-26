import { Segmented, Tabs } from '@kition/tessera'
import { useState } from 'react'

export default function Demo() {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d')
  return (
    <Tabs
      extra={<Segmented label="Range" value={range} onChange={setRange} segments={[{ value: '24h', label: '24h' }, { value: '7d', label: '7d' }, { value: '30d', label: '30d' }]} />}
      items={[
        { key: 'usage', label: 'Usage', children: `Generations in the last ${range}.` },
        { key: 'ledger', label: 'Credit ledger', children: 'Every credit added and spent.' },
        { key: 'keys', label: 'API keys', children: 'Keys this account created.' },
        { key: 'audit', label: 'Audit log', disabled: true },
      ]}
    />
  )
}
