import { useState } from 'react'
import { AppRail, Avatar, IconButton, NavMenu } from '@kition/tessera-ui'
import { BookOpenIcon, ClockIcon, FolderIcon, InboxIcon, LayoutDashboardIcon, SettingsIcon, SparklesIcon, StarIcon, UsersIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [app, setApp] = useState('docs')
  const go = (set: (key: string) => void) => (href: string, props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a href={href} {...props} onClick={(event) => { event.preventDefault(); set(href.slice(1)) }} />
  )
  return (
    <div style={{ display: 'flex', height: 460, border: '1px solid var(--kit-border)', borderRadius: 'var(--kit-radius-card)', overflow: 'hidden' }}>
      <AppRail
        label="Apps"
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
      <div style={{ flex: 1, padding: 16, color: 'var(--kit-text-muted)' }}>The {app} app</div>
    </div>
  )
}
