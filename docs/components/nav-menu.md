# NavMenu

An app’s sidebar: its pages as links under headings, the current one marked; collapses to icons.

Category: Navigation · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/nav-menu/)

```ts
import { NavMenu } from '@kition/tessera-ui'
```

## Example: Admin sidebar

```tsx
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
```

## NavMenu props

An app's sidebar: its pages as links, grouped under headings, the current one marked.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` (required) | `readonly (NavItem \| NavGroup)[]` |  | Pages, or groups of pages under a heading. |
| `selectedKey` | `string` |  | The current page's key. |
| `collapsed` | `boolean` |  | Icons only, each page's label in its tooltip (a collapsed sidebar). |
| `renderLink` | `(href: string, props: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) => ReactNode` |  | Draws a link; a router passes its own (`<Link to={href} … />`). A plain `<a>` by default. |
| `label` (required) | `string` |  |  |
| `className` | `string` |  |  |

## See also

- [Tabs](tabs.md): Sections of one page under a row of tabs; arrow keys move between them.
- [AppRail](app-rail.md): A suite’s app switcher on the left edge: each app’s icon over its name, the open one marked, badges, the product mark above and the account below; compact shows icons only, each name as its tooltip.
- [Pagination](pagination.md): The pages of a long list on the server: the range shown, page buttons, and a page size.
