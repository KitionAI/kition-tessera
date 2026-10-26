/** @jsxRuntime automatic */
/**
 * An HSB color picker (Photoshop's Color panel, simplified): a saturation/brightness square for
 * the current hue, a vertical hue strip, a hex field, and R, G, B `NumberField`s (upstream
 * `color_picker_ui.rs`, `panels.rs` `color_field`). Styled only through the Kit UI protocol's
 * theme tokens (styles.css).
 *
 * The square and the strip report every pointer move with `final: false` and exactly one
 * `final: true` on release (`NumberField`'s own convention); an arrow key moves by one step and
 * commits at once, as `NumberField`'s own arrow keys do. Unlike `NumberField`'s scrub label, a
 * press on the square or the strip already lands on a real color (its position, not a drag
 * delta), so a press with no movement still reports that color once, not nothing.
 */
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { textOn } from './brand'
import { NumberField } from './NumberField'
import { useStrings } from './context'

export type RGB = readonly [number, number, number]
export type ColorPickerProps = {
  value: RGB
  /** Called on every pointer move and arrow key (`final: false` mid-drag, one `final: true` on release or key). */
  onChange: (rgb: RGB, final: boolean) => void
  disabled?: boolean
  testId?: string
  /** A Kit UI id when the picker is a declared element. */
  uiId?: string
}

type Hsv = { h: number; s: number; v: number }

const HUE_STEP = 1
const HUE_STEP_FAST = 15
const SV_STEP = 0.01
const SV_STEP_FAST = 0.1
/** Below this, saturation or brightness carries no usable hue (greys, black): keep the last one. */
const HUE_EPSILON = 1e-4

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function clampByte(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)))
}

function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360
}

/** HSB/HSV to RGB (0..255 bytes), `h` in degrees, `s` and `v` in 0..1. */
export function hsvToRgb(h: number, s: number, v: number): RGB {
  const hue = wrapHue(h)
  const c = v * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = v - c
  const sector = Math.floor(hue / 60)
  const [r, g, b] =
    sector === 0 ? [c, x, 0] : sector === 1 ? [x, c, 0] : sector === 2 ? [0, c, x] : sector === 3 ? [0, x, c] : sector === 4 ? [x, 0, c] : [c, 0, x]
  return [clampByte((r + m) * 255), clampByte((g + m) * 255), clampByte((b + m) * 255)]
}

/** RGB (0..255 bytes) to HSB/HSV (`h` in degrees, `s` and `v` in 0..1). */
export function rgbToHsv([r, g, b]: RGB): Hsv {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6)
    else if (max === gn) h = 60 * ((bn - rn) / d + 2)
    else h = 60 * ((rn - gn) / d + 4)
  }
  if (h < 0) h += 360
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

export function rgbToHex([r, g, b]: RGB): string {
  const byte = (value: number) => clampByte(value).toString(16).padStart(2, '0')
  return `#${byte(r)}${byte(g)}${byte(b)}`
}

/** A 3- or 6-digit hex color, with or without the leading `#`, any case; `null` for anything else. */
export function parseHex(text: string): RGB | null {
  const trimmed = text.trim()
  const short = /^#?([0-9a-fA-F]{3})$/.exec(trimmed)
  if (short) {
    const [r, g, b] = short[1]
    return [Number.parseInt(r + r, 16), Number.parseInt(g + g, 16), Number.parseInt(b + b, 16)]
  }
  const long = /^#?([0-9a-fA-F]{6})$/.exec(trimmed)
  if (!long) return null
  const hex = long[1]
  return [Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16)]
}

/**
 * The "saturation and brightness", "hue", and "hex color" accessible names: the editor's own
 * strings when a `KitEditorProvider` is present, otherwise the shared en-US text — `ColorPicker`
 * may render on its own, outside any editor, as in tests or a host-less preview.
 */
function usePickerLabels() {
  const t = useStrings()
  return { square: t('colorPickerSquare'), hue: t('colorPickerHue'), hex: t('colorPickerHex') }
}

