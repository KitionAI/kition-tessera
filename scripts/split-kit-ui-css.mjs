#!/usr/bin/env node
/**
 * One-off migration helper: splits kition-sdk's kit-editor `styles.css` into the rules Tessera's
 * components need and the rules kit-editor keeps, by which source files use each rule's classes.
 *
 *   node scripts/split-kit-ui-css.mjs <kit-ui src dir> <tessera src dir> [--write <tessera css> <kit-ui css>]
 *
 * A rule moves to Tessera when every `kui-` class it names is used by Tessera's sources and none
 * is used only by kit-editor's; everything else (page base rules, tokens, kit-ui-only classes, classes
 * no source names) stays. Prints the split and every pair whose order the split reverses while
 * the two rules share a class and a property, which must be reviewed by hand.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [kitUiDir, tesseraDir] = process.argv.slice(2)
if (!kitUiDir || !tesseraDir) {
  console.error('usage: split-kit-ui-css.mjs <kit-ui src dir> <tessera src dir> [--write <tessera css> <kit-ui css>]')
  process.exit(2)
}

/** Top-level blocks with the comments above them; `@media` and other at-rules stay whole. */
function blocks(css) {
  const out = []
  let i = 0
  let pending = ''
  while (i < css.length) {
    const rest = css.slice(i)
    const ws = /^\s+/.exec(rest)
    if (ws) {
      pending += ws[0]
      i += ws[0].length
      continue
    }
    if (rest.startsWith('/*')) {
      const end = css.indexOf('*/', i) + 2
      pending += css.slice(i, end)
      i = end
      continue
    }
    const open = css.indexOf('{', i)
    if (open < 0) throw new Error(`unparsed text at ${i}`)
    let depth = 0
    let j = open
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++
      else if (css[j] === '}' && --depth === 0) break
    }
    const prelude = css.slice(i, open).trim()
    const text = css.slice(i, j + 1)
    out.push({ lead: pending, prelude, text })
    pending = ''
    i = j + 1
  }
  return { blocks: out, tail: pending }
}

const sourceFiles = (dir, keep) =>
  readdirSync(dir)
    .filter((file) => /\.(ts|tsx)$/.test(file) && !/\.test\./.test(file) && keep(file))
    .map((file) => readFileSync(join(dir, file), 'utf8'))

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'test') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(path))
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(path)
  }
  return out
}

const tesseraNames = new Set(readdirSync(tesseraDir).filter((file) => /\.(ts|tsx)$/.test(file)))
const tesseraSources = sourceFiles(tesseraDir, () => true).join('\n')
const kitUiSources = walk(kitUiDir)
  .filter((path) => !(path.startsWith(join(kitUiDir, '')) && !path.slice(kitUiDir.length + 1).includes('/') && tesseraNames.has(path.slice(kitUiDir.length + 1))))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n')

