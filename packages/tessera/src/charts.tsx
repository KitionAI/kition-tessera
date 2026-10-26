/**
 * Charts for product screens: a line chart of one or more series over ordered categories (days,
 * hours). Drawn as SVG in the chart palette tokens (`--kui-chart-1` … `--kui-chart-6`), with a
 * legend and a readout of every series at the point under the pointer.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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

export type LineChartProps<T> = {
  data: readonly T[]
  /** The field of each datum on the horizontal axis (categories in order of first appearance). */
  xField: keyof T & string
  /** The field holding the number. */
  yField: keyof T & string
  /** The field naming the series a datum belongs to; one series without it. */
  seriesField?: keyof T & string
  height?: number
  formatX?: (value: string) => string
  formatY?: (value: number) => string
  /** The chart's accessible name. */
  label: string
  className?: string
  testId?: string
}

const MARGIN = { top: 12, right: 16, bottom: 28, left: 48 }
const PALETTE = 6

/** Lines of one or more series over ordered categories, with a legend and a hover readout. */
export function LineChart<T>({ data, xField, yField, seriesField, height = 280, formatX = (value) => value, formatY = (value) => value.toLocaleString(), label, className, testId }: LineChartProps<T>) {
  const t = useStrings()
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [hover, setHover] = useState<number | null>(null)
  useEffect(() => {
    const element = box.current
    if (!element || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(160, entry.contentRect.width)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const { categories, series, ticks } = useMemo(() => {
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
    const values = [...bySeries.values()].flatMap((points) => [...points.values()])
    const ticks = niceTicks(Math.min(0, ...values), Math.max(0, ...values))
    return { categories, series: [...bySeries].map(([name, points]) => ({ name, points })), ticks }
  }, [data, xField, yField, seriesField])
  const plotWidth = width - MARGIN.left - MARGIN.right
  const plotHeight = height - MARGIN.top - MARGIN.bottom
  const low = ticks[0]
  const high = ticks[ticks.length - 1]
  const xAt = (index: number) => MARGIN.left + (categories.length <= 1 ? plotWidth / 2 : (index / (categories.length - 1)) * plotWidth)
  const yAt = (value: number) => MARGIN.top + plotHeight - ((value - low) / (high - low || 1)) * plotHeight
  // At most one label per 72px.
  const labelEvery = Math.max(1, Math.ceil(categories.length / Math.max(1, Math.floor(plotWidth / 72))))
  const color = (index: number) => `var(--kui-chart-${(index % PALETTE) + 1})`
  const readout: ReactNode =
    hover === null ? null : (
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
    )
  return (
    <figure className={join('kui-chart', className)} data-testid={testId}>
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
      <div ref={box} className="kui-chart-plot" style={{ height }}>
        {categories.length === 0 ? (
          <div className="kui-chart-empty">{t('noData')}</div>
        ) : (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={label}
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const x = event.clientX - rect.left - MARGIN.left
              const index = categories.length <= 1 ? 0 : Math.round((x / plotWidth) * (categories.length - 1))
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
                <text key={category} className="kui-chart-axis" x={xAt(index)} y={height - 8} textAnchor="middle">
                  {formatX(category)}
                </text>
              ) : null,
            )}
            {series.map((item, index) => {
              const points = categories.flatMap((category, at) => (item.points.has(category) ? [`${xAt(at)},${yAt(item.points.get(category)!)}`] : []))
              return <polyline key={item.name} className="kui-chart-line" points={points.join(' ')} style={{ stroke: color(index) }} />
            })}
            {hover !== null ? (
              <g className="kui-chart-hover">
                <line x1={xAt(hover)} x2={xAt(hover)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} />
                {series.map((item, index) =>
                  item.points.has(categories[hover]) ? <circle key={item.name} cx={xAt(hover)} cy={yAt(item.points.get(categories[hover])!)} r={3.5} style={{ fill: color(index) }} /> : null,
                )}
              </g>
            ) : null}
          </svg>
        )}
        {readout}
      </div>
    </figure>
  )
}
