/**
 * Shared kit editor components: buttons and fields, the ribbon, menus, panels, the status bar,
 * dialogs, and notices. Styled only through the Kit UI protocol's theme tokens (styles.css).
 */
import { Children, cloneElement, forwardRef, createContext, Fragment, isValidElement, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react'
import { CheckIcon as Check, ChevronDownIcon as ChevronDown, ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, LoaderCircleIcon as LoaderCircle } from '@kition/tessera-icons/react'
import type { IconComponent } from './icon'
import { useElements } from './context'
import { DropPanel } from './DropPanel'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

/** The stroke width of every Lucide icon Kit UI draws, at every size (ribbon, menus, rail, panels). */
/** The stroke every control draws its icons with (Tessera's icon style, docs/icon-style.md). */
export const ICON_STROKE = 1.5

/** Control heights: `sm` 32px (toolbars, dense rows), `md` 36px (panels, settings, dialogs), `lg` 40px (forms and calls to action). */
export type ControlSize = 'sm' | 'md' | 'lg'

/**
 * How much a button stands out: `primary` is the one main action (the theme's primary color);
 * `secondary` is outlined; `subtle` is a quiet filled button; `ghost` has no border or fill until
 * hovered; `danger` destroys. Without a variant a button is outlined, like `secondary`.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger'

export type TesseraButtonProps = ButtonProps & {
  variant?: ButtonVariant
  /** Without `size` a button keeps the editor chrome's 30px. */
  size?: ControlSize
  /** A square button holding only an icon; give it an `aria-label`. */
  iconOnly?: boolean
  /** Shows a spinner before the label and marks the button busy, while its action runs. */
  loading?: boolean
}

/** A button. Its `className` adds to Tessera's, so a host can adjust one button's layout. */
export const Button = forwardRef<HTMLButtonElement, TesseraButtonProps>(function Button({ variant, size, iconOnly, loading, className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={joinClass('kui-button', className)}
      data-variant={variant}
      data-size={size}
      data-icon-only={iconOnly || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size={16} /> : null}
      {children}
    </button>
  )
})

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant
  size?: ControlSize
  /** Draws the link another way: a router passes its own (`(props) => <Link to="/" {...props} />`). */
  render?: (props: AnchorHTMLAttributes<HTMLAnchorElement> & { className: string; children?: ReactNode }) => ReactNode
}

/** A link that looks like a button: for navigation (another page, a sign-in URL, a mail link) drawn as an action. */
export function ButtonLink({ variant, size, render, className, children, ...props }: ButtonLinkProps) {
  const shared = { ...props, className: joinClass('kui-button', className), 'data-variant': variant, 'data-size': size, children } as AnchorHTMLAttributes<HTMLAnchorElement> & { className: string; children?: ReactNode }
  return render ? render(shared) : <a {...shared} />
}

