/**
 * One Tessera icon: its name, family, and its shapes as SVG path data on a 24 × 24 grid. `paths`
 * are stroked; `fills` (dots, solid marks) are filled in the icon color and stroked.
 */
export type IconData = {
  readonly name: string
  readonly family: 'ui' | 'tool'
  readonly paths: readonly string[]
  readonly fills: readonly string[]
  /** Accent areas (tool icons, docs/icon-style.md): filled with the skin's accent at 25%, under the strokes. */
  readonly accents: readonly string[]
}

/** How strongly accent areas are filled. */
export const ACCENT_OPACITY = 0.25

/** How an icon is drawn. Defaults follow Tessera's icon style (docs/icon-style.md): 24 px, `currentColor`, 1.5 px strokes. */
export type IconStyle = {
  size?: number
  color?: string
  strokeWidth?: number
  absoluteStrokeWidth?: boolean
  /** Accent fill colour; defaults to the icon colour (SVG, canvas) or `--kit-icon-accent` (React). `false` draws plain line. */
  accent?: string | false
}

export const ICON_GRID = 24
export const DEFAULT_STROKE = 1.5
