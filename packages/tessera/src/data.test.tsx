// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { Alert, Breadcrumb, Descriptions, Empty, Pagination, Result, Table, Tag, pageList, valueAt, type TableColumn } from './data'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let host: HTMLElement | null = null

function render(node: React.ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() => root!.render(node))
  return host
}

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = null
  host = null
})

type Row = { id: number; name: string; plan: { tier: string } }
const rows: Row[] = Array.from({ length: 25 }, (_, index) => ({ id: index + 1, name: `User ${index + 1}`, plan: { tier: index % 2 ? 'pro' : 'free' } }))
const columns: TableColumn<Row>[] = [
  { key: 'name', title: 'Name', dataIndex: 'name', width: 160, fixed: 'left' },
  { key: 'tier', title: 'Tier', dataIndex: ['plan', 'tier'], render: (tier: string) => <Tag tone={tier === 'pro' ? 'success' : 'neutral'}>{tier}</Tag> },
  { key: 'id', title: 'ID', dataIndex: 'id', align: 'right' },
]

const bodyRows = (out: HTMLElement) => [...out.querySelectorAll('tbody tr')].map((row) => [...row.querySelectorAll('td')].map((cell) => cell.textContent))

describe('Table', () => {
  it('shows a page of records through their columns, nested fields and renders included', () => {
    const out = render(<Table columns={columns} dataSource={rows} rowKey="id" pagination={{ defaultPageSize: 10 }} />)
    expect([...out.querySelectorAll('th')].map((cell) => cell.textContent)).toEqual(['Name', 'Tier', 'ID'])
    expect(bodyRows(out)).toHaveLength(10)
    expect(bodyRows(out)[1]).toEqual(['User 2', 'pro', '2'])
    expect(out.querySelector('tbody .kui-tag')?.getAttribute('data-tone')).toBe('neutral')
    expect((out.querySelector('td[data-fixed="left"]') as HTMLElement).style.left).toBe('0px')
    expect(out.querySelector('.kui-pagination-range')?.textContent).toBe('1–10 of 25')
  })

  it('turns pages and changes the page size', () => {
    const out = render(<Table columns={columns} dataSource={rows} rowKey="id" pagination={{ defaultPageSize: 10, showSizeChanger: true }} />)
    act(() => (out.querySelector('[aria-label="Page 3"]') as HTMLButtonElement).click())
    expect(bodyRows(out).map((row) => row[0])).toEqual(['User 21', 'User 22', 'User 23', 'User 24', 'User 25'])
    const size = out.querySelector('.kui-pagination select') as HTMLSelectElement
    act(() => {
      size.value = '50'
      size.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(bodyRows(out)).toHaveLength(25)
    expect(out.querySelector('.kui-pagination')).toBeNull()
  })

  it('shows every row without pagination, the empty text without rows, and a spinner while loading', () => {
    expect(bodyRows(render(<Table columns={columns} dataSource={rows} rowKey="id" pagination={false} />))).toHaveLength(25)
    act(() => root!.render(<Table columns={columns} dataSource={[]} rowKey="id" emptyText="No users yet" />))
    expect(host!.querySelector('.kui-table-empty')?.textContent).toBe('No users yet')
    act(() => root!.render(<Table columns={columns} dataSource={undefined} rowKey="id" loading />))
    expect(host!.querySelector('.kui-table-loading [role="status"]')).not.toBeNull()
    expect(host!.querySelector('.kui-table-scroll')?.getAttribute('aria-busy')).toBe('true')
  })

  it('reads nested values by path', () => {
    expect(valueAt({ a: { b: [1, 2] } }, ['a', 'b', 1])).toBe(2)
    expect(valueAt({ a: 1 }, 'a')).toBe(1)
    expect(valueAt(null, 'a')).toBeUndefined()
  })
})

describe('Pagination', () => {
  it('lists the first, last, and neighbouring pages with gaps', () => {
    expect(pageList(1, 1)).toEqual([1])
    expect(pageList(1, 4)).toEqual([1, 2, 3, 4])
    expect(pageList(6, 12)).toEqual([1, 'gap', 5, 6, 7, 'gap', 12])
    expect(pageList(3, 12)).toEqual([1, 2, 3, 4, 'gap', 12])
  })

  it('disables the steps at either end and marks the current page', () => {
    const out = render(<Pagination page={1} pageSize={10} total={30} onChange={() => undefined} />)
    expect((out.querySelector('[aria-label="Previous page"]') as HTMLButtonElement).disabled).toBe(true)
    expect(out.querySelector('[aria-current="page"]')?.textContent).toBe('1')
  })
})

describe('display', () => {
  it('draws alerts in their tone with an optional close', () => {
    let closed = false
    const out = render(<Alert tone="danger" title="Payment failed" description="Card declined" onClose={() => (closed = true)} />)
    const alert = out.querySelector('.kui-alert')!
    expect(alert.getAttribute('role')).toBe('alert')
    expect(alert.getAttribute('data-tone')).toBe('danger')
    act(() => (out.querySelector('.kui-alert-close') as HTMLButtonElement).click())
    expect(closed).toBe(true)
  })

  it('draws empty states, results, breadcrumbs, and descriptions', () => {
    const out = render(
      <>
        <Empty />
        <Result status="notFound" title="Page not found" />
        <Breadcrumb items={[{ title: <a href="/users">Users</a> }, { title: 'Ada' }]} />
        <Descriptions columns={2} items={[{ label: 'Email', children: 'ada@example.com' }, { label: 'Notes', children: '—', span: 4 }]} />
      </>,
    )
    expect(out.querySelector('.kui-empty-title')?.textContent).toBe('No data')
    expect(out.querySelector('.kui-result h2')?.textContent).toBe('Page not found')
    expect(out.querySelector('.kui-breadcrumb [aria-current="page"]')?.textContent).toBe('Ada')
    const items = out.querySelectorAll<HTMLElement>('.kui-descriptions-item')
    expect(items[0].textContent).toBe('Emailada@example.com')
    expect(items[1].style.gridColumn).toBe('span 2')
  })
})
