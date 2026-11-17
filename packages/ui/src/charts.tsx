/** @jsxRuntime automatic */
/**
 * Charts for product screens: lines and bars of one or more series over ordered categories (days,
 * stages), and a pie (or donut) of parts of a whole. Drawn as SVG in the chart palette tokens
 * (`--kui-chart-1` … `--kui-chart-6`) or a colour of the caller's, with a legend and a readout of
 * the values under the pointer.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useStrings } from './context'

function join(...names: (string | undefined | false)[]) {
  return names.filter(Boolean).join(' ')
}

/** Rounded steps for an axis from 0 (or the least value) to at least `max`: about `count` of them. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0]
  if (max === min) max = min + 1
  const raw = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= raw) ?? raw
  const first = Math.floor(min / step) * step
  const ticks: number[] = []
  for (let value = first; value <= max + step * 1e-9; value += step) ticks.push(Number(value.toFixed(10)))
  if (ticks[ticks.length - 1] < max) ticks.push(Number((ticks[ticks.length - 1] + step).toFixed(10)))
  return ticks
}

const PALETTE = 6
const paletteColor = (index: number) => `var(--kui-chart-${(index % PALETTE) + 1})`

/** The element's size, followed as it changes; `fallback` until it is measured (and where there is no ResizeObserver). */
function useSize(fallback: { width: number; height: number }): [RefObject<HTMLDivElement | null>, { width: number; height: number }] {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(fallback)
  useEffect(() => {
    const element = box.current
    if (!element || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => setSize({ width: Math.max(120, entry.contentRect.width), height: Math.max(80, entry.contentRect.height) }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [box, size]
}

/** A chart's height: pixels, or `fill` to take the height of the box it sits in (a dashboard widget). */
export type ChartHeight = number | 'fill'

type Series = { name: string; points: Map<string, number> }

/** Categories in order of first appearance, and each series' value per category. */
function seriesOf<T>(data: readonly T[], xField: keyof T & string, yField: keyof T & string, seriesField?: keyof T & string) {
  const categories: string[] = []
  const seen = new Set<string>()
  const bySeries = new Map<string, Map<string, number>>()
  for (const datum of data) {
    const x = String(datum[xField])
    const name = seriesField ? String(datum[seriesField]) : ''
    const y = Number(datum[yField])
    if (!seen.has(x)) {
      seen.add(x)
      categories.push(x)
    }
    if (!bySeries.has(name)) bySeries.set(name, new Map())
    if (Number.isFinite(y)) bySeries.get(name)!.set(x, y)
  }
  const series: Series[] = [...bySeries].map(([name, points]) => ({ name, points }))
  const values = series.flatMap((item) => [...item.points.values()])
  return { categories, series, ticks: niceTicks(Math.min(0, ...values), Math.max(0, ...values)) }
}

type CartesianProps<T> = {
  data: readonly T[]
  /** The field of each datum on the horizontal axis (categories in order of first appearance). */
  xField: keyof T & string
  /** The field holding the number. */
  yField: keyof T & string
  /** The field naming the series a datum belongs to; one series without it. */
  seriesField?: keyof T & string
  height?: ChartHeight
  /** The colour of a single series (the palette's first by default). */
  color?: string
  /** Counts: the axis steps only by whole numbers. */
  integers?: boolean
  formatX?: (value: string) => string
  formatY?: (value: number) => string
  /** The chart's accessible name. */
  label: string
  className?: string
  testId?: string
}

const MARGIN = { top: 12, right: 16, bottom: 28, left: 48 }

type CartesianLayout = {
  xAt: (index: number) => number
  band: number
  yAt: (value: number) => number
  color: (index: number) => string
  categories: string[]
  series: Series[]
  hover: number | null
  plotHeight: number
}

/** The frame both cartesian charts share: legend, grid, axis labels, hover readout. */
function Cartesian<T>({ props, kind, children }: { props: CartesianProps<T>; kind: 'line' | 'bar'; children: (layout: CartesianLayout) => ReactNode }) {
  const { data, xField, yField, seriesField, height = 280, color: single, formatX = (value) => value, formatY = (value) => value.toLocaleString(), label, className, testId } = props
  const t = useStrings()
  const [box, size] = useSize({ width: 640, height: typeof height === 'number' ? height : 240 })
  const [hover, setHover] = useState<number | null>(null)
  const { categories, series, ticks: all } = useMemo(() => seriesOf(data, xField, yField, seriesField), [data, xField, yField, seriesField])
  const ticks = props.integers ? all.filter(Number.isInteger) : all
  const width = size.width
  const total = height === 'fill' ? size.height : height
  const plotWidth = width - MARGIN.left - MARGIN.right
  const plotHeight = total - MARGIN.top - MARGIN.bottom
  const low = ticks[0]
  const high = ticks[ticks.length - 1]
  // Bars sit in bands, their points at band centres; a line spreads its points edge to edge.
  const band = categories.length ? plotWidth / categories.length : plotWidth
  const xAt = (index: number) => (kind === 'bar' ? MARGIN.left + band * (index + 0.5) : MARGIN.left + (categories.length <= 1 ? plotWidth / 2 : (index / (categories.length - 1)) * plotWidth))
  const yAt = (value: number) => MARGIN.top + plotHeight - ((value - low) / (high - low || 1)) * plotHeight
  // At most one label per 72px.
  const labelEvery = Math.max(1, Math.ceil(categories.length / Math.max(1, Math.floor(plotWidth / 72))))
  const color = (index: number) => (single && series.length === 1 ? single : paletteColor(index))
  return (
    <figure className={join('kui-chart', className)} data-testid={testId} data-fill={height === 'fill' || undefined}>
      {seriesField && series.length > 1 ? (
        <figcaption className="kui-chart-legend">
          {series.map((item, index) => (
            <span key={item.name} className="kui-chart-legend-item">
              <span className="kui-chart-swatch" style={{ background: color(index) }} />
              {item.name}
            </span>
          ))}
        </figcaption>
      ) : null}
      <div ref={box} className="kui-chart-plot" style={height === 'fill' ? undefined : { height }}>
        {categories.length === 0 ? (
          <div className="kui-chart-empty">{t('noData')}</div>
        ) : (
          <svg
            width={width}
            height={total}
            role="img"
            aria-label={label}
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const x = event.clientX - rect.left - MARGIN.left
              const index = kind === 'bar' ? Math.floor(x / band) : categories.length <= 1 ? 0 : Math.round((x / plotWidth) * (categories.length - 1))
              setHover(Math.max(0, Math.min(categories.length - 1, index)))
            }}
            onPointerLeave={() => setHover(null)}
          >
            {ticks.map((tick) => (
              <g key={tick} className="kui-chart-grid">
                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={yAt(tick)} y2={yAt(tick)} />
                <text x={MARGIN.left - 8} y={yAt(tick)} textAnchor="end" dominantBaseline="middle">
                  {formatY(tick)}
                </text>
              </g>
            ))}
            {categories.map((category, index) =>
              index % labelEvery === 0 ? (
                <text key={category} className="kui-chart-axis" x={xAt(index)} y={total - 8} textAnchor="middle">
                  {formatX(category)}
                </text>
              ) : null,
            )}
            {children({ xAt, band, yAt, color, categories, series, hover, plotHeight })}
          </svg>
        )}
        {hover === null ? null : (
          <div className="kui-chart-readout" style={{ left: Math.min(xAt(hover) + 12, width - 180), top: MARGIN.top }}>
            <div className="kui-chart-readout-title">{formatX(categories[hover])}</div>
            {series.map((item, index) => (
              <div key={item.name} className="kui-chart-readout-row">
                <span className="kui-chart-swatch" style={{ background: color(index) }} />
                <span>{item.name || label}</span>
                <span className="kui-chart-readout-value">{item.points.has(categories[hover]) ? formatY(item.points.get(categories[hover])!) : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </figure>
  )
}

export type LineChartProps<T> = CartesianProps<T> & {
  /** Marks each point with a dot. */
  dots?: boolean
}

/** Lines of one or more series over ordered categories, with a legend and a hover readout. */
export function LineChart<T>(props: LineChartProps<T>) {
  return (
    <Cartesian props={props} kind="line">
      {({ xAt, yAt, color, categories, series, hover, plotHeight }) => (
        <>
          {series.map((item, index) => {
            const points = categories.flatMap((category, at) => (item.points.has(category) ? [[xAt(at), yAt(item.points.get(category)!)] as const] : []))
            return (
              <g key={item.name}>
                <polyline className="kui-chart-line" points={points.map(([x, y]) => `${x},${y}`).join(' ')} style={{ stroke: color(index) }} />
                {props.dots ? points.map(([x, y]) => <circle key={x} className="kui-chart-dot" cx={x} cy={y} r={3} style={{ fill: color(index) }} />) : null}
              </g>
            )
          })}
          {hover !== null ? (
            <g className="kui-chart-hover">
              <line x1={xAt(hover)} x2={xAt(hover)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} />
              {series.map((item, index) =>
                item.points.has(categories[hover]) ? <circle key={item.name} cx={xAt(hover)} cy={yAt(item.points.get(categories[hover])!)} r={3.5} style={{ fill: color(index) }} /> : null,
              )}
            </g>
          ) : null}
        </>
      )}
    </Cartesian>
  )
}

export type BarChartProps<T> = CartesianProps<T> & {
  /** The widest a bar draws, in px. */
  maxBarWidth?: number
}

/** Bars of one or more series per category, side by side, with rounded tops. */
export function BarChart<T>(props: BarChartProps<T>) {
  const maxBar = props.maxBarWidth ?? 44
  return (
    <Cartesian props={props} kind="bar">
      {({ xAt, band, yAt, color, categories, series, hover }) => {
        const group = Math.min(band * 0.7, maxBar * series.length)
        const bar = group / Math.max(1, series.length)
        const base = yAt(0)
        return (
          <>
            {hover !== null ? <rect className="kui-chart-band" x={xAt(hover) - band / 2} y={MARGIN.top} width={band} height={Math.max(0, base - MARGIN.top)} /> : null}
            {categories.map((category, at) =>
              series.map((item, index) => {
                const value = item.points.get(category)
                if (value === undefined) return null
                const top = yAt(value)
                const x = xAt(at) - group / 2 + index * bar
                const h = Math.abs(base - top)
                const r = Math.min(6, bar / 2, h)
                const y = Math.min(top, base)
                // A rectangle with its top corners rounded (its bottom ones, for a negative value).
                const d =
                  value >= 0
                    ? `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + bar - r}Q${x + bar},${y} ${x + bar},${y + r}V${y + h}Z`
                    : `M${x},${y}V${y + h - r}Q${x},${y + h} ${x + r},${y + h}H${x + bar - r}Q${x + bar},${y + h} ${x + bar},${y + h - r}V${y}Z`
                return <path key={`${category}-${item.name}`} className="kui-chart-bar" d={d} style={{ fill: color(index) }} />
              }),
            )}
          </>
        )
      }}
    </Cartesian>
  )
}

export type PieChartProps<T> = {
  data: readonly T[]
  /** The field naming each slice. */
  labelField: keyof T & string
  /** The field holding each slice's number. */
  valueField: keyof T & string
  height?: ChartHeight
  /** The hole's size as a share of the radius (0.6 for a donut); a full pie by default. */
  innerRadius?: number
  /** Colours for the slices, in order; the chart palette by default. */
  colors?: readonly string[]
  formatValue?: (value: number) => string
  /** The chart's accessible name. */
  label: string
  className?: string
  testId?: string
}

/** Where an arc reaches at `fraction` of the way round, from 12 o'clock clockwise. */
function point(cx: number, cy: number, radius: number, fraction: number): [number, number] {
  const angle = fraction * Math.PI * 2 - Math.PI / 2
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
}

/** The path of one slice from `start` to `end` (fractions of the whole), with an optional hole. */
export function slicePath(cx: number, cy: number, radius: number, inner: number, start: number, end: number): string {
  if (end - start >= 0.999999) {
    // A whole circle cannot be one arc: two halves, and the hole the same way (even-odd fill).
    const ring = (r: number, sweep: number) => `M${cx},${cy - r}A${r},${r} 0 1 ${sweep} ${cx},${cy + r}A${r},${r} 0 1 ${sweep} ${cx},${cy - r}Z`
    return ring(radius, 1) + (inner ? ring(inner, 0) : '')
  }
  const [x0, y0] = point(cx, cy, radius, start)
  const [x1, y1] = point(cx, cy, radius, end)
  const large = end - start > 0.5 ? 1 : 0
  if (!inner) return `M${cx},${cy}L${x0},${y0}A${radius},${radius} 0 ${large} 1 ${x1},${y1}Z`
  const [i1x, i1y] = point(cx, cy, inner, end)
  const [i0x, i0y] = point(cx, cy, inner, start)
  return `M${x0},${y0}A${radius},${radius} 0 ${large} 1 ${x1},${y1}L${i1x},${i1y}A${inner},${inner} 0 ${large} 0 ${i0x},${i0y}Z`
}

/** Parts of a whole as slices of a pie (or a donut), with a legend and a readout of the slice under the pointer. */
export function PieChart<T>({ data, labelField, valueField, height = 240, innerRadius = 0, colors, formatValue = (value) => value.toLocaleString(), label, className, testId }: PieChartProps<T>) {
  const t = useStrings()
  const [box, size] = useSize({ width: 320, height: typeof height === 'number' ? height : 240 })
  const [hover, setHover] = useState<number | null>(null)
  const slices = data.map((datum) => ({ name: String(datum[labelField]), value: Math.max(0, Number(datum[valueField]) || 0) })).filter((slice) => slice.value > 0)
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const tall = height === 'fill' ? size.height : height
  const radius = Math.max(10, Math.min(size.width, tall) / 2 - 8)
  const cx = size.width / 2
  const cy = tall / 2
  const inner = radius * Math.min(0.9, Math.max(0, innerRadius))
  const color = (index: number) => colors?.[index % colors.length] ?? paletteColor(index)
  const starts = slices.map((_, index) => slices.slice(0, index).reduce((sum, slice) => sum + slice.value, 0) / (total || 1))
  return (
    <figure className={join('kui-chart', className)} data-testid={testId} data-fill={height === 'fill' || undefined}>
      <div ref={box} className="kui-chart-plot" style={height === 'fill' ? undefined : { height }}>
        {total === 0 ? (
          <div className="kui-chart-empty">{t('noData')}</div>
        ) : (
          <svg width={size.width} height={tall} role="img" aria-label={label} onPointerLeave={() => setHover(null)}>
            {slices.map((slice, index) => (
              <path
                key={slice.name}
                className="kui-chart-slice"
                d={slicePath(cx, cy, radius, inner, starts[index], starts[index] + slice.value / total)}
                fillRule="evenodd"
                style={{ fill: color(index) }}
                data-hovered={hover === index || undefined}
                onPointerEnter={() => setHover(index)}
              />
            ))}
          </svg>
        )}
        {hover === null || !slices[hover] ? null : (
          <div className="kui-chart-readout" style={{ left: 8, top: 8 }}>
            <div className="kui-chart-readout-row">
              <span className="kui-chart-swatch" style={{ background: color(hover) }} />
              <span>{slices[hover].name}</span>
              <span className="kui-chart-readout-value">
                {formatValue(slices[hover].value)} · {Math.round((slices[hover].value / total) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
      {slices.length > 1 ? (
        <figcaption className="kui-chart-legend kui-chart-legend-below">
          {slices.map((slice, index) => (
            <span key={slice.name} className="kui-chart-legend-item">
              <span className="kui-chart-swatch" style={{ background: color(index) }} />
              {slice.name}
            </span>
          ))}
        </figcaption>
      ) : null}
    </figure>
  )
}
