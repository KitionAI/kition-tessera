/**
 * Peak level meters on a canvas (upstream Film `panels/meters.rs` and `widgets.rs` `meter_bar`):
 * one bar per channel over a dark track, a green gradient up to −12 dB, yellow up to −3 dB, and
 * red above it, a hold line per channel, always drawn (red once it reaches −0.5 dB), the dB scale
 * every 3 dB down to the floor, "dB" at its foot, and channel captions under the bars. The colours
 * are the theme tokens `--kit-meter-bg`, `--kit-meter-ok` and `--kit-meter-ok-high` (the green
 * gradient's ends), `--kit-meter-warn`, `--kit-meter-clip`, and `--kit-text-muted` (styles.css).
 *
 * Live levels never re-render React: a caller that updates per audio frame calls the handle's
 * `draw`, which draws at most once per animation frame and not at all while the meter is hidden
 * or after it unmounts. The `peaks` and `holds` props draw at once, and only when their values
 * change. A redraw reads neither layout nor styles: the size comes from the resize observer, the
 * colours are read again only when the theme changes, and a new device pixel ratio (the window
 * moved to another screen, or zoomed) redraws at once.
 */
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react'
import { useStrings } from './context'

export type LevelMeterProps = {
  /** Current peak per channel, linear 0..1+ (above 1 clips). */
  peaks: readonly number[]
  /** dB at the bottom of the scale (upstream meters: -60). */
  floor?: number
  /** Peak hold per channel, linear. */
  holds?: readonly number[]
  orientation?: 'vertical' | 'horizontal'
  /** Channel captions under the bars ("S" "S" in upstream's solo buttons row, or "L" "R"). */
  labels?: readonly string[]
  /** Draws live levels without a React render. */
  ref?: Ref<LevelMeterHandle>
  testId?: string
}

export type LevelMeterHandle = {
  /** Shows these levels at the next animation frame (the latest call before it wins). */
  draw: (peaks: readonly number[], holds?: readonly number[]) => void
}

/** A rectangle in CSS pixels. */
export type MeterBox = { x: number; y: number; w: number; h: number }

/** Where a meter of a given size draws: the bars, the scale's span, and the captions' line. */
export type MeterLayout = {
  bars: MeterBox[]
  /** The span the scale maps onto (the bars' length axis), in CSS pixels. */
  scale: { from: number; to: number; at: number }
  /** Where "dB" and the channel captions sit (centre line, across the bars' axis). */
  captions: number
}

/** Upstream's dB ticks are every 3 dB. */
const TICK_DB = 3
/** Below this many CSS pixels between labels, the scale labels every other tick (or fewer). */
const MIN_LABEL_GAP = 11
/** Upstream's band edges: yellow above −12 dB, red above −3 dB, a red hold line above −0.5 dB. */
const WARN_DB = -12
const CLIP_DB = -3
const HOLD_CLIP_DB = -0.5
/** The gap between channels' bars. */
const BAR_GAP = 4
/** Room for the scale's labels beside (vertical) or under (horizontal) the bars. */
const SCALE_SIZE = 24
const SCALE_SIZE_ACROSS = 14
/** Room for the captions under the bars, or at their start in a horizontal meter. */
const CAPTION_SIZE = 16
const PAD = 4

/** Colours used when the tokens are not there (a meter drawn outside any styled page). */
const FALLBACK = { bg: '#000000', ok: '#579f51', okHigh: '#70dc5d', warn: '#f0f04f', clip: '#e34850', text: '#8a8a8a' }

/** A linear amplitude in dB (−Infinity for silence). */
function toDb(linear: number): number {
  return linear > 0 ? 20 * Math.log10(linear) : Number.NEGATIVE_INFINITY
}

/** How far up the scale `db` sits, 0 at `floor` and 1 at 0 dB (clamped). */
export function meterFraction(db: number, floor: number): number {
  if (!(floor < 0)) return db >= 0 ? 1 : 0
  if (Number.isNaN(db)) return 0
  return Math.min(1, Math.max(0, (db - floor) / -floor))
}

