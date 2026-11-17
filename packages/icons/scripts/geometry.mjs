/**
 * SVG elements to path data. Tessera stores every icon as path strings only, so a canvas `Path2D`,
 * a Rust renderer, and React draw identical shapes from one list.
 */

const num = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) throw new Error(`not a number: ${value}`)
  return Number(n.toFixed(4)).toString()
}

/** `points="2 3 4 5"` or `"2,3 4,5"` as `[[2, 3], [4, 5]]`. */
function points(text) {
  const values = text.trim().split(/[\s,]+/).map(Number)
  if (values.length % 2 !== 0 || values.some((value) => !Number.isFinite(value))) throw new Error(`bad points: ${text}`)
  const out = []
  for (let i = 0; i < values.length; i += 2) out.push([values[i], values[i + 1]])
  return out
}

/** Two half arcs, so the ellipse closes. */
function ellipse(cx, cy, rx, ry) {
  return `M${num(cx - rx)} ${num(cy)}a${num(rx)} ${num(ry)} 0 1 0 ${num(2 * rx)} 0a${num(rx)} ${num(ry)} 0 1 0 ${num(-2 * rx)} 0z`
}

function rect(x, y, width, height, rxIn, ryIn) {
  let rx = rxIn ?? ryIn ?? 0
  let ry = ryIn ?? rxIn ?? 0
  rx = Math.min(Math.max(rx, 0), width / 2)
  ry = Math.min(Math.max(ry, 0), height / 2)
  if (rx === 0 || ry === 0) return `M${num(x)} ${num(y)}h${num(width)}v${num(height)}h${num(-width)}z`
  const w = width - 2 * rx
  const h = height - 2 * ry
  const arc = (dx, dy) => `a${num(rx)} ${num(ry)} 0 0 1 ${num(dx)} ${num(dy)}`
  return (
    `M${num(x + rx)} ${num(y)}h${num(w)}${arc(rx, ry)}v${num(h)}${arc(-rx, ry)}` + `h${num(-w)}${arc(-rx, -ry)}v${num(-h)}${arc(rx, -ry)}z`
  )
}

const n = (attrs, key, fallback) => {
  const value = attrs[key]
  if (value === undefined) {
    if (fallback === undefined) throw new Error(`missing ${key}`)
    return fallback
  }
  return Number(value)
}

/** One SVG element (`[tag, attributes]`) as path data. */
export function toPath([tag, attrs]) {
  switch (tag) {
    case 'path':
      if (typeof attrs.d !== 'string' || attrs.d.trim() === '') throw new Error('path without d')
      return attrs.d
    case 'circle': {
      const r = n(attrs, 'r')
      return ellipse(n(attrs, 'cx', 0), n(attrs, 'cy', 0), r, r)
    }
    case 'ellipse':
      return ellipse(n(attrs, 'cx', 0), n(attrs, 'cy', 0), n(attrs, 'rx'), n(attrs, 'ry'))
    case 'rect':
      return rect(
        n(attrs, 'x', 0),
        n(attrs, 'y', 0),
        n(attrs, 'width'),
        n(attrs, 'height'),
        attrs.rx === undefined ? undefined : Number(attrs.rx),
        attrs.ry === undefined ? undefined : Number(attrs.ry),
      )
    case 'line':
      return `M${num(n(attrs, 'x1', 0))} ${num(n(attrs, 'y1', 0))}L${num(n(attrs, 'x2', 0))} ${num(n(attrs, 'y2', 0))}`
    case 'polyline':
    case 'polygon': {
      const list = points(attrs.points ?? '')
      if (list.length < 2) throw new Error(`${tag} needs two points`)
      const d = list.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${num(x)} ${num(y)}`).join('')
      return tag === 'polygon' ? `${d}z` : d
    }
    default:
      throw new Error(`unsupported SVG element: ${tag}`)
  }
}

const GEOMETRY = new Set(['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'points', 'key'])

/**
 * An icon's elements as `paths` (stroked) and `fills` (filled in the icon color, and stroked).
 * `fill="currentColor"` is the only styling attribute an element may carry; any other would draw
 * differently from the rest of the set.
 */
export function toPaths(nodes) {
  const paths = []
  const fills = []
  for (const node of nodes) {
    const { fill, ...geometry } = node[1]
    const extra = Object.keys(geometry).filter((key) => !GEOMETRY.has(key))
    if (extra.length > 0) throw new Error(`${node[0]} has non-geometry attributes: ${extra.join(', ')}`)
    if (fill !== undefined && fill !== 'currentColor') throw new Error(`${node[0]} has fill="${fill}"; only currentColor is allowed`)
    ;(fill === undefined ? paths : fills).push(toPath([node[0], geometry]))
  }
  return { paths, fills }
}