/** A spinning circle for work in progress; `label` names it for screen readers (otherwise it is decorative). */
export function Spinner({ size = 16, label, className }: { size?: number; label?: string; className?: string }) {
  return (
    <LoaderCircle
      className={joinClass('kui-spinner', className)}
      size={size}
      strokeWidth={ICON_STROKE}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}

export function IconButton({ icon: Icon, label, pressed, className, ...props }: ButtonProps & { icon: IconComponent; label: string; pressed?: boolean }) {
  return (
    <button type="button" className={joinClass('kui-icon-button', className)} aria-label={label} title={label} aria-pressed={pressed} {...props}>
      <Icon size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
    </button>
  )
}

function joinClass(...names: (string | undefined | false)[]) {
  return names.filter(Boolean).join(' ')
}

/* Ribbon */

type RibbonOverflow = 'none' | 'start' | 'end' | 'both'

/** Which edges of a scrolled box have more beyond them (1 px of slack for fractional widths). */
export function overflowOf(scrollLeft: number, clientWidth: number, scrollWidth: number): RibbonOverflow {
  const start = scrollLeft > 1
  const end = scrollLeft + clientWidth < scrollWidth - 1
  return start && end ? 'both' : start ? 'start' : end ? 'end' : 'none'
}

/**
 * Tracks whether a ribbon panel has more beyond either edge: on scroll, when it or a group
 * resizes, when groups come or go, and when `key` (the shown tab) changes.
 */
function useOverflow(box: RefObject<HTMLElement | null>, key: unknown) {
  const [overflow, setOverflow] = useState<RibbonOverflow>('none')
  useLayoutEffect(() => {
    const element = box.current
    if (!element) return undefined
    const update = () => setOverflow(overflowOf(element.scrollLeft, element.clientWidth, element.scrollWidth))
    update()
    element.addEventListener('scroll', update, { passive: true })
    // The box's own size, and its groups' (a group's content can change while its tab shows).
    let sizes: ResizeObserver | null = null
    const watchGroups = () => {
      if (!sizes) return
      sizes.disconnect()
      sizes.observe(element)
      for (const group of element.querySelectorAll(':scope > *, .kui-ribbon-group')) sizes.observe(group)
    }
    if (typeof ResizeObserver !== 'undefined') sizes = new ResizeObserver(update)
    watchGroups()
    // Groups shown or hidden (a configuration change) are watched in turn.
    const rows = typeof MutationObserver !== 'undefined' ? new MutationObserver(() => (watchGroups(), update())) : null
    rows?.observe(element, { childList: true, subtree: true })
    return () => {
      element.removeEventListener('scroll', update)
      sizes?.disconnect()
      rows?.disconnect()
    }
  }, [box, key])
  return overflow
}

/**
 * A row that scrolls sideways when its content does not fit (the ribbon's groups, a tool's options
 * bar): the cut edge fades, and a button there scrolls by most of a width. `className` and
 * `panelClassName` add to the outer box and the scrolled row; `resetKey` (the shown tab, the active
 * tool) re-measures; the buttons' test ids are `${testId}-start` and `${testId}-end`.
 */
export function OverflowStrip({
  className,
  panelClassName,
  role,
  resetKey,
  labels,
  testId,
  panelRef,
  children,
}: {
  className: string
  panelClassName: string
  role?: string
  resetKey?: unknown
  labels: { start: string; end: string }
  testId: string
  /** The scrolled row, for a caller that measures it (the frame's step-down). */
  panelRef?: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  const own = useRef<HTMLDivElement>(null)
  const panel = panelRef ?? own
  const overflow = useOverflow(panel, resetKey)
  const scroll = (direction: -1 | 1) => {
    const element = panel.current
    if (!element) return
    const by = direction * Math.max(80, element.clientWidth * 0.75)
    if (typeof element.scrollBy === 'function') element.scrollBy({ left: by, behavior: 'smooth' })
    else element.scrollLeft += by
  }
  return (
    <div className={`kui-overflow-strip ${className}`} data-overflow={overflow}>
      <div ref={panel} className={`kui-overflow-strip-panel ${panelClassName}`} role={role}>
        {children}
      </div>
      {overflow === 'start' || overflow === 'both' ? (
        <button type="button" className="kui-ribbon-scroll" data-side="start" aria-label={labels.start} title={labels.start} onClick={() => scroll(-1)} data-testid={`${testId}-start`}>
          <ChevronLeft size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      ) : null}
      {overflow === 'end' || overflow === 'both' ? (
        <button type="button" className="kui-ribbon-scroll" data-side="end" aria-label={labels.end} title={labels.end} onClick={() => scroll(1)} data-testid={`${testId}-end`}>
          <ChevronRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

/**
 * How ribbon content draws, set by the editor frame: `full` is the Classic ribbon and any panel
 * that shows a group whole; `line` is Single line's row, where each group shows its primary items
 * and a chevron to the rest; `primary` is inside such a group, where only items marked `primary`
 * draw (large ones small).
 */
export type RibbonPresentation = 'full' | 'line' | 'primary'
export const RibbonPresentationContext = createContext<RibbonPresentation>('full')

/** The name of a Single line group's chevron, translated by the frame (`More: Font`). */
export const LineMoreLabelContext = createContext<(group: string) => string>((group) => `More: ${group}`)

/**
 * What of a group's content reaches Single line's row: elements marked `primary` (ribbon buttons,
 * ribbon menus, `RibbonItem`s, and a kit's own component given `primary`, which then draws its
 * own primary items), found through fragments, plain elements (`div`s), `RibbonStack`, and
 * `RibbonRow`, which are kept around them. Everything else, raw fields (`select`, `input`) and
 * unmarked components included, waits in the popover: a raw element cannot read the presentation,
 * so it would otherwise mount in the row as well. To show a field in the row, wrap it in
 * `<RibbonItem primary>`.
 */
function primaryContent(children: ReactNode): ReactNode[] {
  const kept: ReactNode[] = []
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ primary?: boolean; children?: ReactNode }>(child)) continue
    if (child.props.primary) {
      kept.push(child)
      continue
    }
    const { type } = child
    if (type !== Fragment && typeof type !== 'string' && type !== RibbonStack && type !== RibbonRow) continue
    const inner = primaryContent(child.props.children)
    if (!inner.length) continue
    kept.push(type === Fragment ? <Fragment key={child.key}>{inner}</Fragment> : cloneElement(child, undefined, inner))
  }
  return kept
}

/**
 * A group in Single line: its primary items inline, then a chevron that opens the whole group (its
 * Classic content, the host's buttons included) in a popover; a group with no primary item is one
 * button with its label and icon that opens it. Each item mounts once: while the popover is open
 * the row's primary items are unmounted (they are in the popover), and an empty box as wide holds
 * their place so the row does not move. Only `primary` content reaches the row (`primaryContent`).
 */
function LineGroup({ id, label, icon: Icon, disabled, children }: { id?: string; label: string; icon?: IconComponent; disabled: boolean; children: ReactNode }) {
  const ui = useElements()
  const moreLabel = useContext(LineMoreLabelContext)
  const inline = useRef<HTMLDivElement>(null)
  const anchor = useRef<HTMLSpanElement>(null)
  const [hasPrimary, setHasPrimary] = useState(true)
  const [open, setOpen] = useState(false)
  /** The row's width while the popover holds its items. */
  const [held, setHeld] = useState<number | null>(null)
  const primary = primaryContent(children)
  // After every render: which items are primary, and whether they draw, can change with the
  // document (a context tab's state). Not while the popover holds them.
  useLayoutEffect(() => {
    if (open) return
    const found = primary.length > 0 && inline.current?.querySelector('[data-primary], button, input, select, textarea') != null
    if (found !== hasPrimary) setHasPrimary(found)
  })
  const key = id ?? label
  const toggle = () => {
    if (!open) setHeld(inline.current?.getBoundingClientRect().width ?? null)
    setOpen((value) => !value)
  }
  const more = moreLabel(label)
  return (
    <div className="kui-line-group" role="group" aria-label={label} data-kit-ui-id={id}>
      {open && hasPrimary ? (
        <div className="kui-line-inline" aria-hidden="true" style={{ width: held ?? undefined, boxSizing: 'border-box', flex: 'none' }} />
      ) : (
        <div ref={inline} className="kui-line-inline" hidden={!hasPrimary}>
          <fieldset className="kui-element" disabled={disabled} role="presentation">
            <RibbonPresentationContext.Provider value="primary">{primary}</RibbonPresentationContext.Provider>
          </fieldset>
        </div>
      )}
      <span ref={anchor} style={{ display: 'inline-flex' }}>
        {hasPrimary ? (
          <button type="button" className="kui-line-more" aria-label={more} title={more} aria-haspopup="dialog" aria-expanded={open} onClick={toggle} data-testid={`kui-line-more-${key}`}>
            <ChevronDown size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="kui-ribbon-button kui-line-collapsed" data-size="small" title={label} aria-haspopup="dialog" aria-expanded={open} onClick={toggle} data-testid={`kui-line-group-${key}`}>
            {Icon ? <Icon size={16} strokeWidth={ICON_STROKE} aria-hidden="true" /> : null}
            <span>{label}</span>
            <ChevronDown size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
        )}
        <DropPanel open={open} anchor={anchor} onClose={() => setOpen(false)} label={label} className="kui-line-popover" testId={`kui-line-popover-${key}`}>
          <RibbonPresentationContext.Provider value="full">
            <div className="kui-ribbon-group">
              <div className="kui-ribbon-group-body">
                <fieldset className="kui-element" disabled={disabled} role="presentation">
                  {children}
                  {id ? ui.renderExtras(id, 'ribbon') : null}
                </fieldset>
              </div>
              <div className="kui-ribbon-group-label">{label}</div>
            </div>
          </RibbonPresentationContext.Provider>
        </DropPanel>
      </span>
    </div>
  )
}

/**
 * A ribbon group. With an `id` (`group:<tab>/<group>`, or an engine menu path `menu:<Menu>/<Group>`
 * for groups built from commands) it follows the UI configuration and ends with the host's
 * buttons for it. In Single line it shows its primary items and a popover with the rest; `icon`
 * marks the one button a group without primary items becomes there.
 */
export function RibbonGroup({ id, label, icon, children }: { id?: string; label: string; icon?: IconComponent; children: ReactNode }) {
  const ui = useElements()
  const presentation = useContext(RibbonPresentationContext)
  if (id) ui.drawn(id)
  const state = id ? ui.state(id) : null
  if (state?.hidden) return null
  if (presentation === 'line')
    return (
      <LineGroup id={id} label={label} icon={icon} disabled={state?.disabled ?? false}>
        {children}
      </LineGroup>
    )
  return (
    <div className="kui-ribbon-group" role="group" aria-label={label} data-kit-ui-id={id}>
      <div className="kui-ribbon-group-body">
        <fieldset className="kui-element" disabled={state?.disabled ?? false} role="presentation">
          {children}
          {id ? ui.renderExtras(id, 'ribbon') : null}
        </fieldset>
      </div>
      <div className="kui-ribbon-group-label">{label}</div>
    </div>
  )
}

/** Small buttons stacked in up to three rows; in a Single line group, its primary buttons in the row. */
export function RibbonStack({ children }: { children: ReactNode }) {
  const inline = useContext(RibbonPresentationContext) === 'primary'
  return <div className={inline ? 'kui-line-contents' : 'kui-ribbon-stack'}>{children}</div>
}

export function RibbonRow({ children }: { children: ReactNode }) {
  const inline = useContext(RibbonPresentationContext) === 'primary'
  return <div className={inline ? 'kui-line-contents' : 'kui-ribbon-row'}>{children}</div>
}

/**
 * Any content in a ribbon group that is not a ribbon button (a field, a gallery): `primary` shows
 * it in Single line's row too; otherwise it waits in the group's popover there.
 */
export function RibbonItem({ primary, children }: { primary?: boolean; children: ReactNode }) {
  if (useContext(RibbonPresentationContext) === 'primary' && !primary) return null
  return (
    <span className="kui-ribbon-item" data-primary={primary || undefined}>
      {children}
    </span>
  )
}

export type RibbonButtonProps = ButtonProps & {
  icon?: IconComponent
  label: string
  size?: 'large' | 'small' | 'icon'
  pressed?: boolean
  /** A colored mark under the icon (font color, fill). */
  swatch?: string
  /** Shown in Single line's row (small); the group's other items wait in its popover. */
  primary?: boolean
  /** In Single line's row, keep the label beside the icon; a primary item with an icon otherwise shows the icon alone there (its label stays its name and tooltip). */
  lineLabel?: boolean
}

/** The size an item draws at: as given, except in Single line's row, where an item with an icon is the icon alone (unless `lineLabel`) and a large one is small. */
export function lineSize(presentation: RibbonPresentation, size: 'large' | 'small' | 'icon', hasIcon: boolean, lineLabel?: boolean): 'large' | 'small' | 'icon' {
  if (presentation !== 'primary') return size
  if (hasIcon && !lineLabel) return 'icon'
  return size === 'large' ? 'small' : size
}

export function RibbonButton({ icon: Icon, label, size = 'small', pressed, swatch, primary, lineLabel, ...props }: RibbonButtonProps) {
  const presentation = useContext(RibbonPresentationContext)
  if (presentation === 'primary' && !primary) return null
  const shown = lineSize(presentation, size, Icon != null, lineLabel)
  const iconSize = shown === 'large' ? 28 : 16
  return (
    <button type="button" className="kui-ribbon-button" data-size={shown} data-primary={primary || undefined} aria-pressed={pressed} aria-label={label} title={label} {...props}>
      {Icon ? (
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
          <Icon size={iconSize} strokeWidth={ICON_STROKE} aria-hidden="true" />
          {swatch ? <span style={{ width: iconSize, height: 3, marginTop: 1, borderRadius: 1, background: swatch }} /> : null}
        </span>
      ) : null}
      {shown === 'icon' ? null : <span>{label}</span>}
    </button>
  )
}

/* Menus */

type MenuState = { close: () => void }
const MenuContext = createContext<MenuState | null>(null)

/**
 * Closes an open menu on a press outside every element in `inside` (the menu, and the button that
 * opened it) and on Escape. Escape is heard as it bubbles, so a submenu that takes it (to close
 * itself only) keeps it from the menu around it.
 */
function useDismiss(open: boolean, inside: readonly RefObject<HTMLElement | null>[], close: () => void) {
  const latest = useRef({ inside, close })
  latest.current = { inside, close }
  useEffect(() => {
    if (!open) return undefined
    const onDown = (event: PointerEvent) => {
      if (!latest.current.inside.some((ref) => ref.current?.contains(event.target as Node))) latest.current.close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') latest.current.close()
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])
}

/** A menu's own rows that take the focus, in order: not those of a submenu inside it. */
const menuRows = (menu: HTMLElement) =>
  [...menu.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)')].filter((row) => row.parentElement?.closest('[role="menu"]') === menu)

/**
 * A menu's keys, on the menu element (its rows' keys bubble to it): Up and Down move through its
 * own rows (wrapping), Home and End to the first and last, Escape closes it (`close`). A key it
 * takes goes no further: not to a menu around it, not to the editor's shortcuts.
 */
export function menuKeyDown(event: ReactKeyboardEvent<HTMLElement>, close?: () => void) {
  if (event.key === 'Escape' && close) {
    event.preventDefault()
    event.stopPropagation()
    close()
    return
  }
  const rows = menuRows(event.currentTarget)
  if (!rows.length) return
  const at = rows.indexOf(document.activeElement as HTMLElement)
  const next = { ArrowDown: at + 1, ArrowUp: at < 0 ? rows.length - 1 : at - 1, Home: 0, End: rows.length - 1 }[event.key]
  if (next === undefined) return
  event.preventDefault()
  event.stopPropagation()
  rows[(next + rows.length) % rows.length].focus()
}

/**
 * While a menu is open, its first row has the focus; when it closes, the focus goes back to
 * `returnTo()` (asked as it opens, before its first row takes the focus: what had it, or the
 * button that opened it), unless something else outside the menu has taken it meanwhile.
 */
function useMenuFocus(open: boolean, placed: boolean, menu: RefObject<HTMLElement | null>, returnTo: () => HTMLElement | null) {
  const latest = useRef(returnTo)
  latest.current = returnTo
  useLayoutEffect(() => {
    if (!open) return undefined
    const back = latest.current()
    return () => {
      const now = document.activeElement
      if (back?.isConnected && (!now || now === document.body || menu.current?.contains(now))) back.focus()
    }
  }, [menu, open])
  // A menu is hidden until it is placed, and a hidden row takes no focus: focus it once placed.
  useLayoutEffect(() => {
    if (open && placed && menu.current) menuRows(menu.current)[0]?.focus()
  }, [menu, open, placed])
}

/**
 * A button that opens a menu below it; the menu takes the focus, and gives it back to the button
 * when it closes. With `placement` `auto` (a button along a panel's bottom), the menu opens above
 * the button when it does not fit below and there is more room above.
 */
export function MenuButton({ trigger, children, align = 'start', placement = 'below' }: { trigger: (props: { open: boolean; toggle: () => void }) => ReactNode; children: ReactNode; align?: 'start' | 'end'; placement?: 'below' | 'auto' }) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLSpanElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number; maxHeight: number } | null>(null)
  const close = useCallback(() => setOpen(false), [])
  const place = useCallback(() => {
    if (!anchor.current) return
    const box = anchor.current.getBoundingClientRect()
    const width = popover.current?.offsetWidth ?? 200
    const left = align === 'end' ? box.right - width : box.left
    const below = box.bottom + 4
    // Its whole height, borders included (it is measured before any max-height applies).
    const height = popover.current?.offsetHeight ?? 0
    const roomAbove = box.top - 4 - 8
    const x = Math.max(4, Math.min(left, window.innerWidth - width - 4))
    if (placement === 'auto' && below + height > window.innerHeight - 8 && roomAbove > window.innerHeight - below - 8) {
      // Above its button: as tall as it is, at most the room above, its bottom 4 px over the button.
      const maxHeight = Math.max(0, roomAbove)
      setPosition({ left: x, top: box.top - 4 - Math.min(height, maxHeight), maxHeight })
      return
    }
    // A long menu fills the room below its button and scrolls, its bottom 8 px inside the window
    // (the popover is border-box, so its border and padding are inside that room).
    setPosition({ left: x, top: below, maxHeight: Math.max(0, window.innerHeight - below - 8) })
  }, [align, placement])
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return undefined
    }
    place()
    // A window that resizes while the menu is open (the host's pane) keeps it inside.
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, place])
  useDismiss(open, [popover, anchor], close)
  useMenuFocus(open, position != null, popover, () => anchor.current?.querySelector<HTMLElement>('button, [tabindex]') ?? null)
  return (
    <span ref={anchor} style={{ display: 'inline-flex' }}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open ? (
        <div
          ref={popover}
          className="kui-popover"
          role="menu"
          style={position ? { left: position.left, top: position.top, maxHeight: position.maxHeight } : { visibility: 'hidden' }}
          onKeyDown={(event) => menuKeyDown(event, close)}
          // A choice in the menu (an item, a swatch, a table size) closes it; a field in it does not.
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('button')) setOpen(false)
          }}
        >
          <MenuContext.Provider value={{ close }}>{children}</MenuContext.Provider>
        </div>
      ) : null}
    </span>
  )
}

