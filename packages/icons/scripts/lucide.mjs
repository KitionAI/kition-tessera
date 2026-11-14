/**
 * Lucide's icons by canonical (kebab-case) name, and which export names (canonical and aliases)
 * point at each, read from the pinned `lucide` package. Tessera Icons' first set is built from it.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)

/** @returns {Promise<{ version: string, nodes: Map<string, Array<[string, Record<string, string>]>>, byExport: Map<string, string>, exportsOf: Map<string, string[]> }>} */
export async function lucideIndex() {
  const pkgFile = require.resolve('lucide/package.json')
  const dir = dirname(pkgFile)
  const version = JSON.parse(readFileSync(pkgFile, 'utf8')).version
  const iconsDir = join(dir, 'dist', 'esm', 'icons')
  /** @type {Map<string, any>} */
  const nodes = new Map()
  for (const file of readdirSync(iconsDir).filter((file) => file.endsWith('.mjs')).sort()) {
    nodes.set(file.slice(0, -4), (await import(pathToFileURL(join(iconsDir, file)).href)).default)
  }
  const byNode = new Map([...nodes].map(([kebab, node]) => [node, kebab]))
  const all = await import(pathToFileURL(join(dir, 'dist', 'esm', 'lucide.mjs')).href)
  /** @type {Map<string, string>} */
  const byExport = new Map()
  /** @type {Map<string, string[]>} */
  const exportsOf = new Map()
  for (const [name, value] of Object.entries(all)) {
    const kebab = byNode.get(value)
    if (!kebab) continue
    // lucide-react names its components with and without an `Icon` suffix and a `Lucide` prefix.
    for (const alias of [name, `${name}Icon`, `Lucide${name}`]) byExport.set(alias, kebab)
    exportsOf.set(kebab, [...(exportsOf.get(kebab) ?? []), name])
  }
  return { version, nodes, byExport, exportsOf }
}
