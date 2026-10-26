/**
 * Behavior hooks for hosts' own overlays: focus kept inside a dialog, a layer that closes on an
 * outside press or Escape, and a media query.
 */
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Tabbable descendants in document order, skipping anything not rendered or hidden from assistive technology. */
function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) =>
      element.getAttribute('aria-hidden') !== 'true' &&
      !element.closest('[aria-hidden="true"]') &&
      (typeof element.checkVisibility !== 'function' || element.checkVisibility()),
  )
}

/**
 * Focus management for a dialog that mounts while open. On mount, focus moves to the descendant
 * marked `data-dialog-initial-focus` (a search field, say, rather than a close button that would
 * otherwise be first in tab order), or else the first tabbable descendant, or the container itself
 * (which must have `tabIndex={-1}`); Tab and Shift+Tab move through the dialog's own tabbable
 * elements and wrap inside; on unmount focus returns to the element that had it before. Every Tab
 * is handled here rather than by the browser: WebKit (WKWebView, like Safari) tabs only between
 * text fields by default, skipping buttons, and would leave the dialog.
 */
export function useDialogFocus<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!container.contains(document.activeElement)) {
      const candidates = focusableElements(container)
      const preferred = container.querySelector<HTMLElement>('[data-dialog-initial-focus]')
      const initial = (preferred && candidates.includes(preferred) ? preferred : candidates[0]) ?? container
      initial.focus()
    }

    function onKeyDown(event: KeyboardEvent) {
      // An editor inside the dialog may use Tab itself (indenting); it then prevents the default.
      if (event.key !== 'Tab' || event.defaultPrevented) return
      const elements = focusableElements(container!)
      if (elements.length === 0) {
        event.preventDefault()
        container!.focus()
        return
      }
      event.preventDefault()
      const active = document.activeElement
      const index = elements.indexOf(active as HTMLElement)
      let next: number
      if (index !== -1) {
        next = (index + (event.shiftKey ? -1 : 1) + elements.length) % elements.length
      } else if (active instanceof Node && container!.contains(active)) {
        // Focus on something inside the dialog that is not in the list (an editable region): the
        // neighbour in document order.
        const after = elements.findIndex((element) => active.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
        next = event.shiftKey ? (after === -1 ? elements.length : after) - 1 : after === -1 ? 0 : after
        if (next < 0) next = elements.length - 1
      } else {
        next = event.shiftKey ? elements.length - 1 : 0
      }
      elements[next]!.focus()
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      if (previous && previous.isConnected) previous.focus()
    }
  }, [])

  return ref
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Calls `handler` on a press (`mousedown` by default) outside the element `ref` holds. */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(ref: RefObject<T | null>, handler?: (event: MouseEvent) => void, mouseEvent: 'mousedown' | 'mouseup' = 'mousedown') {
  const saved = useRef(handler)
  useIsomorphicLayoutEffect(() => {
    saved.current = handler
  }, [handler])
  useEffect(() => {
    if (!handler) return
    const listener = (event: MouseEvent) => {
      const element = ref.current
      if (!element || element.contains(event.target as Node)) return
      saved.current?.(event)
    }
    window.addEventListener(mouseEvent, listener)
    return () => window.removeEventListener(mouseEvent, listener)
  }, [handler, mouseEvent, ref])
}

/** While `open`, calls `onDismiss` on a press outside the element `ref` holds or on Escape. */
export function useDismissableLayer<T extends HTMLElement = HTMLElement>(ref: RefObject<T | null>, open: boolean, onDismiss: () => void, mouseEvent: 'mousedown' | 'mouseup' = 'mousedown') {
  useOnClickOutside(ref, open ? () => onDismiss() : undefined, mouseEvent)
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onDismiss, open])
}

/** Whether the viewport matches `query` (`(min-width: 768px)`), following changes. */
export function useMediaQuery(query: string): boolean {
  const matches = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false)
  const [value, setValue] = useState(matches)
  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setValue(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])
  return value
}