/**
 * A menu row. With `checked` set (true or false) it is a toggle: a check mark shows in the icon's
 * place while it is on (the state wins over the icon), and assistive technology hears it as a
 * checkbox item.
 */
export function MenuItem({ icon: Icon, label, shortcut, onSelect, disabled, checked, testId, uiId }: { icon?: IconComponent; label: string; shortcut?: string | null; onSelect: () => void; disabled?: boolean; checked?: boolean; testId?: string; uiId?: string }) {
  const menu = useContext(MenuContext)
  return (
    <button
      type="button"
      role={checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
      aria-checked={checked}
      className="kui-menu-item"
      disabled={disabled}
      data-testid={testId}
      data-kit-ui-id={uiId}
      onClick={() => {
        menu?.close()
        onSelect()
      }}
    >
      {checked ? <Check size={15} strokeWidth={ICON_STROKE} aria-hidden="true" /> : Icon ? <Icon size={15} strokeWidth={ICON_STROKE} aria-hidden="true" /> : <span style={{ width: 15 }} />}
      <span>{label}</span>
      {shortcut ? <kbd>{shortcut}</kbd> : null}
    </button>
  )
}

export function MenuSeparator() {
  return <div className="kui-menu-separator" role="separator" />
}

/** Where a context menu opens: a point in the viewport (a pointer event's `clientX`/`clientY`). */
export type ContextMenuPoint = { x: number; y: number }

/**
 * A menu at a point (a row's right-click menu): open while `at` is set, kept inside the window,
 * its first row focused (Up, Down, Home, and End move through the rows; the focus goes back where
 * it was when it closes), and closed through
 * `onClose` by a press outside it, Escape, or a choice in it (a `MenuItem`, any button). Its rows
 * are `MenuItem`s and `MenuSeparator`s, as in `MenuButton`.
 */
export function ContextMenu({ at, onClose, label, children, testId }: { at: ContextMenuPoint | null; onClose: () => void; label?: string; children: ReactNode; testId?: string }) {
  const popover = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<ContextMenuPoint | null>(null)
  const latestClose = useRef(onClose)
  latestClose.current = onClose
  const close = useCallback(() => latestClose.current(), [])
  /**
   * Places it from its measured size, moved left and up to stay 4 px inside the window; again
   * whenever its size changes after it opened (rows that change once a right-click's selection
   * lands, a scroll bar that appears), so a grown menu is not left hanging past the edge.
   */
  const latestAt = useRef(at)
  latestAt.current = at
  const place = useCallback(() => {
    const point = latestAt.current
    if (!point) return
    const width = popover.current?.offsetWidth ?? 200
    const height = popover.current?.offsetHeight ?? 0
    const next = { x: Math.max(4, Math.min(point.x, window.innerWidth - width - 4)), y: Math.max(4, Math.min(point.y, window.innerHeight - height - 4)) }
    setPosition((shown) => (shown && shown.x === next.x && shown.y === next.y ? shown : next))
  }, [])
  useLayoutEffect(() => {
    if (!at) {
      setPosition(null)
      return undefined
    }
    place()
    const element = popover.current
    if (!element || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => place())
    observer.observe(element)
    return () => observer.disconnect()
  }, [at, place])
  useDismiss(at != null, [popover], close)
  // The element focused when the menu opened gets the focus back (the editor's keys keep working).
  useMenuFocus(at != null, position != null, popover, () => (document.activeElement instanceof HTMLElement ? document.activeElement : null))
  if (!at) return null
  return (
    <div
      ref={popover}
      className="kui-popover"
      role="menu"
      aria-label={label}
      data-testid={testId}
      style={position ? { left: position.x, top: position.y } : { left: at.x, top: at.y, visibility: 'hidden' }}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => menuKeyDown(event, close)}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) close()
      }}
    >
      <MenuContext.Provider value={{ close }}>{children}</MenuContext.Provider>
    </div>
  )
}

