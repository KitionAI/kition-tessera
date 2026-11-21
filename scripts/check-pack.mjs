#!/usr/bin/env node
/**
 * Builds and packs each package as `pnpm publish` would and checks the result: it holds its
 * README, its license files, and everything its `exports` point at; it leaves tests out; and it depends on the other Tessera packages by version, not by `workspace:`.
 *
 * Then it uses the packed packages as an app would, from a folder outside the workspace: Node
 * loads them and draws a component, TypeScript finds their types, and a bundle that takes one
 * button leaves the other components out. Nothing is published.
 *
 * `@kition/tessera`, the three packages in one, gets the same in an app of its own where none
 * of the three is installed: its exports mirror theirs subpath for subpath, every file they
 * export is at its new path, Node and TypeScript (`bundler` and `node16`) resolve every subpath,
 * and esbuild and Vite bundle an app that takes one component.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { build as viteBuild } from 'vite'
import { EXPORTS, NEW_NAME, PARTS, toTessera } from './migrate-to-tessera.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const out = mkdtempSync(join(tmpdir(), 'tessera-pack-'))
const problems = []
const tarballs = []
/** Each package's packed manifest and unpacked folder, by directory name. */
const packedBy = {}

/** Every file under a folder, relative to it, with its size. */
function listFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const path = join(entry.parentPath, entry.name)
      return { file: path.slice(dir.length + 1).split('\\').join('/'), size: statSync(path).size }
    })
}

const kB = (bytes) => `${(bytes / 1024).toFixed(1)} kB`

/**
 * An app outside the workspace: the packed packages unpacked into its node_modules, and what
 * they depend on (React, Radix, cmdk) linked from this repository's install.
 */
function makeApp(folder, names) {
  const app = join(out, folder)
  const modules = join(app, 'node_modules')
  mkdirSync(join(modules, '@kition'), { recursive: true })
  for (const name of names) cpSync(packedBy[name].dir, join(modules, packedBy[name].manifest.name), { recursive: true })
  for (const dependency of ['react', 'react-dom', 'radix-ui', 'cmdk']) symlinkSync(join(root, 'packages', 'ui', 'node_modules', dependency), join(modules, dependency))
  symlinkSync(join(root, 'node_modules', '@types'), join(modules, '@types'))
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'app', private: true, type: 'module' }))
  return app
}

