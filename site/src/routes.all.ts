/** Every page there is, for prerendering and the sitemap (it needs the icon set, so the browser never loads it). */
import { ICON_NAMES } from '@kition/tessera-icons/registry'
import { DOCS } from './docs/registry'
import type { Route } from './routes'

export const ICON_COUNT = ICON_NAMES.length

export function allRoutes(): Route[] {
  return [
    { page: 'home', detail: null },
    ...DOCS.map((doc) => ({ page: 'docs' as const, detail: doc.id })),
    { page: 'components', detail: null },
    { page: 'icons', detail: null },
    ...ICON_NAMES.map((name) => ({ page: 'icons' as const, detail: name })),
    { page: 'tokens', detail: null },
  ]
}
