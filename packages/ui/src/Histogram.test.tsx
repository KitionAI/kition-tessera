// @vitest-environment jsdom
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Histogram, rankScale, smoothHistogram } from './Histogram'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom reports every element's layout box as 0x0; a getter standing in for `clientWidth` and
// `clientHeight` lets a test say what the canvas's CSS box would be in a real browser.
let mockClientWidth = 0
let mockClientHeight = 0
Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => mockClientWidth })
Object.defineProperty(window.HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => mockClientHeight })

// jsdom has no `devicePixelRatio` of its own worth relying on; a getter standing in for it lets a
// test say what a retina (or not) display would be.
let mockDpr = 1
Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => mockDpr })

// jsdom has no `ResizeObserver`; this fake records every instance so a test can fire its callback
// by hand, the way a real resize would.
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  callback: () => void
  constructor(callback: () => void) {
    this.callback = callback
    FakeResizeObserver.instances.push(this)
  }
  observe() {}
  disconnect() {}
}

/** A fake 2D context recording every `fillRect`, since jsdom has no real one to draw into. */
class FakeContext {
  fillStyle = ''
  calls: { x: number; y: number; w: number; h: number }[] = []
  setTransform() {}
  clearRect() {}
  fillRect(x: number, y: number, w: number, h: number) {
    this.calls.push({ x, y, w, h })
  }
}

function withFakeContext(): FakeContext {
  const context = new FakeContext()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D)
  return context
}

