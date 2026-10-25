// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkspaces, workspaceSlug, type WorkspacePrefs, type Workspaces } from './useWorkspaces'
import type { WorkspaceNode } from './workspaceTree'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const tabs = (panels: string[], active = 0): WorkspaceNode => ({ tabs: panels, active })
const row = (a: WorkspaceNode, b: WorkspaceNode, ratio = 0.5): WorkspaceNode => ({ split: 'row', size: { ratio }, a, b })

const BUILTINS: Readonly<Record<string, WorkspaceNode>> = {
  Editing: row(tabs(['source', 'program']), tabs(['timeline'])),
  Assembly: row(tabs(['project']), tabs(['timeline'])),
  'Captions and Graphics': row(tabs(['program']), tabs(['text'])),
  audio: row(tabs(['audioMeters']), tabs(['timeline'])),
}
const KNOWN = new Set(['source', 'program', 'timeline', 'project', 'text', 'audioMeters'])
const BUILTIN_NAMES = ['Assembly', 'audio', 'Captions and Graphics', 'Editing']
/** A live edit of Editing: the timeline beside the monitors, sized differently. */
const EDITED = row(tabs(['source', 'program'], 1), tabs(['timeline']), 0.7)
const OTHER = row(tabs(['program']), tabs(['timeline', 'source']), 0.3)

const KEY = 'kit:k:workspaces'
const stored = () => JSON.parse(localStorage.getItem(KEY)!) as WorkspacePrefs

type Mounted = { ws: Workspaces; root: Root; host: HTMLElement; render: (mode: string) => void }
const mounted: Mounted[] = []

beforeEach(() => localStorage.clear())
afterEach(() => {
  for (const page of mounted.splice(0)) {
    act(() => page.root.unmount())
    page.host.remove()
  }
  localStorage.clear()
  vi.restoreAllMocks()
})

/** Mounts one editor page's hook; `page.ws` always holds its latest answer. */
function mount(mode = 'edit'): Mounted {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  const page = { root, host } as unknown as Mounted
  function Probe({ mode }: { mode: string }) {
    page.ws = useWorkspaces('k', { mode, builtins: BUILTINS, fallback: 'Editing', known: KNOWN })
    return null
  }
  page.render = (next) => act(() => root.render(<Probe mode={next} />))
  page.render(mode)
  mounted.push(page)
  return page
}

/** Runs a call on a page inside `act`, answering what it returned. */
function call<T>(page: Mounted, run: (ws: Workspaces) => T): T {
  let out!: T
  act(() => {
    out = run(page.ws)
  })
  return out
}

/** Another tab wrote the store: the browser tells this one through the `storage` event. */
function storageEvent(key = KEY) {
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: localStorage.getItem(key) }))
  })
}

