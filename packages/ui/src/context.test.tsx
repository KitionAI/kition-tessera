// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStrings, Element, ElementsProvider, StringsProvider, TESSERA_CATALOGS, useStrings, type Elements } from './context'
import { RibbonGroup } from './ui'
import enUS from '../locales/en-US.json'
import zhCN from '../locales/zh-CN.json'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let host: HTMLElement | null = null

function render(node: React.ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() => root!.render(node))
  return host
}

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = null
  host = null
})

function Label({ id, values }: { id: string; values?: Record<string, string | number> }) {
  return <span>{useStrings()(id, values)}</span>
}

describe('strings', () => {
  it('has every key in every locale', () => {
    expect(Object.keys(zhCN).sort()).toEqual(Object.keys(enUS).sort())
    for (const value of Object.values(zhCN)) expect(value).not.toBe('')
  })

  it('draws English without a provider', () => {
    expect(render(<Label id="levelMeter" />).textContent).toBe(enUS.levelMeter)
  })

  it('draws the provider strings', () => {
    const strings = createStrings({ ...TESSERA_CATALOGS, 'en-US': { ...TESSERA_CATALOGS['en-US'], levelMeter: 'Loudness' } }, 'en-GB')
    expect(render(<StringsProvider strings={strings}><Label id="levelMeter" /></StringsProvider>).textContent).toBe('Loudness')
  })

  it('falls back from a regional locale to its language, then English, then the key', () => {
    const t = createStrings({ 'en-US': { a: 'A', b: 'B {n}' }, zh: { a: 'zh-A' } }, 'zh-TW')
    expect(t('a')).toBe('zh-A')
    expect(t('b', { n: 2 })).toBe('B 2')
    expect(t('missing')).toBe('missing')
    expect(t('b', {})).toBe('B {n}')
  })
})

describe('elements', () => {
  const elements = (hidden: string[], disabled: string[], drawn = vi.fn()): Elements => ({
    state: (id) => ({ hidden: hidden.includes(id), disabled: disabled.includes(id) }),
    renderExtras: (place, as) => <span data-testid="extra">{`${place}/${as}`}</span>,
    drawn,
  })

  it('shows every element without a provider', () => {
    const out = render(<Element id="panel:layers">body</Element>)
    expect(out.textContent).toBe('body')
    expect(out.querySelector('fieldset')?.disabled).toBe(false)
    expect(out.querySelector('fieldset')?.getAttribute('data-kit-ui-id')).toBe('panel:layers')
  })

  it('hides and disables elements, and reports drawing them', () => {
    const drawn = vi.fn()
    const out = render(
      <ElementsProvider elements={elements(['panel:hidden'], ['panel:off'], drawn)}>
        <Element id="panel:hidden">hidden</Element>
        <Element id="panel:off">off</Element>
      </ElementsProvider>,
    )
    expect(out.textContent).toBe('off')
    expect(out.querySelector('fieldset')?.disabled).toBe(true)
    expect(drawn).toHaveBeenCalledWith('panel:hidden')
    expect(drawn).toHaveBeenCalledWith('panel:off')
  })

  it('ends a ribbon group with the extras for it', () => {
    const out = render(
      <ElementsProvider elements={elements([], [])}>
        <RibbonGroup id="group:home/clipboard" label="Clipboard">
          <button type="button">Paste</button>
        </RibbonGroup>
      </ElementsProvider>,
    )
    expect(out.querySelector('[data-testid="extra"]')?.textContent).toBe('group:home/clipboard/ribbon')
  })

  it('leaves out a hidden ribbon group', () => {
    const out = render(
      <ElementsProvider elements={elements(['group:home/clipboard'], [])}>
        <RibbonGroup id="group:home/clipboard" label="Clipboard">
          <button type="button">Paste</button>
        </RibbonGroup>
      </ElementsProvider>,
    )
    expect(out.textContent).toBe('')
  })
})
