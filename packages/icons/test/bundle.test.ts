/**
 * The published package as an app's bundler sees it: `pnpm build:packages` writes `dist/`, the
 * package is laid out as npm would install it (`publishConfig.exports`), and Rollup (through Vite,
 * as most apps bundle) builds an app that takes a few icons. Only those icons may reach the bundle.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, type Rollup } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AArrowDown, Layers, Trash, ZoomOut } from '../src/index'
import { PenLine } from '../src/generated/icons'

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(pkg, '..', '..')

/** The bundle below is about 2.4 kB minified; with every icon it was over 130 kB. */
const BUDGET = 8_000

let app: string

async function bundle(source: string) {
  writeFileSync(join(app, 'entry.js'), source)
  const result = await build({
    root: app,
    configFile: false,
    logLevel: 'silent',
    build: { write: false, minify: true, rollupOptions: { input: join(app, 'entry.js'), external: [/^react(\/|$)/] } },
  })
  const { output } = (Array.isArray(result) ? result[0] : result) as Rollup.RollupOutput
  return output.map((file) => (file.type === 'chunk' ? file.code : '')).join('')
}

beforeAll(() => {
  execFileSync('node', [join(root, 'scripts', 'build-packages.mjs'), 'icons'], { cwd: root, stdio: 'pipe' })
  app = mkdtempSync(join(tmpdir(), 'tessera-icons-bundle-'))
  const installed = join(app, 'node_modules', '@kition', 'tessera-icons')
  mkdirSync(installed, { recursive: true })
  cpSync(join(pkg, 'dist'), join(installed, 'dist'), { recursive: true })
  const manifest = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'))
  writeFileSync(join(installed, 'package.json'), JSON.stringify({ ...manifest, exports: manifest.publishConfig.exports }))
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'app', private: true, type: 'module' }))
}, 120_000)

afterAll(() => {
  if (app) rmSync(app, { recursive: true, force: true })
})

describe('the published package in an app bundle', () => {
  it('carries only the icons the app imports', async () => {
    const code = await bundle(
      "import { Layers, Trash, toSvg } from '@kition/tessera-icons'\nimport { PenLineIcon } from '@kition/tessera-icons/react'\nconsole.log(toSvg(Layers), toSvg(Trash), PenLineIcon)\n",
    )
    for (const icon of [Layers, Trash, PenLine]) expect(code.includes(icon.paths[0]), `${icon.name} is missing`).toBe(true)
    // Neither another icon's paths nor its name (the registry's `ICON_NAMES`) are in the bundle.
    for (const icon of [AArrowDown, ZoomOut]) {
      expect(code.includes(JSON.stringify(icon.name)), `the bundle names ${icon.name}`).toBe(false)
      expect(code.includes(icon.paths[0]), `the bundle carries ${icon.name}`).toBe(false)
    }
    expect(code.length, 'bundle bytes').toBeLessThan(BUDGET)
  }, 60_000)

  it('carries every icon when the app imports the registry', async () => {
    const code = await bundle("import { ICONS } from '@kition/tessera-icons/registry'\nconsole.log(ICONS)\n")
    for (const icon of [AArrowDown, Layers, ZoomOut]) expect(code.includes(icon.paths[0]), `${icon.name} is missing`).toBe(true)
  }, 60_000)
})
