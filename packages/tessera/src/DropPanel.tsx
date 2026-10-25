/**
 * A panel under a button: a Single line group's popover, a Menus tab's ribbon. It opens below its
 * anchor, kept inside the window as it grows, and closes on a press outside the anchor, on Escape (unless a
 * menu inside it took the key), and after a command, tool, or host button in it runs; its other
 * controls (fields, galleries, menu buttons) leave it open. Render it inside `anchor`, after the
 * button that opens it: the panel takes the focus as it opens (its first control) and gives it back
 * to that button as it closes, unless something outside has taken it meanwhile. The button carries
 * `aria-haspopup="dialog"` and `aria-expanded`.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

/** The presses that are a choice made: the panel has done its job. */
const CHOICES = 'button[data-kit-ui-id^="command:"], button[data-kit-ui-id^="tool:"], button[data-kit-ui-id^="host:"]'
/** What takes the focus as the panel opens. */
const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'

export function DropPanel({ open, anchor, onClose, label, className = '', testId, children }: { open: boolean; anchor: RefObject<HTMLElement | null>; onClose: () => void; label: string; className?: string; testId?: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState<{ left: number; top: number; maxHeight: number } | null>(null)
  const latestClose = useRef(onClose)
  latestClose.current = onClose
  useLayoutEffect(() => {
    if (!open) {
      setAt(null)
      return undefined
    }
    const place = () => {
      const box = anchor.current?.getBoundingClientRect()
      if (!box) return
      const width = panel.current?.offsetWidth ?? 0
      const top = box.bottom + 4
      setAt({ left: Math.max(4, Math.min(box.left, window.innerWidth - width - 4)), top, maxHeight: Math.max(0, window.innerHeight - top - 8) })
    }
    place()
    window.addEventListener('resize', place)
    // Its content can grow after it opens (a gallery that fills in): placed again, it stays inside.
    const grows = typeof ResizeObserver === 'function' && panel.current ? new ResizeObserver(place) : null
    if (grows && panel.current) grows.observe(panel.current)
    return () => {
      window.removeEventListener('resize', place)
      grows?.disconnect()
    }
  }, [anchor, open])
  // As it closes (or unmounts), the focus goes back to the button that opened it, when the focus
  // was in the panel or fell to nothing (the control that had it ran a command and went away).
  useLayoutEffect(() => {
    if (!open) return undefined
    const trigger = anchor.current?.querySelector<HTMLElement>('button')
    const node = panel.current
    return () => {
      const now = document.activeElement
      if (trigger?.isConnected && (!now || now === document.body || !now.isConnected || node?.contains(now))) trigger.focus({ preventScroll: true })
    }
  }, [anchor, open])
  // A panel is hidden until it is placed, and a hidden control takes no focus: focus it once placed.
  const placed = at !== null
  useLayoutEffect(() => {
    const node = panel.current
    if (!open || !placed || !node || node.contains(document.activeElement)) return
    ;(node.querySelector<HTMLElement>(FOCUSABLE) ?? node).focus({ preventScroll: true })
  }, [open, placed])
  useEffect(() => {
    if (!open) return undefined
    const onDown = (event: Event) => {
      if (!anchor.current?.contains(event.target as Node)) latestClose.current()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) latestClose.current()
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [anchor, open])
  if (!open) return null
  return (
    <div
      ref={panel}
      className={`kui-popover kui-drop-panel ${className}`}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      data-testid={testId}
      style={at ? { left: at.left, top: at.top, maxHeight: at.maxHeight } : { visibility: 'hidden' }}
      onClick={(event) => {
        if ((event.target as Element).closest(CHOICES)) onClose()
      }}
    >
      {children}
    </div>
  )
}