/* Panels and status bar */

export function Panel({ side, width, title, children, testId }: { side: 'left' | 'right'; width: number; title?: string; children: ReactNode; testId?: string }) {
  return (
    <aside className="kui-panel" data-side={side} style={{ width }} data-testid={testId}>
      {title ? <div className="kui-panel-header">{title}</div> : null}
      <div className="kui-panel-body">{children}</div>
    </aside>
  )
}

export function StatusBar({ children, onClick }: { children: ReactNode; onClick?: (event: ReactMouseEvent<HTMLElement>) => void }) {
  return (
    <footer className="kui-status-bar" onClick={onClick}>
      {children}
    </footer>
  )
}

export function StatusSpacer() {
  return <div className="kui-status-spacer" />
}

/** Zoom out, a slider from `min` to `max`, zoom in, the value, and fit. */
export function ZoomControl({ zoom, onZoom, onFit, min = 0.1, max = 4, labels }: { zoom: number; onZoom: (zoom: number) => void; onFit: () => void; min?: number; max?: number; labels: { out: string; in: string; fit: string } }) {
  // The slider is logarithmic so 100% sits where people expect it.
  const toSlider = (value: number) => Math.log(value / min) / Math.log(max / min)
  const fromSlider = (value: number) => min * Math.pow(max / min, value)
  return (
    <div className="kui-zoom">
      <button type="button" className="kui-icon-button" aria-label={labels.out} title={labels.out} onClick={() => onZoom(zoom / 1.25)}>
        −
      </button>
      <input type="range" min={0} max={1} step={0.001} value={toSlider(zoom)} onChange={(event) => onZoom(fromSlider(Number(event.target.value)))} aria-label={labels.fit} />
      <button type="button" className="kui-icon-button" aria-label={labels.in} title={labels.in} onClick={() => onZoom(zoom * 1.25)}>
        +
      </button>
      <span className="kui-zoom-value" data-testid="kit-zoom">{Math.round(zoom * 100)}%</span>
      <button type="button" className="kui-button" data-variant="ghost" onClick={onFit}>
        {labels.fit}
      </button>
    </div>
  )
}

