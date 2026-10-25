import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))

describe('PreviewDialog', () => {
  it('never calls the engine itself: the kit injects the preview functions', () => {
    const source = readFileSync(join(here, 'PreviewDialog.tsx'), 'utf8')
    // Every import, static or dynamic, as TypeScript reads them.
    const imports = ts.preProcessFile(source, true, true).importedFiles.map((file) => file.fileName)
    expect(imports.sort()).toEqual(['./context', './ui', 'react'])
    expect(source).not.toMatch(/\brequire\s*\(|\bimport\s*\(/)
    expect(source).not.toMatch(/previewBegin|previewEnd|postMessage|Worker|\.call\(|\.run\(/)
  })
})

describe('styles', () => {
  const css = readFileSync(join(here, 'styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

  it('fades a ribbon edge with an overlay, never a mask that would clip the popovers its menus open', () => {
    expect(css).not.toMatch(/mask(-image)?\s*:/)
    const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selectors, body]) => ({ selectors: selectors.split(',').map((item) => item.trim()), body }))
    for (const edge of ['::before', '::after']) {
      const fade = rules.filter((rule) => rule.selectors.includes(`.kui-overflow-strip${edge}`))
      expect(fade.some((rule) => /pointer-events:\s*none/.test(rule.body))).toBe(true)
    }
  })

  it('takes the theme tokens from @kition/tessera-tokens', () => {
    expect(css.trimStart().startsWith("@import '@kition/tessera-tokens/tokens.css';")).toBe(true)
    expect(css).not.toMatch(/:root\s*\{/)
  })
})

describe('licenses', () => {
  const root = join(here, '..', '..', '..')
  it('ships the license in every package, as the repository has it, so hosts list it in their notices', () => {
    const license = readFileSync(join(root, 'LICENSE'), 'utf8')
    for (const name of ['icons', 'tessera', 'tokens']) {
      const dir = join(root, 'packages', name)
      expect(readFileSync(join(dir, 'LICENSE'), 'utf8')).toBe(license)
      expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).files).toContain('LICENSE')
    }
    // Icons drawn from Lucide carry Lucide's licenses.
    expect(JSON.parse(readFileSync(join(root, 'packages', 'icons', 'package.json'), 'utf8')).files).toContain('LICENSE-lucide')
  })
})
