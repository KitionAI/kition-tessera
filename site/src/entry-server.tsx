/**
 * Prerendering (scripts/prerender.mjs): each page of the site as HTML, with the <head> a search
 * engine reads (title, description, canonical, Open Graph).
 */
import { renderToString } from 'react-dom/server'
import { App } from './App'
import { SITE_NAME, SITE_URL, allRoutes, metaOf, pathOf, type Route } from './routes'

export { allRoutes, pathOf, SITE_URL }

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The page for `route`, at its own path or at `at` (an alias such as `/docs/`, whose canonical stays the route's). */
export function render(route: Route, at?: string): { path: string; url: string; title: string; description: string; head: string; html: string } {
  const path = at ?? pathOf(route.page, route.detail)
  const { title, description } = metaOf(route)
  const url = SITE_URL + pathOf(route.page, route.detail)
  const head = [
    `<meta property="og:site_name" content="${escape(SITE_NAME)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    `<meta name="twitter:card" content="summary" />`,
  ].join('\n    ')
  return { path, url, title, description, head, html: renderToString(<App path={path} />) }
}
