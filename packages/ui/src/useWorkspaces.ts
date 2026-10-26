/**
 * A kit's named workspaces, as Premiere's Window ▸ Workspaces: the built-in layouts and the
 * person's own in one list, kept in the kit store (Film's upstream `dock.rs` `WorkspacePrefs` and
 * `panels/workspaces.rs` `route`).
 *
 * The live tree belongs to the page and stays in memory: dragging a divider or moving a tab never
 * writes the store. Switching to a workspace loads its saved layout (the saved version, else the
 * built-in) and drops the live changes, unless the person saved them first (`saveChanges`,
 * `saveAs`). Every editor page of the kit follows the others' saved workspaces through the store,
 * and none of them ever replaces another's live tree. When another page renames the workspace this
 * page has open, this page follows the new name; when it deletes it, this page's layout goes on
 * under the fallback's name. Either way the next Save Changes never writes the old name back.
 *
 * Each mode keeps its own store (`workspaces`, `workspaces.<mode>`), and a page keeps each mode's
 * live layout in memory across a mode change, as upstream keeps `ui.dock` while the header switches
 * modes (`header.rs` sets only `ui.mode`): coming back to a mode shows the layout it was left with.
 * A mode opened for the first time on the page loads its workspace in use from its store.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { useKitStore, type KitStoreWrite } from './kitStore'
import { validateTree, type WorkspaceNode } from './workspaceTree'

/** A named layout, kept as raw JSON so one unreadable entry (a panel a newer version added) doesn't lose the others. */
export type SavedWorkspace = { name: string; layout: unknown }
/** The person's own workspaces and saved changes to the built-in ones, and the workspace in use (reopened next time). */
export type WorkspacePrefs = { saved: SavedWorkspace[]; current: string }

/** Command keys under `window.workspace.` that are not workspace names, so no workspace may take them. */
export const WORKSPACE_ACTIONS = ['reset', 'saveChanges', 'saveAs', 'edit', 'rename', 'delete'] as const

/** A workspace's command-id key: `Captions and Graphics` → `captionsandgraphics`. */
export function workspaceSlug(name: string) {
  return name.replace(/[A-Z]/g, (c) => c.toLowerCase()).replaceAll(' ', '')
}

export type WorkspacesOptions = {
  /** Kept per mode: the store name is `workspaces` for `edit`, `workspaces.<mode>` otherwise. */
  mode: string
  /** The built-in layouts by name. Keep the object stable across renders. */
  builtins: Readonly<Record<string, WorkspaceNode>>
  /** The built-in opened first, and after deleting the current user workspace. */
  fallback: string
  /** The panel ids a stored layout may name (`validateTree`). Keep the set stable across renders. */
  known: ReadonlySet<string>
}

export type Workspaces = {
  /** Every workspace, built-in and the person's own, sorted case-insensitively. */
  names: string[]
  /** The names with a saved layout: user workspaces, and built-ins with saved changes (Edit Workspaces offers Restore Original for those). */
  saved: string[]
  /** This page's workspace. */
  current: string
  /** This page's live layout. */
  tree: WorkspaceNode
  /** Changes the live layout, in memory only. */
  setTree: (tree: WorkspaceNode) => void
  /** Opens the workspace called `name` (any case, spaces optional) with its saved layout; an unknown name does nothing. */
  switchTo: (name: string) => void
  /** The workspace called `query` (any case, spaces optional), as listed. */
  find: (query: string) => string | undefined
  /** Reset to Saved Layout: reloads the current workspace's saved layout. */
  reset: () => void
  /** Save Changes to this Workspace; answers why the store could not keep it, or null. */
  saveChanges: () => string | null
  /** Save as New Workspace: saves the live layout under a new name and switches to it; answers why not, or null. */
  saveAs: (name: string) => string | null
  /** Renames a user workspace; answers why not, or null. */
  rename: (from: string, to: string) => string | null
  /** Deletes a user workspace, or drops a built-in's saved changes (restoring its original); answers why not, or null. */
  remove: (name: string) => string | null
  isBuiltin: (name: string) => boolean
}

const EMPTY: WorkspacePrefs = { saved: [], current: '' }

