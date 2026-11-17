/** @jsxRuntime automatic */
import { useLayoutEffect, useRef, useState } from 'react'

export type ScrollbarProps = {
  /** Accessible name supplied by the editor's locale. */
  label: string
  orientation?: 'vertical' | 'horizontal'
  /** Distance from the start of the content, in the caller's coordinates. */
  value: number
  /** Maximum scroll distance (content length minus visible length). */
  max: number
  /** Visible content length, in the same coordinates as value. */
  page: number
  onChange: (value: number) => void
  controls?: string
}

/** A persistent scrollbar for virtual viewports, with proportional thumb, pointer capture and keyboard navigation. */
export function Scrollbar({ label, orientation = 'vertical', value, max, page, onChange, controls }: ScrollbarProps) {
  const track = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointer: number; offset: number } | null>(null)
  const [length, setLength] = useState(0)
  const horizontal = orientation === 'horizontal'
  const limit = Math.max(0, max)
  const position = Math.max(0, Math.min(limit, value))
  const thumbLength = Math.min(length, Math.max(24, length * page / (limit + page || 1)))
  const travel = Math.max(0, length - thumbLength)
  const start = limit > 0 ? position / limit * travel : 0
  const change = (next: number) => onChange(Math.max(0, Math.min(limit, next)))

  useLayoutEffect(() => {
    const element = track.current
    if (!element) return
    const measure = () => setLength(horizontal ? element.clientWidth : element.clientHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [horizontal])

  // A scrollbar owns wheel input too, even when the editor captures keys and wheel events.
  useLayoutEffect(() => {
    const element = track.current
    if (!element) return
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? length : 1
      const delta = horizontal ? event.deltaX || event.deltaY : event.deltaY
      change(position + delta * units * page / Math.max(1, length))
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  })

  return (
    <div
      ref={track}
      className="kui-scrollbar"
      role="scrollbar"
      aria-label={label}
      aria-controls={controls}
      aria-orientation={orientation}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={position}
      aria-disabled={limit === 0}
      tabIndex={limit > 0 ? 0 : -1}
      onPointerDown={(event) => {
        if (event.button !== 0 || limit === 0) return
        event.preventDefault()
        event.stopPropagation()
        // Pointer scrolling preserves the editor's typing focus; Tab can focus this control.
        const rect = event.currentTarget.getBoundingClientRect()
        const point = horizontal ? event.clientX - rect.left : event.clientY - rect.top
        if (event.target === thumb.current) {
          drag.current = { pointer: event.pointerId, offset: point - start }
          event.currentTarget.setPointerCapture(event.pointerId)
        } else change(position + (point < start ? -page : page))
      }}
      onPointerMove={(event) => {
        if (drag.current?.pointer !== event.pointerId || travel === 0) return
        const rect = event.currentTarget.getBoundingClientRect()
        const point = horizontal ? event.clientX - rect.left : event.clientY - rect.top
        change((point - drag.current.offset) / travel * limit)
      }}
      onLostPointerCapture={() => { drag.current = null }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        drag.current = null
      }}
      onKeyDown={(event) => {
        if (event.metaKey || event.ctrlKey) return
        event.stopPropagation()
        const step = Math.max(1, page / 20)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? limit
          : event.key === 'PageUp' ? position - page : event.key === 'PageDown' ? position + page
          : event.key === (horizontal ? 'ArrowLeft' : 'ArrowUp') ? position - step
          : event.key === (horizontal ? 'ArrowRight' : 'ArrowDown') ? position + step : null
        if (next === null) return
        event.preventDefault()
        change(next)
      }}
    >
      <div ref={thumb} className="kui-scrollbar-thumb" style={horizontal ? { left: start, width: thumbLength } : { top: start, height: thumbLength }} />
    </div>
  )
}
