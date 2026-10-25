import { useEffect, useState } from 'react'
import { SKINS, SKIN_IDS, type SkinId } from '@kition/tessera-tokens'
import { DocsPage } from './docs/DocsPage'
import { HomePage } from './home/HomePage'
import { Landing } from './home/Landing'
import { IconsPage } from './IconsPage'
import { ReviewPage } from './ReviewPage'
import { StyleLab } from './StyleLab'
import { TokensPage } from './TokensPage'

const PAGES = [
  { id: 'home', label: 'Overview' },
  { id: 'docs', label: 'Docs' },
  { id: 'components', label: 'Components' },
  { id: 'icons', label: 'Icons' },
  { id: 'styles', label: 'Icon style lab' },
  { id: 'review', label: 'Redraw review' },
  { id: 'tokens', label: 'Tokens & skins' },
  { id: 'galaxy', label: 'Galaxy' },
] as const
type PageId = (typeof PAGES)[number]['id']

const SKIN_LABELS: Record<SkinId, string> = { paper: 'Paper', graphite: 'Graphite' }

/** `#icons/layers` opens the icons page at one icon. */
function route(): { page: PageId; detail: string | null } {
  const [id, detail = null] = location.hash.slice(1).split('/')
  return { page: PAGES.some((page) => page.id === id) ? (id as PageId) : 'home', detail }
}

export function App() {
  const [{ page, detail }, setRoute] = useState(route)
  const [skin, setSkin] = useState<SkinId>('paper')

  useEffect(() => {
    const onHash = () => {
      setRoute(route())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

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
        <a className="site-brand" href="#home">
          <TesseraMark />
          <span>
            Kition <strong>Tessera</strong>
          </span>
        </a>
        <nav className="site-nav">
          {PAGES.map((item) => (
            <a key={item.id} href={`#${item.id}`} aria-current={page === item.id ? 'page' : undefined}>
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
          {page === 'icons' ? <IconsPage key={detail ?? ''} initial={detail} /> : page === 'styles' ? <StyleLab /> : page === 'review' ? <ReviewPage /> : page === 'tokens' ? <TokensPage skin={skin} /> : <DocsPage id={detail ?? (page === 'docs' ? 'overview' : 'button')} />}
        </main>
      )}
    </div>
  )
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
