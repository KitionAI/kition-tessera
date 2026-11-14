/**
 * The demos of the docs, each a file in ./demos that the site runs and shows the source of. The
 * browser loads the demos of the page it shows; the prerendering build registers all of them.
 */
import type { ComponentType } from 'react'

export type Demo = { Component: ComponentType; source: string }

const modules = import.meta.glob<{ default: ComponentType }>('./demos/*.tsx')
const sources = import.meta.glob<string>('./demos/*.tsx', { query: '?raw', import: 'default' })
const loaded = new Map<string, Demo>()
const file = (id: string) => `./demos/${id}.tsx`

export function registerDemo(id: string, demo: Demo) {
  loaded.set(id, demo)
}

/** Loads the demos `ids` name, so `demoOf` has them. Unknown ids are skipped. */
export async function loadDemos(ids: string[]): Promise<void> {
  await Promise.all(
    ids
      .filter((id) => !loaded.has(id) && modules[file(id)])
      .map(async (id) => {
        const [module, source] = await Promise.all([modules[file(id)](), sources[file(id)]()])
        loaded.set(id, { Component: module.default, source })
      }),
  )
}

export function demoOf(id: string): Demo | null {
  return loaded.get(id) ?? null
}
