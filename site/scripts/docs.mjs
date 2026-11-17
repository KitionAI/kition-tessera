#!/usr/bin/env node
/**
 * Writes the Markdown docs (pnpm build:docs): `docs/` in this repository, one file per guide and per
 * component plus the token and icon references (`docs/icon-style.md` is written by hand), and the two files for language models,
 * `site/public/llms.txt` (an index, one line per page) and `site/public/llms-full.txt` (every page
 * in one file). All of it comes from what the site shows: `site/src/docs/registry.ts`, the demos,
 * `site/src/docs/api.json` (the components' types), and the token and icon sources.
 * `--check` fails when a file is stale, missing, or left over; both modes fail when an exported
 * component has no page.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { docsDir, root, site } from './paths.mjs'

const { CATEGORIES, DOCS } = await import(join(site, 'src', 'docs', 'registry.ts'))
const api = JSON.parse(readFileSync(join(site, 'src', 'docs', 'api.json'), 'utf8'))
const check = process.argv.includes('--check')
// The site's address (site/src/routes.ts SITE_URL): links in llms.txt are absolute.
const URL = 'https://tessera.kition.ai'
/** Where the site serves `docs/` (site/scripts/prerender.mjs copies it there). */
const MARKDOWN_URL = `${URL}/markdown`
const REPO = 'https://github.com/KitionAI/kition-tessera'

// Every exported component has a page, and every page lists real components.
const listed = new Set(DOCS.flatMap((doc) => doc.api ?? []))
const undocumented = Object.keys(api).filter((name) => !listed.has(name))
const unknown = [...listed].filter((name) => !api[name])
if (undocumented.length || unknown.length) {
  if (undocumented.length) console.error(`components without a docs page: ${undocumented.join(', ')}`)
  if (unknown.length) console.error(`docs pages list unknown components: ${unknown.join(', ')}`)
  process.exit(1)
}

const GUIDES = 'Getting started'
const isGuide = (doc) => doc.category === GUIDES
/** A page's Markdown file, relative to `docs/`. */
const fileOf = (doc) => `${isGuide(doc) ? 'guides' : 'components'}/${doc.id}.md`
const cell = (text) => String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ')
const demoSource = (id) => readFileSync(join(site, 'src', 'docs', 'demos', `${id}.tsx`), 'utf8').trim()

