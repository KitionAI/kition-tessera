import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
// @ts-expect-error: plain ESM build scripts without type declarations
import { toPath, toPaths } from '../scripts/geometry.mjs'
// @ts-expect-error: plain ESM build scripts without type declarations
import { lucideIndex } from '../scripts/lucide.mjs'
import { ChartScatter, Layers, gridStroke, toSvg } from '../src/index'
import { LayersIcon, createIcon } from '../src/react'
import { FROM_LUCIDE, ICONS, ICON_NAMES, KIT_ICONS } from '../src/registry'

const here = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(here, '..', 'icons.json'), 'utf8')) as { icons: Record<string, { source: string }> }

const SIZE = 48

function pixels(svg: string) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: SIZE }, background: 'white', font: { loadSystemFonts: false } }).render().pixels
}

/** Lucide's own markup for an icon, with Tessera's stroke, as the reference drawing. */
function lucideSvg(nodes: Array<[string, Record<string, string>]>) {
  const body = nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
}

/** Pixels whose gray level differs by more than `tolerance` (anti-aliasing at shape edges is allowed). */
function differing(a: Uint8Array, b: Uint8Array, tolerance = 48) {
  let count = 0
  for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) > tolerance) count++
  return count
}

describe('geometry', () => {
  it('turns shapes into paths', () => {
    expect(toPath(['line', { x1: '2', y1: '3', x2: '4', y2: '5' }])).toBe('M2 3L4 5')
    expect(toPath(['polyline', { points: '1 2 3 4 5 6' }])).toBe('M1 2L3 4L5 6')
    expect(toPath(['polygon', { points: '1,2 3,4 5,6' }])).toBe('M1 2L3 4L5 6z')
    expect(toPath(['rect', { x: '1', y: '2', width: '3', height: '4' }])).toBe('M1 2h3v4h-3z')
    expect(toPath(['circle', { cx: '12', cy: '12', r: '10' }])).toBe('M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0z')
  })

  it('clamps rounded corners to half the side', () => {
    expect(toPath(['rect', { x: '0', y: '0', width: '4', height: '2', rx: '5' }])).toBe('M2 0h0a2 1 0 0 1 2 1v0a2 1 0 0 1 -2 1h0a2 1 0 0 1 -2 -1v0a2 1 0 0 1 2 -1z')
  })

  it('separates filled shapes', () => {
    expect(toPaths([['path', { d: 'M1 1' }], ['circle', { cx: '1', cy: '1', r: '1', fill: 'currentColor' }]])).toEqual({
      paths: ['M1 1'],
      fills: ['M0 1a1 1 0 1 0 2 0a1 1 0 1 0 -2 0z'],
    })
  })

  it('refuses styling that would draw differently from the set', () => {
    expect(() => toPaths([['path', { d: 'M1 1', stroke: 'red' }]])).toThrow('non-geometry attributes: stroke')
    expect(() => toPaths([['path', { d: 'M1 1', fill: 'red' }]])).toThrow('only currentColor')
    expect(() => toPath(['text', {}])).toThrow('unsupported SVG element: text')
  })
})

describe('the lucide set', () => {
  let lucide: Awaited<ReturnType<typeof lucideIndex>>
  beforeAll(async () => {
    lucide = await lucideIndex()
  })

  it('draws every icon as lucide does', () => {
    const failures: string[] = []
    for (const [name, entry] of Object.entries(manifest.icons)) {
      if (!entry.source.startsWith('lucide:')) continue
      const expected = pixels(lucideSvg(lucide.nodes.get(entry.source.slice('lucide:'.length))))
      const actual = pixels(toSvg(ICONS[name], { color: 'black', strokeWidth: 1.75 }))
      const diff = differing(expected, actual)
      if (diff > 0) failures.push(`${name}: ${diff} pixels`)
    }
    expect(failures).toEqual([])
  })

  it('sees a drawing that is off by one grid unit', () => {
    const shifted = { ...Layers, paths: Layers.paths.map((d) => `M1 0${d.replace(/^M/, 'm')}`) }
    expect(differing(pixels(toSvg(Layers, { color: 'black' })), pixels(toSvg(shifted, { color: 'black' })))).toBeGreaterThan(20)
  })

  it('maps every lucide-react name the set covers', () => {
    expect(FROM_LUCIDE.Layers).toBe('layers')
    expect(FROM_LUCIDE.BarChart3).toBe(FROM_LUCIDE.ChartColumn)
    for (const name of Object.values(FROM_LUCIDE)) expect(ICONS[name]).toBeDefined()
  })
})

