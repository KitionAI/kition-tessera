/**
 * A kit's own values that outlive a document (its dock layout, its tools' options, a paint
 * editor's colours and swatches), kept in the browser's `localStorage` under a key named for the
 * kit and the value (`kit:<kit>:<name>`), so kits sharing an origin (Kition serves every kit's
 * editor from the app's own origin, each under `/kits/<kit>/`) never collide. Every editor of
 * the kit open in another tab or frame hears a change through the `storage` event.
 *
 * Reading tolerates anything: no storage (disabled, a sandboxed frame), corrupt JSON, or a value of
 * an older shape all read as nothing (the caller's `validate` decides what a stored value must
 * be). Writing reports what happened: stored, too large for the value's cap (nothing written), or
 * storage unavailable or full (nothing written, the value holds for this page only).
 */
import { useCallback, useEffect, useRef, useState } from 'react'

/** The `localStorage` key of a kit's value. */
export function kitStoreKey(kit: string, name: string) {
  return `kit:${kit}:${name}`
}

/** What a write did: `stored`, `tooLarge` (over the value's `maxBytes`; nothing written), or `unavailable` (no storage, or it is full). */
export type KitStoreWrite = 'stored' | 'tooLarge' | 'unavailable'

/** A stored value's size as the cap counts it: its JSON's UTF-8 bytes. */
export function storedBytes(json: string) {
  return new TextEncoder().encode(json).length
}

/** The kit's stored value of `name` as `validate` accepts it, or undefined (none, unreadable, or not valid). */
export function readKitStore<T>(kit: string, name: string, validate: (raw: unknown) => T | undefined): T | undefined {
  try {
    const raw = window.localStorage.getItem(kitStoreKey(kit, name))
    return raw == null ? undefined : validate(JSON.parse(raw))
  } catch {
    return undefined
  }
}

/** Stores `value` as the kit's `name`, unless its JSON is over `maxBytes`. */
export function writeKitStore(kit: string, name: string, value: unknown, maxBytes = Number.POSITIVE_INFINITY): KitStoreWrite {
  let json: string
  try {
    json = JSON.stringify(value)
  } catch {
    return 'unavailable'
  }
  if (storedBytes(json) > maxBytes) return 'tooLarge'
  try {
    window.localStorage.setItem(kitStoreKey(kit, name), json)
    return 'stored'
  } catch {
    return 'unavailable'
  }
}

/** Forgets the kit's `name`. */
export function removeKitStore(kit: string, name: string) {
  try {
    window.localStorage.removeItem(kitStoreKey(kit, name))
  } catch {
    // No storage: nothing was kept.
  }
}

export type KitStoreOptions<T> = {
  /** The value while nothing valid is stored. */
  initial: T
  /** What a stored value must be: the value to use, or undefined to ignore it (corrupt, an older shape). */
  validate: (raw: unknown) => T | undefined
  /** The largest value kept, in UTF-8 bytes of its JSON; a larger one holds for this page only (`set` answers `tooLarge`). */
  maxBytes?: number
  /** How long a change rests before it is written (a scrubbed field changes on every step); written at once by default, and always when the page goes away. */
  delayMs?: number
  /** Another tab or frame of the kit stored a new value (not called for this page's own `set`). */
  onExternal?: (value: T) => void
}

/**
 * The kit's value `name`: read once, written through on every `set` (or once it rests, with
 * `delayMs`, and when the page goes away), and following the kit's other editors (the `storage`
 * event). `set` answers whether the value could be kept; a value too large or a storage that
 * refuses it still holds for this page.
 */
export function useKitStore<T>(kit: string, name: string, options: KitStoreOptions<T>) {
  const latest = useRef(options)
  latest.current = options
  const key = kitStoreKey(kit, name)
  // The value belongs to its key: a new kit or name reads its own value, never keeps the old one.
  const [state, setState] = useState(() => ({ key, value: readKitStore(kit, name, options.validate) ?? options.initial }))
  const current = useRef(state.value)
  let value = state.value
  if (state.key !== key) {
    value = readKitStore(kit, name, options.validate) ?? options.initial
    current.current = value
    setState({ key, value })
  }
  const pending = useRef<{ timer: number; value: T } | null>(null)

  const flush = useCallback(() => {
    const waiting = pending.current
    if (!waiting) return
    window.clearTimeout(waiting.timer)
    pending.current = null
    writeKitStore(kit, name, waiting.value, latest.current.maxBytes)
  }, [kit, name])

  const set = useCallback(
    (next: T | ((value: T) => T)): KitStoreWrite => {
      const resolved = typeof next === 'function' ? (next as (value: T) => T)(current.current) : next
      current.current = resolved
      setState({ key: kitStoreKey(kit, name), value: resolved })
      const { delayMs, maxBytes } = latest.current
      if (!delayMs) return writeKitStore(kit, name, resolved, maxBytes)
      // A delayed write still answers for the size now, so a caller can say it will not be kept.
      let json: string
      try {
        json = JSON.stringify(resolved)
      } catch {
        return 'unavailable'
      }
      if (maxBytes != null && storedBytes(json) > maxBytes) return 'tooLarge'
      if (pending.current) window.clearTimeout(pending.current.timer)
      pending.current = { value: resolved, timer: window.setTimeout(flush, delayMs) }
      return 'stored'
    },
    [flush, kit, name],
  )

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key !== key || event.newValue == null) return
      let next: T | undefined
      try {
        next = latest.current.validate(JSON.parse(event.newValue))
      } catch {
        next = undefined
      }
      if (next === undefined) return
      current.current = next
      setState({ key, value: next })
      latest.current.onExternal?.(next)
    }
    window.addEventListener('storage', changed)
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('storage', changed)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush, key])

  return [value, set] as const
}
