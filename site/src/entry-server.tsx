/**
 * Prerendering (scripts/prerender.mjs): each page of the site as HTML, with the <head> a search
 * engine reads (title, description, canonical, Open Graph).
 */
import { renderToString } from 'react-dom/server'
import type { ComponentType } from 'react'
import { App } from './App'
import { ComponentsPage } from './ComponentsPage'
import { DocsPage } from './docs/DocsPage'
import { registerDemo } from './docs/demos'
import { Landing } from './home/Landing'
import { IconsPage } from './IconsPage'
import { registerPage } from './pages'
import { TokensPage } from './TokensPage'
import { SITE_NAME, SITE_URL, metaOf, pathOf, type Route } from './routes'
import { ICON_COUNT, allRoutes } from './routes.all'

export { allRoutes, pathOf, SITE_URL }

// Prerendering draws every page, so all of them, and every demo, are ready up front.
registerPage('home', { page: Landing })
registerPage('docs', { page: DocsPage })
registerPage('components', { page: ComponentsPage })
registerPage('icons', { page: IconsPage })
registerPage('tokens', { page: TokensPage })
const demoModules = import.meta.glob<{ default: ComponentType }>('./docs/demos/*.tsx', { eager: true })
const demoSources = import.meta.glob<string>('./docs/demos/*.tsx', { eager: true, query: '?raw', import: 'default' })
for (const [path, module] of Object.entries(demoModules)) registerDemo(path.replace(/^.*\/([^/]+)\.tsx$/, '$1'), { Component: module.default, source: demoSources[path] })

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The page for `route`, at its own path or at `at` (an alias such as `/docs/`, whose canonical stays the route's). */
export function render(route: Route, at?: string): { path: string; url: string; title: string; description: string; head: string; html: string } {
  const path = at ?? pathOf(route.page, route.detail)
  const { title, description } = metaOf(route, ICON_COUNT)
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
