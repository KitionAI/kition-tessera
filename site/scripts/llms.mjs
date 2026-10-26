#!/usr/bin/env node
/**
 * Writes the docs for language models: `public/llms.txt` (an index of every page, one line each)
 * and `public/llms-full.txt` (every page in Markdown: guides, when to use, demo source, and props
 * tables), both from `src/docs/registry.ts`, the demos, and `src/docs/api.json`, so they say what
 * the site says. `--check` fails when either is stale; both modes fail when an exported component
 * has no page.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = join(dirname(fileURLToPath(import.meta.url)), '..')
const { CATEGORIES, DOCS } = await import(join(site, 'src', 'docs', 'registry.ts'))
const api = JSON.parse(readFileSync(join(site, 'src', 'docs', 'api.json'), 'utf8'))
// The site's address (site/src/routes.ts SITE_URL): links in llms.txt are absolute.
const URL = 'https://tessera.kition.ai'

// Every exported component has a page, and every page lists real components.
const listed = new Set(DOCS.flatMap((doc) => doc.api ?? []))
const undocumented = Object.keys(api).filter((name) => !listed.has(name))
const unknown = [...listed].filter((name) => !api[name])
if (undocumented.length || unknown.length) {
  if (undocumented.length) console.error(`components without a docs page: ${undocumented.join(', ')}`)
  if (unknown.length) console.error(`docs pages list unknown components: ${unknown.join(', ')}`)
  process.exit(1)
}

const intro = [
  '# Kition Tessera',
  '',
  '> The design system for professional editors and Kition kits: design tokens (`@kition/tessera-tokens`), Tessera Icons (`@kition/tessera-icons`), and components (`@kition/tessera`). A kit editor imports all of it through `@kition/kit-ui`.',
  '',
]

const index = [...intro]
for (const category of CATEGORIES) {
  index.push(`## ${category}`, '')
  for (const doc of DOCS.filter((entry) => entry.category === category)) index.push(`- [${doc.title}](${URL}/docs/${doc.id}/): ${doc.summary}`)
  index.push('')
}

const cell = (text) => String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ')
const full = [...intro]
for (const doc of DOCS) {
  full.push(`## ${doc.title}`, '', `${doc.category}. ${doc.summary}`, '')
  if (doc.api?.length) full.push('```ts', `import { ${doc.api.join(', ')} } from '@kition/tessera' // in a kit: '@kition/kit-ui'`, '```', '')
  if (doc.when?.length) full.push('When to use:', '', ...doc.when.map((item) => `- ${item}`), '')
  if (doc.whenNot?.length) full.push('When not to:', '', ...doc.whenNot.map((item) => `- ${item}`), '')
  for (const section of doc.sections ?? []) {
    full.push(`### ${section.heading}`, '', ...section.body.flatMap((paragraph) => [paragraph, '']))
    if (section.code) full.push('```tsx', section.code, '```', '')
  }
  for (const demo of doc.demos ?? []) {
    full.push(`### Example: ${demo.title}`, '')
    if (demo.note) full.push(demo.note, '')
    full.push('```tsx', readFileSync(join(site, 'src', 'docs', 'demos', `${demo.id}.tsx`), 'utf8').trim(), '```', '')
  }
  for (const name of doc.api ?? []) {
    const info = api[name]
    if (!info) continue
    full.push(`### ${name} props`, '')
    if (info.description) full.push(info.description, '')
    if (info.props.length) {
      full.push('| Prop | Type | Default | Description |', '| --- | --- | --- | --- |')
      for (const prop of info.props) full.push(`| \`${prop.name}\`${prop.required ? ' (required)' : ''} | \`${cell(prop.type)}\` | ${prop.default ? `\`${cell(prop.default)}\`` : ''} | ${cell(prop.doc)} |`)
      full.push('')
    }
    if (info.domProps) full.push('Also takes the attributes of its HTML element.', '')
  }
}

const outputs = { 'llms.txt': index.join('\n'), 'llms-full.txt': full.join('\n') }
let stale = false
for (const [file, text] of Object.entries(outputs)) {
  const path = join(site, 'public', file)
  if (process.argv.includes('--check')) {
    let current = ''
    try {
      current = readFileSync(path, 'utf8')
    } catch {}
    if (current !== text) stale = true
  } else writeFileSync(path, text)
}
if (stale) {
  console.error('site/public/llms*.txt are out of date: run node site/scripts/llms.mjs')
  process.exit(1)
}
if (!process.argv.includes('--check')) console.log(`llms.txt: ${DOCS.length} pages; llms-full.txt: ${outputs['llms-full.txt'].length} characters`)
