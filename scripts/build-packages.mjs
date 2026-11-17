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
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

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

for (const name of selected) if (!PACKAGES.some(({ dir }) => dir === name)) throw new Error(`Unknown package: ${name}`)

for (const { dir, entries, modules, copy } of PACKAGES) {
  if (selected.length && !selected.includes(dir)) continue
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
