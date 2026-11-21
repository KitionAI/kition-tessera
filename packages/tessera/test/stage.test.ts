/**
 * The rehearsal copy under another npm scope (scripts/stage-package.mjs, used by the Stage
 * workflow), on a fixture package packed as a tarball and unpacked as a folder.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error: a plain-JavaScript script without declarations
import { checkTarget, stageManifest, stagePackage } from '../../../scripts/stage-package.mjs'

const script = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'scripts', 'stage-package.mjs')

const MANIFEST = {
  name: '@kition/tessera',
  version: '0.1.1',
  description: 'Fixture',
  license: 'Apache-2.0',
  type: 'module',
  exports: { './tokens': { types: './dist/tokens/index.d.ts', default: './dist/tokens/index.js' }, './ui/styles.css': './dist/ui/styles.css' },
  files: ['dist', 'LICENSE', 'README.md'],
  sideEffects: ['**/*.css'],
  dependencies: { cmdk: '1.1.1' },
  peerDependencies: { react: '>=19', 'react-dom': '>=19' },
  peerDependenciesMeta: { react: { optional: true }, 'react-dom': { optional: true } },
  publishConfig: { access: 'public' },
  // A packed package keeps its scripts; staging must not run them.
  scripts: { prepack: 'exit 1' },
}
const FILES = {
  'README.md': '# @kition/tessera\n\n`pnpm add @kition/tessera`\n',
  LICENSE: 'Apache-2.0\n',
  'dist/tokens/index.js': 'export const tokens = {}\n',
  'dist/tokens/index.d.ts': 'export declare const tokens: object\n',
  'dist/ui/styles.css': '.kui-button {}\n',
}

const temps: string[] = []
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true })
})

/** A fixture package as `pnpm pack` leaves it: a folder, and its tarball. */
function fixture() {
  const base = mkdtempSync(join(tmpdir(), 'tessera-stage-'))
  temps.push(base)
  const dir = join(base, 'package')
  for (const [file, text] of Object.entries({ ...FILES, 'package.json': `${JSON.stringify(MANIFEST, null, 2)}\n` })) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), text)
  }
  const tarball = join(base, 'kition-tessera-0.1.1.tgz')
  execFileSync('tar', ['-czf', tarball, '-C', base, 'package'])
  return { base, dir, tarball }
}

