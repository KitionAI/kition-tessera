// @vitest-environment jsdom
import { act, createRef, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DockArea, dockHeights, type DockAreaHandle, type DockGroup, type DockSizing } from './index'
import { StringsProvider } from './context'
import { createTestElements, TestElements } from './testElements'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom has no PointerEvent (https://github.com/jsdom/jsdom/issues/2527); a MouseEvent with the
// right type and a pointerId reaches React's pointer handlers just the same (see NumberField.test.tsx).
if (typeof PointerEvent === 'undefined') {
  class FakePointerEvent extends MouseEvent {
    pointerId: number
    constructor(type: string, params: MouseEventInit & { pointerId?: number } = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
    }
  }
  globalThis.PointerEvent = FakePointerEvent as unknown as typeof PointerEvent
}

let host: HTMLDivElement
let roots: Root[] = []
afterEach(() => {
  for (const root of roots) act(() => root.unmount())
  roots = []
  host?.remove()
  localStorage.clear()
})

beforeEach(() => {
  localStorage.clear()
})

function render(node: ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  act(() => root.render(node))
  return root
}

function withUi(store: ReturnType<typeof createTestElements>, children: ReactNode) {
  return <TestElements store={store}>{children}</TestElements>
}

const colorGroup: DockGroup = {
  id: 'color',
  defaultHeight: 190,
  tabs: [
    { id: 'color', label: 'Color', render: () => <div data-testid="color-body">Color body</div> },
    { id: 'swatches', label: 'Swatches', render: () => <div data-testid="swatches-body">Swatches body</div> },
  ],
}

const layersGroup: DockGroup = {
  id: 'layers',
  defaultHeight: 320,
  minHeight: 140,
  tabs: [{ id: 'layers', label: 'Layers', render: () => <div data-testid="layers-body">Layers body</div> }],
}

const group = (testId: string, id: string) => host.querySelector(`[data-testid="${testId}-group-${id}"]`) as HTMLDivElement | null
const tab = (testId: string, id: string) => host.querySelector(`[data-testid="${testId}-tab-${id}"]`) as HTMLButtonElement | null
const collapseButton = (testId: string, id: string) => host.querySelector(`[data-testid="${testId}-collapse-${id}"]`) as HTMLButtonElement | null
const handle = (testId: string, id: string) => host.querySelector(`[data-testid="${testId}-handle-${id}"]`) as HTMLDivElement | null

function pointer(element: HTMLElement, type: 'pointerdown' | 'pointermove' | 'pointerup', clientY: number) {
  act(() => {
    element.dispatchEvent(new PointerEvent(type, { clientY, pointerId: 1, bubbles: true }))
  })
}

function key(element: HTMLElement, key: string, options: Partial<KeyboardEventInit> = {}) {
  act(() => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options }))
  })
}

