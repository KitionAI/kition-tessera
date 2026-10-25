// @vitest-environment jsdom
import { act, createRef, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LevelMeter, meterFraction, meterLayout, type LevelMeterHandle } from './LevelMeter'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** A 2D context that records what is drawn, with the fill colour of each rectangle. */
type Rect = { x: number; y: number; w: number; h: number; fill: string }
type Gradient = { from: number[]; stops: [number, string][]; toString: () => string }
function fakeContext() {
  const drawn = { rects: [] as Rect[], texts: [] as string[], lines: 0, clears: 0, gradients: [] as Gradient[] }
  const context = {
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    lineWidth: 1,
    setTransform: () => {},
    clearRect: () => {
      drawn.clears += 1
      drawn.rects = []
      drawn.texts = []
      drawn.lines = 0
      drawn.gradients = []
    },
    createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
      const gradient: Gradient = {
        from: [x0, y0, x1, y1],
        stops: [],
        toString: () => `gradient(${gradient.stops.map(([, color]) => color).join(',')})`,
      }
      drawn.gradients.push(gradient)
      return { addColorStop: (at: number, color: string) => gradient.stops.push([at, color]), toString: gradient.toString }
    },
    fillRect(x: number, y: number, w: number, h: number) {
      drawn.rects.push({ x, y, w, h, fill: String(this.fillStyle) })
    },
    fillText: (text: string) => drawn.texts.push(text),
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {
      drawn.lines += 1
    },
  }
  return { context, drawn }
}

let drawn: ReturnType<typeof fakeContext>['drawn']
let frames: FrameRequestCallback[]
let host: HTMLDivElement
let roots: Root[] = []
const originalGetContext = HTMLCanvasElement.prototype.getContext
const originalRatio = window.devicePixelRatio

beforeEach(() => {
  const fake = fakeContext()
  drawn = fake.drawn
  HTMLCanvasElement.prototype.getContext = (() => fake.context) as unknown as typeof HTMLCanvasElement.prototype.getContext
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 })
  // jsdom lays nothing out: the meter's box is 40 × 200 CSS pixels.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 40 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 200 })
  frames = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  for (const root of roots) act(() => root.unmount())
  roots = []
  host?.remove()
  HTMLCanvasElement.prototype.getContext = originalGetContext
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: originalRatio })
  delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
  delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight
  vi.unstubAllGlobals()
})

function render(node: ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  act(() => root.render(node))
  return root
}

const canvas = () => host.querySelector('canvas') as HTMLCanvasElement
const BAND = /^var|^#|^rgb|^gradient/
/** The hold lines: one device-snapped CSS pixel across a bar (2 device pixels at the tests' ratio of 2). */
const isHold = (rect: Rect) => rect.h === 1 || rect.w === 1
const holdLines = () => drawn.rects.filter(isHold)
/** The level bars' rectangles: the band colours, not the background behind them nor the hold lines. */
const levels = (background: string) => drawn.rects.filter((rect) => rect.fill !== background && BAND.test(rect.fill) && !isHold(rect))

describe('meterFraction', () => {
  it('maps dB linearly from the floor to 0 dB', () => {
    expect(meterFraction(-6, -60)).toBeCloseTo(0.9, 9)
    expect(meterFraction(0, -60)).toBe(1)
    expect(meterFraction(-60, -60)).toBe(0)
    expect(meterFraction(-90, -60)).toBe(0)
    expect(meterFraction(6, -60)).toBe(1)
    expect(meterFraction(-24, -48)).toBeCloseTo(0.5, 9)
  })
})

