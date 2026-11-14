/**
 * A workspace's frame tree, as pure functions: splits of two children and groups of tabs, the
 * Premiere-style layout a kit's `WorkspaceLayout` draws. This ports a docking editor's tree
 * (Film's upstream `dock.rs` `DockNode`), with panels named by string ids. Every function returns
 * a new tree, or the same tree when nothing changes, and never mutates its input.
 */

/** How a split shares its space: a ratio for the first child, or a fixed size in px for one child. */
export type WorkspaceSize = { ratio: number } | { fixedA: number } | { fixedB: number }

/** A split (`row` lays its children side by side, `column` stacks them) or a group of tabs. */
export type WorkspaceNode =
  | { split: 'row' | 'column'; size: WorkspaceSize; a: WorkspaceNode; b: WorkspaceNode }
  | { tabs: readonly string[]; active: number }

/** A split node of a workspace tree. */
export type WorkspaceSplit = Extract<WorkspaceNode, { split: unknown }>
/** A tab group of a workspace tree. */
export type WorkspaceTabs = Extract<WorkspaceNode, { tabs: unknown }>

/** The smallest size either child of a split keeps when there is room. */
const MIN_CHILD = 20
/** The deepest stored tree `validateTree` accepts; real layouts are a few levels deep. */
const MAX_DEPTH = 64

const isSplit = (node: WorkspaceNode): node is WorkspaceSplit => 'split' in node

/**
 * Size of a split's first child in `available` px: upstream `split_first`. It is the requested
 * size, keeping each child at least 20 px when there is room, and it is never NaN and never more
 * than `available`. No space (zero, negative, or NaN) gives 0.
 */
export function splitFirst(size: WorkspaceSize, available: number): number {
  if (!(available > 0)) return 0
  const want = 'ratio' in size ? available * size.ratio : 'fixedA' in size ? size.fixedA : available - size.fixedB
  const lo = Math.min(MIN_CHILD, available * 0.5)
  const hi = Math.max(available - MIN_CHILD, lo)
  if (Number.isNaN(want)) return lo
  return Math.min(Math.max(want, lo), hi)
}

/** Every panel in the tree, in order (first child before second, tabs left to right). */
export function panelsOf(node: WorkspaceNode): string[] {
  return isSplit(node) ? [...panelsOf(node.a), ...panelsOf(node.b)] : [...node.tabs]
}

/** Whether a group in the tree holds `panel`. */
export function contains(node: WorkspaceNode, panel: string): boolean {
  return isSplit(node) ? contains(node.a, panel) || contains(node.b, panel) : node.tabs.includes(panel)
}

/**
 * Makes `panel` the active tab of the first group holding it (upstream `activate` stops there);
 * the same tree when it is absent or already that group's active tab. A later group listing the
 * same panel is left alone.
 */
export function activate(node: WorkspaceNode, panel: string): WorkspaceNode {
  if (isSplit(node)) {
    if (contains(node.a, panel)) {
      const a = activate(node.a, panel)
      return a === node.a ? node : { ...node, a }
    }
    const b = activate(node.b, panel)
    return b === node.b ? node : { ...node, b }
  }
  const index = node.tabs.indexOf(panel)
  return index < 0 || index === node.active ? node : { tabs: node.tabs, active: index }
}

/** Whether `panel` is the active tab of its group, so its contents are shown (upstream `is_visible`). */
export function isVisible(node: WorkspaceNode, panel: string): boolean {
  return isSplit(node) ? isVisible(node.a, panel) || isVisible(node.b, panel) : node.tabs[node.active] === panel
}

const isEmpty = (node: WorkspaceNode) => !isSplit(node) && node.tabs.length === 0

/**
 * Removes a tab; an empty group collapses its split into the other child (upstream `close`). As
 * upstream, the active index is only clamped to the remaining tabs.
 */
export function closePanel(node: WorkspaceNode, panel: string): WorkspaceNode {
  if (!contains(node, panel)) return node
  if (isSplit(node)) {
    const a = closePanel(node.a, panel)
    const b = closePanel(node.b, panel)
    if (isEmpty(a)) return b
    if (isEmpty(b)) return a
    return { ...node, a, b }
  }
  const tabs = node.tabs.filter((tab) => tab !== panel)
  return { tabs, active: Math.min(node.active, Math.max(tabs.length - 1, 0)) }
}

/** Appends `panel` as the active tab of the first group holding `near`, or undefined when none does. */
function addNear(node: WorkspaceNode, panel: string, near: string): WorkspaceNode | undefined {
  if (isSplit(node)) {
    const a = addNear(node.a, panel, near)
    if (a) return { ...node, a }
    const b = addNear(node.b, panel, near)
    return b && { ...node, b }
  }
  if (!node.tabs.includes(near)) return undefined
  return { tabs: [...node.tabs, panel], active: node.tabs.length }
}

/**
 * Adds `panel` as the active tab of the group holding `near`, or activates it when present
 * (upstream `open_near`). `near` may list candidates tried in order, as upstream falls back to
 * Project and then Program; when no candidate is present the tree is unchanged.
 */
