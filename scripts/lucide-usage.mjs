#!/usr/bin/env node
/**
 * Finds every lucide-react icon the Kition repositories import, so Tessera Icons covers them.
 *
 * Scans kition (`src`, `packages`), kition-sdk `packages/kit-ui/src`, and each kit's `web/src`,
 * found as siblings of this repository (or under `KITION_WORKSPACE`). Test files are skipped.
 * Prints a summary; `--write` adds the icons `packages/icons/icons.json` does not have yet, and
 * `--json` prints the per-repository lists.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lucideIndex } from '../packages/icons/scripts/lucide.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workspace = process.env.KITION_WORKSPACE ? resolve(process.env.KITION_WORKSPACE) : resolve(root, '..')
const KITS = ['note', 'table', 'board', 'photo', 'film', 'doc', 'sheet', 'slide', 'pdf', 'vector', 'design', 'effect', 'cad', 'html']
const SKIP_DIRS = new Set(['node_modules', 'dist', 'target', '.git'])
const IMPORT = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]lucide-react['"]/g
const NOT_ICONS = new Set(['LucideIcon', 'LucideProps', 'IconNode', 'createLucideIcon', 'icons'])

function* sources(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) yield* sources(path)
    else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\./.test(entry)) yield path
  }
}

function scan(dirs) {
  const names = new Set()
  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    for (const file of sources(dir)) {
      for (const match of readFileSync(file, 'utf8').matchAll(IMPORT)) {
        for (const part of match[1].split(',')) {
          const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()
          if (name && !NOT_ICONS.has(name)) names.add(name)
        }
      }
    }
  }
  return names
}

const scopes = {
  kition: [join(workspace, 'kition', 'src'), join(workspace, 'kition', 'packages')],
  'kit-ui': [join(workspace, 'kition-sdk', 'packages', 'kit-ui', 'src')],
  ...Object.fromEntries(KITS.map((kit) => [kit, [join(workspace, `kition-${kit}`, 'web', 'src')]])),
}
const missingRepos = Object.entries(scopes).filter(([, dirs]) => !dirs.some(existsSync)).map(([scope]) => scope)
const perScope = Object.fromEntries(Object.entries(scopes).map(([scope, dirs]) => [scope, scan(dirs)]))

const index = await lucideIndex()
/** @type {Map<string, { scopes: string[], imports: Set<string> }>} */
const used = new Map()
const unknown = new Set()
for (const [scope, names] of Object.entries(perScope)) {
  for (const name of names) {
    const kebab = index.byExport.get(name)
    if (!kebab) {
      unknown.add(name)
      continue
    }
    const entry = used.get(kebab) ?? { scopes: [], imports: new Set() }
    entry.scopes.push(scope)
    entry.imports.add(name)
    used.set(kebab, entry)
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(Object.fromEntries(Object.entries(perScope).map(([scope, names]) => [scope, [...names].sort()])), null, 1))
} else {
  for (const [scope, names] of Object.entries(perScope)) console.log(`${scope.padEnd(8)} ${names.size}`)
  const shared = [...used.values()].filter((entry) => entry.scopes.length >= 5).length
  const single = [...used.values()].filter((entry) => entry.scopes.length === 1).length
  console.log(`distinct  ${used.size} (in 5+ scopes: ${shared}, in one: ${single})`)
  if (missingRepos.length > 0) console.log(`not found: ${missingRepos.join(', ')}`)
  if (unknown.size > 0) console.log(`not in lucide ${index.version}: ${[...unknown].sort().join(', ')}`)
}

if (process.argv.includes('--write')) {
  const file = join(root, 'packages', 'icons', 'icons.json')
  const manifest = JSON.parse(readFileSync(file, 'utf8'))
  let added = 0
  for (const kebab of [...used.keys()].sort()) {
    if (Object.values(manifest.icons).some((icon) => icon.source === `lucide:${kebab}`)) continue
    manifest.icons[kebab] = { family: 'ui', source: `lucide:${kebab}` }
    added++
  }
  manifest.icons = Object.fromEntries(Object.entries(manifest.icons).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`added ${added} icons to packages/icons/icons.json`)
}