describe('named workspaces', () => {
  it('starts on the fallback, listing the built-ins in case-insensitive order', () => {
    const page = mount()
    expect(page.ws.names).toEqual(BUILTIN_NAMES)
    expect(page.ws.current).toBe('Editing')
    expect(page.ws.tree).toEqual(BUILTINS.Editing)
    expect(page.ws.isBuiltin('Assembly')).toBe(true)
    expect(page.ws.isBuiltin('Cut')).toBe(false)
    expect(workspaceSlug('Captions and Graphics')).toBe('captionsandgraphics')
  })

  it('keeps live changes in memory and never writes them to the store', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const page = mount()
    for (let i = 0; i < 20; i++) call(page, (ws) => ws.setTree(i % 2 ? EDITED : OTHER))
    expect(page.ws.tree).toEqual(EDITED)
    expect(setItem).not.toHaveBeenCalled()
  })

  it('switching discards live edits and loads the saved layout', () => {
    const page = mount()
    call(page, (ws) => ws.setTree(EDITED))
    call(page, (ws) => ws.switchTo('Assembly'))
    expect(page.ws.current).toBe('Assembly')
    expect(page.ws.tree).toEqual(BUILTINS.Assembly)
    expect(stored().current).toBe('Assembly')
    call(page, (ws) => ws.switchTo('Editing'))
    expect(page.ws.tree).toEqual(BUILTINS.Editing)
    // Any case, spaces optional, as upstream's `find`.
    call(page, (ws) => ws.switchTo('captionsandgraphics'))
    expect(page.ws.current).toBe('Captions and Graphics')
    call(page, (ws) => ws.switchTo('Nowhere'))
    expect(page.ws.current).toBe('Captions and Graphics')
  })

  it('saveChanges and then reset keeps the edit', () => {
    const page = mount()
    call(page, (ws) => ws.setTree(EDITED))
    expect(call(page, (ws) => ws.saveChanges())).toBeNull()
    expect(stored()).toEqual({ saved: [{ name: 'Editing', layout: EDITED }], current: 'Editing' })
    expect(page.ws.saved).toEqual(['Editing'])
    call(page, (ws) => ws.setTree(OTHER))
    call(page, (ws) => ws.reset())
    expect(page.ws.tree).toEqual(EDITED)
    call(page, (ws) => ws.switchTo('Assembly'))
    call(page, (ws) => ws.switchTo('Editing'))
    expect(page.ws.tree).toEqual(EDITED)
  })

  it('saveAs refuses an empty name, an action, and an existing name, with reasons', () => {
    const page = mount()
    expect(call(page, (ws) => ws.saveAs(''))).toBe('the workspace needs a name')
    expect(call(page, (ws) => ws.saveAs('   '))).toBe('the workspace needs a name')
    expect(call(page, (ws) => ws.saveAs('Reset'))).toBe("`Reset` can't be used as a workspace name")
    expect(call(page, (ws) => ws.saveAs('Save Changes'))).toBe("`Save Changes` can't be used as a workspace name")
    expect(call(page, (ws) => ws.saveAs('editing'))).toBe('a workspace named `Editing` already exists')
    expect(call(page, (ws) => ws.saveAs('Captions and graphics'))).toBe('a workspace named `Captions and Graphics` already exists')
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(page.ws.names).toEqual(BUILTIN_NAMES)
  })

  it('saveAs trims the name, saves the live tree under it, and switches to it', () => {
    const page = mount()
    call(page, (ws) => ws.setTree(EDITED))
    expect(call(page, (ws) => ws.saveAs('  Cut  '))).toBeNull()
    expect(page.ws.current).toBe('Cut')
    expect(page.ws.tree).toEqual(EDITED)
    expect(page.ws.names).toEqual(['Assembly', 'audio', 'Captions and Graphics', 'Cut', 'Editing'])
    expect(stored()).toEqual({ saved: [{ name: 'Cut', layout: EDITED }], current: 'Cut' })
    // Editing itself keeps its original.
    call(page, (ws) => ws.switchTo('Editing'))
    expect(page.ws.tree).toEqual(BUILTINS.Editing)
  })

  it('rename refuses a built-in, an unknown name, and a taken name; it renames a user workspace', () => {
    const page = mount()
    call(page, (ws) => ws.saveAs('Cut'))
    expect(call(page, (ws) => ws.rename('Editing', 'Mine'))).toBe('`Editing` is a built-in workspace and keeps its name')
    expect(call(page, (ws) => ws.rename('Nope', 'Mine'))).toBe('unknown workspace `Nope`')
    expect(call(page, (ws) => ws.rename('Cut', 'assembly'))).toBe('a workspace named `Assembly` already exists')
    expect(call(page, (ws) => ws.rename('Cut', ' Rough Cut '))).toBeNull()
    expect(page.ws.current).toBe('Rough Cut')
    expect(page.ws.names).toContain('Rough Cut')
    expect(page.ws.names).not.toContain('Cut')
    expect(stored().current).toBe('Rough Cut')
  })

  it('remove of a built-in restores its original', () => {
    const page = mount()
    call(page, (ws) => ws.setTree(EDITED))
    call(page, (ws) => ws.saveChanges())
    expect(call(page, (ws) => ws.remove('Editing'))).toBeNull()
    expect(page.ws.current).toBe('Editing')
    expect(page.ws.tree).toEqual(BUILTINS.Editing)
    expect(page.ws.names).toEqual(BUILTIN_NAMES)
    expect(stored().saved).toEqual([])
    expect(call(page, (ws) => ws.remove('Editing'))).toBe("`Editing` is a built-in workspace and can't be deleted")
    expect(call(page, (ws) => ws.remove('Nope'))).toBe('unknown workspace `Nope`')
  })

  it('removing the current user workspace falls back', () => {
    const page = mount()
    call(page, (ws) => ws.switchTo('Assembly'))
    call(page, (ws) => ws.setTree(EDITED))
    call(page, (ws) => ws.saveAs('Cut'))
    expect(call(page, (ws) => ws.remove('Cut'))).toBeNull()
    expect(page.ws.current).toBe('Editing')
    expect(page.ws.tree).toEqual(BUILTINS.Editing)
    expect(page.ws.names).toEqual(BUILTIN_NAMES)
    expect(stored()).toEqual({ saved: [], current: 'Editing' })
  })

  it("follows another page's saves without touching this page's live tree", () => {
    const first = mount()
    const second = mount()
    call(second, (ws) => ws.switchTo('Assembly'))
    call(second, (ws) => ws.setTree(OTHER))
    call(first, (ws) => ws.setTree(EDITED))
    call(first, (ws) => ws.saveAs('Cut'))
    storageEvent()
    expect(second.ws.names).toContain('Cut')
    expect(second.ws.saved).toEqual(['Cut'])
    expect(second.ws.current).toBe('Assembly')
    expect(second.ws.tree).toEqual(OTHER)
    // The second page's own save keeps the first page's workspace.
    call(second, (ws) => ws.saveChanges())
    expect(stored().saved.map((s) => s.name)).toEqual(['Cut', 'Assembly'])
    storageEvent()
    expect(first.ws.tree).toEqual(EDITED)
    expect(first.ws.current).toBe('Cut')
    expect(first.ws.saved).toEqual(['Cut', 'Assembly'])
  })

  it("follows another page's rename of the workspace it has open, and its next save keeps the new name", () => {
    const first = mount()
    call(first, (ws) => ws.setTree(EDITED))
    call(first, (ws) => ws.saveAs('Cut'))
    const second = mount()
    expect(second.ws.current).toBe('Cut')
    call(second, (ws) => ws.setTree(OTHER))
    // The first page renames a workspace it is not on, so the store's `current` stays put.
    call(first, (ws) => ws.switchTo('Assembly'))
    storageEvent()
    expect(call(first, (ws) => ws.rename('Cut', 'Rough Cut'))).toBeNull()
    expect(stored().current).toBe('Assembly')
    storageEvent()
    expect(second.ws.current).toBe('Rough Cut')
    expect(second.ws.tree).toEqual(OTHER)
    expect(call(second, (ws) => ws.saveChanges())).toBeNull()
    expect(stored().saved).toEqual([{ name: 'Rough Cut', layout: OTHER }])
  })

  it("follows another page's rename when the store's current names the new workspace", () => {
    const first = mount()
    call(first, (ws) => ws.saveAs('Cut'))
    const second = mount()
    call(second, (ws) => ws.setTree(OTHER))
    call(first, (ws) => ws.rename('Cut', 'Final'))
    storageEvent()
    expect(second.ws.current).toBe('Final')
    expect(second.ws.tree).toEqual(OTHER)
  })

  it("falls back to the fallback's name when another page deletes the workspace it has open, keeping its live tree", () => {
    const first = mount()
    call(first, (ws) => ws.saveAs('Cut'))
    const second = mount()
    expect(second.ws.current).toBe('Cut')
    call(second, (ws) => ws.setTree(OTHER))
    expect(call(first, (ws) => ws.remove('Cut'))).toBeNull()
    storageEvent()
    expect(second.ws.current).toBe('Editing')
    expect(second.ws.tree).toEqual(OTHER)
    expect(second.ws.names).not.toContain('Cut')
    call(second, (ws) => ws.saveChanges())
    expect(stored().saved).toEqual([{ name: 'Editing', layout: OTHER }])
  })

  it('a corrupt store falls back to the built-ins', () => {
    localStorage.setItem(KEY, '{oops')
    let page = mount()
    expect(page.ws.names).toEqual(BUILTIN_NAMES)
    expect(page.ws.current).toBe('Editing')
    expect(page.ws.tree).toEqual(BUILTINS.Editing)
    act(() => page.root.unmount())
    mounted.pop()

    // One unreadable layout falls back to its built-in, and the others still load.
    localStorage.setItem(
      KEY,
      JSON.stringify({
        saved: [
          { name: 'Editing', layout: { tabs: ['nonsense'], active: 0 } },
          { name: 'Cut', layout: EDITED },
          { name: 'Broken', layout: 7 },
          { nope: true },
        ],
        current: 'editing',
      }),
    )
    page = mount()
    expect(page.ws.current).toBe('Editing')
    expect(page.ws.tree).toEqual(BUILTINS.Editing)
    expect(page.ws.names).toEqual(['Assembly', 'audio', 'Broken', 'Captions and Graphics', 'Cut', 'Editing'])
    call(page, (ws) => ws.switchTo('Cut'))
    expect(page.ws.tree).toEqual(EDITED)
    // A user workspace whose layout can't be read opens the fallback's.
    call(page, (ws) => ws.switchTo('Broken'))
    expect(page.ws.tree).toEqual(BUILTINS.Editing)
  })

  it('reopens the workspace in use, and an unknown one as the fallback', () => {
    localStorage.setItem(KEY, JSON.stringify({ saved: [{ name: 'Cut', layout: EDITED }], current: 'cut' }))
    const page = mount()
    expect(page.ws.current).toBe('Cut')
    expect(page.ws.tree).toEqual(EDITED)
    act(() => page.root.unmount())
    mounted.pop()
    localStorage.setItem(KEY, JSON.stringify({ saved: [], current: 'Gone' }))
    expect(mount().ws.current).toBe('Editing')
  })

  it('keeps each mode in its own store, and the live layout across a mode change, as upstream keeps `ui.dock`', () => {
    const page = mount()
    call(page, (ws) => ws.saveAs('Cut'))
    call(page, (ws) => ws.setTree(OTHER))
    page.render('color')
    expect(page.ws.names).toEqual(BUILTIN_NAMES)
    expect(page.ws.current).toBe('Editing')
    expect(page.ws.tree).toEqual(BUILTINS.Editing)
    call(page, (ws) => ws.setTree(EDITED))
    call(page, (ws) => ws.saveAs('Grade'))
    expect(JSON.parse(localStorage.getItem('kit:k:workspaces.color')!).current).toBe('Grade')
    expect(stored().saved.map((s) => s.name)).toEqual(['Cut'])
    page.render('edit')
    expect(page.ws.current).toBe('Cut')
    expect(page.ws.tree).toEqual(OTHER)
    expect(page.ws.names).toContain('Cut')
    expect(page.ws.names).not.toContain('Grade')
    page.render('color')
    expect(page.ws.current).toBe('Grade')
    expect(page.ws.tree).toEqual(EDITED)
  })
})