export function openNear(node: WorkspaceNode, panel: string, near: string | readonly string[]): WorkspaceNode {
  if (contains(node, panel)) return activate(node, panel)
  for (const candidate of typeof near === 'string' ? [near] : near) {
    const next = addNear(node, panel, candidate)
    if (next) return next
  }
  return node
}

/** Splits the first group holding only `beside` into `panel` and `beside`, or undefined when none does. */
function splitBeside(node: WorkspaceNode, panel: string, beside: string, besideWidth: number): WorkspaceNode | undefined {
  if (isSplit(node)) {
    const a = splitBeside(node.a, panel, beside, besideWidth)
    if (a) return { ...node, a }
    const b = splitBeside(node.b, panel, beside, besideWidth)
    return b && { ...node, b }
  }
  if (node.tabs.length !== 1 || node.tabs[0] !== beside) return undefined
  return { split: 'row', size: { fixedB: besideWidth }, a: { tabs: [panel], active: 0 }, b: { tabs: [beside], active: 0 } }
}

/**
 * Puts `panel` back beside a single-tab group holding `beside`, split in a row with `beside`
 * fixed at `besideWidth` (upstream `restore_timeline`), else near `fallbackNear` as `openNear`
 * does. The same tree when `panel` is present.
 */
export function restoreBeside(
  node: WorkspaceNode,
  panel: string,
  beside: string,
  besideWidth: number,
  fallbackNear: string | readonly string[],
): WorkspaceNode {
  if (contains(node, panel)) return node
  return splitBeside(node, panel, beside, besideWidth) ?? openNear(node, panel, fallbackNear)
}

/**
 * Sets the split at `path` (a string of 'a'/'b' steps from the root, '' for the root) to `size`.
 * The same tree when the path does not end at a split.
 */
export function resizeAt(node: WorkspaceNode, path: string, size: WorkspaceSize): WorkspaceNode {
  if (!isSplit(node)) return node
  if (path === '') return { ...node, size }
  const step = path[0]
  if (step !== 'a' && step !== 'b') return node
  const child = resizeAt(node[step], path.slice(1), size)
  return child === node[step] ? node : { ...node, [step]: child }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function validSize(raw: unknown): WorkspaceSize | undefined {
  if (!isRecord(raw)) return undefined
  for (const key of ['ratio', 'fixedA', 'fixedB'] as const) {
    if (!(key in raw)) continue
    const value = raw[key]
    return typeof value === 'number' && Number.isFinite(value) ? ({ [key]: value } as WorkspaceSize) : undefined
  }
  return undefined
}

/** A stored node, or undefined when it is not one; `seen` drops a panel's later copies. */
function validNode(raw: unknown, known: ReadonlySet<string>, seen: Set<string>, depth: number): WorkspaceNode | undefined | null {
  if (!isRecord(raw) || depth > MAX_DEPTH) return undefined
  if ('split' in raw) {
    if (raw.split !== 'row' && raw.split !== 'column') return undefined
    const size = validSize(raw.size)
    if (!size) return undefined
    const a = validNode(raw.a, known, seen, depth + 1)
    if (a === undefined) return undefined
    const b = validNode(raw.b, known, seen, depth + 1)
    if (b === undefined) return undefined
    if (a === null) return b
    if (b === null) return a
    return { split: raw.split, size, a, b }
  }
  if (!Array.isArray(raw.tabs) || typeof raw.active !== 'number' || Number.isNaN(raw.active)) return undefined
  const activeIndex = Math.max(0, Math.floor(raw.active))
  const activePanel: unknown = raw.tabs[activeIndex]
  const tabs: string[] = []
  for (const tab of raw.tabs) {
    if (typeof tab !== 'string' || !known.has(tab) || seen.has(tab)) continue
    seen.add(tab)
    tabs.push(tab)
  }
  if (tabs.length === 0) return null
  const kept = typeof activePanel === 'string' ? tabs.indexOf(activePanel) : -1
  return { tabs, active: kept >= 0 ? kept : Math.min(activeIndex, tabs.length - 1) }
}

/**
 * A stored tree, or undefined when it is not one; unknown panels are dropped and emptied groups
 * collapse. A panel listed twice keeps its first place. A group keeps its active panel when that
 * panel is known; otherwise its active index is clamped. A tree left with no panel is undefined.
 */
export function validateTree(raw: unknown, known: ReadonlySet<string>): WorkspaceNode | undefined {
  return validNode(raw, known, new Set(), 0) ?? undefined
}

/**
 * The tab a group shows when only some panels are `shown` (a host hid the others, or the kit does
 * not draw them): its active tab when shown, else its first shown tab; undefined when it shows none.
 */
export function shownActive(group: WorkspaceTabs, shown: (panel: string) => boolean): string | undefined {
  const active = group.tabs[group.active]
  return active !== undefined && shown(active) ? active : group.tabs.find(shown)
}

/**
 * The panels the frames show, in drawn order (first child before second): each group's
 * `shownActive` tab (upstream `visible_panels`, for Select Next and Previous Panel; a kit leaves
 * compact panels out of `shown` to match upstream).
 */
export function visiblePanels(node: WorkspaceNode, shown: (panel: string) => boolean): string[] {
  if (isSplit(node)) return [...visiblePanels(node.a, shown), ...visiblePanels(node.b, shown)]
  const active = shownActive(node, shown)
  return active === undefined ? [] : [active]
}
