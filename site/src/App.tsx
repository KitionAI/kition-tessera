import { useEffect, useState } from 'react'
import { SKINS, SKIN_IDS, type SkinId } from '@kition/tessera-tokens'
import { DocsPage } from './docs/DocsPage'
import { DOCS } from './docs/registry'
import { HomePage } from './home/HomePage'
import { Landing } from './home/Landing'
import { IconsPage } from './IconsPage'
import { ReviewPage } from './ReviewPage'
import { StyleLab } from './StyleLab'
import { TokensPage } from './TokensPage'
import { PAGES, SITE_URL, metaOf, pathOf, routeOf } from './routes'

const SKIN_LABELS: Record<SkinId, string> = { paper: 'Paper', graphite: 'Graphite' }

/** The site at `path`: prerendered on the server with the page's path, hydrated in the browser. */
export function App({ path }: { path: string }) {
  const [{ page, detail }, setRoute] = useState(() => routeOf(path))
  const [skin, setSkin] = useState<SkinId>('paper')

  // Links within the site change the page without a reload; Back and Forward follow.
  useEffect(() => {
    const go = (next: string, push: boolean) => {
      if (push) history.pushState(null, '', next)
      setRoute(routeOf(new URL(next, location.href).pathname))
      window.scrollTo(0, 0)
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

  // The <head> the prerendered page carries, kept up to date as the page changes.
  useEffect(() => {
    const meta = metaOf({ page, detail })
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', SITE_URL + pathOf(page, detail))
  }, [page, detail])

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
        <a className="site-brand" href="/">
          <TesseraMark />
          <span>
            Kition <strong>Tessera</strong>
          </span>
        </a>
        <nav className="site-nav">
          {PAGES.map((item) => (
            <a key={item.id} href={pathOf(item.id)} aria-current={(item.id === 'docs' ? page === 'docs' && !isComponentDoc(detail) : item.id === 'components' ? page === 'docs' && isComponentDoc(detail) : page === item.id) ? 'page' : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
        <label className="site-skin">
          Skin
          <select value={skin} onChange={(event) => setSkin(event.target.value as SkinId)}>
            {SKIN_IDS.map((id) => (
              <option key={id} value={id}>
                {SKIN_LABELS[id] ?? id}
              </option>
            ))}
          </select>
        </label>
      </header>
      {page === 'galaxy' ? (
        <HomePage dark={SKINS[skin].colorScheme === 'dark'} />
      ) : page === 'home' ? (
        <Landing skin={skin} />
      ) : (
        <main className="site-main">
          {page === 'icons' ? <IconsPage key={detail ?? ''} initial={detail} /> : page === 'styles' ? <StyleLab /> : page === 'review' ? <ReviewPage /> : page === 'tokens' ? <TokensPage skin={skin} /> : <DocsPage id={detail ?? 'overview'} />}
        </main>
      )}
    </div>
  )
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
