import { useState } from 'react'
import { NavMenu, Switch } from '@kition/tessera-ui'
import { CreditCardIcon, KeyRoundIcon, LayoutDashboardIcon, MessageSquareIcon, UsersIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [selected, setSelected] = useState('users')
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ width: collapsed ? 52 : 220, padding: 8, borderRight: '1px solid var(--kit-border)' }}>
        <NavMenu
          label="Admin"
          selectedKey={selected}
          collapsed={collapsed}
          renderLink={(href, props) => <a href={href} {...props} onClick={(event) => { event.preventDefault(); setSelected(href.slice(1)) }} />}
          items={[
            { key: 'overview', label: 'Overview', icon: LayoutDashboardIcon, href: '#overview' },
            { key: 'people', label: 'People', items: [{ key: 'users', label: 'Users', icon: UsersIcon, href: '#users', badge: 1284 }, { key: 'feedback', label: 'Feedback', icon: MessageSquareIcon, href: '#feedback' }] },
            { key: 'billing', label: 'Billing', items: [{ key: 'orders', label: 'Orders', icon: CreditCardIcon, href: '#orders' }, { key: 'keys', label: 'API keys', icon: KeyRoundIcon, href: '#keys' }] },
          ]}
        />
      </div>
      <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <Switch checked={collapsed} onCheckedChange={setCollapsed} /> Collapsed
      </label>
    </div>
  )
}