/* Dialogs */

export function Dialog({
  title,
  children,
  actions,
  onClose,
  onEscape,
  modal = true,
  uiId,
  testId,
  position,
  onMove,
}: {
  title: string
  children: ReactNode
  actions: ReactNode
  onClose: () => void
  /** Called for Escape in place of `onClose` (a dialog that lets a field keep its own Escape). */
  onEscape?: (event: KeyboardEvent) => void
  /**
   * Blocks the page behind a backdrop (the default), where a press outside closes it. With
   * `false` the page stays usable: no backdrop, and the editor keeps its keys.
   */
  modal?: boolean
  uiId?: string
  testId?: string
  /** Where the dialog's top left sits in the window (with `onMove`); null or absent: where the layout puts it. */
  position?: { x: number; y: number } | null
  /**
   * Makes the dialog movable by its title: a drag moves it, and its place is reported once, on
   * release (keep it, and give it back as `position`). Absent, the title does not move it.
   */
  onMove?: (position: { x: number; y: number }) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // A non-modal dialog leaves the page usable: an Escape pressed elsewhere (in a panel, in a
      // menu open over the dialog) is that place's. Inside the dialog, or with focus nowhere, it closes.
      if (!modal) {
        const active = document.activeElement
        if (active && active !== document.body && !box.current?.contains(active)) return
      }
      if (onEscape) onEscape(event)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onEscape, modal])
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [dragged, setDragged] = useState<{ x: number; y: number } | null>(null)
  // A new position from the kit wins over where a drag left the dialog.
  useEffect(() => {
    setDragged(null)
  }, [position?.x, position?.y])
  const shown = dragged ?? position ?? null
  // Kept inside the window: never past its top or left, and the title always reachable.
  const keep = (x: number, y: number) => ({ x: Math.round(Math.min(Math.max(0, x), Math.max(0, window.innerWidth - 48))), y: Math.round(Math.min(Math.max(0, y), Math.max(0, window.innerHeight - 32))) })
  const moves = onMove
    ? {
        'data-movable': 'true',
        onPointerDown: (event: ReactPointerEvent<HTMLHeadingElement>) => {
          if (event.button !== 0) return
          const rect = box.current?.getBoundingClientRect()
          const from = shown ?? { x: rect?.left ?? 0, y: rect?.top ?? 0 }
          drag.current = { x: event.clientX, y: event.clientY, left: from.x, top: from.y }
          event.currentTarget.setPointerCapture?.(event.pointerId)
          event.preventDefault()
        },
        onPointerMove: (event: ReactPointerEvent<HTMLHeadingElement>) => {
          const start = drag.current
          if (start) setDragged(keep(start.left + event.clientX - start.x, start.top + event.clientY - start.y))
        },
        onPointerUp: (event: ReactPointerEvent<HTMLHeadingElement>) => {
          const start = drag.current
          drag.current = null
          if (!start) return
          const at = keep(start.left + event.clientX - start.x, start.top + event.clientY - start.y)
          setDragged(at)
          onMove(at)
        },
        onPointerCancel: () => {
          drag.current = null
        },
      }
    : {}
  return (
    <div className={modal ? 'kui-dialog-backdrop' : 'kui-dialog-layer'} onPointerDown={modal ? (event) => event.target === event.currentTarget && onClose() : undefined}>
      <div ref={box} className="kui-dialog" role="dialog" aria-modal={modal} aria-label={title} data-kit-ui-id={uiId} data-testid={testId} style={shown ? { position: 'absolute', left: shown.x, top: shown.y, margin: 0 } : undefined}>
        <h2 {...moves}>{title}</h2>
        <div className="kui-dialog-body">{children}</div>
        <div className="kui-dialog-actions">{actions}</div>
      </div>
    </div>
  )
}

