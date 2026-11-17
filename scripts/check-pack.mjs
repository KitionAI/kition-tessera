#!/usr/bin/env node
/**
 * Builds and packs each package as `pnpm publish` would and checks the result: it holds its
 * README, its license files, and everything its `exports` point at; it leaves tests out; and it depends on the other Tessera packages by version, not by `workspace:`.
 *
 * Then it uses the packed packages as an app would, from a folder outside the workspace: Node
 * loads them and draws a component, TypeScript finds their types, and a bundle that takes one
 * button leaves the other components out. Nothing is published.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = mkdtempSync(join(tmpdir(), 'tessera-pack-'))
const problems = []
const tarballs = []
try {
  for (const name of ['tokens', 'icons', 'ui']) {
    const dir = join(root, 'packages', name)
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    execFileSync('pnpm', ['pack', '--pack-destination', out], { cwd: dir, stdio: 'pipe' })
    const tarball = join(out, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)
    const files = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).split('\n').filter(Boolean).map((file) => file.replace(/^package\//, ''))
    const packed = JSON.parse(execFileSync('tar', ['-xzOf', tarball, 'package/package.json'], { encoding: 'utf8' }))
    const fail = (message) => problems.push(`${manifest.name}: ${message}`)
    tarballs.push({ name: manifest.name, tarball })

    const required = ['README.md', 'LICENSE', 'package.json', ...(name === 'icons' ? ['NOTICE', 'LICENSE-lucide'] : [])]
    for (const file of required) if (!files.includes(file)) fail(`${file} is not packed`)
    for (const file of files) {
      if (/(^|\/)(test|tests|__tests__|testElements)([/.]|$)|\.(test|spec|testkit)\./.test(file)) fail(`test file packed: ${file}`)
      if (file.startsWith('src/')) fail(`unbuilt source packed: ${file}`)
      if (file.endsWith('.map')) {
        const map = JSON.parse(execFileSync('tar', ['-xzOf', tarball, `package/${file}`], { encoding: 'utf8' }))
        for (const path of [map.sourceRoot, map.file, ...(map.sources ?? [])].filter(Boolean)) {
          if (/^(?:\/|[a-z]:[\\/]|file:)|(?:^|[/\\])(?:Users|home)[/\\]/i.test(path)) fail(`local path in ${file}`)
        }
      }
    }
    // An export is a file, or `{ types, default }`: every file it names is packed.
    const targets = Object.entries(packed.exports ?? {}).flatMap(([key, target]) => (typeof target === 'string' ? [[key, target]] : Object.values(target).map((file) => [key, file])))
    for (const [key, target] of targets) {
      const path = String(target).replace(/^\.\//, '')
      if (path.includes('*')) {
        const prefix = path.slice(0, path.indexOf('*'))
        if (!files.some((file) => file.startsWith(prefix))) fail(`exports["${key}"] matches no packed file`)
      } else if (!files.includes(path)) fail(`exports["${key}"] points at ${path}, which is not packed`)
    }
    for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies'])
      for (const [dependency, range] of Object.entries(packed[field] ?? {})) if (/^(workspace|link|file):/.test(range)) fail(`${field}.${dependency} is "${range}"`)
    for (const field of ['description', 'license', 'repository', 'homepage', 'types']) if (!packed[field]) fail(`package.json has no ${field}`)
    if (!files.includes(packed.types?.replace(/^\.\//, ''))) fail('types points at a missing declaration')
    if (packed.private) fail('package is private')
    if (packed.publishConfig?.access !== 'public') fail('publishConfig.access is not public')
    if (packed.license !== 'Apache-2.0') fail('package license is not Apache-2.0')
    console.log(`${manifest.name}@${manifest.version}: ${files.length} files, ${statSync(tarball).size} bytes packed`)
  }

  // An app outside the workspace: the packed packages unpacked into its node_modules, and what
  // they depend on (React, Radix, cmdk) linked from this repository's install.
  const app = join(out, 'app')
  const modules = join(app, 'node_modules')
  mkdirSync(join(modules, '@kition'), { recursive: true })
  for (const { name, tarball } of tarballs) {
    const dir = join(modules, name)
    mkdirSync(dir, { recursive: true })
    execFileSync('tar', ['-xzf', tarball, '-C', dir, '--strip-components=1'])
  }
  for (const dependency of ['react', 'react-dom', 'radix-ui', 'cmdk']) symlinkSync(join(root, 'packages', 'ui', 'node_modules', dependency), join(modules, dependency))
  symlinkSync(join(root, 'node_modules', '@types'), join(modules, '@types'))
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'app', private: true, type: 'module' }))

  // Node loads the published packages as they are and draws a component.
  writeFileSync(
    join(app, 'run.mjs'),
    `import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button, ColorPicker, NumberField } from '@kition/tessera-ui'
import { validateTree } from '@kition/tessera-ui/workspaceTree'
import { Layers, toSvg } from '@kition/tessera-icons'
import { LayersIcon } from '@kition/tessera-icons/react'
import { ICON_NAMES, ICON_SEARCH } from '@kition/tessera-icons/registry'
import { SKINS, skinTheme } from '@kition/tessera-tokens'
const html = renderToStaticMarkup(createElement('div', null, createElement(Button, { variant: 'primary' }, createElement(LayersIcon, { size: 16 }), 'Save'), createElement(NumberField, { label: 'Opacity', value: 80, min: 0, max: 100, onChange() {} }), createElement(ColorPicker, { value: [86, 69, 212], onChange() {} })))
const checks = { button: html.includes('kui-button'), icon: html.includes('<svg'), svg: toSvg(Layers).startsWith('<svg'), icons: ICON_NAMES.length > 500 && ICON_SEARCH.trash.keywords.includes('delete'), skin: skinTheme('graphite').colorScheme === 'dark' && Object.keys(SKINS.paper.tokens).length === 15, tree: typeof validateTree === 'function' }
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name)
if (failed.length) { console.error('failed: ' + failed.join(', ')); process.exit(1) }
`,
  )
  try {
    execFileSync('node', ['run.mjs'], { cwd: app, stdio: 'pipe' })
    console.log('an app outside the workspace: Node loads the packages and draws components')
  } catch (error) {
    problems.push(`the packed packages do not run in Node: ${String(error.stderr ?? error).trim().split('\n').slice(0, 6).join(' | ')}`)
  }

  // TypeScript finds the packages' types.
  writeFileSync(
    join(app, 'app.tsx'),
    `import { Button, NumberField, type ButtonVariant } from '@kition/tessera-ui'
import { LayersIcon } from '@kition/tessera-icons/react'
import { drawIcon, Layers, type IconData } from '@kition/tessera-icons'
import { SKINS, type SkinId } from '@kition/tessera-tokens'
const variant: ButtonVariant = 'primary'
const skin: SkinId = 'paper'
const icon: IconData = Layers
export const scheme: 'light' | 'dark' = SKINS[skin].colorScheme
export const draw = (ctx: CanvasRenderingContext2D) => drawIcon(ctx, icon, 0, 0, { size: 16 })
export const view = (
  <>
    <Button variant={variant} size="md"><LayersIcon size={16} /> Save</Button>
    <NumberField label="Opacity" value={80} min={0} max={100} onChange={(value: number) => void value} />
  </>
)
`,
  )
  writeFileSync(join(app, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', lib: ['ES2022', 'DOM'], module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, noEmit: true, skipLibCheck: true, types: ['react'] }, include: ['app.tsx'] }))
  try {
    execFileSync(join(root, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.json'], { cwd: app, stdio: 'pipe' })
    console.log('an app outside the workspace: TypeScript finds the types')
  } catch (error) {
    problems.push(`the packed packages' types do not check: ${String(error.stdout ?? error).trim().split('\n').slice(0, 6).join(' | ')}`)
  }

  // A bundle that takes one button leaves the rest out.
  writeFileSync(join(app, 'one.mjs'), "import { Button } from '@kition/tessera-ui'\nconsole.log(Button)\n")
  const result = await build({ absWorkingDir: app, entryPoints: ['one.mjs'], bundle: true, format: 'esm', platform: 'browser', write: false, external: ['react', 'react-dom', 'react/jsx-runtime', 'radix-ui', 'cmdk'], logLevel: 'silent' })
  const bundle = result.outputFiles[0].text
  for (const absent of ['kui-curve', 'kui-level-meter', 'kui-workspace']) if (bundle.includes(absent)) problems.push(`a bundle that imports only Button also carries ${absent}: unused components are not dropped`)
  console.log(`an app outside the workspace: a bundle with one button is ${Math.round(bundle.length / 1024)} kB`)

  // CSS survives bundling and its token import resolves from the packed tokens package.
  writeFileSync(join(app, 'styles.mjs'), "import '@kition/tessera-ui/styles.css'\n")
  const styles = await build({ absWorkingDir: app, entryPoints: ['styles.mjs'], outdir: 'bundle', bundle: true, write: false, logLevel: 'silent' })
  const css = styles.outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? ''
  if (!css.includes('--kit-primary:') || !css.includes('.kui-button')) problems.push('the packed CSS or its theme tokens were dropped from the bundle')
  console.log('an app outside the workspace: CSS and theme tokens survive bundling')
} finally {
  rmSync(out, { recursive: true, force: true })
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
