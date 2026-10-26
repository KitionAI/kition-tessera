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

/** Whether `icon`'s accents draw under `accent` (IconStyle.accent): by default only a tool icon's. */
export function drawsAccents(icon: IconData, accent: string | boolean | undefined) {
  return accent === undefined ? icon.family === 'tool' : accent !== false
}

/** How an icon is drawn. Defaults follow Tessera's icon style (docs/icon-style.md): 24 px, `currentColor`, 1.5 px strokes. */
export type IconStyle = {
  size?: number
  color?: string
  strokeWidth?: number
  absoluteStrokeWidth?: boolean
  /**
   * The accent areas (docs/icon-style.md): a colour draws them in it; `true` draws them in the icon
   * colour (SVG, canvas) or `--kit-icon-accent` (React); `false` draws plain line. Left out, a tool
   * icon (`family: "tool"`) draws them and an interface icon does not; in React the CSS variable
   * `--tessera-icon-accent-opacity` decides instead, which a tool rail or a duotone theme sets.
   */
  accent?: string | boolean
}

export const ICON_GRID = 24
export const DEFAULT_STROKE = 1.5
