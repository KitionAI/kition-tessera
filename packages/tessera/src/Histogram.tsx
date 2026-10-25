/**
 * A normalized bar histogram (Levels/Curves-style), drawn on a canvas. The canvas's backing
 * store is sized to the element's own CSS box (`clientWidth`/`clientHeight`) times the device
 * pixel ratio, redrawn on mount, on every resize (a `ResizeObserver`), and whenever `bins`,
 * `color`, or `height` changes, so bars stay crisp at any zoom or window size.
 *
 * One spike (a flat image's edge bin, all-white or all-black pixels piling into bin 0 or the
 * last bin) must not flatten every other bar: the scale is the interior bins' own maximum
 * (every bin but the first and the last) with 10% headroom, like upstream `rgb_histogram.rs`'s
 * own clipping, not the raw maximum. Only when every interior bin is empty does the scale widen
 * to the overall maximum (so edge-only data still gets a sensible scale); only when every bin is
 * empty does it fall back to 1, so nothing divides by zero.
 *
 * `smooth` softens the comb a quantized image leaves (every other bin empty after a levels
 * stretch) with upstream's five-bin binomial display kernel (`rgb_histogram.rs`, see
 * `smoothHistogram`); the bins themselves stay exact.
 *
 * jsdom has neither a 2D canvas context nor `ResizeObserver`; both are optional, so the component
 * still mounts without either (a test can still observe that it does not throw, or supply fakes
 * for both to observe the actual drawing).
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'

export type HistogramProps = {
  /** Bin counts (256 for an 8-bit channel), left (shadows) to right (highlights). */
  bins: ArrayLike<number>
  /** A CSS color for the bars; the element's own (inherited) color by default. */
  color?: string
  height?: number
  /** Draws the bins through upstream's five-bin display kernel (`smoothHistogram`), as its Camera Raw histogram does. */
  smooth?: boolean
  /**
   * What the bars are scaled to: `interior`, the interior bins' maximum (the default, see
   * `scaleFor`), or `rank`, upstream's Histogram panel and tone editors (`tone.rs`
   * `draw_histogram`): the 251st-smallest of 256 bins, so a handful of spikes (pure white, pure
   * black) are clipped instead of flattening the rest. Either with 10% headroom.
   */
  scale?: 'interior' | 'rank'
  testId?: string
}

/** Headroom above the scale's peak, so the tallest bar never quite touches the top. */
const HEADROOM = 1.1

function overallMax(bins: ArrayLike<number>): number {
  let max = 0
  for (let i = 0; i < bins.length; i += 1) max = Math.max(max, bins[i] ?? 0)
  return max
}

/**
 * Upstream's display filter (`rgb_histogram.rs` `curves`): each interior bin becomes the
 * binomial (1, 4, 6, 4, 1) / 16 average of itself and its two neighbours on each side, so a
 * quantized image's comb draws as the tone curve it stands for. The first and last bins (the
 * clipping bins) stay exact, and neighbours are read from the interior only, so a clipping spike
 * never spreads into the bins beside it. Fewer than three bins come back as they are.
 */
export function smoothHistogram(bins: ArrayLike<number>): number[] {
  const n = bins.length
  const raw = Array.from({ length: n }, (_, i) => bins[i] ?? 0)
  if (n < 3) return raw
  const at = (j: number) => raw[Math.min(n - 2, Math.max(1, j))]
  return raw.map((center, i) => (i === 0 || i === n - 1 ? center : (at(i - 2) + 4 * at(i - 1) + 6 * center + 4 * at(i + 1) + at(i + 2)) / 16))
}

/**
 * The scale bars are normalized against: the interior bins' (every bin but the first and the
 * last) own maximum, with headroom. Only when every interior bin is empty does the scale widen to
 * the overall maximum (including the edges); only when every bin is empty does it fall back to 1.
 */
function scaleFor(bins: ArrayLike<number>): number {
  const n = bins.length
  let interiorMax = 0
  for (let i = 1; i < n - 1; i += 1) interiorMax = Math.max(interiorMax, bins[i] ?? 0)
  const peak = interiorMax > 0 ? interiorMax : overallMax(bins)
  return peak > 0 ? peak * HEADROOM : 1
}

/** Upstream's `draw_histogram` scale: the bin ranked 251st of 256 from the smallest (scaled to the bin count), at least 1, with headroom. */
export function rankScale(bins: ArrayLike<number>): number {
  const n = bins.length
  if (n === 0) return 1
  const sorted = Array.from({ length: n }, (_, i) => bins[i] ?? 0).sort((a, b) => a - b)
  return Math.max(1, sorted[Math.min(n - 1, Math.floor((n * 250) / 256))]) * HEADROOM
}

export function Histogram({ bins, color, height = 100, smooth = false, scale = 'interior', testId = 'histogram' }: HistogramProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  // The resize observer's own callback (set up once, on mount) must still see the latest props on
  // a later resize; a ref sidesteps re-subscribing the observer every time `bins` changes.
  const shown = useMemo(() => (smooth ? smoothHistogram(bins) : bins), [bins, smooth])
  const latest = useRef({ bins: shown, color, height, scale })
  latest.current = { bins: shown, color, height, scale }

  function draw() {
    const element = canvas.current
    if (!element) return
    const context = element.getContext('2d')
    if (!context) return // jsdom: no 2D canvas context
    const { bins: currentBins, color: currentColor, height: currentHeight, scale: currentScale } = latest.current
    const dpr = window.devicePixelRatio || 1
    const cssWidth = element.clientWidth || 1
    const cssHeight = element.clientHeight || currentHeight
    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr))
    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr))
    if (element.width !== pixelWidth) element.width = pixelWidth
    if (element.height !== pixelHeight) element.height = pixelHeight
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, cssWidth, cssHeight)
    const n = currentBins.length
    if (n === 0) return
    context.fillStyle = currentColor ?? getComputedStyle(element).color
    const peak = currentScale === 'rank' ? rankScale(currentBins) : scaleFor(currentBins)
    const barWidth = cssWidth / n
    for (let i = 0; i < n; i += 1) {
      const value = Math.max(0, currentBins[i] ?? 0)
      const normalized = Math.min(1, value / peak)
      const barHeight = normalized * cssHeight
      if (barHeight > 0) context.fillRect(i * barWidth, cssHeight - barHeight, barWidth, barHeight)
    }
  }

  // Mount and every later change to `bins` (or `smooth`), `color`, or `height`: one draw, not two (a
  // mount-only effect that also called `draw` here would double it, since this one already runs
  // on mount).
  useLayoutEffect(() => {
    draw()
  }, [shown, color, height, scale])

  // Mount/unmount only: subscribes once. The observer's own callback always reads
  // `latest.current`, kept current above on every render, so a later resize redraws with
  // whatever `bins`, `color`, and `height` are current then, not the ones at mount.
  useEffect(() => {
    const element = canvas.current
    if (!element || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => draw())
    observer.observe(element)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <canvas ref={canvas} className="kui-histogram" data-testid={testId} style={{ height }} />
}
