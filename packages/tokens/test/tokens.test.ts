import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error: plain ESM build script without type declarations
import { declarations, flatten, load, readSkin, skinTheme as themeOf, toCss } from '../scripts/tokens.mjs'
import { KHP_TOKENS, SKINS, SKIN_IDS, TOKENS, skinTheme } from '../src/index'

const here = dirname(fileURLToPath(import.meta.url))
const tokensDir = join(here, '..', 'tokens')
const fixture = readFileSync(join(here, 'fixtures', 'kit-ui-root.css'), 'utf8')
const css = readFileSync(join(here, '..', 'src', 'generated', 'tokens.css'), 'utf8')

/** The Kit UI protocol's theme token table (section 4), in its order. */
const PROTOCOL_TOKENS = [
  '--kit-font-sans',
  '--kit-font-mono',
  '--kit-surface',
  '--kit-surface-muted',
  '--kit-canvas',
  '--kit-text',
  '--kit-text-muted',
  '--kit-border',
  '--kit-primary',
  '--kit-primary-text',
  '--kit-primary-soft',
  '--kit-danger',
  '--kit-radius-control',
  '--kit-radius-card',
  '--kit-shadow-card',
]

describe('tokens', () => {
  it('marks exactly the Kit UI protocol theme tokens as KHP tokens', () => {
    expect([...KHP_TOKENS]).toEqual(PROTOCOL_TOKENS)
  })

  // Tokens added since (status tones, the chart palette) come on top of these.
  it('keeps every :root variable kit-editor declared, with its value', () => {
    expect(declarations(css, ':root')).toMatchObject(declarations(fixture, ':root'))
  })

  it('keeps every dark override kit-editor declared, with its value', () => {
    expect(declarations(css, ":root[data-color-scheme='dark']")).toMatchObject(declarations(fixture, ":root[data-color-scheme='dark']"))
  })

  it('keeps the design rules of kition docs/design.md in Paper', () => {
    expect(SKINS.paper.colorScheme).toBe('light')
    expect(SKINS.paper.tokens['--kit-primary']).toBe('#5645d4')
    expect(SKINS.paper.tokens['--kit-surface']).toBe('#ffffff')
    expect(SKINS.paper.tokens['--kit-radius-control']).toBe('8px')
    expect(SKINS.paper.tokens['--kit-radius-card']).toBe('12px')
  })

  it('gives every skin every theme token', () => {
    expect(SKIN_IDS[0]).toBe('paper')
    for (const id of SKIN_IDS) expect(Object.keys(SKINS[id].tokens)).toEqual(PROTOCOL_TOKENS)
    expect(SKINS.graphite.colorScheme).toBe('dark')
    expect(SKINS.graphite.tokens['--kit-radius-card']).toBe('12px')
  })

  it('keeps text readable in every skin (WCAG AA, 4.5:1)', () => {
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const contrast = (a: string, b: string) => {
      const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
      return (x + 0.05) / (y + 0.05)
    }
    for (const id of SKIN_IDS) {
      const tokens = SKINS[id].tokens
      expect(contrast(tokens['--kit-primary'], tokens['--kit-primary-text']), `${id}: primary text`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(tokens['--kit-surface'], tokens['--kit-text']), `${id}: text`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(tokens['--kit-surface'], tokens['--kit-text-muted']), `${id}: muted text`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('hands out copies of a skin theme', () => {
    const theme = skinTheme('paper')!
    theme.tokens['--kit-primary'] = '#000000'
    expect(SKINS.paper.tokens['--kit-primary']).toBe('#5645d4')
    expect(skinTheme('missing')).toBeNull()
  })

  it('lists tokens once each', () => {
    expect(new Set(TOKENS.map((token) => token.name)).size).toBe(TOKENS.length)
  })
})

describe('token files', () => {
  const { base } = load(tokensDir)

  it('rejects a skin that overrides a token the base does not define', () => {
    const skin = { $extensions: { 'ai.kition.tessera': { skin: 'bad', colorScheme: 'light' } }, kit: { nope: { $value: '#000' } } }
    expect(() => readSkin(skin, base)).toThrow('--kit-nope is not a base token')
  })

  it('rejects a skin without a color scheme', () => {
    expect(() => readSkin({ $extensions: { 'ai.kition.tessera': { skin: 'bad' } } }, base)).toThrow('colorScheme')
  })

  it('rejects a token whose value is not a CSS string', () => {
    expect(() => flatten({ kit: { size: { $value: 8 } } })).toThrow('kit.size: $value must be a CSS string')
  })

  it('rejects a token defined twice', () => {
    expect(() => flatten({ kit: { 'a-b': { $value: '1' } }, 'kit-a': { b: { $value: '2' } } })).toThrow('--kit-a-b is defined twice')
  })

  it('sends only theme tokens to hosts', () => {
    const theme = themeOf({ id: 'x', colorScheme: 'dark', description: '', overrides: { '--kit-text': '#fff' } }, base)
    expect(theme.colorScheme).toBe('dark')
    expect(theme.tokens['--kit-text']).toBe('#fff')
    expect(theme.tokens['--kui-bar-height']).toBeUndefined()
  })

  it('writes a dark block only for tokens with a dark value', () => {
    expect(toCss(flatten({ kit: { a: { $value: '1' } } }))).not.toContain('data-color-scheme')
  })
})
