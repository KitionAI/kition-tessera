#!/usr/bin/env node
/**
 * Checks that the copies of Tessera's tokens, kit icons and kit colors that still live in other
 * repositories match Tessera's, until those repositories import its packages:
 *
 * - kition-sdk `packages/kit-editor/src/styles.css`: imports `@kition/tessera-ui/styles.css` and declares no
 *   tokens of its own (or, before it did, the same `:root` and dark blocks);
 * - kition `public/kit-icons/` and `kits/kit-colors.json` (the kit icons and kit brand colors).
 *
 * The repositories are found as siblings of this one, or through `KITION_SDK_DIR` and
 * `KITION_DIR`. A missing repository is a failure, not a skip.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { declarations, load, toCss } from '../packages/tokens/scripts/tokens.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { base } = load(join(root, 'packages', 'tokens', 'tokens'))
const css = toCss(base)

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

// Kition's kit icons and kit colors (until Kition takes them from @kition/tessera-icons).
const kitDir = join(root, 'packages', 'icons', 'kit')
const kitionIcons = join(kition, 'public', 'kit-icons')
if (existsSync(kitionIcons)) {
  const ours = readdirSync(kitDir).filter((file) => file.endsWith('.svg')).sort()
  const theirs = readdirSync(kitionIcons).filter((file) => file.endsWith('.svg')).sort()
  for (const file of ours) {
    if (!theirs.includes(file)) fail(`kition public/kit-icons: ${file} missing`)
    else if (readFileSync(join(kitionIcons, file), 'utf8') !== readFileSync(join(kitDir, file), 'utf8')) fail(`kition public/kit-icons/${file} differs from Tessera's`)
  }
  for (const file of theirs) if (!ours.includes(file)) fail(`kition public/kit-icons/${file} is not a Tessera kit icon`)
} else if (existsSync(kition)) fail(`${kitionIcons} not found`)
const kitionColors = join(kition, 'kits', 'kit-colors.json')
if (existsSync(kitionColors)) {
  const ours = JSON.parse(readFileSync(join(kitDir, 'colors.json'), 'utf8'))
  const theirs = JSON.parse(readFileSync(kitionColors, 'utf8'))
  const brands = (colors) => Object.fromEntries(Object.entries(colors).filter(([key]) => !key.startsWith('$')).flatMap(([kit, color]) => [[`${kit}.light`, color.light], [`${kit}.dark`, color.dark]]))
  compare('kition kits/kit-colors.json', brands(theirs), brands(ours))
} else if (existsSync(kition)) fail(`${kitionColors} not found`)

if (failures.length > 0) {
  for (const message of failures) console.error(message)
  process.exit(1)
}
console.log('kit-editor matches Tessera tokens; Kition matches its kit icons and colors')
