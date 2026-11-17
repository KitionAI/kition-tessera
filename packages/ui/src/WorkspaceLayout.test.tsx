// @vitest-environment jsdom
import { act, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspaceLayout, type WorkspaceLayoutProps, type WorkspacePanel } from './index'
import type { WorkspaceNode } from './workspaceTree'
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

const WIDTH = 1000
const HEIGHT = 600

let host: HTMLDivElement
let roots: Root[] = []
beforeEach(() => {
  // jsdom lays nothing out: the workspace measures a 1000×600 area.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: WIDTH, bottom: HEIGHT, width: WIDTH, height: HEIGHT, toJSON: () => ({}) } as DOMRect)
})
afterEach(() => {
  for (const root of roots) act(() => root.unmount())
  roots = []
  host?.remove()
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

const tabs = (ids: string[], active = 0): WorkspaceNode => ({ tabs: ids, active })
const row = (size: Record<string, number>, a: WorkspaceNode, b: WorkspaceNode): WorkspaceNode => ({ split: 'row', size: size as never, a, b })
const column = (size: Record<string, number>, a: WorkspaceNode, b: WorkspaceNode): WorkspaceNode => ({ split: 'column', size: size as never, a, b })

/** Upstream's Editing workspace (`dock.rs` `workspace`). */
const EDITING: WorkspaceNode = column(
  { ratio: 0.57 },
  row({ fixedB: 450 }, row({ ratio: 0.5 }, tabs(['source', 'effectControls', 'audioClipMixer', 'metadata']), tabs(['program'])), tabs(['properties', 'essentialGraphics', 'text'])),
  row({ ratio: 0.29 }, tabs(['project', 'mediaBrowser', 'libraries', 'info', 'effects', 'markers', 'history']), row({ fixedA: 64 }, tabs(['tools']), row({ fixedB: 116 }, tabs(['timeline']), tabs(['audioMeters'])))),
)

const IDS = ['source', 'effectControls', 'audioClipMixer', 'metadata', 'program', 'properties', 'essentialGraphics', 'text', 'project', 'mediaBrowser', 'libraries', 'info', 'effects', 'markers', 'history', 'tools', 'timeline', 'audioMeters']
const PANELS: WorkspacePanel[] = IDS.map((id) => ({
  id,
  label: id[0].toUpperCase() + id.slice(1),
  render: () => <div data-testid={`body-${id}`}>{id}</div>,
  compact: id === 'tools' || id === 'audioMeters',
}))

type Harness = Partial<WorkspaceLayoutProps> & { initial?: WorkspaceNode; onTreeSpy?: (tree: WorkspaceNode) => void }

/** A controlled workspace, as a kit keeps one: the tree, focus, and maximized frame in state. */
function Controlled({ initial = EDITING, onTreeSpy, panels = PANELS, ...props }: Harness) {
  const [tree, setTree] = useState(initial)
  const [focused, setFocused] = useState<string | null>(props.focused ?? null)
  const [maximized, setMaximized] = useState<string | null>(props.maximized ?? null)
  return (
    <WorkspaceLayout
      tree={tree}
      onTree={(next) => {
        onTreeSpy?.(next)
        setTree(next)
      }}
      panels={panels}
      focused={focused}
      onFocus={(panel) => {
        props.onFocus?.(panel)
        setFocused(panel)
      }}
      maximized={maximized}
      onMaximized={(panel) => {
        props.onMaximized?.(panel)
        setMaximized(panel)
      }}
      onRestore={() => {
        props.onRestore?.()
        setTree(initial)
      }}
      testId="ws"
    />
  )
}

const q = (id: string) => host.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const frames = () => [...host.querySelectorAll<HTMLElement>('[data-testid^="ws-frame-"]')]
const bodies = () => [...host.querySelectorAll<HTMLElement>('[data-testid^="body-"]')].map((element) => element.textContent)

function pointer(target: HTMLElement, type: string, init: MouseEventInit = {}) {
  act(() => {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, ...init }))
  })
}

function drag(target: HTMLElement, dx: number, dy: number) {
  pointer(target, 'pointerdown', { clientX: 100, clientY: 100 })
  pointer(target, 'pointermove', { clientX: 100 + dx, clientY: 100 + dy })
  pointer(target, 'pointerup', { clientX: 100 + dx, clientY: 100 + dy })
}

