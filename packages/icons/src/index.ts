/**
 * @kition/tessera-icons: Tessera Icons as data. Each icon is SVG path strings on a 24 × 24 grid,
 * so the same list draws in React (`@kition/tessera-icons/react`), on a canvas (`drawIcon`, which
 * works in workers with OffscreenCanvas), as SVG markup (`toSvg`), and in Rust (`tessera-icons`).
 */
import { DEFAULT_STROKE, ICON_GRID, type IconData, type IconStyle } from './types'

export * from './generated/icons'
export { DEFAULT_STROKE, ICON_GRID, type IconData, type IconStyle } from './types'

/** The stroke width in grid units: `absoluteStrokeWidth` keeps the stroke `strokeWidth` px wide at any size. */
export function gridStroke({ size = ICON_GRID, strokeWidth = DEFAULT_STROKE, absoluteStrokeWidth = false }: IconStyle = {}) {
  return absoluteStrokeWidth ? (strokeWidth * ICON_GRID) / size : strokeWidth
}

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** The icon as standalone SVG markup. */
export function toSvg(icon: IconData, style: IconStyle = {}) {
  const size = style.size ?? ICON_GRID
  const color = escapeAttr(style.color ?? 'currentColor')
  const paths =
    icon.paths.map((d) => `<path d="${escapeAttr(d)}"/>`).join('') + icon.fills.map((d) => `<path d="${escapeAttr(d)}" fill="${color}"/>`).join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" ` +
    `stroke-width="${gridStroke(style)}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  )
}

type Canvas2D = Pick<CanvasRenderingContext2D, 'save' | 'restore' | 'translate' | 'scale' | 'stroke' | 'fill' | 'lineWidth' | 'lineCap' | 'lineJoin' | 'strokeStyle' | 'fillStyle'>

const cache = new WeakMap<IconData, { paths: Path2D[]; fills: Path2D[] }>()

/** Strokes the icon on a 2D canvas with its top-left corner at (x, y). `color` defaults to black, as canvases have no `currentColor`. */
export function drawIcon(ctx: Canvas2D, icon: IconData, x: number, y: number, style: IconStyle = {}) {
  let shapes = cache.get(icon)
  if (!shapes) {
    shapes = { paths: icon.paths.map((d) => new Path2D(d)), fills: icon.fills.map((d) => new Path2D(d)) }
    cache.set(icon, shapes)
  }
  const size = style.size ?? ICON_GRID
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / ICON_GRID, size / ICON_GRID)
  ctx.lineWidth = gridStroke(style)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = style.color ?? '#000000'
  ctx.fillStyle = style.color ?? '#000000'
  for (const path of shapes.paths) ctx.stroke(path)
  for (const path of shapes.fills) {
    ctx.fill(path)
    ctx.stroke(path)
  }
  ctx.restore()
}
