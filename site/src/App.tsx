import { Component, useEffect, useState, type ReactNode } from 'react'
import { SKINS, SKIN_IDS, type SkinId } from '@kition/tessera-tokens'
import { Toaster } from '@kition/tessera-ui'
import { DOCS } from './docs/registry'
import { loadPage, pageOf, type PageKey } from './pages'
import { CommandPalette } from './shell/CommandPalette'
import { ArrowUpRightIcon, MoonIcon, SearchIcon, SunIcon } from '@kition/tessera-icons/react'
import { version } from '@tessera/packages/ui/package.json'
import { NAV, PAGES, REPO_URL, SITE_URL, metaOf, pathOf, routeOf } from './routes'

const SKIN_LABELS: Record<SkinId, string> = { paper: 'Paper', graphite: 'Graphite' }
const SKIN_ICONS: Partial<Record<SkinId, typeof SunIcon>> = { paper: SunIcon, graphite: MoonIcon }
const SKIN_KEY = 'tessera-skin'

/** The site at `path`: prerendered on the server with the page's path, hydrated in the browser. */
export function App({ path }: { path?: string }) {
  const [{ page, detail }, setRoute] = useState(() => routeOf(path ?? location.pathname))
  const [skin, setSkin] = useState<SkinId>('paper')

  // Links within the site change the page without a reload; Back and Forward follow.
  useEffect(() => {
    // The page is loaded before the switch, so the old page stays until the new one can draw.
    let latest = 0
    const go = (next: string, push: boolean) => {
      const route = routeOf(new URL(next, location.href).pathname)
      const turn = ++latest
      if (push) history.pushState(null, '', next)
      void loadPage(route.page as PageKey, route.detail).then(() => {
        if (turn !== latest) return
        setRoute(route)
        window.scrollTo(0, 0)
      })
    }
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element).closest?.('a')
      if (!link || link.target || link.hasAttribute('download')) return
      const url = new URL(link.href, location.href)
      if (url.origin !== location.origin || url.pathname === location.pathname && url.hash) return
      event.preventDefault()
      go(url.pathname + url.search, true)
    }
    const onPop = () => go(location.pathname + location.search, false)
    document.addEventListener('click', onClick)
    window.addEventListener('popstate', onPop)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('popstate', onPop)
    }
  }, [])

  // The command palette opens on Cmd or Ctrl + K, and on `/` outside a field.
  const [palette, setPalette] = useState(false)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const field = (event.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]')
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !field && !event.metaKey && !event.ctrlKey && !event.altKey)) {
        event.preventDefault()
        setPalette((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // The <head> the prerendered page carries, kept up to date as the page changes.
  useEffect(() => {
    const meta = metaOf({ page, detail })
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', SITE_URL + pathOf(page, detail))
  }, [page, detail])

  // The skin chosen on an earlier visit, read after hydration so the prerendered page still matches.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SKIN_KEY)
      if (saved && (SKIN_IDS as readonly string[]).includes(saved)) setSkin(saved as SkinId)
    } catch {
      // Storage may be blocked; the default skin stays.
    }
  }, [])
  const chooseSkin = (id: SkinId) => {
    setSkin(id)
    try {
      localStorage.setItem(SKIN_KEY, id)
    } catch {
      // Not remembered, still applied.
    }
  }

  // A host applies a skin by setting its theme tokens on the document (Kit UI protocol, ui/theme).
  useEffect(() => {
    const theme = SKINS[skin]
    const root = document.documentElement
    for (const [name, value] of Object.entries(theme.tokens)) root.style.setProperty(name, value)
    root.dataset.colorScheme = theme.colorScheme
  }, [skin])

  return (
    <div className="site" data-page={page}>
      <header className="site-header">
        {/* Kition leads to kition.ai; Tessera, with the mark, to this site's overview. */}
        <div className="site-brand">
          <a className="site-brand-home" href="/" aria-label="Kition Tessera, overview">
            <TesseraMark />
          </a>
          <a className="site-brand-kition" href="https://kition.ai/" title="Kition: kition.ai">
            Kition
          </a>
          <a className="site-brand-home" href="/" aria-hidden="true" tabIndex={-1}>
            <strong>Tessera</strong>
          </a>
          <span className="site-version">v{version}</span>
        </div>
        <nav className="site-nav" aria-label="Site">
          {NAV.map((id) => (
            <a key={id} href={pathOf(id)} aria-current={(id === 'docs' ? page === 'docs' && !isComponentDoc(detail) : id === 'components' ? page === 'components' || (page === 'docs' && isComponentDoc(detail)) : page === id) ? 'page' : undefined}>
              {PAGES.find((item) => item.id === id)?.label}
            </a>
          ))}
        </nav>
        <div className="site-tools">
          <button type="button" className="site-search" onClick={() => setPalette(true)} aria-label="Search (Cmd or Ctrl + K)">
            <SearchIcon size={15} />
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>
          <div className="site-skin" role="group" aria-label="Skin">
            {SKIN_IDS.map((id) => {
              const Icon = SKIN_ICONS[id]
              return (
                <button key={id} type="button" aria-pressed={skin === id} title={`${SKIN_LABELS[id] ?? id} skin`} onClick={() => chooseSkin(id)}>
                  {Icon ? <Icon size={15} /> : null}
                  <span>{SKIN_LABELS[id] ?? id}</span>
                </button>
              )
            })}
          </div>
          <a className="site-kition" href="https://kition.ai/">
            kition.ai
            <ArrowUpRightIcon size={14} />
          </a>
          <a className="site-repo" href={REPO_URL}>
            GitHub
            <ArrowUpRightIcon size={14} />
          </a>
        </div>
      </header>
      <PageBoundary key={`${page}/${detail ?? ''}`}>
        <PageView page={page as PageKey} detail={detail} skin={skin} />
      </PageBoundary>
      <SiteFooter />
      <CommandPalette open={palette} onOpenChange={setPalette} skin={skin} onSkin={chooseSkin} />
      <Toaster />
    </div>
  )
}