describe('LevelMeter', () => {
  it('gives its canvas a device-pixel backing store the size of its box', () => {
    render(<LevelMeter peaks={[0, 0]} testId="meter" />)
    expect(canvas().width).toBe(80)
    expect(canvas().height).toBe(400)
    expect(canvas().style.width).toBe('40px')
    expect(canvas().style.height).toBe('200px')
    expect(host.querySelector('[data-testid="meter"]')!.getAttribute('data-orientation')).toBe('vertical')
  })

  it('draws the scale and no level for silence', () => {
    render(<LevelMeter peaks={[0, 0]} labels={['S', 'S']} />)
    expect(drawn.clears).toBe(1)
    const layout = meterLayout(40, 200, 2, 'vertical', true)
    const background = drawn.rects.find((rect) => rect.x === layout.bars[0].x && rect.h === layout.bars[0].h)!.fill
    expect(levels(background)).toEqual([])
    // 200 px is too short for a label every 3 dB: every other tick is labelled.
    expect(drawn.texts).toContain('0')
    expect(drawn.texts).toContain('-6')
    expect(drawn.texts).not.toContain('-3')
    expect(drawn.texts).not.toContain('-60')
    expect(drawn.texts).toContain('dB')
    expect(drawn.texts.filter((text) => text === 'S')).toHaveLength(2)
    // Upstream draws the hold line always: for silence it sits one pixel inside the bar at the bottom.
    const holds = holdLines()
    expect(holds).toHaveLength(2)
    for (const [channel, hold] of holds.entries()) {
      const bar = layout.bars[channel]
      expect(hold.x).toBe(bar.x)
      expect(hold.y + hold.h).toBeLessThanOrEqual(bar.y + bar.h)
      expect(hold.y).toBeGreaterThanOrEqual(bar.y + bar.h - 2)
    }
  })

  it("fills the green band with upstream's gradient from the floor up to -12 dB", () => {
    render(<LevelMeter peaks={[1, 1]} floor={-60} />)
    const layout = meterLayout(40, 200, 2, 'vertical', false)
    const bar = layout.bars[0]
    expect(drawn.gradients.length).toBeGreaterThan(0)
    const [gradient] = drawn.gradients
    expect(gradient.stops).toEqual([
      [0, '#579f51'],
      [1, '#70dc5d'],
    ])
    // Bottom of the bar (the floor) to 80% of the way up (-12 dB).
    expect(gradient.from[1]).toBeCloseTo(bar.y + bar.h, 6)
    expect(gradient.from[3]).toBeCloseTo(bar.y + bar.h * 0.2, 6)
  })

  it('fills a bar to the top for a peak above 1, and to 90% of the height at -6 dB', () => {
    render(<LevelMeter peaks={[1.5, 10 ** (-6 / 20)]} floor={-60} />)
    const layout = meterLayout(40, 200, 2, 'vertical', false)
    const [left, right] = layout.bars
    const background = drawn.rects.find((rect) => rect.x === left.x && rect.h === left.h)!.fill
    const bar = (x: number) => levels(background).filter((rect) => rect.x === x)
    const top = (x: number) => Math.min(...bar(x).map((rect) => rect.y))
    const bottom = (x: number) => Math.max(...bar(x).map((rect) => rect.y + rect.h))
    expect(top(left.x)).toBeCloseTo(left.y, 6)
    expect(bottom(left.x)).toBeCloseTo(left.y + left.h, 6)
    // Three bands in the clipping bar: ok, warn, clip.
    expect(new Set(bar(left.x).map((rect) => rect.fill)).size).toBe(3)
    expect(top(right.x)).toBeCloseTo(right.y + right.h * 0.1, 6)
  })

  it('labels every 3 dB down to the floor when there is room', () => {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 400 })
    render(<LevelMeter peaks={[0, 0]} floor={-60} />)
    const ticks = drawn.texts.filter((text) => text !== 'dB')
    expect(ticks).toEqual(Array.from({ length: 20 }, (_, index) => String(-3 * index)))
  })

  it('draws a hold line per channel, red once it reaches -0.5 dB', () => {
    render(<LevelMeter peaks={[0.1, 0.1]} holds={[0.5, 1]} />)
    const holds = holdLines()
    expect(holds.map((hold) => hold.fill)).toEqual(['#f0f04f', '#e34850'])
    const bar = meterLayout(40, 200, 2, 'vertical', false).bars[1]
    // At 0 dB the line keeps inside the bar at the top.
    expect(holds[1].y).toBeGreaterThanOrEqual(bar.y)
  })

  it('snaps the hold line to device pixels', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 1.5 })
    render(<LevelMeter peaks={[0, 0]} holds={[0.37, 0.61]} />)
    const holds = drawn.rects.filter((rect) => Math.abs(rect.h - 1 / 1.5) < 1e-9 || Math.abs(rect.h - 2 / 1.5) < 1e-9)
    expect(holds).toHaveLength(2)
    for (const hold of holds) {
      expect(Math.abs(hold.y * 1.5 - Math.round(hold.y * 1.5))).toBeLessThan(1e-9)
      expect(Math.abs(hold.h * 1.5 - Math.round(hold.h * 1.5))).toBeLessThan(1e-9)
    }
  })

  it('redraws only when the values change', () => {
    const root = render(<LevelMeter peaks={[0.2, 0.3]} />)
    expect(drawn.clears).toBe(1)
    act(() => root.render(<LevelMeter peaks={[0.2, 0.3]} />))
    expect(drawn.clears).toBe(1)
    act(() => root.render(<LevelMeter peaks={[0.4, 0.3]} />))
    expect(drawn.clears).toBe(2)
  })

  it('draws through its handle once per animation frame, and stops when unmounted', () => {
    const meter = createRef<LevelMeterHandle>()
    const root = render(<LevelMeter ref={meter} peaks={[0, 0]} />)
    expect(drawn.clears).toBe(1)
    meter.current!.draw([0.5, 0.5])
    meter.current!.draw([0.6, 0.6], [0.7, 0.7])
    expect(frames).toHaveLength(1)
    expect(drawn.clears).toBe(1)
    act(() => frames.shift()!(0))
    expect(drawn.clears).toBe(2)
    expect(holdLines()).toHaveLength(2)
    meter.current!.draw([0.1, 0.1])
    expect(frames).toHaveLength(1)
    act(() => root.unmount())
    roots = []
    expect(cancelAnimationFrame).toHaveBeenCalled()
  })

  it('draws nothing while hidden', () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 0 })
    render(<LevelMeter peaks={[0.5, 0.5]} />)
    expect(drawn.clears).toBe(0)
  })

  it('lays bars side by side across a horizontal meter', () => {
    render(<LevelMeter peaks={[0.5, 0.5]} orientation="horizontal" testId="meter" />)
    const layout = meterLayout(40, 200, 2, 'horizontal', false)
    expect(layout.bars[1].y).toBeGreaterThan(layout.bars[0].y)
    expect(layout.bars[0].x).toBe(layout.bars[1].x)
    expect(host.querySelector('[data-testid="meter"]')!.getAttribute('data-orientation')).toBe('horizontal')
  })
})

