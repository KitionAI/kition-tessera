#!/usr/bin/env node
/**
 * Moves code from lucide-react to Tessera Icons without changing what it draws.
 *
 *   node scripts/migrate-lucide.mjs <dir>... [--write]
 *
 * In every .ts/.tsx file under the directories (node_modules and dist skipped):
 *
 * - `import { Layers, Brush as BrushIcon, type LucideIcon } from 'lucide-react'` becomes
 *   `import { LayersIcon as Layers, BrushIcon, type IconComponent } from '@kition/tessera-icons/react'`,
 *   so the code that uses the names stays as it is. Names resolve through `FROM_LUCIDE`
 *   (canonical names and aliases).
 * - `LucideIcon` and `LucideProps`, imported without an alias, become `IconComponent` and
 *   `IconProps` in the file.
 * - Test selectors `.lucide-<name>` become `.tessera-icon-<name>`.
 * - Anything else from lucide-react (`createLucideIcon`, an icon Tessera does not have) stays in a
 *   lucide-react import and is reported; draw it into Tessera first (`packages/icons/svg/`).
 *
 * Without `--write` it only reports. `--skip-dirty` leaves alone every file git reports as changed
 * or untracked (someone else's work in progress). Exits 1 when something could not be moved.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const write = args.includes('--write')
const skipDirty = args.includes('--skip-dirty')
/** Take icons from kit-editor's TesseraIcons, for a kit whose package.json cannot gain @kition/tessera-icons yet. */
const viaKitUi = args.includes('--via-kit-ui')
const dirs = args.filter((arg) => !arg.startsWith('--'))

/** Absolute paths git reports as changed or untracked in the repository holding `dir`. */
function dirtyFiles(dir) {
  const top = execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
  const out = execFileSync('git', ['-C', top, 'status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8' })
  return new Set(out.split('\n').filter(Boolean).map((line) => resolve(top, line.slice(3).split(' -> ').pop())))
}
if (dirs.length === 0) {
  console.error('usage: migrate-lucide.mjs <dir>... [--write]')
  process.exit(2)
}

const registry = readFileSync(join(root, 'packages', 'icons', 'src', 'generated', 'registry.ts'), 'utf8')
const FROM_LUCIDE = Object.fromEntries([...registry.matchAll(/^ {2}(\w+): "([a-z0-9-]+)",$/gm)].map((m) => [m[1], m[2]]))
const NAMES = new Set(JSON.parse(/ICON_NAMES: readonly string\[\] = (\[[^\]]*\])/.exec(registry)[1]))
const TYPES = { LucideIcon: 'IconComponent', LucideProps: 'IconProps' }
/** lucide-react exports each icon as `Name`, `NameIcon`, and `LucideName`. */
const lucideName = (name) => [name, name.replace(/Icon$/, ''), name.replace(/^Lucide/, '')].find((candidate) => FROM_LUCIDE[candidate])
const pascal = (name) => name.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('')

function* files(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(ts|tsx)$/.test(entry)) yield path
  }
}

const IMPORT = /import\s+(type\s+)?\{([^}]*)\}\s+from\s+(['"])lucide-react\3(;?)/g

let changed = 0
let leftovers = 0
const skipped = []
for (const dir of dirs) {
  const dirty = skipDirty ? dirtyFiles(resolve(dir)) : new Set()
  for (const file of files(resolve(dir))) {
    const before = readFileSync(file, 'utf8')
    if (dirty.has(file)) {
      if (IMPORT.test(before) || /\.lucide-/.test(before)) skipped.push(relative(process.cwd(), file))
      IMPORT.lastIndex = 0
      continue
    }
    let text = before
    const renamedTypes = []
    const deferred = []
    const unresolved = []
    text = text.replace(IMPORT, (_, typeOnly, body, quote, semi) => {
      const moved = []
      const kept = []
      for (const raw of body.split(',').map((part) => part.trim()).filter(Boolean)) {
        const isType = Boolean(typeOnly) || raw.startsWith('type ')
        const spec = raw.replace(/^type\s+/, '')
        const [imported, alias] = spec.split(/\s+as\s+/).map((part) => part.trim())
        const local = alias ?? imported
        if (TYPES[imported]) {
          const target = TYPES[imported]
          if (!alias) renamedTypes.push([imported, target])
          moved.push(`type ${target}${alias ? ` as ${alias}` : ''}`)
        } else if (lucideName(imported)) {
          const component = `${pascal(FROM_LUCIDE[lucideName(imported)])}Icon`
          moved.push(`${isType ? 'type ' : ''}${component}${component === local ? '' : ` as ${local}`}`)
        } else {
          kept.push(raw)
          unresolved.push(imported)
        }
      }
      const out = []
      if (moved.length && viaKitUi) {
        const types = moved.filter((spec) => spec.startsWith('type '))
        const values = moved.filter((spec) => !spec.startsWith('type '))
        if (types.length) out.push(`import { ${types.join(', ')} } from ${quote}@kition/kit-editor${quote}${semi}`)
        if (values.length) {
          out.push(`import { TesseraIcons } from ${quote}@kition/kit-editor${quote}${semi}`)
          deferred.push(...values.map((spec) => {
            const [component, local = component] = spec.split(/\s+as\s+/)
            return `const ${local} = TesseraIcons.${component}`
          }))
        }
      } else if (moved.length) out.push(`import { ${moved.join(', ')} } from ${quote}@kition/tessera-icons/react${quote}${semi}`)
      if (kept.length) out.push(`import ${typeOnly ?? ''}{ ${kept.join(', ')} } from ${quote}lucide-react${quote}${semi}`)
      return out.join('\n')
    })
    for (const [from, to] of renamedTypes) text = text.replace(new RegExp(`\\b${from}\\b`, 'g'), to)
    if (deferred.length) {
      // After the last import statement: the icons, read from kit-editor's TesseraIcons.
      const imports = [...text.matchAll(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*$|^import\s+['"][^'"]+['"];?\s*$/gm)]
      const end = imports.length ? imports[imports.length - 1].index + imports[imports.length - 1][0].length : 0
      text = `${text.slice(0, end)}\n\n${deferred.join('\n')}\n${text.slice(end).replace(/^\n+/, '\n')}`
      // One import of TesseraIcons per file.
      let seen = false
      text = text.replace(/^import \{ TesseraIcons \} from ['"]@kition\/kit-ui['"];?\n/gm, (line) => (seen ? '' : ((seen = true), line)))
    }
    text = text.replace(/\.lucide-([a-z0-9-]+)/g, (match, name) => (NAMES.has(name) ? `.tessera-icon-${name}` : match))
    const where = relative(process.cwd(), file)
    if (text === before) {
      // Every name it imports is one Tessera lacks: nothing to rewrite, but still a leftover.
      if (unresolved.length) {
        leftovers += unresolved.length
        console.log(`${where}: kept in lucide-react: ${unresolved.join(', ')}`)
      }
      continue
    }
    changed++
    if (unresolved.length) {
      leftovers += unresolved.length
      console.log(`${where}: kept in lucide-react: ${unresolved.join(', ')}`)
    } else console.log(`${where}`)
    if (write) writeFileSync(file, text)
  }
}
for (const file of skipped) console.log(`${file}: skipped, changed by someone else`)
console.log(`${changed} files ${write ? 'rewritten' : 'to rewrite'}; ${leftovers} names left in lucide-react; ${skipped.length} changed files skipped`)
process.exit(leftovers > 0 ? 1 : 0)
