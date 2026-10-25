/**
 * One Tessera icon: its name, family, and its shapes as SVG path data on a 24 × 24 grid. `paths`
 * are stroked; `fills` (dots, solid marks) are filled in the icon color and stroked.
 */
export type IconData = { readonly name: string; readonly family: 'ui' | 'tool'; readonly paths: readonly string[]; readonly fills: readonly string[] }

/** How an icon is drawn. Defaults follow Tessera's icon style (docs/icon-style.md): 24 px, `currentColor`, 1.5 px strokes. */
export type IconStyle = { size?: number; color?: string; strokeWidth?: number; absoluteStrokeWidth?: boolean }

export const ICON_GRID = 24
export const DEFAULT_STROKE = 1.5