let host: HTMLDivElement
let roots: Root[] = []
afterEach(() => {
  for (const root of roots) act(() => root.unmount())
  roots = []
  host?.remove()
  mockClientWidth = 0
  mockClientHeight = 0
  mockDpr = 1
  FakeResizeObserver.instances = []
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver
  vi.restoreAllMocks()
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

describe('Histogram sizing', () => {
  it('sizes the backing store to the CSS box times the device pixel ratio', () => {
    withFakeContext()
    mockClientWidth = 200
    mockClientHeight = 80
    mockDpr = 2
    render(<Histogram bins={new Array(256).fill(1)} />)
    expect(canvas().width).toBe(400)
    expect(canvas().height).toBe(160)
  })

  it('falls back to the height prop when the element has no layout box yet', () => {
    withFakeContext()
    mockClientWidth = 0
    mockClientHeight = 0
    render(<Histogram bins={new Array(256).fill(1)} height={64} />)
    expect(canvas().height).toBe(64)
  })

  it('redraws at the new size when the element resizes', () => {
    globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver
    const context = withFakeContext()
    mockClientWidth = 256
    mockClientHeight = 100
    render(<Histogram bins={new Array(256).fill(1)} />)
    expect(canvas().width).toBe(256)
    context.calls = []
    mockClientWidth = 512
    FakeResizeObserver.instances.at(-1)!.callback()
    expect(canvas().width).toBe(512)
    expect(context.calls.length).toBeGreaterThan(0)
  })

  it('does not throw when there is no 2D context (plain jsdom)', () => {
    expect(() => render(<Histogram bins={new Array(256).fill(0)} />)).not.toThrow()
  })

  it('does not throw when there is no ResizeObserver (plain jsdom)', () => {
    expect(typeof globalThis.ResizeObserver).toBe('undefined')
    expect(() => render(<Histogram bins={new Array(256).fill(0)} />)).not.toThrow()
  })

  it('redraws with the new bin count when bins changes', () => {
    const context = withFakeContext()
    mockClientWidth = 256
    mockClientHeight = 100
    const root = render(<Histogram bins={new Array(256).fill(1)} />)
    expect(context.calls).toHaveLength(256)
    context.calls = []
    act(() => root.render(<Histogram bins={new Array(64).fill(1)} />))
    expect(context.calls).toHaveLength(64)
  })
})

describe('Histogram scaling', () => {
  it('draws no bars for all-zero bins', () => {
    const context = withFakeContext()
    mockClientWidth = 256
    mockClientHeight = 100
    render(<Histogram bins={new Array(256).fill(0)} />)
    expect(context.calls).toHaveLength(0)
  })

  it('scales to the interior maximum, not an edge spike: the edge spike does not flatten two interior plateaus', () => {
    const context = withFakeContext()
    mockClientWidth = 256
    mockClientHeight = 100
    const bins = new Array(256).fill(0)
    bins[0] = 1_000_000 // an edge spike (clipped pixels), excluded from the scale
    for (let i = 50; i < 70; i += 1) bins[i] = 500 // plateau A
    for (let i = 150; i < 170; i += 1) bins[i] = 500 // plateau B
    render(<Histogram bins={bins} />)
    const byIndex = (i: number) => context.calls.find((call) => call.x === i)
    // Interior peak is 500, scaled with 10% headroom: 500 / (500 * 1.1) of the full height.
    const plateauHeight = (500 / (500 * 1.1)) * 100
    expect(byIndex(55)!.h).toBeCloseTo(plateauHeight, 3)
    expect(byIndex(160)!.h).toBeCloseTo(plateauHeight, 3)
    // The edge spike is drawn at full height (clipped to 1), but it is not part of the scale: it
    // must not have flattened the plateaus down near zero.
    expect(byIndex(0)!.h).toBeCloseTo(100, 3)
    expect(byIndex(55)!.h).toBeGreaterThan(50)
  })

  it('falls back to the overall maximum when every interior bin is empty', () => {
    const context = withFakeContext()
    mockClientWidth = 256
    mockClientHeight = 100
    const bins = new Array(256).fill(0)
    bins[0] = 100
    bins[255] = 200
    render(<Histogram bins={bins} />)
    const byIndex = (i: number) => context.calls.find((call) => call.x === i)
    const scale = 200 * 1.1
    expect(byIndex(0)!.h).toBeCloseTo((100 / scale) * 100, 3)
    expect(byIndex(255)!.h).toBeCloseTo((200 / scale) * 100, 3)
  })
})

describe('Histogram smoothing', () => {
  it("averages each interior bin with upstream's (1, 4, 6, 4, 1) / 16 kernel", () => {
    const bins = new Array(9).fill(0)
    bins[4] = 16
    expect(smoothHistogram(bins)).toEqual([0, 0, 1, 4, 6, 4, 1, 0, 0])
  })

  it('keeps the clipping bins exact and never spreads them into their neighbours', () => {
    const bins = [1000, 8, 8, 8, 8, 8, 2000]
    const smoothed = smoothHistogram(bins)
    expect(smoothed[0]).toBe(1000)
    expect(smoothed[6]).toBe(2000)
    // The interior is flat, so it stays flat: no edge value leaks in.
    expect(smoothed.slice(1, 6)).toEqual([8, 8, 8, 8, 8])
  })

  it("fills a quantized comb's gaps (every other bin empty) toward the curve it stands for", () => {
    const bins = Array.from({ length: 64 }, (_, i) => (i % 2 === 0 ? 10 : 0))
    const smoothed = smoothHistogram(bins)
    for (let i = 3; i < 60; i += 1) expect(smoothed[i]).toBeCloseTo(5, 5)
  })

  it('returns fewer than three bins as they are', () => {
    expect(smoothHistogram([3, 4])).toEqual([3, 4])
    expect(smoothHistogram([])).toEqual([])
  })

  it('draws the smoothed bins with `smooth`, and the exact ones without it', () => {
    const context = withFakeContext()
    mockClientWidth = 9
    mockClientHeight = 100
    const bins = [0, 0, 0, 0, 16, 0, 0, 0, 0]
    const root = render(<Histogram bins={bins} smooth />)
    expect(context.calls.map((call) => call.x)).toEqual([2, 3, 4, 5, 6])
    context.calls = []
    act(() => root.render(<Histogram bins={bins} />))
    expect(context.calls.map((call) => call.x)).toEqual([4])
  })
})

describe("Histogram rank scale (upstream's Histogram panel)", () => {
  it('scales to the 251st-smallest of 256 bins with headroom, at least 1', () => {
    const bins = Array.from({ length: 256 }, (_, i) => i)
    expect(rankScale(bins)).toBeCloseTo(250 * 1.1)
    expect(rankScale(new Array(256).fill(0))).toBeCloseTo(1.1)
    expect(rankScale([])).toBe(1)
  })

  it('clips a few spikes instead of letting them flatten the rest', () => {
    const context = withFakeContext()
    mockClientWidth = 256
    mockClientHeight = 100
    const bins = new Array(256).fill(100)
    for (const spike of [0, 1, 128, 254, 255]) bins[spike] = 100_000
    render(<Histogram bins={bins} scale="rank" />)
    const byIndex = (i: number) => context.calls.find((call) => call.x === i)
    expect(byIndex(10)!.h).toBeCloseTo((100 / 110) * 100, 3)
    expect(byIndex(128)!.h).toBeCloseTo(100, 3)
  })
})