/** Stored prefs as far as they can be read: entries without a name are dropped, layouts are checked when loaded. */
function validPrefs(raw: unknown): WorkspacePrefs | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const { saved, current } = raw as { saved?: unknown; current?: unknown }
  const entries = Array.isArray(saved) ? saved : []
  return {
    saved: entries
      .filter((s): s is SavedWorkspace => !!s && typeof s === 'object' && typeof (s as SavedWorkspace).name === 'string' && (s as SavedWorkspace).name !== '')
      .map((s) => ({ name: s.name, layout: s.layout })),
    current: typeof current === 'string' ? current : '',
  }
}

function listNames(builtins: Readonly<Record<string, WorkspaceNode>>, prefs: WorkspacePrefs) {
  const names = Object.keys(builtins)
  for (const s of prefs.saved) if (!names.includes(s.name)) names.push(s.name)
  const key = (n: string) => n.toLowerCase()
  return names.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0))
}

function findName(builtins: Readonly<Record<string, WorkspaceNode>>, prefs: WorkspacePrefs, query: string) {
  const want = workspaceSlug(query)
  return listNames(builtins, prefs).find((n) => workspaceSlug(n) === want)
}

const unstored = (write: KitStoreWrite) => (write === 'stored' ? null : 'the workspaces could not be stored; they hold for this page only')

type Page = { store: string; workspace: string; tree: WorkspaceNode }

