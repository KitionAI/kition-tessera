/** @jsxRuntime automatic */
/**
 * For tests: element states a test can change, as an editor's host configuration would (hide or
 * disable element ids), provided through `ElementsProvider` the way kit-editor's `UiProvider` does.
 */
import { useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { ElementsProvider, type Elements } from './context'

export type TestElementConfig = { hide?: readonly string[]; disable?: readonly string[] }

export type TestElementStore = {
  config: () => TestElementConfig
  replace: (config: TestElementConfig) => void
  subscribe: (listener: () => void) => () => void
}

export function createTestElements(initial: TestElementConfig = {}): TestElementStore {
  let config = initial
  const listeners = new Set<() => void>()
  return {
    config: () => config,
    replace: (next) => {
      config = next
      for (const listener of listeners) listener()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export function TestElements({ store, children }: { store: TestElementStore; children: ReactNode }) {
  const config = useSyncExternalStore(store.subscribe, store.config)
  const elements = useMemo<Elements>(
    () => ({
      state: (id) => ({ hidden: config.hide?.includes(id) ?? false, disabled: config.disable?.includes(id) ?? false }),
      renderExtras: () => null,
      drawn: () => undefined,
    }),
    [config],
  )
  return <ElementsProvider elements={elements}>{children}</ElementsProvider>
}
