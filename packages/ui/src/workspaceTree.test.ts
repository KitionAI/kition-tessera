import { describe, expect, it } from 'vitest'
import {
  activate,
  closePanel,
  contains,
  isVisible,
  openNear,
  panelsOf,
  resizeAt,
  restoreBeside,
  splitFirst,
  shownActive,
  validateTree,
  visiblePanels,
  type WorkspaceNode,
  type WorkspaceSize,
} from './workspaceTree'

const tabs = (panels: string[], active = 0): WorkspaceNode => ({ tabs: panels, active })
const row = (size: WorkspaceSize, a: WorkspaceNode, b: WorkspaceNode): WorkspaceNode => ({ split: 'row', size, a, b })
const column = (size: WorkspaceSize, a: WorkspaceNode, b: WorkspaceNode): WorkspaceNode => ({ split: 'column', size, a, b })

/** Upstream's Editing workspace (`dock.rs` `workspace`), with panels named in lowerCamel. */
const editing = (): WorkspaceNode =>
  column(
    { ratio: 0.57 },
    row(
      { fixedB: 450 },
      row({ ratio: 0.5 }, tabs(['source', 'effectControls', 'audioClipMixer', 'metadata']), tabs(['program'])),
      tabs(['properties', 'essentialGraphics', 'text']),
    ),
    row(
      { ratio: 0.29 },
      tabs(['project', 'mediaBrowser', 'libraries', 'info', 'effects', 'markers', 'history']),
      row({ fixedA: 64 }, tabs(['tools']), row({ fixedB: 116 }, tabs(['timeline']), tabs(['audioMeters']))),
    ),
  )

const KNOWN = new Set(panelsOf(editing()))

describe('splitFirst', () => {
  it('sizes the first child by ratio, fixedA, and fixedB', () => {
    expect(splitFirst({ ratio: 0.25 }, 1000)).toBe(250)
    expect(splitFirst({ fixedA: 300 }, 1000)).toBe(300)
    expect(splitFirst({ fixedB: 300 }, 1000)).toBe(700)
  })

  it('keeps each child at least 20 px when there is room', () => {
    expect(splitFirst({ ratio: 0 }, 1000)).toBe(20)
    expect(splitFirst({ ratio: 1 }, 1000)).toBe(980)
    expect(splitFirst({ fixedA: 0 }, 1000)).toBe(20)
    expect(splitFirst({ fixedB: 2000 }, 1000)).toBe(20)
    expect(splitFirst({ fixedA: 2000 }, 1000)).toBe(980)
  })

  it('never returns NaN or more than the available space, even when it is tiny or negative', () => {
    const sizes: WorkspaceSize[] = [{ ratio: 0 }, { ratio: 0.5 }, { ratio: 1 }, { fixedA: 300 }, { fixedB: 300 }, { fixedA: 0 }]
    for (const available of [0, 1, 15, 20, 35, 39.9, 40, 100, 2000]) {
      for (const size of sizes) {
        const first = splitFirst(size, available)
        expect(Number.isNaN(first)).toBe(false)
        expect(first).toBeGreaterThanOrEqual(0)
        expect(first).toBeLessThanOrEqual(available)
      }
    }
    for (const available of [-10, Number.NaN]) {
      expect(splitFirst({ ratio: 0.5 }, available)).toBe(0)
      expect(splitFirst({ fixedB: 30 }, available)).toBe(0)
    }
    expect(splitFirst({ fixedA: 10 }, 30)).toBe(15)
  })
})

describe('tree queries', () => {
  it('lists every panel in order and finds one', () => {
    expect(panelsOf(editing())).toEqual([
      'source', 'effectControls', 'audioClipMixer', 'metadata', 'program', 'properties', 'essentialGraphics', 'text',
      'project', 'mediaBrowser', 'libraries', 'info', 'effects', 'markers', 'history', 'tools', 'timeline', 'audioMeters',
    ])
    expect(contains(editing(), 'history')).toBe(true)
    expect(contains(editing(), 'lumetriColor')).toBe(false)
  })

  it('treats only active tabs as visible', () => {
    const tree = editing()
    expect(isVisible(tree, 'source')).toBe(true)
    expect(isVisible(tree, 'effectControls')).toBe(false)
    expect(isVisible(tree, 'timeline')).toBe(true)
    expect(isVisible(tree, 'lumetriColor')).toBe(false)
  })

  it('activates a tab in its group without changing the input', () => {
    const tree = editing()
    const next = activate(tree, 'history')
    expect(isVisible(next, 'history')).toBe(true)
    expect(isVisible(next, 'project')).toBe(false)
    expect(isVisible(tree, 'project')).toBe(true)
    expect(activate(tree, 'lumetriColor')).toBe(tree)
  })
})