describe('icons', () => {
  it('lists every icon once, sorted', () => {
    expect(ICON_NAMES.length).toBe(Object.keys(manifest.icons).length)
    expect([...ICON_NAMES].sort()).toEqual(ICON_NAMES)
    expect(Object.keys(ICONS).length).toBe(ICON_NAMES.length)
  })

  it('keeps dots filled', () => {
    expect(ChartScatter.fills.length).toBeGreaterThan(0)
    expect(toSvg(ChartScatter, { color: '#5645d4' })).toContain('fill="#5645d4"')
  })

  it('scales the stroke only when asked', () => {
    expect(gridStroke({ size: 48 })).toBe(1.5)
    expect(gridStroke({ size: 48, strokeWidth: 2, absoluteStrokeWidth: true })).toBe(1)
  })

  it('escapes the color it writes', () => {
    expect(toSvg(Layers, { color: '"><script>' })).not.toContain('<script>')
  })

  it('lists the kit icons with both sizes', () => {
    for (const kit of ['note', 'table', 'board', 'photo', 'film', 'doc', 'sheet', 'slide', 'pdf', 'vector', 'design', 'effect', 'cad']) {
      expect(KIT_ICONS).toContain(kit)
    }
  })
})

describe('react', () => {
  it('renders an icon with lucide-react props', () => {
    const html = renderToStaticMarkup(<LayersIcon size={16} strokeWidth={2} className="tool" />)
    expect(html).toContain('width="16"')
    expect(html).toContain('stroke-width="2"')
    expect(html).toContain('class="tessera-icon tessera-icon-layers tool"')
    expect(html).toContain('aria-hidden="true"')
    expect(html.match(/<path /g)?.length).toBe(Layers.paths.length)
  })

  it('is labelled when given a label', () => {
    const html = renderToStaticMarkup(<LayersIcon aria-label="Layers" />)
    expect(html).not.toContain('aria-hidden')
    expect(html).toContain('aria-label="Layers"')
  })

  it('draws an icon of your own', () => {
    const Custom = createIcon({ name: 'custom', family: 'tool', paths: ['M1 1L2 2'], fills: ['M3 3h1v1h-1z'], accents: ['M5 5h4v4h-4z'] })
    const html = renderToStaticMarkup(<Custom color="#5645d4" />)
    expect(html).toContain('d="M1 1L2 2"')
    expect(html).toContain('fill="#5645d4"')
    // The accent sits first (under the strokes), in the skin's accent at 25%.
    expect(html.indexOf('M5 5h4v4h-4z')).toBeLessThan(html.indexOf('M1 1L2 2'))
    expect(html).toContain('class="tessera-icon-accent" fill="var(--kit-icon-accent, var(--kit-primary, currentColor))" stroke="none" style="fill-opacity:var(--tessera-icon-accent-opacity, 0.25)"')
    expect(renderToStaticMarkup(<Custom accent={false} />)).not.toContain('M5 5h4v4h-4z')
  })

  it('shows an interface icon’s accents only where the context or the caller asks', () => {
    const Ui = createIcon({ name: 'ui-custom', family: 'ui', paths: ['M1 1L2 2'], fills: [], accents: ['M5 5h4v4h-4z'] })
    // A tool rail sets --tessera-icon-accent-opacity; elsewhere the accent stays transparent.
    expect(renderToStaticMarkup(<Ui />)).toContain('style="fill-opacity:var(--tessera-icon-accent-opacity, 0)"')
    expect(renderToStaticMarkup(<Ui accent />)).toContain('style="fill-opacity:0.25"')
    expect(renderToStaticMarkup(<Ui accent="#00ff00" />)).toContain('fill="#00ff00"')
  })

  it('writes accents into SVG markup, or leaves them out', () => {
    const icon = { name: 'custom', family: 'tool' as const, paths: ['M1 1L2 2'], fills: [], accents: ['M5 5h4v4h-4z'] }
    expect(toSvg(icon, { accent: '#00ff00' })).toContain('<path d="M5 5h4v4h-4z" fill="#00ff00" fill-opacity="0.25" stroke="none"/>')
    expect(toSvg(icon, { accent: false })).not.toContain('M5 5h4v4h-4z')
    expect(toSvg(icon)).toContain('M5 5h4v4h-4z')
    // An interface icon draws plain line unless asked.
    const ui = { ...icon, family: 'ui' as const }
    expect(toSvg(ui)).not.toContain('M5 5h4v4h-4z')
    expect(toSvg(ui, { accent: true })).toContain('<path d="M5 5h4v4h-4z" fill="currentColor" fill-opacity="0.25" stroke="none"/>')
  })
})
