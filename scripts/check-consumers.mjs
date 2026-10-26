#!/usr/bin/env node
/**
 * Checks that the copies of Tessera's tokens that still live in other repositories match the token
 * files, until those repositories import @kition/tessera-tokens:
 *
 * - kition-sdk `packages/kit-editor/src/styles.css`: imports `@kition/tessera-ui/styles.css` and declares no
 *   tokens of its own (or, before it did, the same `:root` and dark blocks);
 * - kition `src/features/kits/kition/kitionTheme.ts` (the Paper theme Kition sends to kits).
 *
 * The repositories are found as siblings of this one, or through `KITION_SDK_DIR` and
 * `KITION_DIR`. A missing repository is a failure, not a skip.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { declarations, load, skinTheme, toCss } from '../packages/tokens/scripts/tokens.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { base, skins } = load(join(root, 'packages', 'tokens', 'tokens'))
const css = toCss(base)
const paper = skinTheme(skins[0], base)

const failures = []
const fail = (message) => failures.push(message)

function repo(env, name) {
  const dir = process.env[env] ? resolve(process.env[env]) : resolve(root, '..', name)
  if (!existsSync(dir)) fail(`${name} not found at ${dir}; set ${env}`)
  return dir
}

function compare(label, actual, expected) {
  if (actual === null) return fail(`${label}: block not found`)
  for (const [name, value] of Object.entries(expected)) {
    if (!(name in actual)) fail(`${label}: ${name} missing`)
    else if (actual[name] !== value) fail(`${label}: ${name} is ${actual[name]}, Tessera has ${value}`)
  }
  for (const name of Object.keys(actual)) if (!(name in expected)) fail(`${label}: ${name} is not a Tessera token`)
}

const sdk = repo('KITION_SDK_DIR', 'kition-sdk')
const styles = join(sdk, 'packages', 'kit-editor', 'src', 'styles.css')
if (existsSync(styles)) {
  const text = readFileSync(styles, 'utf8')
  if (/@import\s+['"]@kition\/tessera-ui\/styles\.css['"]/.test(text)) {
    // kit-editor takes the tokens through Tessera's stylesheet; it must not declare its own.
    if (/(^|\n)\s*:root\s*(\[[^\]]*\])?\s*\{/.test(text.replace(/\/\*[\s\S]*?\*\//g, ''))) fail('kit-editor styles.css imports Tessera but still declares :root tokens')
  } else {
    for (const selector of [':root', ":root[data-color-scheme='dark']"]) {
      compare(`kit-editor styles.css ${selector}`, declarations(text, selector), declarations(css, selector))
    }
  }
} else if (existsSync(sdk)) fail(`${styles} not found`)

const kition = repo('KITION_DIR', 'kition')
const theme = join(kition, 'src', 'features', 'kits', 'kition', 'kitionTheme.ts')
if (existsSync(theme)) {
  const text = readFileSync(theme, 'utf8')
  /** @type {Record<string, string>} */
  const actual = {}
  for (const match of text.matchAll(/'(--kit-[\w-]+)':\s*'([^']*)'/g)) actual[match[1]] = match[2]
  // Kition sends the font stack its page computed, so the sans stack is not a literal there.
  const expected = { ...paper.tokens }
  delete expected['--kit-font-sans']
  compare('kition kitionTheme.ts', actual, expected)
} else if (existsSync(kition)) fail(`${theme} not found`)

if (failures.length > 0) {
  for (const message of failures) console.error(message)
  process.exit(1)
}
console.log('kit-editor and Kition match Tessera tokens')