/** The meter's geometry for a `width` × `height` box with `channels` bars. */
export function meterLayout(width: number, height: number, channels: number, orientation: 'vertical' | 'horizontal', captioned: boolean): MeterLayout {
  const count = Math.max(1, channels)
  if (orientation === 'vertical') {
    // Scale on the right, "dB" and captions under the bars, half a label of room at the top.
    const top = PAD + 4
    const bottom = height - PAD - (captioned ? CAPTION_SIZE + 10 : 14)
    const left = PAD
    const right = width - SCALE_SIZE
    const length = Math.max(0, bottom - top)
    const across = Math.max(3, (right - left - BAR_GAP * (count - 1)) / count)
    const bars = Array.from({ length: count }, (_, index) => ({ x: left + index * (across + BAR_GAP), y: top, w: across, h: length }))
    return { bars, scale: { from: bottom, to: top, at: width - 2 }, captions: bottom + 10 }
  }
  // Captions at the start, scale under the bars, half a label of room at the end.
  const left = PAD + (captioned ? CAPTION_SIZE : 0)
  const right = width - PAD - 8
  const top = PAD
  const bottom = height - SCALE_SIZE_ACROSS
  const length = Math.max(0, right - left)
  const across = Math.max(3, (bottom - top - BAR_GAP * (count - 1)) / count)
  const bars = Array.from({ length: count }, (_, index) => ({ x: left, y: top + index * (across + BAR_GAP), w: length, h: across }))
  return { bars, scale: { from: left, to: right, at: height - 2 }, captions: PAD + CAPTION_SIZE / 2 }
}

type Colors = typeof FALLBACK & { font: string }

function colorsOf(element: Element): Colors {
  const style = getComputedStyle(element)
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    bg: token('--kit-meter-bg', FALLBACK.bg),
    ok: token('--kit-meter-ok', FALLBACK.ok),
    okHigh: token('--kit-meter-ok-high', FALLBACK.okHigh),
    warn: token('--kit-meter-warn', FALLBACK.warn),
    clip: token('--kit-meter-clip', FALLBACK.clip),
    text: token('--kit-text-muted', FALLBACK.text),
    font: token('--kit-font-sans', 'sans-serif'),
  }
}

/**
 * The hold line for `fraction` of the scale on `bar`: one CSS pixel thick, snapped to whole device
 * pixels at `ratio`, and kept inside the bar. Upstream centres its 1 pt line at the level and keeps
 * it at least one pixel above the bar's bottom (`meter_bar`), so silence still shows a line there.
 */
export function holdLine(bar: MeterBox, fraction: number, vertical: boolean, ratio: number): MeterBox {
  const thick = Math.max(1, Math.round(ratio))
  if (vertical) {
    const bottom = bar.y + bar.h
    const centre = Math.min(bottom - bar.h * fraction, bottom - 1)
    const device = Math.min(Math.max(Math.round((centre - 0.5) * ratio), Math.ceil(bar.y * ratio)), Math.floor(bottom * ratio) - thick)
    return { x: bar.x, y: device / ratio, w: bar.w, h: thick / ratio }
  }
  const centre = Math.max(bar.x + bar.w * fraction, bar.x + 1)
  const end = bar.x + bar.w
  const device = Math.min(Math.max(Math.round((centre - 0.5) * ratio), Math.ceil(bar.x * ratio)), Math.floor(end * ratio) - thick)
  return { x: device / ratio, y: bar.y, w: thick / ratio, h: bar.h }
}

type Levels = { peaks: readonly number[]; holds?: readonly number[] }
type Shape = { floor: number; orientation: 'vertical' | 'horizontal'; labels?: readonly string[] }