function openMenu(panel: string) {
  act(() => q(`ws-menu-${panel}`)!.click())
}

function menuRow(label: string) {
  return [...document.querySelectorAll<HTMLButtonElement>('[role="menu"] [role="menuitem"]')].find((row) => row.textContent === label)
}

describe('WorkspaceLayout', () => {
  it('renders the Editing tree as 7 frames, each showing only its active tab', () => {
    render(<Controlled />)
    expect(frames().map((frame) => frame.dataset.testid)).toEqual(
      ['source', 'program', 'properties', 'project', 'tools', 'timeline', 'audioMeters'].map((id) => `ws-frame-${id}`),
    )
    expect(bodies().sort()).toEqual(['audioMeters', 'program', 'project', 'properties', 'source', 'timeline', 'tools'])
    expect(q('ws-frame-source')!.dataset.kitUiId).toBe('panel:source')
    // Inactive tabs have a tab but no content.
    expect(q('ws-tab-history')).not.toBeNull()
    expect(q('body-history')).toBeNull()
    // Compact panels have a grip, not a tab strip.
    expect(q('ws-tab-tools')).toBeNull()
    expect(q('ws-frame-tools')!.querySelector('.kui-ws-grip')).not.toBeNull()
  })

  it('lays the frames out from the tree with 4 px gutters', () => {
    render(<Controlled />)
    // The root column: 596 px to share, 0.57 of it on top.
    const top = 0.57 * (HEIGHT - 4)
    const program = q('ws-frame-program')!
    expect(parseFloat(program.style.height)).toBeCloseTo(top)
    const timeline = q('ws-frame-timeline')!
    expect(parseFloat(timeline.style.top)).toBeCloseTo(top + 4)
    // The meters keep their fixed 116 px.
    expect(parseFloat(q('ws-frame-audioMeters')!.style.width)).toBeCloseTo(116)
    expect(parseFloat(q('ws-frame-audioMeters')!.style.left) + 116).toBeCloseTo(WIDTH)
  })

  it('switches content when a tab is clicked, and reports the new tree', () => {
    const onTreeSpy = vi.fn()
    const onFocus = vi.fn()
    render(<Controlled onTreeSpy={onTreeSpy} onFocus={onFocus} />)
    act(() => q('ws-tab-history')!.click())
    expect(onTreeSpy).toHaveBeenCalledTimes(1)
    const tree = onTreeSpy.mock.calls[0][0] as Extract<WorkspaceNode, { split: unknown }>
    expect(((tree.b as Extract<WorkspaceNode, { split: unknown }>).a as { active: number }).active).toBe(6)
    expect(q('body-history')).not.toBeNull()
    expect(q('body-project')).toBeNull()
    expect(q('ws-frame-history')!.dataset.kitUiId).toBe('panel:history')
    expect(q('ws-tab-history')!.getAttribute('aria-selected')).toBe('true')
    expect(onFocus).toHaveBeenLastCalledWith('history')
  })

  it('moves a tab with the arrow keys', () => {
    render(<Controlled />)
    act(() => q('ws-tab-project')!.focus())
    act(() => {
      q('ws-tab-project')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    })
    expect(q('body-history')).not.toBeNull()
    expect(document.activeElement).toBe(q('ws-tab-history'))
  })

  it('resizes a ratio split and a fixedB split by dragging their gutters', () => {
    const onTreeSpy = vi.fn()
    render(<Controlled onTreeSpy={onTreeSpy} />)
    // The root is a column: dragging its gutter 50 px down grows the top.
    drag(q('ws-gutter-')!, 0, 50)
    const root = onTreeSpy.mock.lastCall![0] as { size: { ratio: number } }
    const avail = HEIGHT - 4
    expect(root.size.ratio).toBeCloseTo((0.57 * avail + 50) / avail)

    // Timeline | Meters (fixedB 116): dragging 50 px right shrinks the meters to 66.
    drag(q('ws-gutter-bbb')!, 50, 0)
    const meters = onTreeSpy.mock.lastCall![0] as { b: { b: { b: { size: { fixedB: number } } } } }
    expect(meters.b.b.b.size.fixedB).toBeCloseTo(66)
    expect(parseFloat(q('ws-frame-audioMeters')!.style.width)).toBeCloseTo(66)
  })

  it('keeps each side of a dragged gutter at least 40 px', () => {
    const onTreeSpy = vi.fn()
    render(<Controlled onTreeSpy={onTreeSpy} />)
    drag(q('ws-gutter-bbb')!, 2000, 0)
    const meters = onTreeSpy.mock.lastCall![0] as { b: { b: { b: { size: { fixedB: number } } } } }
    expect(meters.b.b.b.size.fixedB).toBeCloseTo(40)
  })

  it('moves a gutter with the arrow keys, 16 px or 64 px with Shift', () => {
    const onTreeSpy = vi.fn()
    render(<Controlled onTreeSpy={onTreeSpy} />)
    const gutter = q('ws-gutter-bbb')!
    expect(gutter.getAttribute('role')).toBe('separator')
    expect(gutter.getAttribute('aria-orientation')).toBe('vertical')
    expect(gutter.tabIndex).toBe(0)
    act(() => {
      gutter.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    })
    expect((onTreeSpy.mock.lastCall![0] as { b: { b: { b: { size: { fixedB: number } } } } }).b.b.b.size.fixedB).toBeCloseTo(132)
    act(() => {
      q('ws-gutter-bbb')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }))
    })
    expect((onTreeSpy.mock.lastCall![0] as { b: { b: { b: { size: { fixedB: number } } } } }).b.b.b.size.fixedB).toBeCloseTo(68)
    // Up and Down do nothing on a row's gutter.
    const calls = onTreeSpy.mock.calls.length
    act(() => {
      q('ws-gutter-bbb')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    })
    expect(onTreeSpy.mock.calls.length).toBe(calls)
  })

  it('closes a tab from the panel menu, and collapses a group when its last tab closes', () => {
    render(<Controlled />)
    openMenu('project')
    act(() => menuRow('Close Panel')!.click())
    expect(q('ws-tab-project')).toBeNull()
    expect(q('ws-frame-mediaBrowser')).not.toBeNull()
    expect(frames()).toHaveLength(7)

    openMenu('program')
    act(() => menuRow('Close Panel')!.click())
    expect(q('ws-frame-program')).toBeNull()
    expect(frames()).toHaveLength(6)
    // Source now takes the whole of its split's width (1000 − 450 − 4).
    expect(parseFloat(q('ws-frame-source')!.style.width)).toBeCloseTo(WIDTH - 450 - 4)
  })

  it('opens the panel menu on a right-click of a tab, activating it first', () => {
    const onFocus = vi.fn()
    render(<Controlled onFocus={onFocus} />)
    act(() => {
      q('ws-tab-markers')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 30, clientY: 400 }))
    })
    expect(q('body-markers')).not.toBeNull()
    expect(onFocus).toHaveBeenLastCalledWith('markers')
    expect(menuRow('Close Panel')).toBeDefined()
    act(() => menuRow('Close Panel')!.click())
    expect(q('ws-tab-markers')).toBeNull()
  })

  it('maximizes a frame from the panel menu as upstream: the tree becomes that panel until Restore Workspace', () => {
    const onTreeSpy = vi.fn()
    const onFocus = vi.fn()
    const onMaximized = vi.fn()
    render(<Controlled onTreeSpy={onTreeSpy} onFocus={onFocus} onMaximized={onMaximized} />)
    openMenu('program')
    expect(menuRow('Restore Frame')).toBeUndefined()
    act(() => menuRow('Maximize Frame')!.click())
    expect(onTreeSpy).toHaveBeenLastCalledWith({ tabs: ['program'], active: 0 })
    expect(onFocus).toHaveBeenLastCalledWith('program')
    expect(onMaximized).not.toHaveBeenCalled()
    expect(bodies()).toEqual(['program'])
    expect(frames()).toHaveLength(1)
    expect(parseFloat(q('ws-frame-program')!.style.width)).toBeCloseTo(WIDTH)
    expect(host.querySelector('[role="separator"]')).toBeNull()

    // The menu still reads Maximize Frame; only Restore Workspace brings the layout back.
    openMenu('program')
    expect(menuRow('Maximize Frame')).toBeDefined()
    act(() => menuRow('Restore Workspace')!.click())
    expect(frames()).toHaveLength(7)
  })

  it('fills the area with the maximized panel without changing the tree (the ` keys)', () => {
    const onTreeSpy = vi.fn()
    const root = render(<Controlled onTreeSpy={onTreeSpy} maximized="timeline" />)
    expect(bodies()).toEqual(['timeline'])
    expect(parseFloat(q('ws-frame-timeline')!.style.height)).toBeCloseTo(HEIGHT)
    expect(onTreeSpy).not.toHaveBeenCalled()
    // A maximized panel the tree does not hold is ignored.
    act(() => root.render(<Controlled key="other" initial={{ tabs: ['program'], active: 0 }} maximized="timeline" />))
    expect(bodies()).toEqual(['program'])
  })

  it('calls onRestore from Restore Workspace and adds the panel’s own rows', () => {
    const onRestore = vi.fn()
    const panels = PANELS.map((panel) => (panel.id === 'timeline' ? { ...panel, menu: (close: () => void) => <button type="button" role="menuitem" data-testid="extra" onClick={close}>Extra</button> } : panel))
    render(<Controlled panels={panels} onRestore={onRestore} />)
    openMenu('timeline')
    expect(document.querySelector('[data-testid="extra"]')).not.toBeNull()
    act(() => menuRow('Restore Workspace')!.click())
    expect(onRestore).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[role="menu"]')).toBeNull()
  })

  it('draws a panel’s own strip over its tab, outside the tablist, told whether the tab is active', () => {
    const strip = vi.fn((active: boolean) => <button type="button" data-testid="seq-close">{active ? 'Sequence 01 ×' : 'Sequence 01'}</button>)
    const panels = PANELS.map((panel) => (panel.id === 'timeline' ? { ...panel, strip } : panel))
    render(<Controlled panels={panels} />)
    expect(strip).toHaveBeenLastCalledWith(true)
    const tab = q('ws-tab-timeline')!
    expect(tab.getAttribute('aria-label')).toBe('Timeline')
    expect(tab.querySelector('button')).toBeNull()
    const overlay = q('ws-strip-timeline')!
    expect(overlay.closest('[role="tablist"]')).toBeNull()
    expect(overlay.getAttribute('aria-labelledby')).toBe(tab.id)
    expect(overlay.textContent).toBe('Sequence 01 ×')
    act(() => q('seq-close')!.click())
    expect(q('body-timeline')).not.toBeNull()
  })

  it('lets a panel close itself, add rows after Close Panel, and fill the » list', () => {
    const onClose = vi.fn()
    const panels = PANELS.map((panel) =>
      panel.id === 'project'
        ? {
            ...panel,
            onClose,
            afterClose: () => <button type="button" role="menuitem" data-kit-ui-id="panel:project">Close Others</button>,
          }
        : panel,
    )
    render(<Controlled panels={panels} />)
    openMenu('project')
    const rows = [...document.querySelectorAll('[role="menu"] [role="menuitem"]')].map((row) => row.textContent)
    expect(rows).toEqual(['Close Panel', 'Close Others', 'Maximize Frame', 'Restore Workspace'])
    act(() => menuRow('Close Panel')!.click())
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(q('ws-tab-project')).not.toBeNull()
    act(() => {
      q('ws-tab-project')!.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }))
    })
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(q('ws-tab-project')).not.toBeNull()
  })

  it('does not draw hidden tabs, nor a group whose tabs are all hidden', () => {
    const store = createTestElements({ hide: ['panel:history'] })
    render(
      <TestElements store={store}>
        <Controlled />
      </TestElements>,
    )
    expect(q('ws-tab-history')).toBeNull()
    expect(q('ws-tab-markers')).not.toBeNull()
    expect(frames()).toHaveLength(7)

    act(() => store.replace({ hide: ['panel:program'] }))
    expect(q('ws-frame-program')).toBeNull()
    expect(frames()).toHaveLength(6)
    // The hidden group's split closes: Source takes its place, and its gutter goes.
    expect(parseFloat(q('ws-frame-source')!.style.width)).toBeCloseTo(WIDTH - 450 - 4)
    expect(q('ws-gutter-aa')).toBeNull()
    expect(q('ws-gutter-a')).not.toBeNull()
  })

  it('shows the first visible tab when the active one is hidden', () => {
    const store = createTestElements({ hide: ['panel:project'] })
    render(
      <TestElements store={store}>
        <Controlled />
      </TestElements>,
    )
    expect(q('body-mediaBrowser')).not.toBeNull()
    expect(q('ws-frame-mediaBrowser')!.dataset.kitUiId).toBe('panel:mediaBrowser')
  })

  it('renders a disabled tab’s content in a disabled fieldset', () => {
    const store = createTestElements({ disable: ['panel:program'] })
    render(
      <TestElements store={store}>
        <Controlled />
      </TestElements>,
    )
    const fieldset = q('body-program')!.closest('fieldset')!
    expect(fieldset.classList.contains('kui-element')).toBe(true)
    expect(fieldset.disabled).toBe(true)
    expect(q('body-source')!.closest('fieldset')!.disabled).toBe(false)
  })

  it('moves the focus with the pointer, and outlines the focused frame', () => {
    const onFocus = vi.fn()
    render(<Controlled onFocus={onFocus} focused="program" />)
    expect(q('ws-frame-program')!.dataset.focused).toBe('true')
    expect(q('ws-frame-timeline')!.dataset.focused).toBeUndefined()
    pointer(q('body-timeline')!, 'pointerdown')
    expect(onFocus).toHaveBeenLastCalledWith('timeline')
    expect(q('ws-frame-timeline')!.dataset.focused).toBe('true')
    expect(q('ws-frame-program')!.dataset.focused).toBeUndefined()
  })

  it('closes a tab on a middle click', () => {
    render(<Controlled />)
    act(() => {
      q('ws-tab-info')!.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }))
    })
    expect(q('ws-tab-info')).toBeNull()
  })

  it('keeps a panel mounted when its frame moves in the tree', () => {
    let mounts = 0
    function Counted() {
      useState(() => {
        mounts += 1
        return 0
      })
      return <div data-testid="body-program">program</div>
    }
    const panels = PANELS.map((panel) => (panel.id === 'program' ? { ...panel, render: () => <Counted /> } : panel))
    render(<Controlled panels={panels} />)
    openMenu('program')
    act(() => menuRow('Maximize Frame')!.click())
    expect(frames()).toHaveLength(1)
    openMenu('program')
    act(() => menuRow('Restore Workspace')!.click())
    expect(frames()).toHaveLength(7)
    expect(mounts).toBe(1)
  })

  it('does not draw other bodies again while a gutter is dragged, and reports one tree per frame', () => {
    const renders = new Map<string, number>()
    const panels = PANELS.map((panel) => ({
      ...panel,
      render: () => {
        renders.set(panel.id, (renders.get(panel.id) ?? 0) + 1)
        return <div data-testid={`body-${panel.id}`}>{panel.id}</div>
      },
    }))
    const onTreeSpy = vi.fn()
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback))
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
    render(<Controlled panels={panels} onTreeSpy={onTreeSpy} />)
    const before = new Map(renders)
    const gutter = q('ws-gutter-bbb')!
    pointer(gutter, 'pointerdown', { clientX: 100, clientY: 100 })
    pointer(gutter, 'pointermove', { clientX: 110, clientY: 100 })
    pointer(gutter, 'pointermove', { clientX: 120, clientY: 100 })
    expect(onTreeSpy).not.toHaveBeenCalled()
    act(() => frames.shift()!(0))
    expect(onTreeSpy).toHaveBeenCalledTimes(1)
    pointer(gutter, 'pointermove', { clientX: 130, clientY: 100 })
    pointer(gutter, 'pointerup', { clientX: 130, clientY: 100 })
    // Released: the last move is reported at once.
    expect(onTreeSpy).toHaveBeenCalledTimes(2)
    expect((onTreeSpy.mock.lastCall![0] as { b: { b: { b: { size: { fixedB: number } } } } }).b.b.b.size.fixedB).toBeCloseTo(86)
    for (const id of ['source', 'program', 'properties', 'project', 'tools']) expect(renders.get(id)).toBe(before.get(id))
    // The two frames beside the gutter changed size, so they drew again.
    expect(renders.get('timeline')).toBeGreaterThan(before.get('timeline')!)
  })

  it('fits tabs as upstream: the active one always shows, earlier ones drop out first, the rest through »', () => {
    // Every tab is 100 px wide, the active one 120 px (its ≡); the Project frame is 0.29 × 996 px.
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      if (!this.classList.contains('kui-ws-tab')) return 0
      return this.getAttribute('aria-selected') === 'true' ? 120 : 100
    })
    render(<Controlled />)
    const drawn = () => ['project', 'mediaBrowser', 'libraries', 'info', 'effects', 'markers', 'history'].filter((id) => q(`ws-tab-${id}`)!.style.display !== 'none')
    expect(drawn()).toEqual(['project', 'mediaBrowser'])
    expect(q('ws-more-project')).not.toBeNull()
    act(() => q('ws-more-project')!.click())
    act(() => document.querySelector<HTMLButtonElement>('[data-testid="ws-more-project-history"]')!.click())
    expect(q('body-history')).not.toBeNull()
    expect(drawn()).toEqual(['markers', 'history'])
  })

  it('closes the » list when its own button is pressed again', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('kui-ws-tab') ? 100 : 0
    })
    render(<Controlled />)
    const more = () => q('ws-more-project')!
    act(() => more().click())
    expect(more().getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('[data-testid="ws-more-list-project"]')).not.toBeNull()
    pointer(more(), 'pointerdown')
    act(() => more().click())
    expect(document.querySelector('[data-testid="ws-more-list-project"]')).toBeNull()
    expect(more().getAttribute('aria-expanded')).toBe('false')
  })

  it('closes the panel menu when ≡ is pressed again, and says whether it is open', () => {
    render(<Controlled />)
    const button = () => q('ws-menu-program')!
    expect(button().getAttribute('aria-expanded')).toBe('false')
    openMenu('program')
    expect(button().getAttribute('aria-expanded')).toBe('true')
    pointer(button(), 'pointerdown')
    act(() => button().click())
    expect(document.querySelector('[role="menu"]')).toBeNull()
  })

  it('gives tabs, panels, and gutters their accessible names and limits', () => {
    render(<Controlled />)
    const tab = q('ws-tab-program')!
    const body = document.getElementById(tab.getAttribute('aria-controls')!)!
    expect(body.getAttribute('role')).toBe('tabpanel')
    expect(body.getAttribute('aria-labelledby')).toBe(tab.id)
    expect(q('ws-menu-program')!.closest('[role="tablist"]')).toBeNull()
    expect(q('ws-frame-tools')!.querySelector('[role="tabpanel"]')!.getAttribute('aria-label')).toBe('Tools')
    const gutter = q('ws-gutter-bbb')!
    expect(gutter.getAttribute('aria-label')).toBe('Resize panels')
    expect(gutter.getAttribute('aria-valuemin')).toBe('40')
    // Timeline | Meters shares 635.16 px: the gutter moves up to 40 px from the far side.
    expect(Number(gutter.getAttribute('aria-valuemax'))).toBe(Math.round(635.16 - 40))
    expect(q('ws-frame-program')!.dataset.panel).toBe('program')
  })

  it('focuses a frame when the keyboard enters it', () => {
    const onFocus = vi.fn()
    render(<Controlled onFocus={onFocus} />)
    act(() => q('ws-tab-timeline')!.focus())
    expect(onFocus).toHaveBeenLastCalledWith('timeline')
  })

  it('moves the keyboard to the frame’s next tab, or the next frame, after Close Panel', () => {
    render(<Controlled />)
    openMenu('project')
    act(() => menuRow('Close Panel')!.click())
    expect(document.activeElement).toBe(q('ws-tab-mediaBrowser'))
    openMenu('program')
    act(() => menuRow('Close Panel')!.click())
    expect(document.activeElement).toBe(q('ws-tab-properties'))
  })
})
