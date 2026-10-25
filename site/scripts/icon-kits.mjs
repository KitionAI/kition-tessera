#!/usr/bin/env node
/**
 * Writes `src/home/iconKits.json`: for each Tessera icon, the kits (and `kition`, `kit-ui`) whose
 * sources use it, from `scripts/lucide-usage.mjs --json`. The home page's galaxy groups and colors
 * icons by it. Rerun after `pnpm usage:lucide --write`.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = join(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(site, '..')
const perScope = JSON.parse(execFileSync('node', [join(root, 'scripts', 'lucide-usage.mjs'), '--json'], { encoding: 'utf8' }))
const registry = readFileSync(join(root, 'packages', 'icons', 'src', 'generated', 'registry.ts'), 'utf8')
const fromLucide = Object.fromEntries([...registry.matchAll(/^ {2}(\w+): "([a-z0-9-]+)",$/gm)].map((m) => [m[1], m[2]]))
// Tessera's own component names (`LayersIcon`, `ClipInsertIcon`) to icon names.
const generated = readFileSync(join(root, 'packages', 'icons', 'src', 'generated', 'icons.ts'), 'utf8')
for (const [, pascal, name] of generated.matchAll(/export const (\w+): IconData = \{ name: "([a-z0-9-]+)"/g)) fromLucide[`${pascal}Icon`] = name
const out = {}
for (const [scope, names] of Object.entries(perScope)) {
  for (const name of names) {
    const icon = fromLucide[name]
    if (!icon) continue
    out[icon] = [...new Set([...(out[icon] ?? []), scope])]
  }
}
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(join(site, 'src', 'home', 'iconKits.json'), JSON.stringify(sorted) + '\n')
console.log(`${Object.keys(sorted).length} icons`)