/** Whether a source names a class, literally or through a `kui-x-${…}` template prefix. */
function uses(source, cls) {
  if (new RegExp(`(^|[^\\w-])${cls.replace(/-/g, '\\-')}($|[^\\w-])`).test(source)) return true
  for (const match of source.matchAll(/(kui-[\w-]*-)\$\{/g)) if (cls.startsWith(match[1])) return true
  return false
}

const css = readFileSync(join(kitUiDir, 'styles.css'), 'utf8')
const { blocks: list, tail } = blocks(css)
const classesOf = (text) => [...new Set([...text.matchAll(/\.(kui-[\w-]+)/g)].map((match) => match[1]))]
const propsOf = (text) => new Set([...text.matchAll(/([\w-]+)\s*:/g)].map((match) => match[1]))

/** Base rules that belong to the design system, kept before the component rules they underlie. */
const BASE = [/^button,\s*input,\s*select,\s*textarea$/, /^:focus-visible$/]

for (const block of list) {
  const classes = classesOf(block.prelude.startsWith('@') ? block.text : block.prelude)
  block.classes = classes
  if (/^:root(\[data-color-scheme='dark'\])?$/.test(block.prelude)) {
    // The theme and layout tokens: both stylesheets get them from @kition/tessera-tokens.
    block.to = 'tokens'
    continue
  }
  if (BASE.some((pattern) => pattern.test(block.prelude.replace(/\s+/g, ' ').replace(/, /g, ',').replace(/,/g, ', ').trim()))) {
    block.to = 'tessera'
    block.why = 'base rule'
    continue
  }
  if (classes.length === 0) {
    block.to = 'kit-editor'
    block.why = 'no kui class'
    continue
  }
  const inTessera = classes.filter((cls) => uses(tesseraSources, cls))
  const onlyKitUi = classes.filter((cls) => !uses(tesseraSources, cls) && uses(kitUiSources, cls))
  const unused = classes.filter((cls) => !uses(tesseraSources, cls) && !uses(kitUiSources, cls))
  if (onlyKitUi.length > 0) [block.to, block.why] = ['kit-editor', `kit-editor only: ${onlyKitUi.join(' ')}`]
  else if (inTessera.length === 0) [block.to, block.why] = ['kit-editor', `unused: ${unused.join(' ')}`]
  else [block.to, block.why] = ['tessera', unused.length ? `unused too: ${unused.join(' ')}` : '']
}

const moved = list.filter((block) => block.to === 'tessera')
console.log(`${list.length} blocks: ${moved.length} to Tessera, ${list.filter((block) => block.to === 'kit-editor').length} stay in kit-editor, ${list.filter((block) => block.to === 'tokens').length} are tokens`)

// Kit-ui rules that came before a Tessera rule now come after it.
const reversed = []
list.forEach((kept, i) => {
  if (kept.to !== 'kit-editor' || kept.classes.length === 0) return
  for (const later of list.slice(i + 1)) {
    if (later.to !== 'tessera') continue
    const shared = kept.classes.filter((cls) => later.classes.includes(cls))
    if (shared.length === 0) continue
    const keptProps = propsOf(kept.text.slice(kept.text.indexOf('{')))
    const props = [...propsOf(later.text.slice(later.text.indexOf('{')))].filter((prop) => keptProps.has(prop))
    if (props.length > 0) reversed.push(`${kept.prelude}  <->  ${later.prelude}  [${shared.join(' ')}; ${props.join(' ')}]`)
  }
})
console.log(`\n${reversed.length} reversed pairs sharing a class and a property:`)
for (const line of reversed) console.log(`  ${line}`)

if (process.argv.includes('--verbose')) {
  for (const block of list) console.log(`${block.to.padEnd(8)} ${block.prelude.slice(0, 90)}${block.why ? `  (${block.why})` : ''}`)
}

const at = process.argv.indexOf('--write')
if (at > 0) {
  const [tesseraCss, kitUiCss] = process.argv.slice(at + 1)
  const join_ = (items) => items.map((block) => block.lead + block.text).join('').replace(/^\s+/, '') + '\n'
  const tesseraHead = [
    '/*',
    ' * @kition/tessera-ui: the components\' styles. Every color, radius, font, and shadow comes from the theme',
    " * tokens (@kition/tessera-tokens, the Kit Harness Protocol's Kit UI protocol section 4); a host's",
    ' * theme overrides them. Class names keep the `kui-` prefix kits already style against.',
    ' */',
    "@import '@kition/tessera-tokens/tokens.css';",
    '',
    '',
  ].join('\n')
  const kitUi = list.filter((block) => block.to === 'kit-editor')
  const header = kitUi[0].lead.match(/^\s*\/\*[\s\S]*?\*\//)?.[0]?.trim() ?? ''
  kitUi[0] = { ...kitUi[0], lead: kitUi[0].lead.replace(/^\s*\/\*[\s\S]*?\*\//, '') }
  writeFileSync(tesseraCss, tesseraHead + join_(moved))
  writeFileSync(kitUiCss, `${header}\n@import '@kition/tessera-ui/styles.css';\n\n` + join_(kitUi) + (tail.trim() ? `${tail.trim()}\n` : ''))
  console.log(`\nwrote ${tesseraCss} and ${kitUiCss}`)
}
