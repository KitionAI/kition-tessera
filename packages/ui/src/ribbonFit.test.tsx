// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { TypeIcon as Type } from '@kition/tessera-icons/react'
import { RibbonButton, RibbonFitContext, RibbonGroup, lineSize, ribbonGroupKey, type RibbonFit } from './ui'

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

const fit = (size: RibbonFit['size'], collapsed: string[] = []): RibbonFit => ({ size, collapsed: new Set(collapsed) })

function ribbon(value: RibbonFit) {
  return (
    <RibbonFitContext.Provider value={value}>
      <RibbonGroup label="Clipboard">
        <RibbonButton label="Paste" icon={Type} size="large" />
        <RibbonButton label="Plain" size="large" />
      </RibbonGroup>
      <RibbonGroup id="group:home/font" label="Font" icon={Type}>
        <RibbonButton label="Bold" icon={Type} />
      </RibbonGroup>
    </RibbonFitContext.Provider>
  )
}

const sizes = (out: HTMLElement) => [...out.querySelectorAll<HTMLElement>('[data-ribbon-group] > .kui-ribbon-group-body .kui-ribbon-button')].map((button) => `${button.getAttribute('aria-label')}:${button.dataset.size}`)

describe('RibbonFit', () => {
  it('draws large buttons small, then buttons with an icon as the icon alone, in a Classic ribbon giving way', () => {
    expect(lineSize('full', 'large', true, false, 'full')).toBe('large')
    expect(lineSize('full', 'large', true, false, 'small')).toBe('small')
    expect(lineSize('full', 'small', true, false, 'icon')).toBe('icon')
    expect(lineSize('full', 'large', false, false, 'icon')).toBe('small')
    // Single line's row keeps its own rule.
    expect(lineSize('primary', 'large', true, false, 'icon')).toBe('icon')
    expect(sizes(render(ribbon(fit('small'))))).toEqual(['Paste:small', 'Plain:small', 'Bold:small'])
  })

  it('marks every group with its key and collapses the named ones to one button that opens the group whole', () => {
    const out = render(ribbon(fit('icon', ['group:home/font'])))
    expect([...out.querySelectorAll<HTMLElement>('[data-ribbon-group]')].map((group) => group.dataset.ribbonGroup)).toEqual(['Clipboard', 'group:home/font'])
    expect(sizes(out)).toEqual(['Paste:icon', 'Plain:small'])
    const button = out.querySelector<HTMLButtonElement>('[data-testid="kui-ribbon-collapsed-group:home/font"]')
    expect(button?.textContent).toBe('Font')
    act(() => button?.click())
    const panel = document.querySelector('[data-testid="kui-ribbon-collapsed-panel-group:home/font"]')
    // The panel shows the group whole, at full size.
    expect(panel?.querySelector('[aria-label="Bold"]')?.getAttribute('data-size')).toBe('small')
    expect(ribbonGroupKey({ label: 'Clipboard' })).toBe('Clipboard')
  })
})