/** The page of a route, with the props it takes. */
function PageView({ page, detail, skin }: { page: PageKey; detail: string | null; skin: SkinId }) {
  const Page = pageOf(page)
  if (!Page) return <main className="site-main" />
  if (page === 'home') return <Page skin={skin} />
  return <main className="site-main">{page === 'icons' ? <Page key={detail ?? ''} initial={detail} /> : page === 'tokens' ? <Page skin={skin} /> : page === 'docs' ? <Page id={detail ?? 'overview'} /> : <Page />}</main>
}

/** Links to Kition products and developer resources. */
const KITION_LINKS = [
  { label: 'Kition — desktop', href: 'https://kition.ai/' },
  { label: 'Kition One — teams', href: 'https://kition.one/' },
  { label: 'Kition for Developers', href: 'https://dev.kition.ai/' },
  { label: 'Kition Universe', href: 'https://universe.kition.ai/' },
  { label: 'Kition Tessera', href: 'https://tessera.kition.ai/' },
]

const TESSERA_LINKS = [
  ...NAV.map((id) => ({ label: PAGES.find((item) => item.id === id)?.label ?? id, href: pathOf(id) })),
]

const RESOURCE_LINKS = [
  { label: 'GitHub', href: REPO_URL },
  { label: 'Contributing', href: `${REPO_URL}/blob/main/CONTRIBUTING.md` },
  { label: 'Changelog', href: `${REPO_URL}/blob/main/CHANGELOG.md` },
  { label: 'License (Apache-2.0)', href: `${REPO_URL}/blob/main/LICENSE` },
  { label: 'Third-party notices', href: '/THIRD_PARTY_LICENSES.txt' },
  { label: 'Docs as Markdown', href: `${REPO_URL}/tree/main/docs` },
  { label: 'llms.txt', href: '/llms.txt' },
]

function SiteFooter() {
  const columns = [
    { title: 'Tessera', links: TESSERA_LINKS },
    { title: 'Open source', links: RESOURCE_LINKS },
    { title: 'Kition', links: KITION_LINKS },
  ]
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <p className="site-footer-brand">
            <TesseraMark /> Kition Tessera
          </p>
          <p className="site-footer-muted">The design system for AI-native professional software: tokens, icons, and the components editors are built from.</p>
          <p className="site-footer-muted site-footer-legal">Apache-2.0 · v{version} · Kition and Tessera are trademarks of Kition AI.</p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="site-footer-title">{column.title}</p>
            <ul>
              {column.links.map((link) => (
                <li key={link.href}>
                  {/* Files outside the app (llms.txt) and other sites load as documents. */}
                  <a href={link.href} target={link.href.endsWith('.txt') ? '_self' : undefined}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  )
}

/**
 * A page that fails to draw shows what went wrong and a way on, instead of a blank screen; the
 * header stays, and moving to another page tries again.
 */
class PageBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="site-main">
        <section className="page-intro">
          <h1>This page could not be shown</h1>
          <p>{this.state.error.message}</p>
          <p>
            <a href={location.pathname} onClick={() => location.reload()}>Reload the page</a> or <a href="/">go to the overview</a>.
          </p>
        </section>
      </main>
    )
  }
}

/** Whether a docs page is a component's (Components highlights for those, Docs for the guides). */
function isComponentDoc(id: string | null) {
  return DOCS.find((doc) => doc.id === id)?.category !== 'Getting started'
}

/** A 3 × 3 mosaic: the Kit Grid's cells as tesserae. */
function TesseraMark() {
  const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      {cells.map((cell) => (
        <rect key={cell} x={(cell % 3) * 8 + 1} y={Math.floor(cell / 3) * 8 + 1} width="6" height="6" rx="1.5" fill="var(--kit-primary)" opacity={[0, 4, 8, 2, 6].includes(cell) ? 1 : 0.35} />
      ))}
    </svg>
  )
}
