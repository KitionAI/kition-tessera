/**
 * @kition/tessera-tokens: Tessera's design tokens. Import `@kition/tessera-tokens/tokens.css` for
 * the CSS variables (Paper values, plus dark overrides under `[data-color-scheme='dark']`); a host
 * sends a skin's theme with `SKINS.<id>` in the Kit UI protocol's `ui/initialize` and `ui/theme`.
 */
export * from './generated/tokens'
import { SKINS, type SkinId, type SkinTheme } from './generated/tokens'

/** A skin's theme, or `null` for an unknown id. The theme is a fresh copy the caller may change. */
export function skinTheme(id: string): SkinTheme | null {
  const skin = (SKINS as Record<string, SkinTheme>)[id]
  return skin ? { colorScheme: skin.colorScheme, tokens: { ...skin.tokens } } : null
}

export const SKIN_IDS = Object.keys(SKINS) as SkinId[]