const listTarball = (tarball: string) =>
  execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
    .split('\n')
    .filter((line) => line && !line.endsWith('/'))
    .map((line) => line.replace(/^package\//, ''))
    .sort()

describe('checkTarget', () => {
  it('takes an npm scope and a semantic version', () => {
    for (const scope of ['@kitionstage', '@kition', '@a', '@kition-stage-2']) expect(() => checkTarget(scope, '0.1.1-stage.7')).not.toThrow()
    for (const version of ['0.1.1', '0.1.1-stage.7', '1.0.0-rc.1', '0.0.0-stage']) expect(() => checkTarget('@kitionstage', version)).not.toThrow()
  })

  it('refuses another scope', () => {
    for (const scope of ['kitionstage', '@', '@Kition', '@-kition', '@kition/tessera', '@kition stage', '@kition_stage', '', undefined]) expect(() => checkTarget(scope, '0.1.1')).toThrow(/is not an npm scope/)
  })

  it('refuses a version that is not semver, and build metadata', () => {
    for (const version of ['0.1', 'v0.1.1', '01.1.1', '0.1.1-', '0.1.1-stage..1', '0.1.1-01', 'latest', '', undefined]) expect(() => checkTarget('@kitionstage', version)).toThrow(/is not a semantic version/)
    expect(() => checkTarget('@kitionstage', '0.1.1+build.5')).toThrow(/build metadata/)
  })
})

describe('stageManifest', () => {
  it('changes the name and version and nothing else, in place', () => {
    const staged = stageManifest(MANIFEST, '@kitionstage', '0.1.1-stage.7')
    expect(staged.name).toBe('@kitionstage/tessera')
    expect(staged.version).toBe('0.1.1-stage.7')
    expect({ ...staged, name: MANIFEST.name, version: MANIFEST.version }).toEqual(MANIFEST)
    expect(Object.keys(staged)).toEqual(Object.keys(MANIFEST))
    expect(MANIFEST.name).toBe('@kition/tessera')
  })

  it('moves an unscoped name into the scope', () => {
    expect(stageManifest({ name: 'tessera', version: '1.0.0' }, '@kitionstage', '1.0.1').name).toBe('@kitionstage/tessera')
  })
})

describe('stagePackage', () => {
  for (const kind of ['tarball', 'folder'] as const) {
    it(`stages a packed package given as a ${kind}`, () => {
      const { base, dir, tarball } = fixture()
      const out = join(base, 'out')
      const staged = stagePackage({ from: kind === 'tarball' ? tarball : dir, scope: '@kitionstage', version: '0.1.1-stage.7', out })
      expect(staged).toMatchObject({ name: '@kitionstage/tessera', version: '0.1.1-stage.7', from: { name: '@kition/tessera', version: '0.1.1' } })
      expect(staged.tarball).toBe(join(out, 'kitionstage-tessera-0.1.1-stage.7.tgz'))

      // The same files; package.json renamed and nothing else; the rest byte for byte.
      expect(listTarball(staged.tarball)).toEqual(Object.keys({ ...FILES, 'package.json': '' }).sort())
      const manifest = JSON.parse(execFileSync('tar', ['-xzOf', staged.tarball, 'package/package.json'], { encoding: 'utf8' }))
      expect(manifest).toEqual({ ...MANIFEST, name: '@kitionstage/tessera', version: '0.1.1-stage.7' })
      for (const [file, text] of Object.entries(FILES)) expect(execFileSync('tar', ['-xzOf', staged.tarball, `package/${file}`], { encoding: 'utf8' })).toBe(text)

      // The input is untouched.
      expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))).toEqual(MANIFEST)
    })
  }

  it('refuses a bad scope or version before writing anything', () => {
    const { base, tarball } = fixture()
    const out = join(base, 'out')
    expect(() => stagePackage({ from: tarball, scope: 'kitionstage', version: '0.1.1-stage.7', out })).toThrow(/is not an npm scope/)
    expect(() => stagePackage({ from: tarball, scope: '@kitionstage', version: 'next', out })).toThrow(/is not a semantic version/)
    expect(existsSync(out)).toBe(false)
  })

  it('refuses an output folder that is not empty, and a source folder', () => {
    const { base, tarball } = fixture()
    const out = join(base, 'out')
    mkdirSync(out)
    writeFileSync(join(out, 'old.tgz'), '')
    expect(() => stagePackage({ from: tarball, scope: '@kitionstage', version: '0.1.1-stage.7', out })).toThrow(/is not empty/)
    const source = join(base, 'source')
    mkdirSync(join(source, 'node_modules'), { recursive: true })
    writeFileSync(join(source, 'package.json'), JSON.stringify(MANIFEST))
    expect(() => stagePackage({ from: source, scope: '@kitionstage', version: '0.1.1-stage.7', out: join(base, 'out2') })).toThrow(/pass the packed package/)
  })
})

describe('the command', () => {
  it('prints the tarball, and exits 1 with a reason on a bad scope', () => {
    const { base, tarball } = fixture()
    const ok = spawnSync('node', [script, tarball, '@kitionstage', '0.1.1-stage.8', join(base, 'out')], { encoding: 'utf8' })
    expect(ok.status).toBe(0)
    expect(ok.stdout.trim()).toBe(join(base, 'out', 'kitionstage-tessera-0.1.1-stage.8.tgz'))
    const bad = spawnSync('node', [script, '--check', '@Kition', '0.1.1'], { encoding: 'utf8' })
    expect(bad.status).toBe(1)
    expect(bad.stderr).toMatch(/"@Kition" is not an npm scope/)
    expect(spawnSync('node', [script, '--check', '@kitionstage', '0.1.1-stage.8']).status).toBe(0)
  })
})
