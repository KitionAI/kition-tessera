// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { Segmented } from './BarControls'
import { LineChart, niceTicks } from './charts'
import { NavMenu, Tabs } from './navigation'
import { LayersIcon } from '@kition/tessera-icons/react'

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

describe('Tabs', () => {
  it('shows the open tab’s panel and moves with the arrow keys, past disabled tabs', () => {
    const seen: string[] = []
    const out = render(
      <Tabs
        onChange={(key) => seen.push(key)}
        items={[
          { key: 'usage', label: 'Usage', children: 'Usage panel' },
          { key: 'billing', label: 'Billing', children: 'Billing panel', disabled: true },
          { key: 'keys', label: 'API keys', children: 'Keys panel' },
        ]}
      />,
    )
    expect(out.querySelector('[role="tabpanel"]')?.textContent).toBe('Usage panel')
    act(() => out.querySelector('[role="tablist"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(seen).toEqual(['keys'])
    expect(out.querySelector('[aria-selected="true"]')?.textContent).toBe('API keys')
    expect(out.querySelector('[role="tabpanel"]')?.textContent).toBe('Keys panel')
    expect(document.activeElement?.textContent).toBe('API keys')
  })
})

describe('NavMenu', () => {
  it('lists pages under headings, marks the current one, and draws links through the router', () => {
    const out = render(
      <NavMenu
        label="Admin"
        selectedKey="users"
        renderLink={(href, props) => <a data-router="yes" href={href} {...props} />}
        items={[
          { key: 'overview', label: 'Overview', icon: LayersIcon, href: '/' },
          { key: 'people', label: 'People', items: [{ key: 'users', label: 'Users', href: '/users', badge: 12 }] },
        ]}
      />,
    )
    expect(out.querySelector('nav')?.getAttribute('aria-label')).toBe('Admin')
    expect(out.querySelector('.kui-nav-heading')?.textContent).toBe('People')
    const current = out.querySelector('[aria-current="page"]') as HTMLAnchorElement
    expect(current.getAttribute('href')).toBe('/users')
    expect(current.dataset.router).toBe('yes')
    expect(current.textContent).toBe('Users12')
  })
})

describe('Segmented', () => {
  it('draws word segments without icons, one pressed', () => {
    const seen: string[] = []
    const out = render(
      <Segmented
        label="Range"
        value="7d"
        onChange={(value) => seen.push(value)}
        segments={[
          { value: '24h', label: '24h' },
          { value: '7d', label: '7d' },
        ]}
      />,
    )
    expect(out.querySelector('[aria-pressed="true"]')?.textContent).toBe('7d')
    act(() => (out.querySelector('.kui-segment-text') as HTMLButtonElement).click())
    expect(seen).toEqual(['24h'])
  })
})

describe('LineChart', () => {
  it('rounds its axis to nice steps', () => {
    expect(niceTicks(0, 87)).toEqual([0, 20, 40, 60, 80, 100])
    expect(niceTicks(0, 1)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
    expect(niceTicks(0, 0)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
  })

  it('draws a line per series with a legend', () => {
    const data = [
      { date: '10-01', metric: 'Visitors', value: 10 },
      { date: '10-02', metric: 'Visitors', value: 14 },
      { date: '10-01', metric: 'Signups', value: 2 },
      { date: '10-02', metric: 'Signups', value: 3 },
    ]
    const out = render(<LineChart label="Growth" data={data} xField="date" yField="value" seriesField="metric" />)
    expect(out.querySelector('svg')?.getAttribute('aria-label')).toBe('Growth')
    expect(out.querySelectorAll('polyline')).toHaveLength(2)
    expect([...out.querySelectorAll('.kui-chart-legend-item')].map((item) => item.textContent)).toEqual(['Visitors', 'Signups'])
  })
})