/** Draws `levels` on `canvas`, sized to `width` × `height` CSS pixels at `ratio` device pixels each. */
function paint(canvas: HTMLCanvasElement, width: number, height: number, ratio: number, levels: Levels, shape: Shape, colors: Colors) {
  const context = canvas.getContext('2d')
  if (!context) return
  const { floor, orientation, labels } = shape
  const vertical = orientation === 'vertical'
  const channels = Math.max(levels.peaks.length, labels?.length ?? 0, 1)
  const layout = meterLayout(width, height, channels, orientation, !!labels?.length)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)
  const { from, to } = layout.scale
  /** The position along the bars' axis of a fraction of the scale. */
  const along = (fraction: number) => from + (to - from) * fraction
  /** A span along the bars' axis as a rectangle of `bar`. */
  const span = (bar: MeterBox, a: number, b: number): MeterBox =>
    vertical ? { x: bar.x, y: Math.min(a, b), w: bar.w, h: Math.abs(b - a) } : { x: Math.min(a, b), y: bar.y, w: Math.abs(b - a), h: bar.h }
  const fill = (box: MeterBox, color: string | CanvasGradient) => {
    if (box.w <= 0 || box.h <= 0) return
    context.fillStyle = color
    context.fillRect(box.x, box.y, box.w, box.h)
  }
  const warnAt = meterFraction(WARN_DB, floor)
  const clipAt = meterFraction(CLIP_DB, floor)
  layout.bars.forEach((bar, channel) => {
    fill(bar, colors.bg)
    const level = meterFraction(toDb(levels.peaks[channel] ?? 0), floor)
    if (level > 0) {
      // Upstream's green runs from #579f51 at the floor to #70dc5d at −12 dB.
      const low = along(0)
      const high = along(warnAt)
      const green = vertical ? context.createLinearGradient(0, low, 0, high) : context.createLinearGradient(low, 0, high, 0)
      green.addColorStop(0, colors.ok)
      green.addColorStop(1, colors.okHigh)
      fill(span(bar, low, along(Math.min(level, warnAt))), green)
      if (level > warnAt) fill(span(bar, along(warnAt), along(Math.min(level, clipAt))), colors.warn)
      if (level > clipAt) fill(span(bar, along(clipAt), along(level)), colors.clip)
    }
    const holdDb = toDb(levels.holds?.[channel] ?? 0)
    // Always drawn, as upstream does: at the floor it rests one pixel inside the bar's bottom.
    fill(holdLine(bar, meterFraction(holdDb, floor), vertical, ratio), holdDb > HOLD_CLIP_DB ? colors.clip : colors.warn)
  })
  // The scale: every 3 dB from 0 down to (not including) the floor, thinned where it is crowded.
  context.fillStyle = colors.text
  context.font = `9px ${colors.font}`
  const ticks = Math.max(1, Math.floor(-floor / TICK_DB))
  const pitch = Math.abs(to - from) / Math.max(1, -floor / TICK_DB)
  const every = Math.max(1, Math.ceil(MIN_LABEL_GAP / Math.max(pitch, 0.001)))
  context.textAlign = vertical ? 'right' : 'center'
  context.textBaseline = vertical ? 'middle' : 'bottom'
  for (let tick = 0; tick < ticks; tick += every) {
    const db = -tick * TICK_DB
    if (db <= floor) break
    const position = along(meterFraction(db, floor))
    if (vertical) context.fillText(String(db), layout.scale.at, position)
    else context.fillText(String(db), position, layout.scale.at)
  }
  // "dB" at the scale's foot (vertical) or its start (horizontal), and the channel captions.
  if (vertical) {
    context.textBaseline = 'middle'
    context.fillText('dB', layout.scale.at, layout.captions)
    context.textAlign = 'center'
    labels?.forEach((label, channel) => {
      const bar = layout.bars[channel]
      if (bar) context.fillText(label, bar.x + bar.w / 2, layout.captions)
    })
  } else {
    context.textAlign = 'left'
    context.fillText('dB', PAD, layout.scale.at)
    context.textBaseline = 'middle'
    context.textAlign = 'center'
    labels?.forEach((label, channel) => {
      const bar = layout.bars[channel]
      if (bar) context.fillText(label, layout.captions, bar.y + bar.h / 2)
    })
  }
}

/** The meter's accessible name. */
function useMeterLabel(): string {
  return useStrings()('levelMeter')
}

