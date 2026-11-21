/**
 * The codemod that moves a consumer from `@kition/tessera-tokens`, `-icons` and `-ui` to
 * `@kition/tessera` (scripts/migrate-to-tessera.mjs), on fixture strings and a fixture folder.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error: a plain-JavaScript script without declarations
import { EXPORTS, isExported, migrate, rewriteManifest, rewriteSource, toTessera } from '../../../scripts/migrate-to-tessera.mjs'

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('toTessera', () => {
  it('maps each old specifier to its subpath', () => {
    expect(toTessera('@kition/tessera-ui')).toBe('@kition/tessera/ui')
    expect(toTessera('@kition/tessera-ui/styles.css')).toBe('@kition/tessera/ui/styles.css')
    expect(toTessera('@kition/tessera-icons/react')).toBe('@kition/tessera/icons/react')
    expect(toTessera('@kition/tessera-icons/kit/photo.svg')).toBe('@kition/tessera/icons/kit/photo.svg')
    expect(toTessera('@kition/tessera-tokens/tokens/skins/paper.tokens.json')).toBe('@kition/tessera/tokens/tokens/skins/paper.tokens.json')
    expect(toTessera('@kition/tessera-site')).toBeNull()
    expect(toTessera('@kition/tessera')).toBeNull()
    expect(toTessera('@kition/kit-editor')).toBeNull()
  })

  it('lists the exports of the package', () => {
    const manifest = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'))
    expect(Object.keys(manifest.exports).sort()).toEqual([...EXPORTS].sort())
    expect(isExported('@kition/tessera/ui/styles.css')).toBe(true)
    expect(isExported('@kition/tessera/icons/kit/photo.svg?url')).toBe(true)
    expect(isExported('@kition/tessera/ui/src/ui.tsx')).toBe(false)
    expect(isExported('@kition/tessera/icons/kit/')).toBe(false)
  })
})

describe('rewriteSource', () => {
  it('rewrites import, export, dynamic import, require and mock specifiers', () => {
    const before = [
      "import '@kition/tessera-ui/styles.css'",
      "import { Button } from '@kition/tessera-ui'",
      'import { LayersIcon, type IconComponent } from "@kition/tessera-icons/react"',
      "export { SKINS } from '@kition/tessera-tokens'",
      "export * from '@kition/tessera-icons'",
      "const tree = await import('@kition/tessera-ui/workspaceTree')",
      "const tokens = require('@kition/tessera-tokens/tokens/base.tokens.json')",
      "vi.mock('@kition/tessera-icons/registry', () => ({}))",
      "import photo from '@kition/tessera-icons/kit/photo.svg?url'",
      "declare module '@kition/tessera-ui' {}",
      '// @kition/tessera-ui in a comment stays',
      "const site = '@kition/tessera-site'",
    ].join('\n')
    const after = [
      "import '@kition/tessera/ui/styles.css'",
      "import { Button } from '@kition/tessera/ui'",
      'import { LayersIcon, type IconComponent } from "@kition/tessera/icons/react"',
      "export { SKINS } from '@kition/tessera/tokens'",
      "export * from '@kition/tessera/icons'",
      "const tree = await import('@kition/tessera/ui/workspaceTree')",
      "const tokens = require('@kition/tessera/tokens/tokens/base.tokens.json')",
      "vi.mock('@kition/tessera/icons/registry', () => ({}))",
      "import photo from '@kition/tessera/icons/kit/photo.svg?url'",
      "declare module '@kition/tessera/ui' {}",
      '// @kition/tessera-ui in a comment stays',
      "const site = '@kition/tessera-site'",
    ].join('\n')
    const { text, written } = rewriteSource(before)
    expect(text).toBe(after)
    expect(written).toHaveLength(10)
    expect(written.every(isExported)).toBe(true)
  })

  it('rewrites CSS imports, quoted or in url(), with or without ~', () => {
    const css = "@import '@kition/tessera-ui/styles.css';\n@import url(@kition/tessera-tokens/tokens.css);\n@import \"~@kition/tessera-tokens/tokens.css\";\n"
    expect(rewriteSource(css, { css: true }).text).toBe("@import '@kition/tessera/ui/styles.css';\n@import url(@kition/tessera/tokens/tokens.css);\n@import \"~@kition/tessera/tokens/tokens.css\";\n")
  })

  it('leaves text without the old names alone', () => {
    const text = "import { Button } from '@kition/tessera/ui'\nimport x from '@kition/tessera-uikit'\n"
    expect(rewriteSource(text).text).toBe(text)
  })
})

describe('rewriteManifest', () => {
  const manifest = (fields: object) => `${JSON.stringify({ name: 'kit', version: '0.1.0', ...fields }, null, 2)}\n`

  it('folds the three dependencies into one, in the place of the first', () => {
    const before = manifest({
      dependencies: { '@kition/kit-editor': '^0.1.0', '@kition/tessera-icons': '^0.1.1', '@kition/tessera-ui': '^0.1.1', react: '^19.0.0' },
      devDependencies: { '@kition/tessera-tokens': '^0.1.1', vite: '^6.0.0' },
    })
    const { text, problems } = rewriteManifest(before)
    expect(problems).toEqual([])
    const after = JSON.parse(text)
    expect(Object.entries(after.dependencies)).toEqual([
      ['@kition/kit-editor', '^0.1.0'],
      ['@kition/tessera', '^0.1.1'],
      ['react', '^19.0.0'],
    ])
    expect(after.devDependencies).toEqual({ '@kition/tessera': '^0.1.1', vite: '^6.0.0' })
    expect(text.endsWith('}\n')).toBe(true)
  })

  it('takes --range, or asks for it when the ranges differ', () => {
    const before = manifest({ dependencies: { '@kition/tessera-icons': '^0.1.0', '@kition/tessera-ui': '^0.1.1' } })
    expect(rewriteManifest(before).problems[0]).toMatch(/different ranges/)
    expect(JSON.parse(rewriteManifest(before, { range: '^0.1.1' }).text).dependencies).toEqual({ '@kition/tessera': '^0.1.1' })
  })

  it('points a linked checkout at packages/tessera', () => {
    const before = manifest({ dependencies: { '@kition/tessera-icons': 'link:../kition-tessera/packages/icons', '@kition/tessera-ui': 'link:../kition-tessera/packages/ui' } })
    expect(JSON.parse(rewriteManifest(before).text).dependencies).toEqual({ '@kition/tessera': 'link:../kition-tessera/packages/tessera' })
  })

  it('keeps an optional peer optional only when every old one was', () => {
    const optional = manifest({ peerDependencies: { '@kition/tessera-icons': '>=0.1.0' }, peerDependenciesMeta: { '@kition/tessera-icons': { optional: true } } })
    expect(JSON.parse(rewriteManifest(optional).text).peerDependenciesMeta).toEqual({ '@kition/tessera': { optional: true } })
    const mixed = manifest({ peerDependencies: { '@kition/tessera-icons': '>=0.1.0', '@kition/tessera-ui': '>=0.1.0' }, peerDependenciesMeta: { '@kition/tessera-icons': { optional: true } } })
    expect(JSON.parse(rewriteManifest(mixed).text).peerDependenciesMeta).toEqual({ '@kition/tessera': { optional: false } })
  })

  it('keeps an existing @kition/tessera entry, and reports names it cannot move', () => {
    const before = manifest({ dependencies: { '@kition/tessera': '^0.2.0', '@kition/tessera-ui': '^0.1.1' }, pnpm: { overrides: { '@kition/tessera-ui': '^0.1.1' } } })
    const { text, problems } = rewriteManifest(before)
    expect(JSON.parse(text).dependencies).toEqual({ '@kition/tessera': '^0.2.0' })
    expect(problems[0]).toMatch(/outside the dependency fields/)
  })

  it('leaves a manifest without the old names as it is', () => {
    const before = manifest({ dependencies: { react: '^19.0.0' } })
    expect(rewriteManifest(before)).toEqual({ text: before, problems: [] })
  })
})

describe('migrate', () => {
  it('rewrites a folder, skips node_modules and lockfiles, and only reports with check', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tessera-migrate-'))
    try {
      const files: Record<string, string> = {
        'package.json': `${JSON.stringify({ name: 'kit', dependencies: { '@kition/tessera-ui': '^0.1.1' } }, null, 2)}\n`,
        'src/App.tsx': "import '@kition/tessera-ui/styles.css'\nimport { Button } from '@kition/tessera-ui'\n",
        'src/theme.css': "@import '@kition/tessera-tokens/tokens.css';\n",
        'src/README.md': 'pnpm add @kition/tessera-ui\n',
        'pnpm-lock.yaml': "  '@kition/tessera-ui':\n    specifier: ^0.1.1\n",
        'node_modules/x/index.js': "import '@kition/tessera-ui'\n",
        'dist/app.js': "import '@kition/tessera-ui'\n",
      }
      for (const [file, text] of Object.entries(files)) {
        mkdirSync(dirname(join(dir, file)), { recursive: true })
        writeFileSync(join(dir, file), text)
      }
      const checked = migrate([dir], { check: true })
      expect(checked.changed.map((file: string) => file.slice(file.indexOf('tessera-migrate-')).split(/[/\\]/).slice(1).join('/')).sort()).toEqual(['package.json', 'src/App.tsx', 'src/theme.css'])
      expect(readFileSync(join(dir, 'src/App.tsx'), 'utf8')).toBe(files['src/App.tsx'])

      const done = migrate([dir])
      expect(done.problems).toEqual([])
      expect(readFileSync(join(dir, 'src/App.tsx'), 'utf8')).toBe("import '@kition/tessera/ui/styles.css'\nimport { Button } from '@kition/tessera/ui'\n")
      expect(readFileSync(join(dir, 'src/theme.css'), 'utf8')).toBe("@import '@kition/tessera/tokens/tokens.css';\n")
      expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).dependencies).toEqual({ '@kition/tessera': '^0.1.1' })
      for (const file of ['src/README.md', 'pnpm-lock.yaml', 'node_modules/x/index.js', 'dist/app.js']) expect(readFileSync(join(dir, file), 'utf8')).toBe(files[file])
      expect(migrate([dir], { check: true }).changed).toEqual([])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('reports a subpath the package does not export', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tessera-migrate-'))
    try {
      writeFileSync(join(dir, 'a.ts'), "import { x } from '@kition/tessera-ui/src/ui.tsx'\n")
      expect(migrate([dir], { check: true }).problems[0]).toMatch(/@kition\/tessera\/ui\/src\/ui\.tsx is not exported/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('the command', () => {
  const script = join(pkg, '..', '..', 'scripts', 'migrate-to-tessera.mjs')
  const run = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })

  it('checks, writes, and takes --range before or after the folder', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tessera-migrate-'))
    try {
      writeFileSync(join(dir, 'a.ts'), "import { Button } from '@kition/tessera-ui'\n")
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { '@kition/tessera-ui': '^0.1.0', '@kition/tessera-icons': '^0.1.1' } }))
      const checked = run(dir, '--check')
      expect(checked.status).toBe(1)
      expect(checked.stdout).toContain('would change')
      expect(checked.stderr).toMatch(/different ranges/)
      expect(run('--range', '^0.1.1', dir).status).toBe(0)
      expect(readFileSync(join(dir, 'a.ts'), 'utf8')).toBe("import { Button } from '@kition/tessera/ui'\n")
      expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).dependencies).toEqual({ '@kition/tessera': '^0.1.1' })
      expect(run(dir, '--check').status).toBe(0)
      expect(run().status).toBe(2)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
