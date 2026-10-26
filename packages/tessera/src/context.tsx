/** @jsxRuntime automatic */
/**
 * What Tessera's components ask of the editor around them, through two small contexts. Both work
 * without a provider (tests, a page of their own): English strings, every element shown.
 *
 * - Strings: the text components draw (labels, accessible names), by key. An editor provides its
 *   own lookup, which may override any of Tessera's keys and add locales.
 * - Elements: whether an element with an id is hidden or disabled, and extra items to draw at a
 *   place. A Kit Harness Protocol editor backs it with the host's UI configuration (Kit UI
 *   protocol, section 9); `@kition/kit-ui` does.
 */
import { createContext, useContext, type ReactNode } from 'react'
import enUS from '../locales/en-US.json'
import zhCN from '../locales/zh-CN.json'

export type Catalog = Record<string, string>
export type Strings = (key: string, values?: Record<string, string | number>) => string

/** Tessera's own strings by locale; `en-US` has every key. */
export const TESSERA_CATALOGS: Readonly<Record<string, Catalog>> = { 'en-US': enUS, 'zh-CN': zhCN }

/**
 * A lookup over catalogs by locale. Falls back from `zh-CN` to `zh` to `en-US`, then to the key
 * itself; `{name}` placeholders take `values`.
 */
export function createStrings(catalogs: Readonly<Record<string, Catalog>>, locale: string): Strings {
  const chain = [locale, locale.split('-')[0], 'en-US']
    .map((tag) => catalogs[tag] ?? Object.entries(catalogs).find(([key]) => key.split('-')[0] === tag)?.[1])
    .filter((catalog): catalog is Catalog => Boolean(catalog))
  return (key, values) => {
    const text = chain.find((catalog) => key in catalog)?.[key] ?? key
    return values ? text.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match)) : text
  }
}

const ENGLISH = createStrings(TESSERA_CATALOGS, 'en-US')

export const StringsContext = createContext<Strings | null>(null)

/** The strings here: the editor's when it provides them, Tessera's English otherwise. */
export function useStrings(): Strings {
  return useContext(StringsContext) ?? ENGLISH
}

export function StringsProvider({ strings, children }: { strings: Strings; children: ReactNode }) {
  return <StringsContext.Provider value={strings}>{children}</StringsContext.Provider>
}

export type ElementState = { hidden: boolean; disabled: boolean }

/** Where extra items go: a menu's end, a ribbon group's end, or the action buttons. */
export type ExtrasKind = 'menu' | 'ribbon' | 'action'

export type Elements = {
  /** Whether the element with this id is hidden or disabled. */
  state: (id: string) => ElementState
  /** Extra items to draw at a place (an element id), such as a host's own buttons. */
  renderExtras: (place: string, as: ExtrasKind) => ReactNode
  /** Called when a component draws an element with an id; editors use it to warn about ids they did not declare. */
  drawn: (id: string) => void
}

const SHOWN: ElementState = { hidden: false, disabled: false }
const NONE: Elements = { state: () => SHOWN, renderExtras: () => null, drawn: () => undefined }

export const ElementsContext = createContext<Elements | null>(null)

/** The element states here; outside an editor, every element is shown and enabled. */
export function useElements(): Elements {
  return useContext(ElementsContext) ?? NONE
}

export function ElementsProvider({ elements, children }: { elements: Elements; children: ReactNode }) {
  return <ElementsContext.Provider value={elements}>{children}</ElementsContext.Provider>
}

/**
 * Content that belongs to one element: not drawn when hidden; its form controls disabled when
 * disabled. A `fieldset` disables every control inside it without each control knowing.
 */
export function Element({ id, children }: { id: string; children: ReactNode }) {
  const elements = useElements()
  elements.drawn(id)
  const state = elements.state(id)
  if (state.hidden) return null
  return (
    <fieldset className="kui-element" data-kit-ui-id={id} disabled={state.disabled} role="presentation">
      {children}
    </fieldset>
  )
}
