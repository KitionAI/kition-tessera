// @vitest-environment jsdom
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MapPinIcon as MapPin, PlayIcon as Play, StepBackIcon as StepBack, StepForwardIcon as StepForward } from '@kition/tessera-icons/react'
import { TransportBar, type TransportButton } from './TransportBar'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLDivElement
let roots: Root[] = []
afterEach(() => {
  for (const root of roots) act(() => root.unmount())
  roots = []
  host?.remove()
})

function render(node: ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  act(() => root.render(node))
  return root
}

describe('TransportBar', () => {
  it('renders its buttons in order with their ids and labels, and presses run onPress', () => {
    const onPress = vi.fn()
    const buttons: TransportButton[] = [
      { id: 'markers.add', label: 'Add Marker (M)', icon: MapPin, uiId: 'control:transport.addMarker', onPress: () => onPress('markers.add') },
      { id: 'playhead.stepBack', label: 'Step Back 1 Frame (Left)', icon: StepBack, uiId: 'control:transport.stepBack', onPress: () => onPress('playhead.stepBack') },
      { id: 'playback.toggle', label: 'Play-Stop Toggle (Space)', icon: Play, large: true, pressed: false, uiId: 'control:transport.toggle', onPress: () => onPress('playback.toggle') },
      { id: 'playhead.stepForward', label: 'Step Forward 1 Frame (Right)', icon: StepForward, disabled: true, onPress: () => onPress('playhead.stepForward') },
    ]
    render(<TransportBar buttons={buttons} testId="tb" />)
    const bar = host.querySelector('[data-testid="tb"]') as HTMLElement
    expect(bar.getAttribute('role')).toBe('toolbar')
    const shown = [...bar.querySelectorAll('button')]
    expect(shown.map((button) => button.getAttribute('data-testid'))).toEqual(['tb-markers.add', 'tb-playhead.stepBack', 'tb-playback.toggle', 'tb-playhead.stepForward'])
    expect(shown.map((button) => button.getAttribute('aria-label'))).toEqual(buttons.map((button) => button.label))
    expect(shown.map((button) => button.title)).toEqual(buttons.map((button) => button.label))
    expect(shown[0].getAttribute('data-kit-ui-id')).toBe('control:transport.addMarker')
    expect(shown[3].hasAttribute('data-kit-ui-id')).toBe(false)
    expect(shown[2].getAttribute('aria-pressed')).toBe('false')
    expect(shown[0].hasAttribute('aria-pressed')).toBe(false)
    expect(shown[2].getAttribute('data-large')).toBe('true')
    act(() => shown[2].click())
    act(() => shown[0].click())
    act(() => shown[3].click())
    expect(onPress.mock.calls).toEqual([['playback.toggle'], ['markers.add']])
  })

  it('shows a pressed button as pressed', () => {
    render(<TransportBar buttons={[{ id: 'loop', label: 'Loop', icon: Play, pressed: true, onPress: () => {} }]} testId="tb" />)
    expect(host.querySelector('button')!.getAttribute('aria-pressed')).toBe('true')
  })
})