describe('LevelMeter observers', () => {
  type Observed = { callback: ResizeObserverCallback; targets: Element[] }
  let observers: Observed[]
  let media: { query: string; listeners: (() => void)[]; removed: number }[]
  let sizeReads: number

  beforeEach(() => {
    observers = []
    media = []
    sizeReads = 0
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => {
        sizeReads += 1
        return 40
      },
    })
    class FakeResizeObserver {
      observed: Observed
      constructor(callback: ResizeObserverCallback) {
        this.observed = { callback, targets: [] }
        observers.push(this.observed)
      }
      observe(target: Element) {
        this.observed.targets.push(target)
      }
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    vi.stubGlobal('matchMedia', (query: string) => {
      const entry = { query, listeners: [] as (() => void)[], removed: 0 }
      media.push(entry)
      return {
        media: query,
        matches: true,
        addEventListener: (_: string, listener: () => void) => entry.listeners.push(listener),
        removeEventListener: () => {
          entry.removed += 1
        },
      }
    })
  })

  function resize(width: number, height: number) {
    const [observed] = observers
    const entry = { target: observed.targets[0], contentRect: { width, height } } as unknown as ResizeObserverEntry
    act(() => observed.callback([entry], {} as ResizeObserver))
  }

  it('takes its size from the resize observer and reads neither layout nor styles per redraw', () => {
    const computed = vi.spyOn(window, 'getComputedStyle')
    const meter = createRef<LevelMeterHandle>()
    render(<LevelMeter ref={meter} peaks={[0, 0]} />)
    resize(60, 300)
    expect(canvas().width).toBe(120)
    expect(canvas().height).toBe(600)
    expect(canvas().style.width).toBe('60px')
    const reads = sizeReads
    const styles = computed.mock.calls.length
    for (let i = 0; i < 5; i++) {
      meter.current!.draw([0.1 * i, 0.2])
      act(() => frames.shift()!(0))
    }
    expect(drawn.clears).toBeGreaterThanOrEqual(6)
    expect(sizeReads).toBe(reads)
    expect(computed.mock.calls.length).toBe(styles)
  })

  it('reads the theme colours again only when the theme changes', async () => {
    let ok = ''
    const computed = vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () => ({ getPropertyValue: (name: string) => (name === '--kit-meter-ok' ? ok : '') }) as unknown as CSSStyleDeclaration,
    )
    const meter = createRef<LevelMeterHandle>()
    render(<LevelMeter ref={meter} peaks={[1, 1]} />)
    expect(drawn.gradients[0].stops[0][1]).toBe('#579f51')
    ok = '#123456'
    meter.current!.draw([1, 1])
    act(() => frames.shift()!(0))
    expect(drawn.gradients[0].stops[0][1]).toBe('#579f51')
    const reads = computed.mock.calls.length
    document.documentElement.setAttribute('data-color-scheme', 'dark')
    await act(async () => {
      await Promise.resolve()
    })
    expect(computed.mock.calls.length).toBe(reads + 1)
    expect(drawn.gradients[0].stops[0][1]).toBe('#123456')
    document.documentElement.removeAttribute('data-color-scheme')
  })

  it('redraws at the new device pixel ratio when it changes', () => {
    const root = render(<LevelMeter peaks={[0, 0]} />)
    resize(40, 200)
    expect(canvas().width).toBe(80)
    const first = media.at(-1)!
    expect(first.query).toBe('(resolution: 2dppx)')
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 3 })
    act(() => first.listeners.forEach((listener) => listener()))
    expect(canvas().width).toBe(120)
    expect(canvas().height).toBe(600)
    // It listens again at the new ratio, and stops listening when unmounted.
    expect(media.at(-1)!.query).toBe('(resolution: 3dppx)')
    expect(first.removed).toBe(1)
    act(() => root.unmount())
    roots = []
    expect(media.at(-1)!.removed).toBe(1)
  })
})