describe('closePanel', () => {
  it('removes a tab and keeps the active index in range', () => {
    const next = closePanel(tabs(['a', 'b', 'c'], 2), 'c')
    expect(next).toEqual(tabs(['a', 'b'], 1))
  })

  it('collapses the split when a group loses its last tab', () => {
    const next = closePanel(editing(), 'program')
    expect(contains(next, 'program')).toBe(false)
    const top = (next as { a: WorkspaceNode }).a as { a: WorkspaceNode }
    expect(top.a).toEqual(tabs(['source', 'effectControls', 'audioClipMixer', 'metadata']))
  })

  it('collapses a nested split into its parent', () => {
    const next = closePanel(editing(), 'timeline')
    const bottom = (next as { b: WorkspaceNode }).b
    expect(bottom).toEqual(row({ ratio: 0.29 }, tabs(['project', 'mediaBrowser', 'libraries', 'info', 'effects', 'markers', 'history']), row({ fixedA: 64 }, tabs(['tools']), tabs(['audioMeters']))))
  })

  it('leaves a tree without the panel equal', () => {
    expect(closePanel(editing(), 'lumetriColor')).toEqual(editing())
  })
})

describe('openNear', () => {
  it('adds the panel as the active tab of the group holding near', () => {
    const next = openNear(editing(), 'lumetriColor', 'program')
    expect(contains(next, 'lumetriColor')).toBe(true)
    expect(isVisible(next, 'lumetriColor')).toBe(true)
    expect(isVisible(next, 'program')).toBe(false)
    const top = (next as { a: WorkspaceNode }).a as { a: WorkspaceNode }
    expect((top.a as { b: WorkspaceNode }).b).toEqual(tabs(['program', 'lumetriColor'], 1))
  })

  it('activates the panel when it is already present', () => {
    const next = openNear(editing(), 'history', 'program')
    expect(isVisible(next, 'history')).toBe(true)
    expect(panelsOf(next)).toEqual(panelsOf(editing()))
  })

  it('tries each candidate in order and adds nothing when none is present', () => {
    const next = openNear(editing(), 'lumetriColor', ['missing', 'project', 'program'])
    expect(isVisible(next, 'lumetriColor')).toBe(true)
    expect(isVisible(next, 'project')).toBe(false)
    const tree = editing()
    expect(openNear(tree, 'lumetriColor', ['missing'])).toBe(tree)
  })
})

describe('restoreBeside', () => {
  it("reproduces upstream's restore_timeline on the Editing workspace with the Timeline closed", () => {
    const closed = closePanel(editing(), 'timeline')
    expect(restoreBeside(closed, 'timeline', 'audioMeters', 116, 'project')).toEqual(editing())
  })

  it('opens near the fallback when no single-tab group holds beside', () => {
    const closed = closePanel(closePanel(editing(), 'timeline'), 'audioMeters')
    const next = restoreBeside(closed, 'timeline', 'audioMeters', 116, 'project')
    expect(isVisible(next, 'timeline')).toBe(true)
    expect(isVisible(next, 'project')).toBe(false)
  })

  it('does not split a group that holds beside among other tabs', () => {
    const tree = row({ ratio: 0.5 }, tabs(['project']), tabs(['audioMeters', 'info']))
    expect(restoreBeside(tree, 'timeline', 'audioMeters', 116, 'project')).toEqual(row({ ratio: 0.5 }, tabs(['project', 'timeline'], 1), tabs(['audioMeters', 'info'])))
  })

  it('changes nothing when the panel is present', () => {
    const tree = editing()
    expect(restoreBeside(tree, 'timeline', 'audioMeters', 116, 'project')).toBe(tree)
  })
})

describe('resizeAt', () => {
  it('sets the size of the split at a path', () => {
    const next = resizeAt(editing(), 'bb', { fixedA: 80 })
    expect(((next as { b: WorkspaceNode }).b as { b: { size: WorkspaceSize } }).b.size).toEqual({ fixedA: 80 })
    expect(resizeAt(editing(), '', { ratio: 0.4 })).toMatchObject({ size: { ratio: 0.4 } })
  })

  it('leaves the tree unchanged for a path that does not end at a split', () => {
    const tree = editing()
    expect(resizeAt(tree, 'aab', { ratio: 0.1 })).toBe(tree)
    expect(resizeAt(tree, 'aaaa', { ratio: 0.1 })).toBe(tree)
    expect(resizeAt(tree, 'x', { ratio: 0.1 })).toBe(tree)
  })
})

