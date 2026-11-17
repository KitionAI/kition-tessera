import type { CSSProperties } from 'react'
import { SKINS, TOKENS, type SkinId } from '@kition/tessera-tokens'

/**
 * A skin for one element and what is inside it: the theme tokens a host would send, and
 * Tessera's own tokens at their value for the skin's colour scheme (on the document these follow
 * `data-color-scheme`; inside an element they are set here, so two skins can sit side by side).
 */
export function skinStyle(id: SkinId): CSSProperties {
  const skin = SKINS[id]
  const own = Object.fromEntries(TOKENS.filter((token) => !token.khp && token.dark).map((token) => [token.name, skin.colorScheme === 'dark' ? token.dark : token.value]))
  return { ...own, ...skin.tokens, colorScheme: skin.colorScheme, color: 'var(--kit-text)' } as CSSProperties
}

export const SKIN_NAMES: Record<string, string> = { paper: 'Paper', graphite: 'Graphite' }
