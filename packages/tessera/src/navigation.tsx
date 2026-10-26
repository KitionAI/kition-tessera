/**
 * Navigation for product screens: tabs over the sections of one page, and the sidebar menu of an
 * app's pages. Styled through the theme tokens (styles.css, "Navigation").
 */
import { useId, useRef, useState, type AnchorHTMLAttributes, type KeyboardEvent, type Key, type ReactNode } from 'react'
import type { IconComponent } from './icon'
import { ICON_STROKE } from './ui'

function join(...names: (string | undefined | false)[]) {
  return names.filter(Boolean).join(' ')
}

/* Tabs */

export type TabItem = { key: string; label: ReactNode; children?: ReactNode; disabled?: boolean }

export type TabsProps = {
  items: readonly TabItem[]
  /** The open tab, when the screen holds it (with `onChange`); otherwise `defaultActiveKey` or the first. */
  activeKey?: string
  defaultActiveKey?: string
  onChange?: (key: string) => void
  /** Content at the end of the tab row (a filter, an action). */
  extra?: ReactNode
  className?: string
  testId?: string
}

/** Sections of one page under a row of tabs; arrow keys move between tabs. */
export function Tabs({ items, activeKey, defaultActiveKey, onChange, extra, className, testId }: TabsProps) {
  const [own, setOwn] = useState(defaultActiveKey ?? items.find((item) => !item.disabled)?.key)
  const active = activeKey ?? own
  const id = useId()
  const list = useRef<HTMLDivElement>(null)
  const select = (key: string) => {
    if (activeKey === undefined) setOwn(key)
    onChange?.(key)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((item) => !item.disabled)
    const at = enabled.findIndex((item) => item.key === active)
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    const to = event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled[enabled.length - 1] : step ? enabled[(at + step + enabled.length) % enabled.length] : undefined
    if (!to) return
    event.preventDefault()
    select(to.key)
    ;[...(list.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])].find((tab) => tab.dataset.key === to.key)?.focus()
  }
  const current = items.find((item) => item.key === active)
  return (
    <div className={join('kui-tabs', className)} data-testid={testId}>
      <div className="kui-tabs-bar">
        <div ref={list} className="kui-tabs-list" role="tablist" onKeyDown={onKeyDown}>
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`${id}-tab-${item.key}`}
              data-key={item.key}
              aria-selected={item.key === active}
              aria-controls={`${id}-panel`}
              tabIndex={item.key === active ? 0 : -1}
              disabled={item.disabled}
              className="kui-tabs-tab"
              onClick={() => select(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {extra ? <div className="kui-tabs-extra">{extra}</div> : null}
      </div>
      {current?.children !== undefined ? (
        <div className="kui-tabs-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${current.key}`}>
          {current.children}
        </div>
      ) : null}
    </div>
  )
}

/* NavMenu */

export type NavItem = { key: string; label: ReactNode; icon?: IconComponent; href: string; /** A count or mark after the label. */ badge?: ReactNode }
export type NavGroup = { key: Key; label: ReactNode; items: readonly NavItem[] }

export type NavMenuProps = {
  /** Pages, or groups of pages under a heading. */
  items: readonly (NavItem | NavGroup)[]
  /** The current page's key. */
  selectedKey?: string
  /** Icons only, each page's label in its tooltip (a collapsed sidebar). */
  collapsed?: boolean
  /** Draws a link; a router passes its own (`<Link to={href} … />`). A plain `<a>` by default. */
  renderLink?: (href: string, props: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) => ReactNode
  label: string
  className?: string
}

const isGroup = (item: NavItem | NavGroup): item is NavGroup => 'items' in item

/** An app's sidebar: its pages as links, grouped under headings, the current one marked. */
export function NavMenu({ items, selectedKey, collapsed, renderLink, label, className }: NavMenuProps) {
  const link = (item: NavItem) => {
    const Icon = item.icon
    const props = {
      className: 'kui-nav-item',
      'aria-current': item.key === selectedKey ? ('page' as const) : undefined,
      title: collapsed && typeof item.label === 'string' ? item.label : undefined,
      children: (
        <>
          {Icon ? <Icon size={16} strokeWidth={ICON_STROKE} aria-hidden="true" /> : null}
          <span className="kui-nav-label">{item.label}</span>
          {item.badge !== undefined && !collapsed ? <span className="kui-nav-badge">{item.badge}</span> : null}
        </>
      ),
    }
    return <li key={item.key}>{renderLink ? renderLink(item.href, props) : <a href={item.href} {...props} />}</li>
  }
  return (
    <nav className={join('kui-nav', className)} aria-label={label} data-collapsed={collapsed || undefined}>
      <ul>
        {items.map((item) =>
          isGroup(item) ? (
            <li key={item.key} className="kui-nav-group">
              <div className="kui-nav-heading">{item.label}</div>
              <ul>{item.items.map(link)}</ul>
            </li>
          ) : (
            link(item)
          ),
        )}
      </ul>
    </nav>
  )
}
