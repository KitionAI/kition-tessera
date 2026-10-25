/**
 * A kit's brand color (`ui.brand` in kit.json, standard U5b): the primary tokens it gives the
 * editor for a color scheme. `tools/check-manifest.mjs` repeats `contrast` for Node; keep them equal.
 */
export type KitBrand = { light: string; dark: string }

const rgb = (hex: string) => {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const channel = (value: number) => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of `#rrggbb`. */
export function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio of two `#rrggbb` colors, 1 to 21. */
export function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

/** White or black, whichever reads better on `color`. */
export function textOn(color: string) {
  return contrast(color, '#ffffff') >= contrast(color, '#000000') ? '#ffffff' : '#000000'
}

/** The primary tokens a brand gives a color scheme: the color, its text, and its soft tint. */
export function brandTokens(brand: KitBrand, scheme: 'light' | 'dark'): Record<string, string> {
  const color = brand[scheme]
  const [r, g, b] = rgb(color)
  return { '--kit-primary': color, '--kit-primary-text': textOn(color), '--kit-primary-soft': `rgba(${r}, ${g}, ${b}, ${scheme === 'dark' ? 0.2 : 0.1})` }
}

const HEX = /^#[0-9a-fA-F]{6}$/

/** `value` when it is a brand of two `#rrggbb` colors; null otherwise (with a warning). */
export function validBrand(value: unknown): KitBrand | null {
  if (value === undefined || value === null) return null
  const brand = value as Partial<KitBrand>
  if (typeof brand.light === 'string' && typeof brand.dark === 'string' && HEX.test(brand.light) && HEX.test(brand.dark)) return { light: brand.light, dark: brand.dark }
  console.warn('[kit-ui] ui.brand must be { light, dark } as #rrggbb colors; the host primary is used')
  return null
}