/* Notices */

type Toast = { id: number; level: 'info' | 'success' | 'warning' | 'error'; title: string; description?: string }
const listeners = new Set<(toasts: Toast[]) => void>()
let toasts: Toast[] = []
let nextToast = 1
const expiries = new Map<number, ReturnType<typeof setTimeout>>()

/** Removes the notice `id` once its time is up, starting the count again if it was already running. */
function expire(id: number, level: Toast['level']) {
  clearTimeout(expiries.get(id))
  expiries.set(
    id,
    setTimeout(
      () => {
        expiries.delete(id)
        toasts = toasts.filter((item) => item.id !== id)
        for (const listener of listeners) listener(toasts)
      },
      level === 'error' ? 6000 : 3000,
    ),
  )
}

/**
 * Shows a notice at the top of the editor for a few seconds. The same notice again while it is
 * still showing (a command failing stroke after stroke) refreshes it instead of stacking another.
 */
export function toast(level: Toast['level'], title: string, description?: string) {
  const shown = toasts.find((item) => item.level === level && item.title === title && item.description === description)
  if (shown) {
    expire(shown.id, level)
    return
  }
  const id = nextToast++
  toasts = [...toasts, { id, level, title, description }]
  for (const listener of listeners) listener(toasts)
  expire(id, level)
}

