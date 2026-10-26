import { Table, Tag, type TableColumn } from '@kition/tessera'

type Order = { id: string; customer: string; plan: string; amount: number; status: 'paid' | 'pending' | 'refunded' }

const ORDERS: Order[] = Array.from({ length: 23 }, (_, index) => ({
  id: `ord_${1040 + index}`,
  customer: ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson'][index % 4],
  plan: index % 3 ? 'Pro' : 'Team',
  amount: 19 + (index % 5) * 10,
  status: (['paid', 'pending', 'refunded'] as const)[index % 3],
}))

const TONES = { paid: 'success', pending: 'warning', refunded: 'neutral' } as const

const columns: TableColumn<Order>[] = [
  { key: 'id', title: 'Order', dataIndex: 'id', width: 120, fixed: 'left' },
  { key: 'customer', title: 'Customer', dataIndex: 'customer', ellipsis: true },
  { key: 'plan', title: 'Plan', dataIndex: 'plan', width: 90 },
  { key: 'amount', title: 'Amount', dataIndex: 'amount', align: 'right', width: 100, render: (amount: number) => `$${amount}.00` },
  { key: 'status', title: 'Status', dataIndex: 'status', width: 110, render: (status: Order['status']) => <Tag tone={TONES[status]}>{status}</Tag> },
]

export default function Demo() {
  return <Table columns={columns} dataSource={ORDERS} rowKey="id" size="small" pagination={{ defaultPageSize: 8, showSizeChanger: true, pageSizeOptions: [8, 16, 32] }} />
}