export function useWorkspaces(kit: string, options: WorkspacesOptions): Workspaces {
  const { mode, builtins, fallback } = options
  const store = mode === 'edit' ? 'workspaces' : `workspaces.${mode}`
  const config = useRef(options)
  config.current = options

  // The latest prefs, including another page's write the moment the `storage` event brings it.
  const prefsRef = useRef<WorkspacePrefs>(EMPTY)
  const primed = useRef(false)
  const [prefs, setPrefs] = useKitStore<WorkspacePrefs>(kit, store, {
    initial: EMPTY,
    validate: validPrefs,
    onExternal: (next) => {
      const before = prefsRef.current
      prefsRef.current = next
      const now = pageRef.current
      const { builtins, fallback } = config.current
      if (Object.hasOwn(builtins, now.workspace) || next.saved.some((s) => s.name === now.workspace)) return
      // Another page renamed or deleted this page's workspace. A rename leaves exactly one new name
      // in place of the old one (upstream `rename` keeps `current` on it when it was in use);
      // anything else was a delete. The live tree stays as it is.
      const added = next.saved.filter((s) => !before.saved.some((b) => b.name === s.name)).map((s) => s.name)
      const renamed = added.length === 1 ? added[0] : added.find((n) => n === next.current)
      commitPage({ ...now, workspace: renamed ?? fallback })
    },
  })

  /** The saved layout of a workspace: its saved version, else the built-in, else the fallback's. */
  const savedLayout = useCallback((from: WorkspacePrefs, name: string): WorkspaceNode => {
    const { builtins, fallback, known } = config.current
    const entry = from.saved.find((s) => s.name === name)
    return (entry && validateTree(entry.layout, known)) ?? builtins[name] ?? builtins[fallback]
  }, [])

  const opening = (from: WorkspacePrefs): Page => {
    const workspace = findName(builtins, from, from.current) ?? fallback
    return { store, workspace, tree: savedLayout(from, workspace) }
  }
  const [pageState, setPageState] = useState<Page>(() => opening(prefs))
  const pageRef = useRef(pageState)
  /** Each mode's live page, kept while another mode is shown. */
  const modes = useRef(new Map<string, Page>())
  let page = pageState
  if (page.store !== store) {
    // Another mode: its own store; the layout it was left with, else its workspace in use.
    modes.current.set(pageRef.current.store, pageRef.current)
    page = modes.current.get(store) ?? opening(prefs)
    if (!Object.hasOwn(builtins, page.workspace) && !prefs.saved.some((s) => s.name === page.workspace)) page = { ...page, workspace: fallback }
    prefsRef.current = prefs
    pageRef.current = page
    setPageState(page)
  } else if (!primed.current) {
    primed.current = true
    prefsRef.current = prefs
  }

  // Called from `onExternal` above as well, once the store reports another page's write.
  const commitPage = useCallback((next: Page) => {
    pageRef.current = next
    setPageState(next)
  }, [])

  const commitPrefs = useCallback(
    (next: WorkspacePrefs) => {
      prefsRef.current = next
      return setPrefs(next)
    },
    [setPrefs],
  )

  /** Upstream `set_workspace`: open `name`'s saved layout and remember it as the workspace in use. */
  const open = useCallback(
    (name: string) => {
      commitPage({ ...pageRef.current, workspace: name, tree: savedLayout(prefsRef.current, name) })
      if (prefsRef.current.current !== name) commitPrefs({ ...prefsRef.current, current: name })
    },
    [commitPage, commitPrefs, savedLayout],
  )

  /** Stores the live layout as `name`'s saved layout. */
  const save = useCallback(
    (name: string) => {
      const from = prefsRef.current
      const layout = pageRef.current.tree
      const saved = from.saved.some((s) => s.name === name) ? from.saved.map((s) => (s.name === name ? { name, layout } : s)) : [...from.saved, { name, layout }]
      return unstored(commitPrefs({ saved, current: name }))
    },
    [commitPrefs],
  )

  const isBuiltin = useCallback((name: string) => Object.hasOwn(config.current.builtins, name), [])
  const find = useCallback((query: string) => findName(config.current.builtins, prefsRef.current, query), [])

  /** A trimmed new workspace name, or why it can't be used (upstream `new_name`). */
  const newName = useCallback(
    (raw: string): { name: string } | { reason: string } => {
      const name = raw.trim()
      if (!name) return { reason: 'the workspace needs a name' }
      const slug = workspaceSlug(name)
      if (WORKSPACE_ACTIONS.some((a) => a.toLowerCase() === slug.toLowerCase())) return { reason: `\`${name}\` can't be used as a workspace name` }
      const taken = find(name)
      if (taken !== undefined) return { reason: `a workspace named \`${taken}\` already exists` }
      return { name }
    },
    [find],
  )

  const setTree = useCallback(
    (tree: WorkspaceNode) => {
      if (tree !== pageRef.current.tree) commitPage({ ...pageRef.current, tree })
    },
    [commitPage],
  )

  const switchTo = useCallback(
    (query: string) => {
      const name = find(query)
      if (name !== undefined) open(name)
    },
    [find, open],
  )

  const reset = useCallback(() => open(pageRef.current.workspace), [open])

  const saveChanges = useCallback(() => save(pageRef.current.workspace), [save])

  const saveAs = useCallback(
    (raw: string) => {
      const checked = newName(raw)
      if ('reason' in checked) return checked.reason
      const stored = save(checked.name)
      commitPage({ ...pageRef.current, workspace: checked.name })
      return stored
    },
    [commitPage, newName, save],
  )

  const rename = useCallback(
    (from: string, to: string) => {
      if (isBuiltin(from)) return `\`${from}\` is a built-in workspace and keeps its name`
      const prefsNow = prefsRef.current
      if (!prefsNow.saved.some((s) => s.name === from)) return `unknown workspace \`${from}\``
      const checked = newName(to)
      if ('reason' in checked) return checked.reason
      const name = checked.name
      const stored = commitPrefs({
        saved: prefsNow.saved.map((s) => (s.name === from ? { ...s, name } : s)),
        current: prefsNow.current === from ? name : prefsNow.current,
      })
      if (pageRef.current.workspace === from) commitPage({ ...pageRef.current, workspace: name })
      return unstored(stored)
    },
    [commitPage, commitPrefs, isBuiltin, newName],
  )

  const remove = useCallback(
    (name: string) => {
      const prefsNow = prefsRef.current
      const saved = prefsNow.saved.filter((s) => s.name !== name)
      if (saved.length === prefsNow.saved.length) return isBuiltin(name) ? `\`${name}\` is a built-in workspace and can't be deleted` : `unknown workspace \`${name}\``
      const stored = unstored(commitPrefs({ ...prefsNow, saved }))
      if (pageRef.current.workspace === name) open(isBuiltin(name) ? name : config.current.fallback)
      return stored
    },
    [commitPrefs, isBuiltin, open],
  )

  const names = useMemo(() => listNames(builtins, prefs), [builtins, prefs])
  const saved = useMemo(() => prefs.saved.map((s) => s.name).filter((n, i, all) => all.indexOf(n) === i), [prefs])
  return {
    names,
    saved,
    current: page.workspace,
    tree: page.tree,
    setTree,
    switchTo,
    find,
    reset,
    saveChanges,
    saveAs,
    rename,
    remove,
    isBuiltin,
  }
}