describe('DockArea', () => {
  it('renders only the shown groups', () => {
    render(<DockArea kit="photo-shown" groups={[colorGroup, layersGroup]} shown={new Set(['color'])} testId="dock" />)
    expect(group('dock', 'color')).not.toBeNull()
    expect(group('dock', 'layers')).toBeNull()
  })

  it('defaults testId to "dock" so test ids never contain "undefined"', () => {
    render(<DockArea kit="photo-default-testid" groups={[colorGroup]} shown={new Set(['color'])} />)
    expect(host.querySelector('[data-testid="dock-group-color"]')).not.toBeNull()
    expect(host.querySelector('[data-testid="undefined-group-color"]')).toBeNull()
  })

  it('switches the active tab on click, shows its content, persists it once, and restores it on remount', () => {
    const kit = 'photo-switch'
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const root = render(<DockArea kit={kit} groups={[colorGroup]} shown={new Set(['color'])} testId="dock" />)
    expect(host.querySelector('[data-testid="color-body"]')).not.toBeNull()
    expect(tab('dock', 'color')?.getAttribute('aria-selected')).toBe('true')

    setItem.mockClear()
    act(() => tab('dock', 'swatches')!.click())
    expect(host.querySelector('[data-testid="swatches-body"]')).not.toBeNull()
    expect(host.querySelector('[data-testid="color-body"]')).toBeNull()
    expect(tab('dock', 'swatches')?.getAttribute('aria-selected')).toBe('true')
    expect(setItem).toHaveBeenCalledTimes(1)
    setItem.mockRestore()

    act(() => root.unmount())
    roots = roots.filter((r) => r !== root)
    host.remove()

    render(<DockArea kit={kit} groups={[colorGroup]} shown={new Set(['color'])} testId="dock" />)
    expect(host.querySelector('[data-testid="swatches-body"]')).not.toBeNull()
    expect(tab('dock', 'swatches')?.getAttribute('aria-selected')).toBe('true')
  })

  it('shows a tab when the kit asks (its group expanded), persisting it, and ignores a tab it does not draw', () => {
    const kit = 'photo-show-tab'
    const handle = createRef<DockAreaHandle>()
    const store = createTestElements({ hide: ['panel:layers'] })
    render(withUi(store, <DockArea kit={kit} groups={[colorGroup, layersGroup]} shown={new Set(['color', 'layers'])} handle={handle} testId="dock" />))
    act(() => collapseButton('dock', 'color')!.click())
    expect(host.querySelector('[data-testid="color-body"]')).toBeNull()

    act(() => handle.current!.showTab('swatches'))
    expect(host.querySelector('[data-testid="swatches-body"]')).not.toBeNull()
    expect(group('dock', 'color')?.dataset.collapsed).toBe('false')
    expect(JSON.parse(localStorage.getItem(`kit:${kit}:dock`) ?? '{}').color).toMatchObject({ tab: 'swatches', collapsed: false })

    // A hidden tab, or one no group has, changes nothing.
    act(() => handle.current!.showTab('layers'))
    act(() => handle.current!.showTab('nowhere'))
    expect(host.querySelector('[data-testid="layers-body"]')).toBeNull()
    expect(host.querySelector('[data-testid="swatches-body"]')).not.toBeNull()
  })

  it("remembers a tab shown in a group it does not draw yet, opens the group on it, and answers each group's tab", () => {
    const kit = 'photo-show-unshown'
    const handle = createRef<DockAreaHandle>()
    const store = createTestElements({ hide: ['panel:layers'] })
    const dock = (shown: string[]) => withUi(store, <DockArea kit={kit} groups={[colorGroup, layersGroup]} shown={new Set(shown)} handle={handle} testId="dock" />)
    const root = render(dock(['layers']))
    expect(handle.current!.activeTab('color')).toEqual({ tab: 'color', collapsed: false })
    act(() => handle.current!.showTab('swatches'))
    expect(handle.current!.activeTab('color')).toEqual({ tab: 'swatches', collapsed: false })
    act(() => root.render(dock(['color', 'layers'])))
    expect(host.querySelector('[data-testid="swatches-body"]')).not.toBeNull()
    act(() => collapseButton('dock', 'color')!.click())
    expect(handle.current!.activeTab('color')).toEqual({ tab: 'swatches', collapsed: true })
    // A group whose tabs are all hidden, or one the dock does not have, has none.
    expect(handle.current!.activeTab('layers')).toBeNull()
    expect(handle.current!.activeTab('nowhere')).toBeNull()
  })

  it('collapses a group to its strip, hiding its content, and expands it back', () => {
    render(<DockArea kit="photo-collapse" groups={[colorGroup]} shown={new Set(['color'])} testId="dock" />)
    expect(host.querySelector('[data-testid="color-body"]')).not.toBeNull()
    expect(collapseButton('dock', 'color')?.getAttribute('aria-expanded')).toBe('true')

    act(() => collapseButton('dock', 'color')!.click())
    expect(host.querySelector('[data-testid="color-body"]')).toBeNull()
    expect(group('dock', 'color')?.dataset.collapsed).toBe('true')
    expect(collapseButton('dock', 'color')?.getAttribute('aria-expanded')).toBe('false')
    // The strip (and its tabs) stay, even collapsed.
    expect(tab('dock', 'color')).not.toBeNull()

    act(() => collapseButton('dock', 'color')!.click())
    expect(host.querySelector('[data-testid="color-body"]')).not.toBeNull()
    expect(group('dock', 'color')?.dataset.collapsed).toBe('false')
    expect(collapseButton('dock', 'color')?.getAttribute('aria-expanded')).toBe('true')
  })

  it('does not draw a hidden tab, and drops a group whose tabs are all hidden', () => {
    const store = createTestElements({ hide: ['panel:swatches', 'panel:layers'] })
    render(withUi(store, <DockArea kit="photo-hidden" groups={[colorGroup, layersGroup]} shown={new Set(['color', 'layers'])} testId="dock" />))
    // Color's Swatches tab is hidden; Color itself still shows (its own tab remains).
    expect(group('dock', 'color')).not.toBeNull()
    expect(tab('dock', 'swatches')).toBeNull()
    expect(tab('dock', 'color')).not.toBeNull()
    // Layers has only one tab, now hidden: the whole group disappears.
    expect(group('dock', 'layers')).toBeNull()
  })

  it('falls back to the first visible tab when the active one becomes hidden at runtime', () => {
    const store = createTestElements()
    render(withUi(store, <DockArea kit="photo-hidden-fallback" groups={[colorGroup]} shown={new Set(['color'])} testId="dock" />))

    act(() => tab('dock', 'swatches')!.click())
    expect(host.querySelector('[data-testid="swatches-body"]')).not.toBeNull()

    act(() => store.replace({ hide: ['panel:swatches'] }))
    expect(host.querySelector('[data-testid="color-body"]')).not.toBeNull()
    expect(tab('dock', 'color')?.getAttribute('aria-selected')).toBe('true')
  })

  it("carries Kit UI ids on the tab buttons, and the active tab's on the strip and collapse button", () => {
    render(<DockArea kit="photo-ids" groups={[colorGroup]} shown={new Set(['color'])} testId="dock" />)
    expect(tab('dock', 'swatches')?.getAttribute('data-kit-ui-id')).toBe('panel:swatches')
    expect(tab('dock', 'color')?.getAttribute('data-kit-ui-id')).toBe('panel:color')
    expect(collapseButton('dock', 'color')?.getAttribute('data-kit-ui-id')).toBe('panel:color')
    act(() => tab('dock', 'swatches')!.click())
    expect(collapseButton('dock', 'color')?.getAttribute('data-kit-ui-id')).toBe('panel:swatches')
    expect(host.querySelector('.kui-dock-strip')?.getAttribute('data-kit-ui-id')).toBe('panel:swatches')
  })

  it("never shows a hidden tab's id, even when the group shares its first tab's name", () => {
    const store = createTestElements({ hide: ['panel:color'] })
    render(withUi(store, <DockArea kit="photo-hidden-ids" groups={[colorGroup]} shown={new Set(['color'])} testId="dock" />))
    expect(group('dock', 'color')).not.toBeNull()
    expect(host.querySelector('[data-kit-ui-id="panel:color"]')).toBeNull()
    expect(collapseButton('dock', 'color')?.getAttribute('data-kit-ui-id')).toBe('panel:swatches')
  })

  it('ties tabs to their panel and moves focus with Left/Right arrows (roving tabindex)', () => {
    render(<DockArea kit="photo-arrow-tabs" groups={[colorGroup]} shown={new Set(['color'])} testId="dock" />)
    const colorTab = tab('dock', 'color')!
    const swatchesTab = tab('dock', 'swatches')!
    const panel = host.querySelector('[role="tabpanel"]') as HTMLElement
    expect(panel.id).toBe('dock-panel-color')
    expect(colorTab.getAttribute('aria-controls')).toBe(panel.id)
    expect(colorTab.tabIndex).toBe(0)
    expect(swatchesTab.tabIndex).toBe(-1)

    colorTab.focus()
    key(colorTab, 'ArrowRight')
    expect(swatchesTab.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(swatchesTab)
    expect(swatchesTab.tabIndex).toBe(0)
    expect(colorTab.tabIndex).toBe(-1)

    // Wraps around.
    key(swatchesTab, 'ArrowRight')
    expect(colorTab.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(colorTab)

    key(colorTab, 'ArrowLeft')
    expect(swatchesTab.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(swatchesTab)
  })

  it('lets every expanded group give way (flex-shrink) before the dock has to scroll', () => {
    render(<DockArea kit="photo-shrink" groups={[colorGroup, layersGroup]} shown={new Set(['color', 'layers'])} testId="dock" />)
    // Color is not the filler, Layers is; both can shrink (give way) instead of being clipped.
    expect(group('dock', 'color')?.style.flexShrink).toBe('1')
    expect(group('dock', 'layers')?.style.flexShrink).toBe('1')
  })

  it('resizes a non-filler group within bounds via pointer events on its handle, persisting once on release', () => {
    render(<DockArea kit="photo-resize" groups={[colorGroup, layersGroup]} shown={new Set(['color', 'layers'])} testId="dock" />)
    // Color is not the last expanded group, so it has a handle; Layers (the filler) does not.
    expect(handle('dock', 'color')).not.toBeNull()
    expect(handle('dock', 'layers')).toBeNull()
    expect(group('dock', 'color')?.style.flexBasis).toBe('190px')

    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const grip = handle('dock', 'color')!
    pointer(grip, 'pointerdown', 100)
    pointer(grip, 'pointermove', 150)
    expect(group('dock', 'color')?.style.flexBasis).toBe('240px')
    expect(setItem).not.toHaveBeenCalled()
    pointer(grip, 'pointerup', 150)
    expect(group('dock', 'color')?.style.flexBasis).toBe('240px')
    expect(setItem).toHaveBeenCalledTimes(1)

    // Dragging far past the minimum clamps there instead of going negative.
    pointer(grip, 'pointerdown', 150)
    pointer(grip, 'pointermove', -5000)
    expect(group('dock', 'color')?.style.flexBasis).toBe('80px')
    pointer(grip, 'pointerup', -5000)
    expect(setItem).toHaveBeenCalledTimes(2)
    setItem.mockRestore()
  })

  it('resizes via Up/Down arrows on the handle, faster with Shift, clamped at the minimum, persisting each keypress', () => {
    render(<DockArea kit="photo-kbd-resize" groups={[colorGroup, layersGroup]} shown={new Set(['color', 'layers'])} testId="dock" />)
    const grip = handle('dock', 'color')!
    expect(grip.getAttribute('role')).toBe('separator')
    expect(grip.getAttribute('aria-orientation')).toBe('horizontal')
    expect(grip.tabIndex).toBe(0)
    expect(grip.getAttribute('aria-valuenow')).toBe('190')
    expect(grip.getAttribute('aria-valuemin')).toBe('80')

    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    key(grip, 'ArrowDown')
    expect(group('dock', 'color')?.style.flexBasis).toBe('206px')
    expect(setItem).toHaveBeenCalledTimes(1)

    key(grip, 'ArrowUp', { shiftKey: true })
    expect(group('dock', 'color')?.style.flexBasis).toBe('142px')
    expect(setItem).toHaveBeenCalledTimes(2)
    setItem.mockRestore()

    for (let i = 0; i < 20; i += 1) key(grip, 'ArrowUp', { shiftKey: true })
    expect(group('dock', 'color')?.style.flexBasis).toBe('80px')
    expect(grip.getAttribute('aria-valuenow')).toBe('80')
  })

  it("uses the editor's own strings for the collapse/expand labels when a StringsProvider is present, and the shared text otherwise", () => {
    render(<DockArea kit="photo-strings-default" groups={[colorGroup]} shown={new Set(['color'])} testId="dock" />)
    expect(collapseButton('dock', 'color')?.getAttribute('aria-label')).toBe('Collapse panel group')

    render(
      <StringsProvider strings={(key) => (key === 'collapsePanelGroup' ? 'Fold It' : key)}>
        <DockArea kit="photo-strings-editor" groups={[colorGroup]} shown={new Set(['color'])} testId="dock2" />
      </StringsProvider>,
    )
    expect(collapseButton('dock2', 'color')?.getAttribute('aria-label')).toBe('Fold It')
  })
})

// Upstream's Essentials column (dock.rs): Color, Properties, and Layers, with their heights.
const sizing = (height: number, compactHeight: number, minHeight: number, preferredFill: number, extra: Partial<DockSizing> = {}): DockSizing => ({ height, compactHeight, minHeight, preferredFill, resized: false, collapsed: false, ...extra })
const COLOR = sizing(190, 130, 80, 80)
const PROPERTIES = sizing(250, 160, 80, 80)
const CHARACTER = sizing(270, 160, 80, 80)
const LAYERS = sizing(320, 200, 140, 500)
const sum = (heights: number[]) => heights.reduce((total, height) => total + height, 0)

describe("dockHeights (upstream's heights_for)", () => {
  it('gives the groups above the filler their defaults in a tall column, and the filler the rest', () => {
    const heights = dockHeights([COLOR, PROPERTIES, LAYERS], 1200, 28, 6)
    expect(heights.slice(0, 2)).toEqual([190, 250])
    expect(sum(heights) + 12).toBeCloseTo(1200)
  })

  it('shrinks collapsed groups to their strip, and makes the last expanded group the filler', () => {
    expect(dockHeights([{ ...COLOR, collapsed: true }, PROPERTIES, LAYERS], 1000, 28).slice(0, 2)).toEqual([28, 250])
    const heights = dockHeights([{ ...COLOR, collapsed: true }, PROPERTIES, { ...LAYERS, collapsed: true }], 800, 28)
    expect(heights).toEqual([28, 800 - 56, 28])
  })

  it('lets default-sized groups give way to their compact heights, nearest the filler first, so the filler keeps its preferred height', () => {
    const heights = dockHeights([COLOR, PROPERTIES, LAYERS], 820, 28)
    expect(heights[2]).toBeGreaterThanOrEqual(500 - 0.5)
    // 120 points short of 190 + 250 + 500: Properties gives its 90, then Color 30.
    expect(heights).toEqual([160, 160, 500])
    // Four groups in a 780-point column: Layers keeps far more than its minimum.
    const four = dockHeights([COLOR, PROPERTIES, CHARACTER, LAYERS], 780, 28)
    expect(four.slice(0, 3)).toEqual([130, 160, 160])
    expect(four[3]).toBe(330)
  })

  it('keeps the heights a person dragged to', () => {
    const heights = dockHeights([{ ...COLOR, height: 200, resized: true }, { ...PROPERTIES, height: 340, resized: true }, LAYERS], 800, 28)
    expect(heights.slice(0, 2)).toEqual([200, 340])
  })

  it('squeezes every group down to its minimum in a short column, the farthest last, and never goes negative', () => {
    const heights = dockHeights([COLOR, PROPERTIES, LAYERS], 400, 28)
    expect(heights[2]).toBe(140)
    expect(heights[0]).toBe(130)
    expect(heights[1]).toBeLessThan(160)
    for (const available of [0, -50, 1, Number.NaN, Number.POSITIVE_INFINITY, 1e9]) {
      for (const height of dockHeights([COLOR, PROPERTIES, LAYERS], available, 28)) expect(Number.isFinite(height) && height >= 0).toBe(true)
    }
    expect(dockHeights([], 500, 28)).toEqual([])
  })
})

describe('DockArea in a measured column', () => {
  const compactColor: DockGroup = { ...colorGroup, compactHeight: 130 }
  const filler: DockGroup = { ...layersGroup, compactHeight: 200, preferredFill: 500 }
  let restore: (() => void)[] = []
  afterEach(() => {
    for (const undo of restore) undo()
    restore = []
  })
  /** Gives the dock a laid-out height (jsdom lays nothing out) and every strip 28 px. */
  let stripHeight = 28
  function column(height: number) {
    stripHeight = 28
    const fake = (name: 'clientHeight' | 'offsetHeight', className: string, value: () => number) => {
      const own = Object.getOwnPropertyDescriptor(HTMLElement.prototype, name)
      Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get(this: HTMLElement) { return this.classList.contains(className) ? value() : 0 } })
      restore.push(() => (own ? Object.defineProperty(HTMLElement.prototype, name, own) : delete (HTMLElement.prototype as unknown as Record<string, unknown>)[name]))
    }
    fake('clientHeight', 'kui-dock', () => height)
    fake('offsetHeight', 'kui-dock-strip', () => stripHeight)
  }

  /** A ResizeObserver jsdom lacks: records what it observes, and a test fires it as a resize would. */
  class FakeResizeObserver {
    static instances: FakeResizeObserver[] = []
    observed = new Set<Element>()
    constructor(readonly callback: () => void) {
      FakeResizeObserver.instances.push(this)
    }
    observe(element: Element) {
      this.observed.add(element)
    }
    unobserve(element: Element) {
      this.observed.delete(element)
    }
    disconnect() {
      this.observed.clear()
    }
  }
  function observeResizes() {
    FakeResizeObserver.instances = []
    globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver
    restore.push(() => delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver)
  }

  it("lays the groups out as upstream does: a default-sized group gives way so the filler keeps its preferred height", () => {
    column(632)
    render(<DockArea kit="photo-measured" groups={[compactColor, filler]} shown={new Set(['color', 'layers'])} testId="dock" />)
    // 632 less two borders: Color gives way from 190 to 130 so Layers gets 500.
    expect(group('dock', 'color')?.style.flexBasis).toBe('130px')
    expect(group('dock', 'color')?.style.flexShrink).toBe('0')
    expect(group('dock', 'layers')?.style.flexBasis).toBe('500px')
    expect(group('dock', 'color')?.getAttribute('data-height')).toBe('130')
    expect(handle('dock', 'color')?.getAttribute('aria-valuenow')).toBe('130')
  })

  it('pins the default-sized groups at the heights they show when one is resized', () => {
    column(900)
    const properties: DockGroup = { id: 'properties', defaultHeight: 250, compactHeight: 160, tabs: [{ id: 'properties', label: 'Properties', render: () => null }] }
    render(<DockArea kit="photo-pin" groups={[compactColor, properties, filler]} shown={new Set(['color', 'properties', 'layers'])} testId="dock" />)
    // 897 available (three borders): Properties gives way first (to 207), Color keeps 190.
    expect(group('dock', 'color')?.style.flexBasis).toBe('190px')
    expect(group('dock', 'properties')?.style.flexBasis).toBe('207px')
    const grip = handle('dock', 'color')!
    pointer(grip, 'pointerdown', 100)
    pointer(grip, 'pointermove', 120)
    pointer(grip, 'pointerup', 120)
    expect(group('dock', 'color')?.style.flexBasis).toBe('210px')
    expect(group('dock', 'properties')?.style.flexBasis).toBe('207px')
    const stored = JSON.parse(localStorage.getItem('kit:photo-pin:dock') ?? '{}')
    expect(stored.properties.height).toBe(207)
    expect(stored.color.height).toBe(210)
  })

  it('pins nothing for a click on a handle, only on the first move that changes a height', () => {
    column(900)
    const properties: DockGroup = { id: 'properties', defaultHeight: 250, compactHeight: 160, tabs: [{ id: 'properties', label: 'Properties', render: () => null }] }
    render(<DockArea kit="photo-click" groups={[compactColor, properties, filler]} shown={new Set(['color', 'properties', 'layers'])} testId="dock" />)
    const grip = handle('dock', 'color')!
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    pointer(grip, 'pointerdown', 100)
    pointer(grip, 'pointermove', 100)
    pointer(grip, 'pointerup', 100)
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.getItem('kit:photo-click:dock')).toBeNull()
    // Properties still gives way to the filler as it did: nothing was pinned.
    expect(group('dock', 'properties')?.style.flexBasis).toBe('207px')
    setItem.mockRestore()
  })

  it('lays out groups without compact or preferred heights at their defaults, the filler taking the rest', () => {
    column(700)
    render(<DockArea kit="photo-plain" groups={[colorGroup, layersGroup]} shown={new Set(['color', 'layers'])} testId="dock" />)
    // 698 available: Color keeps its default 190 (it gives way only to Layers' minimum), Layers takes 508.
    expect(group('dock', 'color')?.style.flexBasis).toBe('190px')
    expect(group('dock', 'layers')?.style.flexBasis).toBe('508px')
  })

  it('measures the tab strip again when it changes height, not only when the dock resizes', () => {
    observeResizes()
    column(600)
    const collapsed = { ...compactColor }
    localStorage.setItem('kit:photo-strip:dock', JSON.stringify({ color: { collapsed: true } }))
    render(<DockArea kit="photo-strip" groups={[collapsed, filler]} shown={new Set(['color', 'layers'])} testId="dock" />)
    // 598 available less Color's 28-pixel strip: Layers gets 570.
    expect(group('dock', 'layers')?.style.flexBasis).toBe('570px')
    const watching = FakeResizeObserver.instances.at(-1)!
    expect([...watching.observed].some((element) => element.classList.contains('kui-dock-strip'))).toBe(true)
    stripHeight = 40
    act(() => watching.callback())
    expect(group('dock', 'layers')?.style.flexBasis).toBe('558px')
  })
})
