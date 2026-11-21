#!/usr/bin/env node
/**
 * Makes a rehearsal copy of a packed package under another npm scope (the Stage workflow,
 * .github/workflows/stage.yml): `@kition/tessera` becomes `<scope>/tessera` at a version of
 * one's choosing, and everything else in it (files, exports, dependencies, peers, README) stays
 * as packed. It works on a copy; the package it is given is not touched.
 *
 *   node scripts/stage-package.mjs <packed .tgz or unpacked folder> <scope> <version> <out folder>
 *     writes <out folder>/package/ and its tarball, and prints the tarball's path
 *   node scripts/stage-package.mjs --check <scope> <version>
 *     only checks the scope and the version
 *
 * Nothing is published.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** An npm scope: `@` and lowercase letters, digits and hyphens. */
export const SCOPE = /^@[a-z0-9][a-z0-9-]*$/

/** A semantic version (semver.org's expression), build metadata included. */
export const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

/** Throws unless `scope` is an npm scope and `version` a semantic version npm keeps as written. */
export function checkTarget(scope, version) {
  if (typeof scope !== 'string' || !SCOPE.test(scope)) throw new Error(`"${scope}" is not an npm scope (${SCOPE.source})`)
  if (typeof version !== 'string' || !SEMVER.test(version)) throw new Error(`"${version}" is not a semantic version`)
  // npm drops build metadata on publish, so the registry would list another version than asked.
  if (version.includes('+')) throw new Error(`"${version}" has build metadata, which npm drops: use a prerelease (-stage.1)`)
}

/** The manifest with its name moved to `scope` and its version set; every other field as it was. */
export function stageManifest(manifest, scope, version) {
  checkTarget(scope, version)
  const bare = /^(?:@[^/]+\/)?([^/]+)$/.exec(manifest.name ?? '')
  if (!bare) throw new Error(`"${manifest.name}" is not a package name`)
  // Assigning keeps each field where it is in package.json.
  return { ...manifest, name: `${scope}/${bare[1]}`, version }
}

/** Every file under a folder, relative to it, sorted. */
function listFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(dir.length + 1).split('\\').join('/'))
    .sort()
}

/**
 * Copies the packed package `from` (a tarball, or the folder it unpacks to) into
 * `<out>/package`, renames it, and packs the copy into `<out>`. Fails if the new tarball holds
 * other files than `from`, or another manifest than the renamed one.
 */
export function stagePackage({ from, scope, version, out }) {
  checkTarget(scope, version)
  from = resolve(from)
  out = resolve(out)
  if (!existsSync(from)) throw new Error(`${from} does not exist`)
  if (existsSync(out) && readdirSync(out).length) throw new Error(`${out} is not empty`)
  const dir = join(out, 'package')
  mkdirSync(dir, { recursive: true })
  if (statSync(from).isDirectory()) {
    if (existsSync(join(from, 'node_modules'))) throw new Error(`${from} has node_modules: pass the packed package (pnpm pack), not a source folder`)
    cpSync(from, dir, { recursive: true })
  } else {
    execFileSync('tar', ['-xzf', from, '-C', dir, '--strip-components=1'])
  }
  const manifestPath = join(dir, 'package.json')
  if (!existsSync(manifestPath)) throw new Error(`${from} has no package.json`)
  const text = readFileSync(manifestPath, 'utf8')
  const before = JSON.parse(text)
  const after = stageManifest(before, scope, version)
  // Written as pnpm writes it (two spaces, a final newline if it had one): only the two fields differ.
  writeFileSync(manifestPath, `${JSON.stringify(after, null, 2)}${text.endsWith('\n') ? '\n' : ''}`)

  // npm packs the copy as it is: no lifecycle script runs (a packed package keeps its
  // `prepack`, which builds from a checkout).
  const [packed] = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', out], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
  const tarball = join(out, packed.filename)
  const files = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
    .split('\n')
    .filter((line) => line && !line.endsWith('/'))
    .map((file) => file.replace(/^package\//, ''))
    .sort()
  const expected = listFiles(dir)
  const missing = expected.filter((file) => !files.includes(file))
  const extra = files.filter((file) => !expected.includes(file))
  if (missing.length || extra.length) throw new Error(`the staged tarball differs from the package: missing ${missing.join(', ') || 'none'}; extra ${extra.join(', ') || 'none'}`)
  const packedManifest = JSON.parse(execFileSync('tar', ['-xzOf', tarball, 'package/package.json'], { encoding: 'utf8' }))
  if (JSON.stringify(packedManifest) !== JSON.stringify(after)) throw new Error('npm changed package.json while packing')
  return { name: after.name, version, dir, tarball, from: { name: before.name, version: before.version } }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  try {
    if (args[0] === '--check') {
      if (args.length !== 3) throw new Error('usage: stage-package.mjs --check <scope> <version>')
      checkTarget(args[1], args[2])
      console.error(`${args[1]} and ${args[2]} are fine`)
    } else {
      if (args.length !== 4) throw new Error('usage: stage-package.mjs <packed .tgz or folder> <scope> <version> <out folder>')
      const [from, scope, version, out] = args
      const staged = stagePackage({ from, scope, version, out })
      console.error(`${staged.from.name}@${staged.from.version} staged as ${staged.name}@${staged.version}`)
      console.log(staged.tarball)
    }
  } catch (error) {
    console.error(`stage-package: ${error.message}`)
    process.exit(1)
  }
}