/** Device pixels per CSS pixel, for a canvas as sharp as the screen. */
function pixelRatio(): number {
  return typeof window === 'undefined' ? 1 : Math.max(1, window.devicePixelRatio || 1)
}

/** A list of numbers as a key that changes only when one of them does. */
const keyOf = (values?: readonly number[]) => (values ? values.join(',') : '')

export function LevelMeter({ peaks, floor = -60, holds, orientation = 'vertical', labels, ref, testId }: LevelMeterProps) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const levels = useRef<Levels>({ peaks, holds })
  const shape = useRef<Shape>({ floor, orientation, labels })
  shape.current = { floor, orientation, labels }
  const frame = useRef<number | null>(null)
  /** The box's size from the resize observer (read from layout once, before it first reports). */
  const size = useRef<{ width: number; height: number } | null>(null)
  /** The theme's colours, read again only when the theme changes. */
  const colors = useRef<Colors | null>(null)
  const label = useMeterLabel()

  /** Draws the latest levels now, sizing the backing store to the box; nothing while hidden. */
  const redraw = useRef(() => {
    const element = box.current
    const target = canvas.current
    if (!element || !target) return
    if (!size.current) {
      const measured = { width: element.clientWidth, height: element.clientHeight }
      if (measured.width <= 0 || measured.height <= 0) return
      size.current = measured
    }
    const { width, height } = size.current
    if (width <= 0 || height <= 0) return
    colors.current ??= colorsOf(element)
    const ratio = pixelRatio()
    const backingWidth = Math.round(width * ratio)
    const backingHeight = Math.round(height * ratio)
    if (target.width !== backingWidth) target.width = backingWidth
    if (target.height !== backingHeight) target.height = backingHeight
    target.style.width = `${width}px`
    target.style.height = `${height}px`
    paint(target, width, height, ratio, levels.current, shape.current, colors.current)
  })

  useImperativeHandle(
    ref,
    () => ({
      draw(nextPeaks, nextHolds) {
        levels.current = { peaks: nextPeaks, holds: nextHolds }
        if (frame.current !== null) return
        frame.current = requestAnimationFrame(() => {
          frame.current = null
          redraw.current()
        })
      },
    }),
    [],
  )

  // The props' levels draw at once, and only when a value changes.
  const peaksKey = keyOf(peaks)
  const holdsKey = keyOf(holds)
  const labelsKey = labels ? labels.join('\n') : ''
  useLayoutEffect(() => {
    levels.current = { peaks, holds }
    redraw.current()
  }, [peaksKey, holdsKey, labelsKey, floor, orientation])

  // A new size (or the meter shown again), a new theme, and a new device pixel ratio redraw; an
  // unmount stops drawing.
  useEffect(() => {
    const element = box.current
    const resize =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver((entries) => {
            const entry = entries[entries.length - 1]
            if (!entry) return
            size.current = { width: entry.contentRect.width, height: entry.contentRect.height }
            redraw.current()
          })
    if (element) resize?.observe(element)
    const theme =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            if (box.current) colors.current = colorsOf(box.current)
            redraw.current()
          })
    theme?.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-color-scheme'] })
    // A `resolution` query matches one ratio only: when it stops matching, redraw and ask again at the new one.
    let stopRatio = () => {}
    const watchRatio = () => {
      if (typeof window.matchMedia !== 'function') return
      const query = window.matchMedia(`(resolution: ${pixelRatio()}dppx)`)
      const changed = () => {
        stopRatio()
        watchRatio()
        redraw.current()
      }
      query.addEventListener('change', changed)
      stopRatio = () => query.removeEventListener('change', changed)
    }
    watchRatio()
    return () => {
      resize?.disconnect()
      theme?.disconnect()
      stopRatio()
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }, [])

  return (
    <div ref={box} className="kui-meter" role="img" aria-label={label} data-orientation={orientation} data-testid={testId}>
      <canvas ref={canvas} className="kui-meter-canvas" />
    </div>
  )
}
