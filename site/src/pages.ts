/**
 * The pages as separate bundles: the browser loads the one it shows, and the next one before it
 * switches to it; the prerendering build (entry-server.tsx) registers all of them up front. A
 * page module may export `preload(detail)` for what its page needs before it can draw (the docs
 * load a page's demos).
 */
import type { ComponentType } from 'react'
import type { PageId } from './routes'

export type PageKey = PageId
// Each page takes its own props; App passes them.
type Page = ComponentType<any>
type PageModule = { page: Page; preload?: (detail: string | null) => Promise<void> }

const LOADERS: Record<PageKey, () => Promise<PageModule>> = {
  home: () => import('./home/Landing').then((module) => ({ page: module.Landing })),
  docs: () => import('./docs/DocsPage').then((module) => ({ page: module.DocsPage, preload: module.preload })),
  components: () => import('./ComponentsPage').then((module) => ({ page: module.ComponentsPage, preload: module.preload })),
  icons: () => import('./IconsPage').then((module) => ({ page: module.IconsPage })),
  tokens: () => import('./TokensPage').then((module) => ({ page: module.TokensPage })),
}

const loaded = new Map<PageKey, PageModule>()

/** Makes a page ready to draw at once (the prerendering build, with every page). */
export function registerPage(key: PageKey, module: PageModule) {
  loaded.set(key, module)
}

/** Loads a page and what it needs to draw `detail`. */
export async function loadPage(key: PageKey, detail: string | null = null): Promise<void> {
  let module = loaded.get(key)
  if (!module) loaded.set(key, (module = await LOADERS[key]()))
  await module.preload?.(detail)
}

/** A loaded page's component. */
export function pageOf(key: PageKey): Page | null {
  return loaded.get(key)?.page ?? null
}