try {
  for (const name of ['tokens', 'icons', 'ui', 'tessera']) {
    const dir = join(root, 'packages', name)
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    execFileSync('pnpm', ['pack', '--pack-destination', out], { cwd: dir, stdio: 'pipe' })
    const tarball = join(out, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)
    const files = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).split('\n').filter(Boolean).map((file) => file.replace(/^package\//, ''))
    const packed = JSON.parse(execFileSync('tar', ['-xzOf', tarball, 'package/package.json'], { encoding: 'utf8' }))
    const fail = (message) => problems.push(`${manifest.name}: ${message}`)
    tarballs.push({ name: manifest.name, tarball })
    const unpacked = join(out, 'unpacked', name)
    mkdirSync(unpacked, { recursive: true })
    execFileSync('tar', ['-xzf', tarball, '-C', unpacked, '--strip-components=1'])
    packedBy[name] = { manifest: packed, dir: unpacked, files }

    const required = ['README.md', 'LICENSE', 'package.json', ...(name === 'icons' ? ['NOTICE', 'LICENSE-lucide'] : []), ...(name === 'tessera' ? ['NOTICE', 'dist/icons/NOTICE', 'dist/icons/LICENSE-lucide'] : [])]
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
    for (const [key, target] of Object.entries(packed.exports ?? {})) if (typeof target !== 'string' && !target.types) fail(`exports["${key}"] has no types`)
    for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies'])
      for (const [dependency, range] of Object.entries(packed[field] ?? {})) if (/^(workspace|link|file):/.test(range)) fail(`${field}.${dependency} is "${range}"`)
    for (const field of ['description', 'license', 'repository', 'homepage', 'bugs', 'keywords']) if (!packed[field]) fail(`package.json has no ${field}`)
    if (packed.repository?.directory !== `packages/${name}`) fail('repository.directory is not its folder')
    // `types` is the root export's; a package without one (`@kition/tessera`) has neither.
    if (packed.exports?.['.']) {
      if (!packed.types) fail('package.json has no types')
      if (!files.includes(packed.types?.replace(/^\.\//, ''))) fail('types points at a missing declaration')
    }
    if (packed.private) fail('package is private')
    if (packed.publishConfig?.access !== 'public') fail('publishConfig.access is not public')
    if (packed.license !== 'Apache-2.0') fail('package license is not Apache-2.0')

    const sizes = listFiles(unpacked).sort((a, b) => b.size - a.size)
    const total = sizes.reduce((sum, { size }) => sum + size, 0)
    console.log(`${manifest.name}@${manifest.version}: ${files.length} files, ${statSync(tarball).size} bytes packed, ${total} bytes unpacked`)
    console.log(`  largest: ${sizes.slice(0, 5).map(({ file, size }) => `${file} ${kB(size)}`).join(', ')}`)
  }

  // `@kition/tessera` is the three packages in one, at their version.
  const merged = packedBy.tessera.manifest
  const failMerged = (message) => problems.push(`${NEW_NAME}: ${message}`)
  for (const part of PARTS) if (packedBy[part].manifest.version !== merged.version) failMerged(`version ${merged.version} is not ${packedBy[part].manifest.name}'s ${packedBy[part].manifest.version}`)

  // An app outside the workspace with the three packages.
  const app = makeApp('app', PARTS)

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
  if (bundle.includes('"a-arrow-down"')) problems.push('a bundle that imports only Button also carries the icon a-arrow-down: unused icons are not dropped')
  console.log(`an app outside the workspace: a bundle with one button is ${Math.round(bundle.length / 1024)} kB`)

  // CSS survives bundling and its token import resolves from the packed tokens package.
  writeFileSync(join(app, 'styles.mjs'), "import '@kition/tessera-ui/styles.css'\n")
  const styles = await build({ absWorkingDir: app, entryPoints: ['styles.mjs'], outdir: 'bundle', bundle: true, write: false, logLevel: 'silent' })
  const css = styles.outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? ''
  if (!css.includes('--kit-primary:') || !css.includes('.kui-button')) problems.push('the packed CSS or its theme tokens were dropped from the bundle')
  console.log('an app outside the workspace: CSS and theme tokens survive bundling')

  await checkMerged(bundle.length, failMerged)
} finally {
  rmSync(out, { recursive: true, force: true })
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}

/**
 * `@kition/tessera` in an app where it is the only Tessera package: an import of the old names
 * left in it fails here. `oldButtonBytes` is the old packages' one-button bundle, for comparison.
 */
async function checkMerged(oldButtonBytes, fail) {
  const merged = packedBy.tessera
  const app = makeApp('app-tessera', ['tessera'])

  // Its own: no root export, no Tessera package among its dependencies, no old name left in its
  // code, types, or styles (source maps keep the sources as written).
  const manifest = merged.manifest
  if (manifest.exports['.'] || manifest.main || manifest.types) fail('has a root export: import a subpath')
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies'])
    for (const dependency of Object.keys(manifest[field] ?? {})) if (dependency.startsWith('@kition/')) fail(`${field} names ${dependency}`)
  for (const field of ['dependencies', 'peerDependencies', 'peerDependenciesMeta'])
    if (JSON.stringify(manifest[field] ?? {}) !== JSON.stringify(Object.fromEntries(Object.entries(packedBy.ui.manifest[field] ?? {}).filter(([name]) => !name.startsWith('@kition/'))))) fail(`${field} is not @kition/tessera-ui's (less the Tessera packages)`)
  if (JSON.stringify(manifest.sideEffects) !== JSON.stringify(['**/*.css'])) fail('sideEffects is not ["**/*.css"]')
  for (const file of merged.files) if (/\.(js|css|ts)$/.test(file) && /@kition\/tessera-(tokens|icons|ui)(?![\w-])/.test(readFileSync(join(merged.dir, file), 'utf8'))) fail(`${file} still names an old package`)

  // Its exports are the three packages', subpath for subpath (and the codemod's list).
  const mapping = PARTS.flatMap((part) => Object.keys(packedBy[part].manifest.exports).map((key) => [`${packedBy[part].manifest.name}${key.slice(1)}`, toTessera(`${packedBy[part].manifest.name}${key.slice(1)}`)]))
  const expected = mapping.map(([, specifier]) => `.${specifier.slice(NEW_NAME.length)}`)
  const actual = Object.keys(manifest.exports)
  if (JSON.stringify([...expected].sort()) !== JSON.stringify([...actual].sort())) fail(`exports ${actual.join(', ')} are not the three packages' ${expected.join(', ')}`)
  if (JSON.stringify([...EXPORTS].sort()) !== JSON.stringify([...actual].sort())) fail('exports differ from EXPORTS in scripts/migrate-to-tessera.mjs')
  for (const [key, target] of Object.entries(manifest.exports)) {
    const part = key.split('/')[1]
    const old = packedBy[part].manifest.exports[`.${key.slice(part.length + 2)}`]
    if (typeof old !== typeof target || (typeof old === 'object' && Object.keys(old).join() !== Object.keys(target).join())) fail(`exports["${key}"] has other conditions than ${packedBy[part].manifest.name}'s`)
  }
  console.log(`${NEW_NAME}: ${mapping.length} exports mirror the three packages'`)

  // Every file the old packages export is at its new path. Node resolves each new specifier
  // (import.meta.resolve, as an app's import would); JSON and SVG files are the same bytes.
  const specifiers = []
  for (const part of PARTS) {
    const { manifest: old, dir, files } = packedBy[part]
    for (const [key, target] of Object.entries(old.exports)) {
      const file = (typeof target === 'string' ? target : target.default).replace(/^\.\//, '')
      if (!key.includes('*')) specifiers.push({ old: `${old.name}${key.slice(1)}`, file: join(dir, file) })
      else for (const match of files.filter((name) => name.startsWith(file.slice(0, file.indexOf('*'))))) specifiers.push({ old: `${old.name}${key.slice(1).replace('*', match.slice(file.indexOf('*')))}`, file: join(dir, match) })
    }
  }
  writeFileSync(join(app, 'specifiers.json'), JSON.stringify(specifiers.map(({ old }) => toTessera(old))))
  writeFileSync(
    join(app, 'resolve.mjs'),
    `import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const resolved = {}
for (const specifier of JSON.parse(readFileSync('specifiers.json', 'utf8'))) {
  try { resolved[specifier] = fileURLToPath(import.meta.resolve(specifier)) } catch (error) { resolved[specifier] = null }
}
let root = 'resolved'
try { import.meta.resolve('@kition/tessera'); } catch (error) { root = error.code }
console.log(JSON.stringify({ resolved, root }))
`,
  )
  const { resolved, root: rootImport } = JSON.parse(execFileSync('node', ['resolve.mjs'], { cwd: app, encoding: 'utf8' }))
  if (rootImport !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') fail(`import '${NEW_NAME}' should fail with ERR_PACKAGE_PATH_NOT_EXPORTED, not ${rootImport}`)
  let same = 0
  for (const { old, file } of specifiers) {
    const specifier = toTessera(old)
    const path = resolved[specifier]
    if (!path) {
      fail(`${specifier} (was ${old}) does not resolve`)
      continue
    }
    if (/\.(json|svg)$/.test(file)) {
      if (!readFileSync(path).equals(readFileSync(file))) fail(`${specifier} is not the same file as ${old}`)
      else same++
    }
  }
  console.log(`${NEW_NAME}: Node resolves all ${specifiers.length} files the three packages export at their new paths (${same} JSON and SVG files byte for byte); the root import is not exported`)

  // Node loads every module subpath and draws components, in the app with no old package.
  const enUS = JSON.parse(readFileSync(join(packedBy.ui.dir, 'locales', 'en-US.json'), 'utf8'))
  writeFileSync(
    join(app, 'run.mjs'),
    `import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button, ColorPicker, NumberField, Combobox } from '@kition/tessera/ui'
import { validateTree } from '@kition/tessera/ui/workspaceTree'
import { Layers, toSvg } from '@kition/tessera/icons'
import { LayersIcon } from '@kition/tessera/icons/react'
import { ICON_NAMES, ICON_SEARCH, KIT_ICONS } from '@kition/tessera/icons/registry'
import { SKINS, skinTheme } from '@kition/tessera/tokens'
import enUS from '@kition/tessera/ui/locales/en-US.json' with { type: 'json' }
import paper from '@kition/tessera/tokens/tokens/skins/paper.tokens.json' with { type: 'json' }
import colors from '@kition/tessera/icons/kit/colors.json' with { type: 'json' }
const html = renderToStaticMarkup(createElement('div', null, createElement(Button, { variant: 'primary' }, createElement(LayersIcon, { size: 16 }), 'Save'), createElement(NumberField, { label: 'Opacity', value: 80, min: 0, max: 100, onChange() {} }), createElement(ColorPicker, { value: [86, 69, 212], onChange() {} })))
const checks = { button: html.includes('kui-button'), icon: html.includes('<svg'), svg: toSvg(Layers).startsWith('<svg'), icons: ICON_NAMES.length > 500 && ICON_SEARCH.trash.keywords.includes('delete'), kits: Object.keys(KIT_ICONS).length === 16 && Object.keys(colors).length > 0, skin: skinTheme('graphite').colorScheme === 'dark' && Object.keys(SKINS.paper.tokens).length === 15, tree: typeof validateTree === 'function', combobox: typeof Combobox === 'function', locale: Object.keys(enUS).length === ${Object.keys(enUS).length}, tokens: typeof paper === 'object' }
let rootImport = 'resolved'
try { await import('@kition/tessera') } catch (error) { rootImport = error.code }
if (rootImport !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') checks.rootImport = false
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name)
if (failed.length) { console.error('failed: ' + failed.join(', ')); process.exit(1) }
`,
  )
  try {
    execFileSync('node', ['run.mjs'], { cwd: app, stdio: 'pipe' })
    console.log(`${NEW_NAME}: Node loads every subpath (modules and JSON) and draws components`)
  } catch (error) {
    fail(`does not run in Node: ${String(error.stderr ?? error).trim().split('\n').slice(0, 6).join(' | ')}`)
  }

  // TypeScript finds the types of every module subpath, under `bundler` and `node16`; the root
  // import is an error.
  writeFileSync(
    join(app, 'app.tsx'),
    `import { Button, IconButton, NumberField, type ButtonVariant, type IconComponent } from '@kition/tessera/ui'
import { validateTree, type WorkspaceNode } from '@kition/tessera/ui/workspaceTree'
import { LayersIcon } from '@kition/tessera/icons/react'
import { drawIcon, Layers, type IconData } from '@kition/tessera/icons'
import { ICON_NAMES } from '@kition/tessera/icons/registry'
import { SKINS, type SkinId } from '@kition/tessera/tokens'
const variant: ButtonVariant = 'primary'
const skin: SkinId = 'paper'
const icon: IconData = Layers
// An icon of the icons subpath is the icon type the components take: one module, not two.
const layers: IconComponent = LayersIcon
export const names: readonly string[] = ICON_NAMES
export const tree: WorkspaceNode | undefined = validateTree(null, new Set())
export const scheme: 'light' | 'dark' = SKINS[skin].colorScheme
export const draw = (ctx: CanvasRenderingContext2D) => drawIcon(ctx, icon, 0, 0, { size: 16 })
export const view = (
  <>
    <IconButton icon={layers} label="Layers" />
    <Button variant={variant} size="md"><LayersIcon size={16} /> Save</Button>
    <NumberField label="Opacity" value={80} min={0} max={100} onChange={(value: number) => void value} />
  </>
)
`,
  )
  writeFileSync(join(app, 'root.ts'), "export * from '@kition/tessera'\n")
  const base = { target: 'ES2022', lib: ['ES2022', 'DOM'], jsx: 'react-jsx', strict: true, noEmit: true, skipLibCheck: false, types: ['react'] }
  const tsc = (config, files) => {
    writeFileSync(join(app, 'tsconfig.json'), JSON.stringify({ compilerOptions: { ...base, ...config }, include: files }))
    try {
      execFileSync(join(root, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.json'], { cwd: app, stdio: 'pipe' })
      return ''
    } catch (error) {
      return String(error.stdout ?? error).trim() || 'failed'
    }
  }
  for (const [resolution, config] of [
    ['bundler', { module: 'ESNext', moduleResolution: 'Bundler' }],
    ['node16', { module: 'Node16', moduleResolution: 'Node16' }],
  ]) {
    const errors = tsc(config, ['app.tsx'])
    if (errors) fail(`types do not check under moduleResolution ${resolution}: ${errors.split('\n').slice(0, 6).join(' | ')}`)
    const rootErrors = tsc(config, ['root.ts'])
    if (!rootErrors.includes('TS2307')) fail(`TypeScript (${resolution}) resolves the root import`)
  }
  console.log(`${NEW_NAME}: TypeScript finds the types of every subpath under moduleResolution bundler and node16, with the packed declarations checked (skipLibCheck off)`)

  // A bundle that takes one button leaves the rest out (esbuild), the same as the old packages.
  const external = ['react', 'react-dom', 'react/jsx-runtime', 'radix-ui', 'cmdk']
  writeFileSync(join(app, 'one.mjs'), "import { Button } from '@kition/tessera/ui'\nconsole.log(Button)\n")
  const one = (await build({ absWorkingDir: app, entryPoints: ['one.mjs'], bundle: true, format: 'esm', platform: 'browser', write: false, external, logLevel: 'silent' })).outputFiles[0].text
  for (const absent of ['kui-curve', 'kui-level-meter', 'kui-workspace']) if (one.includes(absent)) fail(`a bundle that imports only Button also carries ${absent}`)
  if (one.includes('"a-arrow-down"')) fail('a bundle that imports only Button also carries the icon a-arrow-down')
  writeFileSync(join(app, 'icon.mjs'), "import { Layers } from '@kition/tessera/icons'\nimport { PenLineIcon } from '@kition/tessera/icons/react'\nconsole.log(Layers, PenLineIcon)\n")
  const icon = (await build({ absWorkingDir: app, entryPoints: ['icon.mjs'], bundle: true, format: 'esm', platform: 'browser', write: false, external, logLevel: 'silent' })).outputFiles[0].text
  if (icon.includes('"a-arrow-down"') || !icon.includes('"layers"')) fail('a bundle that imports two icons does not carry exactly those')
  console.log(`${NEW_NAME}: esbuild bundles one button in ${kB(one.length)} (the old packages: ${kB(oldButtonBytes)}) and two icons in ${kB(icon.length)}`)

  // The stylesheet, its theme tokens through the relative import, with esbuild.
  writeFileSync(join(app, 'styles.mjs'), "import '@kition/tessera/ui/styles.css'\n")
  const styles = await build({ absWorkingDir: app, entryPoints: ['styles.mjs'], outdir: 'bundle', bundle: true, write: false, logLevel: 'silent' })
  const css = styles.outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? ''
  if (!css.includes('--kit-primary:') || !css.includes('.kui-button')) fail('the CSS or its theme tokens were dropped from an esbuild bundle')

  // An app as kits build theirs: Vite (Rollup) with the stylesheet and one component.
  writeFileSync(join(app, 'main.js'), "import '@kition/tessera/ui/styles.css'\nimport { Button } from '@kition/tessera/ui'\nimport { LayersIcon } from '@kition/tessera/icons/react'\nconsole.log(Button, LayersIcon)\n")
  const vite = await viteBuild({ root: app, configFile: false, logLevel: 'silent', build: { write: false, minify: true, rollupOptions: { input: join(app, 'main.js'), external: [/^react(\/|-dom|$)/, /^radix-ui/, /^cmdk/] } } })
  const output = (Array.isArray(vite) ? vite[0] : vite).output
  const js = output.filter((file) => file.type === 'chunk').map((file) => file.code).join('')
  const viteCss = output.filter((file) => file.type === 'asset' && file.fileName.endsWith('.css')).map((file) => String(file.source)).join('')
  if (!viteCss.includes('--kit-primary:') || !viteCss.includes('.kui-button')) fail('the CSS or its theme tokens were dropped from a Vite bundle')
  if (js.includes('kui-curve') || js.includes('"a-arrow-down"')) fail('a Vite bundle that imports Button and one icon carries unused components or icons')
  console.log(`${NEW_NAME}: Vite bundles an app with the stylesheet and one button: ${kB(js.length)} JS, ${kB(viteCss.length)} CSS`)
}
