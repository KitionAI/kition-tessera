import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { highlight } from './Code'
import { ENTRIES, search } from './searchIndex'

const LIMIT = { page: 8, icon: 18, token: 6 }

describe('code highlighting', () => {
  it('colours code without changing a character of it', () => {
    const code = `import { Button } from '@kition/tessera-ui'\n// a note\nexport default function Demo() {\n  return <Button size="md" onClick={() => run(12.5)}>Save</Button>\n}`
    const text = renderToStaticMarkup(<>{highlight(code)}</>)
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
    expect(text).toBe(code)
  })

  it('marks keywords, strings, comments, tags and calls', () => {
    const html = renderToStaticMarkup(<>{highlight(`const a = 'x' // c\n<Button>{run(1)}</Button>`)}</>)
    for (const kind of ['keyword', 'string', 'comment', 'tag', 'call', 'number']) expect(html).toContain(`code-${kind}`)
  })
})

describe('the command palette search', () => {
  it('finds a component by its name first, and by the components its page documents', () => {
    expect(search('button', LIMIT)[0]).toMatchObject({ kind: 'page', id: 'button' })
    expect(search('ribbonbutton', LIMIT).some((entry) => entry.kind === 'page' && entry.id === 'ribbon')).toBe(true)
  })

  it('finds icons by name and by their lucide-react name, and tokens by name', () => {
    expect(search('layers', LIMIT).some((entry) => entry.kind === 'icon' && entry.id === 'layers')).toBe(true)
    expect(search('primary', LIMIT).some((entry) => entry.kind === 'token' && entry.id === '--kit-primary')).toBe(true)
    // By what people call an icon, in English and in Chinese.
    expect(search('delete', LIMIT).some((entry) => entry.kind === 'icon' && entry.id === 'trash')).toBe(true)
    expect(search('删除', LIMIT).some((entry) => entry.kind === 'icon' && entry.id === 'trash')).toBe(true)
  })

  it('needs every word to match, and keeps each kind within its limit', () => {
    expect(search('button zzzz', LIMIT)).toEqual([])
    expect(search('a', LIMIT).filter((entry) => entry.kind === 'icon').length).toBeLessThanOrEqual(LIMIT.icon)
    expect(search('   ', LIMIT)).toEqual([])
  })

  it('indexes every page, icon and token once', () => {
    const keys = ENTRIES.map((entry) => `${entry.kind}:${entry.id}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('skins inside an element', () => {
  it('carry the theme tokens and the dark values of Tessera’s own tokens', async () => {
    const { skinStyle } = await import('./skin')
    const paper = skinStyle('paper') as Record<string, string>
    const graphite = skinStyle('graphite') as Record<string, string>
    expect(paper['--kit-primary']).toBe('#5645d4')
    expect(graphite.colorScheme).toBe('dark')
    expect(graphite['--kui-chart-1']).not.toBe(paper['--kui-chart-1'])
  })
})