/** The body of a page under its title: shared by its own file and llms-full.txt (`level` is the heading depth of its sections). */
function body(doc, level) {
  const h = '#'.repeat(level)
  const out = []
  if (doc.api?.length) out.push('```ts', `import { ${doc.api.join(', ')} } from '@kition/tessera-ui'`, '```', '')
  if (doc.when?.length) out.push(`${h} When to use`, '', ...doc.when.map((item) => `- ${item}`), '')
  if (doc.whenNot?.length) out.push(`${h} When not to`, '', ...doc.whenNot.map((item) => `- ${item}`), '')
  for (const section of doc.sections ?? []) {
    out.push(`${h} ${section.heading}`, '', ...section.body.flatMap((paragraph) => [paragraph, '']))
    if (section.code) out.push('```tsx', section.code, '```', '')
  }
  if (doc.keyboard?.length) out.push(`${h} Keyboard`, '', '| Keys | What they do |', '| --- | --- |', ...doc.keyboard.map(([keys, action]) => `| ${keys} | ${cell(action)} |`), '')
  for (const demo of doc.demos ?? []) {
    out.push(`${h} Example: ${demo.title}`, '')
    if (demo.note) out.push(demo.note, '')
    out.push('```tsx', demoSource(demo.id), '```', '')
  }
  for (const name of doc.api ?? []) {
    const info = api[name]
    out.push(`${h} ${name} props`, '')
    if (info.description) out.push(info.description, '')
    if (info.props.length) {
      out.push('| Prop | Type | Default | Description |', '| --- | --- | --- | --- |')
      for (const prop of info.props) out.push(`| \`${prop.name}\`${prop.required ? ' (required)' : ''} | \`${cell(prop.type)}\`${prop.options && !prop.type.includes("'") ? `: ${prop.options.map((option) => `\`'${option}'\``).join(', ')}` : ''} | ${prop.default ? `\`${cell(prop.default)}\`` : ''} | ${cell(prop.doc)} |`)
      out.push('')
    }
    if (info.domProps) out.push('Also takes the attributes of its HTML element (`className`, `aria-*`, events).', '')
  }
  return out
}

/** One page as its own file. */
function page(doc) {
  const out = [`# ${doc.title}`, '', doc.summary, '']
  if (!isGuide(doc)) out.push(`Category: ${doc.category} · Package: \`@kition/tessera-ui\` · [Live examples](${URL}/docs/${doc.id}/)`, '')
  else out.push(`[On the site](${URL}/docs/${doc.id}/)`, '')
  out.push(...body(doc, 2))
  const related = DOCS.filter((other) => other.category === doc.category && other.id !== doc.id)
  if (related.length) out.push('## See also', '', ...related.map((other) => `- [${other.title}](${isGuide(doc) === isGuide(other) ? '' : `../${isGuide(other) ? 'guides' : 'components'}/`}${other.id}.md): ${other.summary}`), '')
  return out.join('\n')
}

/* ------------------------------------------------------------- tokens */

/** Every token of a `*.tokens.json` file as `--name` → { value, description, khp }. */
function tokensOf(file) {
  const found = new Map()
  const walk = (node, path) => {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$') || typeof value !== 'object' || value === null) continue
      if ('$value' in value) found.set(`--${[...path, key].join('-')}`, { value: String(value.$value), description: value.$description ?? '', khp: Boolean(value.$extensions?.['ai.kition.tessera']?.khp) })
      else walk(value, [...path, key])
    }
  }
  walk(JSON.parse(readFileSync(file, 'utf8')), [])
  return found
}

function tokensPage() {
  const dir = join(root, 'packages', 'tokens', 'tokens')
  const base = tokensOf(join(dir, 'base.tokens.json'))
  const skins = readdirSync(join(dir, 'skins'))
    .filter((name) => name.endsWith('.tokens.json'))
    .sort((a, b) => (a.startsWith('paper') ? -1 : b.startsWith('paper') ? 1 : a.localeCompare(b)))
    .map((name) => ({ id: name.replace('.tokens.json', ''), tokens: tokensOf(join(dir, 'skins', name)) }))
  const title = (id) => id[0].toUpperCase() + id.slice(1)
  const table = (names) => [
    `| Token | ${skins.map((skin) => title(skin.id)).join(' | ')} | Meaning |`,
    `| --- | ${skins.map(() => '---').join(' | ')} | --- |`,
    ...names.map((name) => `| \`${name}\` | ${skins.map((skin) => `\`${cell(skin.tokens.get(name)?.value ?? base.get(name).value)}\``).join(' | ')} | ${cell(base.get(name).description)} |`),
  ]
  const khp = [...base.keys()].filter((name) => base.get(name).khp)
  const own = [...base.keys()].filter((name) => !base.get(name).khp)
  return [
    '# Tokens and skins',
    '',
    `Every value a Tessera component draws with is a CSS variable. The ${khp.length} theme tokens are the Kit Harness Protocol's (Kit UI protocol, section 4): a host sends them in \`ui/initialize\` and \`ui/theme\`, and every kit that follows the protocol takes the skin. The component tokens are Tessera's own layout values. A skin (${skins.map((skin) => title(skin.id)).join(', ')}) is one value per theme token.`,
    '',
    `Package: \`@kition/tessera-tokens\` (CSS variables, TypeScript) and the Rust crate \`kition-tessera-tokens\` · [On the site](${URL}/tokens/) · [Theming guide](guides/theming.md)`,
    '',
    '```ts',
    "import '@kition/tessera-tokens/tokens.css' // the Paper values on :root",
    "import { SKINS, skinTheme } from '@kition/tessera-tokens'",
    '',
    "const theme = skinTheme('graphite') // { colorScheme, tokens }, ready to send as ui/theme",
    '```',
    '',
    '## Theme tokens (sent by hosts)',
    '',
    ...table(khp),
    '',
    "## Component tokens (Tessera's own)",
    '',
    ...table(own),
    '',
    '## Rules',
    '',
    '- A component never hard-codes a colour, radius, font, or shadow: it reads a token.',
    '- An app that is not a kit sets the same variables in its own stylesheet.',
    '- Every skin is held to WCAG AA contrast by the token package’s tests.',
    `- The source of every value is \`packages/tokens/tokens/*.tokens.json\`.`,
    '',
  ].join('\n')
}