export function Toaster() {
  const [shown, setShown] = useState(toasts)
  useEffect(() => {
    listeners.add(setShown)
    return () => {
      listeners.delete(setShown)
    }
  }, [])
  return (
    <div className="kui-toasts" aria-live="polite">
      {shown.map((item) => (
        <div key={item.id} className="kui-toast" data-level={item.level} role={item.level === 'error' ? 'alert' : 'status'}>
          <div>{item.title}</div>
          {item.description ? <div className="kui-toast-description">{item.description}</div> : null}
        </div>
      ))}
    </div>
  )
}

/** The standard colors under a color menu (Office's row). */
export const STANDARD_COLORS = ['#C00000', '#FF0000', '#FFC000', '#FFFF00', '#92D050', '#00B050', '#00B0F0', '#0070C0', '#002060', '#7030A0']

/** A grid of tints and shades of `base` colors, as color menus show them. */
export const PALETTE_COLORS = [
  '#FFFFFF', '#000000', '#E7E6E6', '#44546A', '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47',
  '#F2F2F2', '#7F7F7F', '#D0CECE', '#D6DCE4', '#D9E2F3', '#FBE5D5', '#EDEDED', '#FFF2CC', '#DEEBF6', '#E2EFD9',
  '#D8D8D8', '#595959', '#AEABAB', '#ADB9CA', '#B4C6E7', '#F7CBAC', '#DBDBDB', '#FEE599', '#BDD7EE', '#C5E0B3',
  '#BFBFBF', '#3F3F3F', '#757070', '#8496B0', '#8EAADB', '#F4B183', '#C9C9C9', '#FFD965', '#9DC3E6', '#A8D08D',
]

