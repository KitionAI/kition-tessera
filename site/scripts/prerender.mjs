#!/usr/bin/env node
/**
 * Writes the site as static pages (pnpm --filter @kition/tessera-site build): after the client
 * build (dist/) and the server build of src/entry-server.tsx (.ssr/), every page in routes.ts
 * becomes dist/<path>/index.html with its markup and its <head> (title, description, canonical,
 * Open Graph), then sitemap.xml, robots.txt, and 404.html. Hosts serve the files as they are.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const site = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(site, 'dist')
const { render, allRoutes, SITE_URL } = await import(pathToFileURL(join(site, '.ssr', 'entry-server.js')).href)
const template = readFileSync(join(dist, 'index.html'), 'utf8')
const escape = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function page({ title, description, url, head, html }) {
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace('<meta name="description" content="" />', `<meta name="description" content="${escape(description)}" />`)
    .replace('<link rel="canonical" href="" />', `<link rel="canonical" href="${escape(url)}" />`)
    .replace('<!--head-->', head)
    .replace('<!--app-->', html)
}

const routes = allRoutes()
const urls = []
for (const route of routes) {
  const out = render(route)
  const dir = join(dist, out.path)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), page(out))
  urls.push(out.url)
}
// Paths a person may type that show another page: written too, their canonical the page's own.
for (const [at, route] of [['/docs/', { page: 'docs', detail: 'overview' }]]) {
  mkdirSync(join(dist, at), { recursive: true })
  writeFileSync(join(dist, at, 'index.html'), page(render(route, at)))
}
// Unknown paths: the overview's page, marked as not found.
writeFileSync(join(dist, '404.html'), page(render({ page: 'home', detail: null })).replace('<head>', '<head>\n    <meta name="robots" content="noindex" />'))
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`,
)
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
console.log(`prerendered ${routes.length} pages into ${dist}`)