export function ColorPicker({ value, onChange, disabled, testId = 'color-picker', uiId }: ColorPickerProps) {
  const labels = usePickerLabels()
  const [r, g, b] = value
  const hueMemory = useRef(rgbToHsv(value).h)
  // A gesture's own live HSB, while it is in progress: the square and the strip move one HSB
  // component at a time, so the gesture needs the other two to stay put even if `value`'s rounding
  // (a byte RGB) cannot represent them exactly.
  const [draft, setDraft] = useState<Hsv | null>(null)
  const dragging = useRef<'square' | 'hue' | null>(null)
  const [hexText, setHexText] = useState(() => rgbToHex(value))
  const editingHex = useRef(false)

  useEffect(() => {
    if (draft) return
    const hsv = rgbToHsv([r, g, b])
    if (hsv.s > HUE_EPSILON && hsv.v > HUE_EPSILON) hueMemory.current = hsv.h
  }, [r, g, b, draft])

  useEffect(() => {
    if (editingHex.current) return
    setHexText(rgbToHex([r, g, b]).slice(1))
  }, [r, g, b])

  const effective: Hsv =
    draft ??
    (() => {
      const hsv = rgbToHsv([r, g, b])
      return hsv.s > HUE_EPSILON && hsv.v > HUE_EPSILON ? hsv : { h: hueMemory.current, s: hsv.s, v: hsv.v }
    })()

  function commit(next: Hsv, final: boolean) {
    setDraft(final ? null : next)
    if (final) hueMemory.current = next.h
    onChange(hsvToRgb(next.h, next.s, next.v), final)
  }

  function squareValueAt(event: ReactPointerEvent<HTMLDivElement>): { s: number; v: number } {
    const rect = event.currentTarget.getBoundingClientRect()
    return { s: clamp01((event.clientX - rect.left) / rect.width), v: clamp01(1 - (event.clientY - rect.top) / rect.height) }
  }

  function onSquarePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragging.current = 'square'
    const { s, v } = squareValueAt(event)
    commit({ h: effective.h, s, v }, false)
  }

  function onSquarePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || dragging.current !== 'square') return
    const { s, v } = squareValueAt(event)
    commit({ h: effective.h, s, v }, false)
  }

  function onSquarePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || dragging.current !== 'square') return
    dragging.current = null
    const { s, v } = squareValueAt(event)
    commit({ h: effective.h, s, v }, true)
  }

  function onSquareKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const step = event.shiftKey ? SV_STEP_FAST : SV_STEP
    let { s, v } = effective
    if (event.key === 'ArrowLeft') s = clamp01(s - step)
    else if (event.key === 'ArrowRight') s = clamp01(s + step)
    else if (event.key === 'ArrowUp') v = clamp01(v + step)
    else if (event.key === 'ArrowDown') v = clamp01(v - step)
    else return
    event.preventDefault()
    commit({ h: effective.h, s, v }, true)
  }

  /** Upstream's own direction (`color_picker_ui.rs`, `panels.rs` `color_field`): 360° at the top, 0° at the bottom. */
  function hueValueAt(event: ReactPointerEvent<HTMLDivElement>): number {
    const rect = event.currentTarget.getBoundingClientRect()
    const fraction = clamp01((event.clientY - rect.top) / rect.height)
    return wrapHue((1 - fraction) * 360)
  }

  function onHuePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragging.current = 'hue'
    commit({ h: hueValueAt(event), s: effective.s, v: effective.v }, false)
  }

  function onHuePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || dragging.current !== 'hue') return
    commit({ h: hueValueAt(event), s: effective.s, v: effective.v }, false)
  }

  function onHuePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || dragging.current !== 'hue') return
    dragging.current = null
    commit({ h: hueValueAt(event), s: effective.s, v: effective.v }, true)
  }

  function onHueKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const step = event.shiftKey ? HUE_STEP_FAST : HUE_STEP
    // 360° at the top, 0° at the bottom: Up moves toward the top, so it raises the hue.
    if (event.key === 'ArrowUp') commit({ h: wrapHue(effective.h + step), s: effective.s, v: effective.v }, true)
    else if (event.key === 'ArrowDown') commit({ h: wrapHue(effective.h - step), s: effective.s, v: effective.v }, true)
    else return
    event.preventDefault()
  }

  function commitHex(text: string) {
    const rgb = parseHex(text)
    if (!rgb) {
      setHexText(rgbToHex(value).slice(1))
      return
    }
    setHexText(rgbToHex(rgb).slice(1))
    onChange(rgb, true)
  }

  const knobColor = textOn(rgbToHex(hsvToRgb(effective.h, effective.s, effective.v)))

  return (
    <div className="kui-color-picker" data-testid={testId} data-kit-ui-id={uiId}>
      <div className="kui-color-picker-top">
        <div
          className="kui-color-picker-square"
          style={{ '--kui-color-picker-hue': effective.h } as CSSProperties}
          role="slider"
          aria-label={labels.square}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(effective.v * 100)}
          aria-valuetext={`${Math.round(effective.s * 100)}%, ${Math.round(effective.v * 100)}%`}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onPointerDown={onSquarePointerDown}
          onPointerMove={onSquarePointerMove}
          onPointerUp={onSquarePointerUp}
          onPointerCancel={onSquarePointerUp}
          onKeyDown={onSquareKeyDown}
          data-testid={`${testId}-square`}
        >
          <span className="kui-color-picker-knob" style={{ left: `${effective.s * 100}%`, top: `${(1 - effective.v) * 100}%`, borderColor: knobColor }} />
        </div>
        <div
          className="kui-color-picker-hue"
          role="slider"
          aria-label={labels.hue}
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={359}
          aria-valuenow={Math.round(effective.h)}
          aria-valuetext={`${Math.round(effective.h)}°`}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onPointerDown={onHuePointerDown}
          onPointerMove={onHuePointerMove}
          onPointerUp={onHuePointerUp}
          onPointerCancel={onHuePointerUp}
          onKeyDown={onHueKeyDown}
          data-testid={`${testId}-hue`}
        >
          <span className="kui-color-picker-hue-marker" style={{ top: `${(1 - effective.h / 360) * 100}%` }} />
        </div>
      </div>
      <div className="kui-color-picker-fields">
        <div className="kui-color-picker-hex">
          <span className="kui-color-picker-hex-prefix" aria-hidden="true">
            #
          </span>
          <input
            className="kui-field kui-color-picker-hex-input"
            type="text"
            value={hexText}
            disabled={disabled}
            aria-label={labels.hex}
            onChange={(event) => {
              editingHex.current = true
              setHexText(event.target.value.replace(/^#/, ''))
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                editingHex.current = false
                commitHex(hexText)
              } else if (event.key === 'Escape') {
                event.preventDefault()
                editingHex.current = false
                setHexText(rgbToHex(value).slice(1))
              }
            }}
            onBlur={() => {
              if (!editingHex.current) return
              editingHex.current = false
              commitHex(hexText)
            }}
            data-testid={`${testId}-hex`}
          />
        </div>
        {/* R, G, B stay as plain, untranslated channel letters, like NumberField's own units ("%", "°"): symbols, not sentences, and upstream keeps the same letters in its own Chinese build. */}
        <NumberField label="R" value={r} min={0} max={255} step={1} disabled={disabled} onChange={(next, final) => onChange([clampByte(next), g, b], final)} testId={`${testId}-r`} />
        <NumberField label="G" value={g} min={0} max={255} step={1} disabled={disabled} onChange={(next, final) => onChange([r, clampByte(next), b], final)} testId={`${testId}-g`} />
        <NumberField label="B" value={b} min={0} max={255} step={1} disabled={disabled} onChange={(next, final) => onChange([r, g, clampByte(next)], final)} testId={`${testId}-b`} />
      </div>
    </div>
  )
}
