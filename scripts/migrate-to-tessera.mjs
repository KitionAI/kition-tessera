#!/usr/bin/env node
/**
 * Moves a consumer from the three packages `@kition/tessera-tokens`, `@kition/tessera-icons` and
 * `@kition/tessera-ui` to the one package `@kition/tessera`, whose subpaths mirror them 1:1:
 *
 *   @kition/tessera-<x>         ->  @kition/tessera/<x>
 *   @kition/tessera-<x>/<rest>  ->  @kition/tessera/<x>/<rest>      (x: tokens, icons, ui)
 *
 *   node scripts/migrate-to-tessera.mjs <folder>... [--check] [--range <range>]
 *
 * - Code (.ts .tsx .mts .cts .js .jsx .mjs .cjs .vue .svelte .astro): every string literal that is
 *   exactly an old specifier (`from '…'`, `import '…'`, `import('…')`, `require('…')`,
 *   `vi.mock('…')`, `declare module '…'`). Comments and other text are left alone.
 * - Styles (.css .scss .sass .less): `@import '…'`, `@import url(…)`, with or without a `~`.
 * - package.json: the three names in `dependencies`, `devDependencies`, `peerDependencies`,
 *   `optionalDependencies` and `peerDependenciesMeta` become one `@kition/tessera` entry, in the
 *   place of the first. Its range is `--range`, else the old entries' range when they agree (a
 *   `link:`/`file:` path to `packages/<x>` becomes the path to `packages/tessera`).
 *
 * node_modules, dist, build output and lockfiles are never touched: run the package manager's
 * install afterwards. A new specifier that `@kition/tessera` does not export is reported.
 * Without `--check` it writes the files; with `--check` it lists them and exits 1 when any would
 * change. Exits 1 when something needs a hand (an unknown subpath, ranges that disagree).
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The packages folded into `@kition/tessera`, by subpath. */
export const PARTS = ['tokens', 'icons', 'ui']
export const NEW_NAME = '@kition/tessera'
const OLD = /^@kition\/tessera-(tokens|icons|ui)(\/.*)?$/

/**
 * Every subpath `@kition/tessera` exports, as the three packages' `exports` had them. Keep in
 * step with packages/tessera/package.json (the pack check compares the two).
 */
export const EXPORTS = [
  './tokens',
  './tokens/tokens.css',
  './tokens/tokens/*',
  './icons',
  './icons/react',
  './icons/registry',
  './icons/kit/*',
  './ui',
  './ui/styles.css',
  './ui/workspaceTree',
  './ui/locales/*',
]

/** The new specifier for an old one (`@kition/tessera-ui/styles.css` -> `@kition/tessera/ui/styles.css`), or null. */
export function toTessera(specifier) {
  const match = OLD.exec(specifier)
  return match ? `${NEW_NAME}/${match[1]}${match[2] ?? ''}` : null
}

/** Whether `@kition/tessera` exports a specifier (query and hash, as in `?url`, ignored). */
export function isExported(specifier) {
  if (!specifier.startsWith(`${NEW_NAME}/`)) return false
  const subpath = `.${specifier.slice(NEW_NAME.length).replace(/[?#].*$/, '')}`
  return EXPORTS.some((key) => (key.endsWith('*') ? subpath.startsWith(key.slice(0, -1)) && subpath.length > key.length - 1 : subpath === key))
}