describe('validateTree', () => {
  it('accepts a stored tree', () => {
    expect(validateTree(JSON.parse(JSON.stringify(editing())), KNOWN)).toEqual(editing())
  })

  it('rejects non-objects', () => {
    for (const raw of [null, undefined, 3, 'tree', [], true]) expect(validateTree(raw, KNOWN)).toBeUndefined()
  })

  it('rejects a split missing a child', () => {
    expect(validateTree({ split: 'row', size: { ratio: 0.5 }, a: tabs(['program']) }, KNOWN)).toBeUndefined()
    expect(validateTree({ split: 'diagonal', size: { ratio: 0.5 }, a: tabs(['program']), b: tabs(['project']) }, KNOWN)).toBeUndefined()
  })

  it('rejects a non-numeric size', () => {
    for (const size of [{ ratio: '0.5' }, { fixedA: null }, { fixedB: Number.NaN }, {}, 0.5, null]) {
      expect(validateTree({ split: 'row', size, a: tabs(['program']), b: tabs(['project']) }, KNOWN)).toBeUndefined()
    }
  })

  it('rejects tabs that are not a list or an active index that is not a number', () => {
    expect(validateTree({ tabs: 'program', active: 0 }, KNOWN)).toBeUndefined()
    expect(validateTree({ tabs: ['program'], active: '0' }, KNOWN)).toBeUndefined()
  })

  it('drops unknown panels, keeps known ones, and keeps the active panel', () => {
    expect(validateTree({ tabs: ['newPanel', 'project', 'info', 7], active: 2 }, KNOWN)).toEqual(tabs(['project', 'info'], 1))
    expect(validateTree({ tabs: ['project', 'newPanel'], active: 1 }, KNOWN)).toEqual(tabs(['project'], 0))
    expect(validateTree({ tabs: ['project', 'info'], active: 9 }, KNOWN)).toEqual(tabs(['project', 'info'], 1))
  })

  it('collapses a split whose group is emptied, and rejects a tree with no known panel', () => {
    const raw = { split: 'row', size: { ratio: 0.5 }, a: tabs(['newPanel']), b: tabs(['program']) }
    expect(validateTree(raw, KNOWN)).toEqual(tabs(['program']))
    expect(validateTree(tabs(['newPanel']), KNOWN)).toBeUndefined()
  })

  it('drops a panel shown twice after its first place', () => {
    const raw = row({ ratio: 0.5 }, tabs(['program', 'info']), tabs(['info', 'project']))
    expect(validateTree(raw, KNOWN)).toEqual(row({ ratio: 0.5 }, tabs(['program', 'info']), tabs(['project'])))
  })

  it('rejects a tree nested past any real layout', () => {
    let raw: unknown = tabs(['program'])
    for (let i = 0; i < 200; i++) raw = { split: 'row', size: { ratio: 0.5 }, a: raw, b: tabs(['project']) }
    expect(validateTree(raw, KNOWN)).toBeUndefined()
  })
})

describe('visiblePanels', () => {
  it('lists each frame\'s shown tab in drawn order, as upstream visible_panels', () => {
    const notCompact = (panel: string) => panel !== 'tools' && panel !== 'audioMeters'
    expect(visiblePanels(editing(), notCompact)).toEqual(['source', 'program', 'properties', 'project', 'timeline'])
  })

  it('falls back to a group\'s first shown tab, and skips a group showing none', () => {
    const shown = (panel: string) => panel !== 'project' && panel !== 'program'
    expect(visiblePanels(editing(), shown)).toEqual(['source', 'properties', 'mediaBrowser', 'tools', 'timeline', 'audioMeters'])
    expect(shownActive({ tabs: ['a', 'b'], active: 1 }, (panel) => panel === 'a')).toBe('a')
    expect(shownActive({ tabs: ['a'], active: 0 }, () => false)).toBeUndefined()
  })
})

describe('activate with a panel listed twice', () => {
  it('stops at the first group holding it, as upstream, even when that tab is already active', () => {
    const tree = column({ ratio: 0.5 }, tabs(['source', 'effectControls'], 1), tabs(['effectControls', 'essentialGraphics'], 1))
    expect(activate(tree, 'effectControls')).toBe(tree)
    const inactive = column({ ratio: 0.5 }, tabs(['source', 'effectControls'], 0), tabs(['effectControls', 'essentialGraphics'], 1))
    expect(activate(inactive, 'effectControls')).toEqual(column({ ratio: 0.5 }, tabs(['source', 'effectControls'], 1), tabs(['effectControls', 'essentialGraphics'], 1)))
  })
})

describe('the workspaceTree entry point', () => {
  it('serves the same functions as the package root, so plain Node can load the tree alone', async () => {
    const entry = await import('@kition/tessera-ui/workspaceTree')
    const root = await import('./index')
    expect(entry.openNear).toBe(root.workspaceTree.openNear)
    expect(entry.visiblePanels).toBe(root.workspaceTree.visiblePanels)
  })
})
