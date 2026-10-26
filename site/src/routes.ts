/**
 * The site's URLs: real paths (`/docs/button/`, `/icons/layers/`), never `#`, so every page is a
 * static file a search engine can read. One place maps a path to a page, a page back to its path,
 * lists every page for prerendering and the sitemap, and gives each its title and description.
 */
import { ICON_NAMES } from '@kition/tessera-icons/registry'
import { DOCS } from './docs/registry'

/** Where the site is served; canonical links and the sitemap use it. */
export const SITE_URL = 'https://tessera.kition.ai'
export const SITE_NAME = 'Kition Tessera'

export const PAGES = [
  { id: 'home', label: 'Overview' },
  { id: 'docs', label: 'Docs' },
  { id: 'components', label: 'Components' },
  { id: 'icons', label: 'Icons' },
  { id: 'styles', label: 'Icon style lab' },
  { id: 'review', label: 'Redraw review' },
  { id: 'tokens', label: 'Tokens & skins' },
] as const
export type PageId = (typeof PAGES)[number]['id']
export type Route = { page: PageId; detail: string | null }

/** The path of a page (always ending in `/`, as its static file is `<path>index.html`). */
export function pathOf(page: PageId, detail: string | null = null): string {
  if (page === 'home') return '/'
  // Components is the docs, opened at the first component.
  if (page === 'components') return `/docs/${detail ?? 'button'}/`
  return detail ? `/${page}/${detail}/` : `/${page}/`
}

/** The route of a path (`/docs/button/`, `/icons/layers`); unknown paths open the overview. */
export function routeOf(path: string): Route {
  const [id = '', detail = null] = path.split('/').filter(Boolean)
  const page = PAGES.find((item) => item.id === id && item.id !== 'components')
  if (!page) return { page: 'home', detail: null }
  if (page.id === 'docs') return { page: 'docs', detail: detail && DOCS.some((doc) => doc.id === detail) ? detail : 'overview' }
  if (page.id === 'icons') return { page: 'icons', detail: detail && (ICON_NAMES as readonly string[]).includes(detail) ? detail : null }
  return { page: page.id, detail: null }
}

/** Every page there is, for prerendering and the sitemap. */
export function allRoutes(): Route[] {
  return [
    { page: 'home', detail: null },
    ...DOCS.map((doc) => ({ page: 'docs' as const, detail: doc.id })),
    { page: 'icons', detail: null },
    ...ICON_NAMES.map((name) => ({ page: 'icons' as const, detail: name })),
    { page: 'styles', detail: null },
    { page: 'review', detail: null },
    { page: 'tokens', detail: null },
  ]
}

const DESCRIPTION = 'Kition Tessera, the design system for professional editors: design tokens and skins, Tessera Icons, and components for Kition kits, with docs for people and language models.'

/** The title and description of a page, for its <head>. */
export function metaOf(route: Route): { title: string; description: string } {
  const title = (name: string) => `${name} · ${SITE_NAME}`
  switch (route.page) {
    case 'docs': {
      const doc = DOCS.find((entry) => entry.id === route.detail) ?? DOCS[0]
      const guide = doc.category === 'Getting started'
      return {
        title: title(guide ? doc.title : `${doc.title} component`),
        description: guide ? plain(doc.summary) : `${plain(doc.summary)} When to use it, live examples, and its props, in Kition Tessera.`,
      }
    }
    case 'icons':
      return route.detail
        ? { title: title(`${route.detail} icon`), description: `The ${route.detail.replace(/-/g, ' ')} icon of Tessera Icons: a 24 × 24 line icon at a 1.5 stroke, for React, canvas, SVG, and Rust.` }
        : { title: title('Icons'), description: `Tessera Icons: ${ICON_NAMES.length} icons on one grid for professional editors, as React components, canvas drawing, SVG markup, and a Rust crate.` }
    case 'styles':
      return { title: title('Icon style lab'), description: 'The icon styles Tessera compared (fine line, duotone, bold geometric, tile) in toolbars, tool rails, and grids, and the one it chose.' }
    case 'review':
      return { title: title('Redraw review'), description: 'Tessera Icons redrawn batch by batch: slide animations and transitions, CAD drafting, tool accents, and the icons most kits share.' }
    case 'tokens':
      return { title: title('Tokens and skins'), description: 'Tessera design tokens: the Kit Harness Protocol theme tokens, component tokens, and the Paper and Graphite skins as CSS variables, TypeScript, and Rust.' }
    default:
      return { title: `${SITE_NAME}: the design system for professional editors`, description: DESCRIPTION }
  }
}

/** Opens a path within the site from code (a click on a canvas); links need nothing. */
export function navigate(path: string) {
  history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** Inline `code` marks dropped, for plain-text descriptions. */
const plain = (text: string) => text.replace(/`/g, '')
