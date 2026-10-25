#!/usr/bin/env node
/**
 * Writes the generated token files: the package's CSS and TypeScript and the `tessera-tokens`
 * crate's Rust. `--check` writes nothing and fails when a generated file is out of date.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load, toCss, toRust, toTs } from './tokens.mjs'

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(pkg, '..', '..')
const { base, skins } = load(join(pkg, 'tokens'))

const outputs = [
  [join(pkg, 'src', 'generated', 'tokens.css'), toCss(base)],
  [join(pkg, 'src', 'generated', 'tokens.ts'), toTs(base, skins)],
  [join(root, 'crates', 'tessera-tokens', 'src', 'generated.rs'), toRust(base, skins)],
]

const check = process.argv.includes('--check')
let stale = 0
for (const [file, text] of outputs) {
  let current = null
  try {
    current = readFileSync(file, 'utf8')
  } catch {}
  if (current === text) continue
  if (check) {
    console.error(`out of date: ${relative(root, file)}`)
    stale++
  } else {
    writeFileSync(file, text)
    console.log(`wrote ${relative(root, file)}`)
  }
}
if (stale > 0) {
  console.error('run `pnpm build:tokens`')
  process.exit(1)
}
