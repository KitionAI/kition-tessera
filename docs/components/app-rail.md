# AppRail

A suite’s app switcher on the left edge: each app’s icon over its name, the open one marked, badges, the product mark above and the account below; compact shows icons only, each name as its tooltip.

Category: Navigation · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/app-rail/)

```ts
import { AppRail } from '@kition/tessera-ui'
```

## When to use

- A product made of several apps (home, docs, wiki, inbox), each with its own sidebar.

## When not to

- The pages of one app: use NavMenu.
- Kinds of file: filter a list by kind instead.

## Example: Apps beside an app’s sidebar

```tsx
import { useState } from 'react'
import { AppRail, Avatar, IconButton, NavMenu, Switch } from '@kition/tessera-ui'
import { BookOpenIcon, ClockIcon, FolderIcon, InboxIcon, LayoutDashboardIcon, SettingsIcon, SparklesIcon, StarIcon, UsersIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [app, setApp] = useState('docs')
  const [compact, setCompact] = useState(false)
  const go = (set: (key: string) => void) => (href: string, props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a href={href} {...props} onClick={(event) => { event.preventDefault(); set(href.slice(1)) }} />
  )
  return (
    <div style={{ display: 'flex', height: 460, border: '1px solid var(--kit-border)', borderRadius: 'var(--kit-radius-card)', overflow: 'hidden' }}>
      <AppRail
        label="Apps"
        compact={compact}
        selectedKey={app}
        renderLink={go(setApp)}
        header={<div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--kit-primary)' }} />}
        footer={
          <>
            <IconButton icon={SettingsIcon} label="Settings" />
            <Avatar name="Ada Lovelace" size={28} />
          </>
        }
        items={[
          { key: 'home', label: 'Home', icon: LayoutDashboardIcon, href: '#home' },
          { key: 'docs', label: 'Docs', icon: FolderIcon, href: '#docs' },
          { key: 'wiki', label: 'Wiki', icon: BookOpenIcon, href: '#wiki' },
          { key: 'inbox', label: 'Inbox', icon: InboxIcon, href: '#inbox', badge: 3 },
          { key: 'ai', label: 'AI', icon: SparklesIcon, href: '#ai' },
        ]}
      />
      <div style={{ width: 220, padding: 8, borderRight: '1px solid var(--kit-border)' }}>
        <NavMenu
          label="Docs"
          selectedKey="mine"
          items={[
            { key: 'recent', label: 'Recent', icon: ClockIcon, href: '#recent' },
            { key: 'mine', label: 'My files', icon: FolderIcon, href: '#mine' },
            { key: 'shared', label: 'Shared with me', icon: UsersIcon, href: '#shared', badge: 2 },
            { key: 'starred', label: 'Starred', icon: StarIcon, href: '#starred' },
          ]}
        />
      </div>
      <div style={{ flex: 1, padding: 16, color: 'var(--kit-text-muted)' }}>
        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Switch checked={compact} onCheckedChange={setCompact} /> Icons only</label>
        <p>The {app} app</p>
      </div>
    </div>
  )
}
```

## AppRail props

A suite's app switcher: a narrow rail on the left edge with each app's icon over its name, the
open one marked, a badge on an icon, the product mark above and the account below. Each app has
its own sidebar (NavMenu) beside the rail.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` (required) | `readonly AppRailItem[]` |  | The suite's apps, top to bottom. |
| `selectedKey` | `string` |  | The open app's key. |
| `header` | `ReactNode` |  | Above the apps: the product mark. |
| `footer` | `ReactNode` |  | At the bottom: settings, the account. |
| `compact` | `boolean` |  | Icons only: each app's name becomes its tooltip, and stays its accessible name. |
| `renderLink` | `(href: string, props: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) => ReactNode` |  | Draws a link; a router passes its own (`<Link to={href} … />`). A plain `<a>` by default. |
| `label` (required) | `string` |  |  |
| `className` | `string` |  |  |

## See also

- [Tabs](tabs.md): Sections of one page under a row of tabs; arrow keys move between them.
- [NavMenu](nav-menu.md): An app’s sidebar: its pages as links under headings, the current one marked; collapses to icons.
- [Pagination](pagination.md): The pages of a long list on the server: the range shown, page buttons, and a page size.