/** A grid of color swatches; `onPick` gets `#RRGGBB`. */
export function ColorGrid({ colors = [...PALETTE_COLORS, ...STANDARD_COLORS], onPick, testId }: { colors?: readonly string[]; onPick: (color: string) => void; testId?: string }) {
  return (
    <div className="kui-color-grid" data-testid={testId}>
      {colors.map((color, index) => (
        <button key={`${index}-${color}`} type="button" title={color} aria-label={color} className="kui-swatch" style={{ background: color }} onClick={() => onPick(color)} />
      ))}
    </div>
  )
}

/** Choosing a table's size by pointing at a grid of cells (Insert > Table). */
export function TableSizePicker({ rows = 8, columns = 10, onPick, label }: { rows?: number; columns?: number; onPick: (rows: number, columns: number) => void; label: (rows: number, columns: number) => string }) {
  const [hover, setHover] = useState<[number, number]>([0, 0])
  return (
    <div className="kui-table-picker" onPointerLeave={() => setHover([0, 0])}>
      <div className="kui-table-picker-label">{hover[0] ? label(hover[0], hover[1]) : label(0, 0)}</div>
      <div className="kui-table-picker-grid" style={{ gridTemplateColumns: `repeat(${columns}, 16px)` }}>
        {Array.from({ length: rows * columns }, (_, index) => {
          const row = Math.floor(index / columns) + 1
          const column = (index % columns) + 1
          return (
            <button
              key={index}
              type="button"
              aria-label={label(row, column)}
              className="kui-table-picker-cell"
              data-on={row <= hover[0] && column <= hover[1]}
              onPointerEnter={() => setHover([row, column])}
              onClick={() => onPick(row, column)}
              data-testid={`kui-table-${row}x${column}`}
            />
          )
        })}
      </div>
    </div>
  )
}
