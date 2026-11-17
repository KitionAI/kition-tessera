/** @jsxRuntime automatic */
/**
 * Small controls for a tool's options bar (or any toolbar row): a check box, a drop-down choice,
 * segmented icon buttons of which one is pressed, a hairline separator, and a muted hint. Styled
 * only through the Kit UI protocol's theme tokens (styles.css); a kit wraps one in `KitElement`
 * when it is a declared element.
 */
import type { ReactNode } from 'react'
import type { IconComponent } from './icon'
import { IconButton } from './ui'

/** `checked` and `onChange` are optional inside a `FormItem` (`valuePropName="checked"`), which supplies them. */
export type CheckboxProps = { label: ReactNode; checked?: boolean; disabled?: boolean; onChange?: (checked: boolean) => void; testId?: string; id?: string }

/** A check box with its label. */
export function Checkbox({ label, checked = false, disabled, onChange, testId, id }: CheckboxProps) {
  return (
    <label className="kui-checkbox" data-disabled={disabled || undefined}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} data-testid={testId} />
      {label}
    </label>
  )
}

export type ChoiceProps<V extends string> = {
  label: string
  /** Draws no visible label (the drop-down still has `label` as its name). */
  quiet?: boolean
  value: V
  choices: readonly (readonly [V, string])[]
  disabled?: boolean
  onChange: (value: V) => void
  testId?: string
}

/** A drop-down choice with its label before it. */
export function Choice<V extends string>({ label, quiet, value, choices, disabled, onChange, testId }: ChoiceProps<V>) {
  return (
    <label className="kui-choice">
      {quiet ? null : <span>{label}</span>}
      <select className="kui-field" value={value} disabled={disabled} aria-label={label} onChange={(event) => onChange(event.target.value as V)} data-testid={testId}>
        {choices.map(([choice, text]) => (
          <option key={choice} value={choice}>
            {text}
          </option>
        ))}
      </select>
    </label>
  )
}

/** A segment: an icon button named by `label`, or, without `icon`, a button showing `label`. */
export type Segment<V extends string> = { value: V; icon?: IconComponent; label: string }

export type SegmentedProps<V extends string> = {
  /** The group's accessible name (for example "Selection mode"). */
  label: string
  value: V
  segments: readonly Segment<V>[]
  disabled?: boolean
  onChange: (value: V) => void
  /** Each button's test id is `${testId}-${value}`. */
  testId?: string
}

/** Buttons of which one is pressed: icons (selection modes, alignment) or words (24h, 7d, 30d). */
export function Segmented<V extends string>({ label, value, segments, disabled, onChange, testId }: SegmentedProps<V>) {
  return (
    <span className="kui-segmented" role="group" aria-label={label}>
      {segments.map((segment) =>
        segment.icon ? (
          <IconButton key={segment.value} icon={segment.icon} label={segment.label} pressed={value === segment.value} disabled={disabled} onClick={() => onChange(segment.value)} data-testid={testId ? `${testId}-${segment.value}` : undefined} />
        ) : (
          <button key={segment.value} type="button" className="kui-segment-text" aria-pressed={value === segment.value} disabled={disabled} onClick={() => onChange(segment.value)} data-testid={testId ? `${testId}-${segment.value}` : undefined}>
            {segment.label}
          </button>
        ),
      )}
    </span>
  )
}

/** A hairline between groups of controls in a row. */
export function BarSeparator() {
  return <span className="kui-bar-separator" aria-hidden="true" />
}

/** A muted usage hint in a row. */
export function Hint({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <span className="kui-hint" data-testid={testId}>
      {children}
    </span>
  )
}