const OLD_IN_QUOTES = /(['"`])(~?)(@kition\/tessera-(?:tokens|icons|ui)(?:\/[^'"`\s]*)?)\1/g
const OLD_IN_CSS_URL = /(url\(\s*)(~?)(@kition\/tessera-(?:tokens|icons|ui)(?:\/[^'"`\s)]*)?)(\s*\))/g

/** Rewrites the old specifiers in code or CSS. Returns the text and the new specifiers it wrote. */
export function rewriteSource(text, { css = false } = {}) {
  const written = []
  const swap = (tilde, specifier) => {
    const next = toTessera(specifier)
    written.push(next)
    return `${tilde}${next}`
  }
  let out = text.replace(OLD_IN_QUOTES, (_, quote, tilde, specifier) => `${quote}${swap(tilde, specifier)}${quote}`)
  if (css) out = out.replace(OLD_IN_CSS_URL, (_, open, tilde, specifier, close) => `${open}${swap(tilde, specifier)}${close}`)
  return { text: out, written }
}

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

/** The range for `@kition/tessera` that an old entry's range implies. */
function impliedRange(range) {
  return range.replace(/^((?:link|file|portal):.*?)packages[/\\](?:tokens|icons|ui)[/\\]?$/, '$1packages/tessera')
}

/**
 * Rewrites a package.json's text: the old names become one `@kition/tessera` entry per field.
 * Returns the text, and a problem when the range cannot be chosen.
 */
export function rewriteManifest(text, { range } = {}) {
  const manifest = JSON.parse(text)
  const olds = []
  for (const field of DEPENDENCY_FIELDS) for (const [name, value] of Object.entries(manifest[field] ?? {})) if (OLD.test(name)) olds.push(value)
  if (!olds.length && !Object.keys(manifest.peerDependenciesMeta ?? {}).some((name) => OLD.test(name))) return { text, problems: leftovers(text) }
  const ranges = [...new Set(olds.map(impliedRange))]
  if (!range && ranges.length > 1) return { text, problems: [`the old entries have different ranges (${ranges.join(', ')}); pass --range`] }
  const chosen = range ?? ranges[0]
  const peers = { ...manifest.peerDependencies }

  /** The object with the old keys folded into one `@kition/tessera` key where the first was (an existing one stays). */
  const fold = (object, value) => {
    const out = {}
    let placed = NEW_NAME in object
    for (const [name, entry] of Object.entries(object)) {
      if (!OLD.test(name)) out[name] = entry
      else if (!placed) {
        out[NEW_NAME] = value(entry)
        placed = true
      }
    }
    return out
  }
  for (const field of DEPENDENCY_FIELDS) if (Object.keys(manifest[field] ?? {}).some((name) => OLD.test(name))) manifest[field] = fold(manifest[field], () => chosen)
  const meta = manifest.peerDependenciesMeta
  if (meta && Object.keys(meta).some((name) => OLD.test(name))) {
    // Optional only when every old peer it replaces was.
    const oldPeers = new Set([...Object.keys(meta), ...Object.keys(peers)].filter((name) => OLD.test(name)))
    const optional = [...oldPeers].every((name) => meta[name]?.optional === true)
    manifest.peerDependenciesMeta = fold(meta, (entry) => ({ ...entry, optional }))
  }
  const indent = /^[ \t]+(?=")/m.exec(text)?.[0] ?? '  '
  const out = JSON.stringify(manifest, null, indent) + (text.endsWith('\n') ? '\n' : '')
  return { text: out, problems: leftovers(out) }
}

/** Overrides, resolutions and the like are left for a person to read. */
function leftovers(text) {
  const left = /"@kition\/tessera-(?:tokens|icons|ui)(?:\/[^"]*)?"/.exec(text)
  return left ? [`still names ${left[0]} outside the dependency fields; update it by hand`] : []
}

const CODE = /\.(?:[cm]?[jt]sx?|vue|svelte|astro)$/
const STYLE = /\.(?:css|scss|sass|less)$/
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'target', '.ssr', '.next', '.turbo', '.vite', 'coverage', '.wrangler'])

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(join(dir, entry.name))
    } else if (entry.isFile() && (entry.name === 'package.json' || CODE.test(entry.name) || STYLE.test(entry.name))) yield join(dir, entry.name)
  }
}

/** Migrates the folders; returns the changed files and the problems found. */
export function migrate(dirs, { check = false, range } = {}) {
  const changed = []
  const problems = []
  for (const dir of dirs) {
    if (!statSync(dir).isDirectory()) throw new Error(`Not a folder: ${dir}`)
    for (const file of walk(dir)) {
      const text = readFileSync(file, 'utf8')
      if (!text.includes('@kition/tessera-')) continue
      const near = relative(process.cwd(), file)
      const name = near.startsWith('..') ? file : near
      let next
      if (file.endsWith('package.json')) {
        const result = rewriteManifest(text, { range })
        for (const problem of result.problems) problems.push(`${name}: ${problem}`)
        next = result.text
      } else {
        const result = rewriteSource(text, { css: STYLE.test(file) })
        for (const specifier of result.written) if (!isExported(specifier)) problems.push(`${name}: ${specifier} is not exported by ${NEW_NAME}`)
        next = result.text
      }
      if (next === text) continue
      changed.push(name)
      if (!check) writeFileSync(file, next)
    }
  }
  return { changed, problems }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const check = args.includes('--check')
  const rangeAt = args.indexOf('--range')
  const range = rangeAt >= 0 ? args[rangeAt + 1] : undefined
  const dirs = args.filter((arg, index) => !arg.startsWith('--') && (rangeAt < 0 || index !== rangeAt + 1))
  if (!dirs.length || (rangeAt >= 0 && !range)) {
    console.error('usage: node scripts/migrate-to-tessera.mjs <folder>... [--check] [--range <range>]')
    process.exit(2)
  }
  const { changed, problems } = migrate(dirs, { check, range })
  for (const file of changed) console.log(`${check ? 'would change' : 'changed'} ${file}`)
  for (const problem of problems) console.error(problem)
  if (!changed.length && !problems.length) console.log(`nothing names @kition/tessera-tokens, -icons or -ui`)
  if (problems.length || (check && changed.length)) process.exit(1)
}
