/**
 * Pieces a kit's list panels share (a Layers, Channels, or Paths panel): a thumbnail, the eye
 * column's toggle with Photoshop's sweep, a row name that renames in place, and the footer of
 * buttons. Styled only through the Kit UI protocol's theme tokens (styles.css).
 */
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { EyeIcon as Eye } from '@kition/tessera-icons/react'
import { ICON_STROKE } from './ui'

/** Something a canvas draws, with its size: an `ImageBitmap`, a canvas, a loaded image. */
export type ThumbnailImage = CanvasImageSource & { width: number; height: number }

/** Device pixels per CSS pixel, for thumbnails as sharp as the screen. */
export function deviceScale() {
  return typeof window === 'undefined' ? 1 : Math.min(3, Math.max(1, Math.round(window.devicePixelRatio || 1)))
}

/**
 * A thumbnail: `image` fitted in a `size` × `size` cell at its own aspect, over a checkerboard
 * where it is transparent, with a thin frame; an empty cell while there is no image (not drawn
 * yet, or its source could not draw one).
 */
export function Thumbnail({ image, size, testId }: { image: ThumbnailImage | null; size: number; testId?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const scale = deviceScale()
  const fit = image && image.width > 0 && image.height > 0 ? Math.min(size / image.width, size / image.height) : 0
  const width = Math.max(1, Math.round((image?.width ?? 0) * fit))
  const height = Math.max(1, Math.round((image?.height ?? 0) * fit))
  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context || !image) return
    context.clearRect(0, 0, width * scale, height * scale)
    try {
      context.drawImage(image, 0, 0, width * scale, height * scale)
    } catch {
      // An image released meanwhile (a closed ImageBitmap) draws nothing until its successor comes.
    }
  }, [height, image, scale, width])
  return (
    <span className="kui-thumbnail" style={{ width: size, height: size }} data-drawn={image != null} data-testid={testId} aria-hidden="true">
      {image ? <canvas ref={canvas} width={width * scale} height={height * scale} style={{ width, height }} /> : null}
    </span>
  )
}

/** The attribute that names an eye in a sweep, and the sweep it belongs to. */
const SWEEP = 'data-kui-eye'
const SWEEP_GROUP = 'data-kui-eye-group'

/** How far apart (CSS pixels) a sweep samples the pointer's path, so a fast drag skips no row. */
const SWEEP_STEP = 4

export type EyeSweep = {
  /** This eye's name in the sweep (a layer's id). */
  id: string
  /** The eyes that sweep together (one panel's). */
  group: string
  /** The pointer crossed another eye of the group while pressed from this one. */
  onOver: (id: string) => void
}

/**
 * A row's eye: the eye icon while shown, an empty box while hidden (as Photoshop draws it).
 * A press toggles at once (`onPress` hears whether Alt was held); with `sweep`, dragging on from
 * the press down the eye column (mouse, pen, or touch) reaches every other eye of the group the
 * pointer crosses, through `sweep.onOver`, so the panel gives each the visibility the first press
 * set. A keyboard click toggles too. It is pressed while its row shows; `tabIndex` takes it out of
 * the tab order where a list moves the focus itself.
 */
export function EyeButton({ visible, label, onPress, sweep, tabIndex, testId }: { visible: boolean; label: string; onPress: (alt: boolean) => void; sweep?: EyeSweep; tabIndex?: number; testId?: string }) {
  const last = useRef<{ pointerId: number; x: number; y: number; seen: Set<string> } | null>(null)
  const down = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    event.stopPropagation()
    onPress(event.altKey)
    if (!sweep) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    last.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, seen: new Set([sweep.id]) }
  }
  const move = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = last.current
    if (!sweep || !current || current.pointerId !== event.pointerId) return
    const steps = Math.max(1, Math.ceil(Math.hypot(event.clientX - current.x, event.clientY - current.y) / SWEEP_STEP))
    for (let index = 1; index <= steps; index += 1) {
      const x = current.x + ((event.clientX - current.x) * index) / steps
      const y = current.y + ((event.clientY - current.y) * index) / steps
      const eye = document.elementFromPoint(x, y)?.closest(`[${SWEEP}]`)
      const id = eye?.getAttribute(SWEEP)
      if (!id || eye?.getAttribute(SWEEP_GROUP) !== sweep.group || current.seen.has(id)) continue
      current.seen.add(id)
      sweep.onOver(id)
    }
    current.x = event.clientX
    current.y = event.clientY
  }
  const up = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (last.current?.pointerId !== event.pointerId) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    last.current = null
  }
  return (
    <button
      type="button"
      className="kui-eye"
      aria-label={label}
      title={label}
      aria-pressed={visible}
      tabIndex={tabIndex}
      data-kui-eye={sweep?.id}
      data-kui-eye-group={sweep?.group}
      data-testid={testId}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClick={(event) => {
        event.stopPropagation()
        // A pointer press has toggled already; a click from the keyboard has no press before it.
        if (event.detail === 0) onPress(event.altKey)
      }}
    >
      {visible ? <Eye size={14} strokeWidth={ICON_STROKE} aria-hidden="true" /> : null}
    </button>
  )
}

/**
 * A row name's in-place editor, focused with its text selected: Enter or leaving it commits,
 * Escape cancels (`onDone` once, with which); a composing input method keeps Enter for itself.
 * It keeps its presses and keys from the row (no selection change, no editor shortcut).
 */
export function RenameField({ value, label, onChange, onDone, testId }: { value: string; label: string; onChange: (text: string) => void; onDone: (commit: boolean) => void; testId?: string }) {
  const done = useRef(false)
  const finish = (commit: boolean) => {
    if (done.current) return
    done.current = true
    onDone(commit)
  }
  const keyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation()
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Enter') finish(true)
    else if (event.key === 'Escape') finish(false)
  }
  return (
    <input
      className="kui-rename"
      value={value}
      aria-label={label}
      autoFocus
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={keyDown}
      onBlur={() => finish(true)}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      data-testid={testId}
    />
  )
}

/** The buttons along a list panel's bottom, as Photoshop's: `start` on the left, `end` on the right. */
export function PanelFooter({ start, end }: { start?: ReactNode; end?: ReactNode }) {
  return (
    <div className="kui-panel-footer">
      <span className="kui-panel-footer-group">{start}</span>
      <span className="kui-panel-footer-group">{end}</span>
    </div>
  )
}
