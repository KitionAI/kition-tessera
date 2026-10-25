/**
 * A monitor's row of transport buttons (upstream Film `panels/monitor.rs` `transport`): icon
 * buttons in 30 px slots, centred in the row, each with its tooltip, the play button drawn a
 * size larger, and a toggle that is on drawn in the accent colour. Styled only through the Kit UI
 * protocol's theme tokens (styles.css).
 */
import type { ReactElement } from 'react'
import type { IconComponent } from './icon'
import { useElements, useStrings } from './context'
import { ICON_STROKE } from './ui'

export type TransportButton = {
  /** The button's name in the row (its command), unique within the row. */
  id: string
  /** The tooltip and accessible name ("Mark In (I)"). */
  label: string
  icon: IconComponent
  /** A toggle's state; leave it out for a plain button. */
  pressed?: boolean
  disabled?: boolean
  /** Upstream's larger icon, for the play button. */
  large?: boolean
  /** A Kit UI id when the button is a declared element; a hidden one is not drawn. */
  uiId?: string
  onPress: () => void
}

/** The row's accessible name: the editor's strings when there is an editor, en-US otherwise. */
function useBarLabel(): string {
  return useStrings()('transportControls')
}

/**
 * The buttons in `buttons`' order, centred. A button's `testId` is `<testId>-<id>`; one whose
 * Kit UI id the configuration hides is left out, and one it disables is disabled.
 */
export function TransportBar({ buttons, testId }: { buttons: readonly TransportButton[]; testId?: string }): ReactElement {
  const ui = useElements()
  const label = useBarLabel()
  return (
    <div className="kui-transport" role="toolbar" aria-label={label} data-testid={testId}>
      {buttons.map((button) => {
        const state = button.uiId ? ui.state(button.uiId) : null
        if (button.uiId) ui.drawn(button.uiId)
        if (state?.hidden) return null
        const Icon = button.icon
        return (
          <button
            key={button.id}
            type="button"
            className="kui-transport-button"
            aria-label={button.label}
            title={button.label}
            aria-pressed={button.pressed}
            disabled={button.disabled || state?.disabled}
            data-large={button.large || undefined}
            data-kit-ui-id={button.uiId}
            data-testid={testId ? `${testId}-${button.id}` : undefined}
            onClick={button.onPress}
          >
            <Icon size={button.large ? 16 : 14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