/* -------------------------------------------------------------- icons */

function iconsPage() {
  const { icons } = JSON.parse(readFileSync(join(root, 'packages', 'icons', 'icons.json'), 'utf8'))
  const search = JSON.parse(readFileSync(join(root, 'packages', 'icons', 'keywords.json'), 'utf8'))
  const names = Object.keys(icons).sort()
  const kits = readdirSync(join(root, 'packages', 'icons', 'kit'))
    .filter((name) => name.endsWith('.svg') && !name.endsWith('-small.svg'))
    .map((name) => name.replace('.svg', ''))
    .sort()
  const component = (name) => `${name.replace(/(^|-)([a-z0-9])/g, (_, __, letter) => letter.toUpperCase())}Icon`
  const families = [
    ['ui', 'Interface icons', 'Actions every editor has: save, undo, align, share.'],
    ['tool', 'Tool icons', 'Professional tools. They carry accent areas filled with `--kit-icon-accent`; pass `accent={false}` for plain line.'],
  ]
  const out = [
    '# Tessera Icons: every icon',
    '',
    `${names.length} icons and ${kits.length} kit app icons. Each icon is SVG path data on a 24 × 24 grid, stroked at 1.5 with round caps and joins, so React, a canvas, and a Rust engine draw the same shape.`,
    '',
    `Package: \`@kition/tessera-icons\` and the Rust crate \`kition-tessera-icons\` · [Search them on the site](${URL}/icons/) · [Icons guide](guides/icons-guide.md)`,
    '',
    '```tsx',
    "import { LayersIcon } from '@kition/tessera-icons/react'",
    "import { Layers, drawIcon, toSvg } from '@kition/tessera-icons'",
    '',
    '<LayersIcon size={16} />                                    // props match lucide-react\'s',
    "drawIcon(ctx, Layers, 8, 8, { size: 16, color: '#5645d4' }) // canvas, also in workers",
    'toSvg(Layers, { size: 16 })                                 // SVG markup',
    '```',
    '',
    'To find an icon for an action, look for the action in the "Also called" column: it lists the words people use for the icon (`ICON_SEARCH` in `@kition/tessera-icons/registry` holds them, with words in Chinese for search).',
    '',
    'The React component of an icon is its name in PascalCase plus `Icon` (`layer-add` → `LayerAddIcon`); the path data is the PascalCase name alone (`LayerAdd`). Each icon has a page of its own at `/icons/<name>/`.',
    '',
  ]
  for (const [family, heading, text] of families) {
    const members = names.filter((name) => icons[name].family === family)
    if (!members.length) continue
    out.push(`## ${heading} (${members.length})`, '', text, '', '| Icon | React component | Category | Also called | Drawing |', '| --- | --- | --- | --- | --- |')
    for (const name of members) {
      const entry = search.icons[name]
      out.push(`| \`${name}\` | \`${component(name)}\` | ${search.categories[entry.category]} | ${cell(entry.keywords.join(', '))} | ${icons[name].source.startsWith('lucide:') ? `Lucide \`${icons[name].source.slice(7)}\`` : 'Tessera'} |`)
    }
    out.push('')
  }
  out.push(`## Kit app icons (${kits.length})`, '', 'Full-colour tiles, one per Kition kit, each with a small cut for 16 px (`<kit>-small.svg`). They are Kition trademarks.', '', kits.map((kit) => `\`${kit}\``).join(', '), '', '```ts', "import photo from '@kition/tessera-icons/kit/photo.svg'", '```', '')
  return out.join('\n')
}

/* -------------------------------------------------------------- index */

const INTRO = 'The design system for professional editors and Kition kits: design tokens (`@kition/tessera-tokens`), Tessera Icons (`@kition/tessera-icons`), and components (`@kition/tessera-ui`).'

/** The list of every page, with links made by `link(doc)`. */
function listing(link) {
  const out = []
  for (const category of CATEGORIES) {
    out.push(`## ${category}`, '')
    for (const doc of DOCS.filter((entry) => entry.category === category)) out.push(`- [${doc.title}](${link(fileOf(doc))}): ${doc.summary}`)
    if (category === GUIDES) out.push(`- [Tokens and skins](${link('tokens.md')}): Every theme and component token, with its value in each skin.`, `- [Every icon](${link('icons.md')}): The name, React component, and family of each Tessera icon.`)
    out.push('')
  }
  return out
}

const files = new Map()
files.set(
  'README.md',
  [
    '# Kition Tessera documentation',
    '',
    INTRO,
    '',
    `These files are the same docs as [tessera.kition.ai](${URL}), as Markdown: one file per guide and per component, each with when to use it, runnable examples, and its props. They are generated (\`pnpm build:docs\`) from the site's source in \`site/src/docs/\`, so they say what the site says; do not edit them by hand. The one file written by hand is [icon-style.md](icon-style.md), the drawing rules for icons.`,
    '',
    ...listing((file) => file),
  ].join('\n'),
)
for (const doc of DOCS) files.set(fileOf(doc), page(doc))
files.set('tokens.md', tokensPage())
files.set('icons.md', iconsPage())

const full = ['# Kition Tessera', '', `> ${INTRO}`, '']
for (const doc of DOCS) full.push(`## ${doc.title}`, '', `${doc.category}. ${doc.summary}`, '', ...body(doc, 3))
full.push(...files.get('tokens.md').replace(/^#/gm, '##').split('\n'))

const outputs = new Map([...files].map(([file, text]) => [join(docsDir, file), text]))
outputs.set(join(site, 'public', 'llms.txt'), ['# Kition Tessera', '', `> ${INTRO}`, '', `Each link is a Markdown file. The whole reference in one file: ${URL}/llms-full.txt`, '', ...listing((file) => `${MARKDOWN_URL}/${file}`)].join('\n'))
outputs.set(join(site, 'public', 'llms-full.txt'), full.join('\n'))

/** Every Markdown file in the generated folders (`docs/guides`, `docs/components`) now. */
function existing() {
  return ['guides', 'components'].flatMap((folder) => {
    const dir = join(docsDir, folder)
    return existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.md')).map((name) => join(dir, name)) : []
  })
}

const stale = []
for (const [path, text] of outputs) {
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (current === text) continue
  if (check) stale.push(relative(root, path))
  else {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
  }
}
// A page that was removed or renamed leaves no file behind.
for (const path of existing()) {
  if (outputs.has(path)) continue
  if (check) stale.push(`${relative(root, path)} (left over)`)
  else rmSync(path)
}
if (stale.length) {
  console.error(`out of date, run pnpm build:docs:\n  ${stale.join('\n  ')}`)
  process.exit(1)
}
if (!check) console.log(`docs/: ${files.size} Markdown files; llms.txt: ${DOCS.length + 2} pages; llms-full.txt: ${outputs.get(join(site, 'public', 'llms-full.txt')).length} characters`)
