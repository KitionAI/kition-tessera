#!/usr/bin/env node
/**
 * Builds what npm gets (pnpm build:packages): each package's `dist/`, the compiled form of its
 * `src/`. In this repository, and for kits that link a checkout, the packages are their
 * TypeScript source (`exports` in package.json); `publishConfig.exports` points the published
 * package at `dist/` instead, so an app needs no special bundler set-up.
 *
 * JavaScript: esbuild bundles each entry as an ES module, sharing chunks between a package's
 * entries (the icon data is in one place for `.`, `./react` and `./registry`) and leaving
 * dependencies as imports. Types: tsc writes the declarations. CSS is copied as it is.
 *
 * `@kition/tessera` (packages/tessera) is the three packages in one, each under its subpath
 * (`@kition/tessera/ui` is `@kition/tessera-ui`): its `dist/<x>/` is package x's `dist/` plus the
 * other files x publishes (`kit/`, `locales/`, the token JSON), and every import of another
 * Tessera package in them becomes a relative path, so it depends on none of them.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { PARTS } from './migrate-to-tessera.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const selected = process.argv.slice(2)

/** Each package: its entries (as `exports` names them), and the files copied beside them. */
export const PACKAGES = [
  { dir: 'tokens', entries: ['index.ts'], copy: [['src/generated/tokens.css', 'tokens.css']] },
  { dir: 'icons', entries: ['index.ts', 'react.ts', 'registry.ts'], copy: [] },
  // Every module of the components is an entry, so the output keeps one file per module and a
  // bundler drops the components an app does not use (package.json `sideEffects`).
  { dir: 'ui', entries: ['index.ts', 'workspaceTree.ts'], modules: true, copy: [['src/styles.css', 'styles.css']] },
]

/** The package made of the others. */
export const MERGED = 'tessera'

for (const name of selected) if (name !== MERGED && !PACKAGES.some(({ dir }) => dir === name)) throw new Error(`Unknown package: ${name}`)
const merged = !selected.length || selected.includes(MERGED)

for (const { dir, entries, modules, copy } of PACKAGES) {
  // The merged package is made from the others' fresh output.
  if (selected.length && !selected.includes(dir) && !merged) continue
  const pkg = join(root, 'packages', dir)
  const dist = join(pkg, 'dist')
  rmSync(dist, { recursive: true, force: true })
  await build({
    absWorkingDir: pkg,
    entryPoints: (modules ? readdirSync(join(pkg, 'src')).filter((name) => /\.tsx?$/.test(name) && !/\.test\./.test(name) && name !== 'testElements.tsx') : entries).map((entry) => join('src', entry)),
    outdir: 'dist',
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
    jsx: 'automatic',
    // Everything a package depends on stays an import: only its own source is bundled.
    packages: 'external',
    chunkNames: 'chunks/[name]-[hash]',
    sourcemap: true,
    logLevel: 'warning',
  })
  // Declarations (tsconfig.build.json): `./x.ts` imports are written as `./x.js`, so they resolve
  // beside the JavaScript.
  execFileSync(join(root, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.build.json'], { cwd: pkg, stdio: 'inherit' })
  for (const [from, to] of copy) {
    mkdirSync(dirname(join(dist, to)), { recursive: true })
    copyFileSync(join(pkg, from), join(dist, to))
  }
  console.log(`built packages/${dir}/dist`)
}

if (merged) assemble()

/**
 * packages/tessera/dist: for each part, its package's `dist/` and published files, with the
 * imports of the other Tessera packages made relative (`@kition/tessera-icons/react` in
 * `ui/Foo.js` becomes `../icons/react.js`) and their names in comments made the new subpaths.
 */
function assemble() {
  const dist = join(root, 'packages', MERGED, 'dist')
  rmSync(dist, { recursive: true, force: true })
  const manifests = {}
  for (const part of PARTS) {
    const pkg = join(root, 'packages', part)
    const manifest = (manifests[part] = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')))
    cpSync(join(pkg, 'dist'), join(dist, part), { recursive: true })
    // LICENSE is the package's own; each part's README is replaced by the package's.
    for (const file of manifest.files) if (!['dist', 'LICENSE', 'README.md'].includes(file)) cpSync(join(pkg, file), join(dist, part, file), { recursive: true })
  }

  /** Where an old specifier's file is in dist/, by its package's published exports. */
  const target = (specifier, kind) => {
    const [, part, rest = ''] = /^@kition\/tessera-(tokens|icons|ui)(\/.*)?$/.exec(specifier)
    const exports = manifests[part].publishConfig.exports
    const subpath = `.${rest}`
    let entry = exports[subpath]
    let star = ''
    if (!entry) {
      const key = Object.keys(exports).find((key) => key.endsWith('*') && subpath.startsWith(key.slice(0, -1)))
      if (!key) throw new Error(`${specifier} is not exported`)
      entry = exports[key]
      star = subpath.slice(key.length - 1)
    }
    let file = typeof entry === 'string' ? entry : kind === 'types' ? entry.types.replace(/\.d\.ts$/, '.js') : entry.default
    file = file.replace('*', star).replace(/^\.\//, '')
    return posix.join(part, file.replace(/^dist\//, ''))
  }

  const OLD = /(['"])(@kition\/tessera-(?:tokens|icons|ui)(?:\/[^'"\s]*)?)\1/g
  const NAMED = /@kition\/tessera-(tokens|icons|ui)(?![\w-])/g
  for (const file of readdirSync(dist, { recursive: true })) {
    const path = join(dist, file)
    const from = posix.dirname(file.split(sep).join('/'))
    if (file.endsWith('.js.map')) {
      // A map names its sources relative to it (`../src/index.ts`); the parts' would collide, so
      // part x's `src/` is named `src/x/` (not packed, as before) and its packed files as packed.
      const part = from.split('/')[0]
      const map = JSON.parse(readFileSync(path, 'utf8'))
      map.sources = map.sources.map((source) => {
        const inPackage = posix.join('dist', posix.relative(part, from), source)
        const moved = inPackage.startsWith('src/') ? posix.join('..', 'src', part, inPackage.slice(4)) : posix.join(part, inPackage)
        return posix.relative(from, moved)
      })
      writeFileSync(path, JSON.stringify(map))
      continue
    }
    const kind = file.endsWith('.d.ts') ? 'types' : file.endsWith('.js') ? 'js' : file.endsWith('.css') ? 'css' : null
    if (!kind) continue
    const text = readFileSync(path, 'utf8')
    let next = text
    // The parts' declarations name their modules `./ui` and `./ui.ts`; under moduleResolution
    // node16 a relative import needs the extension of what it loads: `./ui.js`.
    if (kind === 'types')
      next = next.replace(/((?:from|import\()\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (whole, before, quote, specifier) => {
        const base = specifier.replace(/\.tsx?$/, '')
        const at = join(dirname(path), base)
        const to = existsSync(`${at}.d.ts`) ? `${base}.js` : existsSync(join(at, 'index.d.ts')) ? `${base}/index.js` : null
        return to ? `${before}${quote}${to}${quote}` : whole
      })
    next = next
      .replace(OLD, (_, quote, specifier) => {
        const to = posix.relative(from, target(specifier, kind))
        return `${quote}${to.startsWith('.') ? to : `./${to}`}${quote}`
      })
      .replace(NAMED, '@kition/tessera/$1')
    if (next !== text) writeFileSync(path, next)
  }
  console.log(`built packages/${MERGED}/dist`)
}
