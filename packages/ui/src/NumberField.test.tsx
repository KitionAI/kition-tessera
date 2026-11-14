// @vitest-environment jsdom
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NumberField } from './NumberField'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom has no PointerEvent (https://github.com/jsdom/jsdom/issues/2527); a MouseEvent with the
// right type and a pointerId reaches React's pointer handlers just the same.
if (typeof PointerEvent === 'undefined') {
  class FakePointerEvent extends MouseEvent {
    pointerId: number
    constructor(type: string, params: MouseEventInit & { pointerId?: number } = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
    }
  }
  globalThis.PointerEvent = FakePointerEvent as unknown as typeof PointerEvent
}

// A controlled input's own setter records the value a React change event is diffed against;
// going through it directly makes React think nothing changed. The native setter bypasses that.
const nativeInputValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!

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

const input = () => host.querySelector('input') as HTMLInputElement
const label = () => host.querySelector('[data-testid="k-field-label"]') as HTMLElement

function type(text: string) {
  act(() => {
    const field = input()
    nativeInputValue.call(field, text)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function key(key: string, options: Partial<KeyboardEventInit> = {}) {
  act(() => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options }))
  })
}

function blur() {
  act(() => {
    input().focus()
    input().blur()
  })
}

function pointer(type: 'pointerdown' | 'pointermove' | 'pointerup', clientX: number, modifiers: Partial<PointerEventInit> = {}) {
  act(() => {
    label().dispatchEvent(new PointerEvent(type, { clientX, pointerId: 1, bubbles: true, ...modifiers }))
  })
}

describe('NumberField', () => {
  it('commits a typed number on Enter', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} testId="k-field" />)
    type('42')
    key('Enter')
    expect(onChange).toHaveBeenCalledWith(42, true)
    expect(input().value).toBe('42')
  })

  it('clamps a typed number to max on Enter', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} testId="k-field" />)
    type('999')
    key('Enter')
    expect(onChange).toHaveBeenCalledWith(100, true)
    expect(input().value).toBe('100')
  })

  it('keeps a rounded value inside bounds even when they do not align to the step', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={5} min={0} max={10.06} step={0.1} onChange={onChange} testId="k-field" />)
    type('999')
    key('Enter')
    expect(onChange).toHaveBeenCalledWith(10, true)
    expect(input().value).toBe('10.0')
  })

  it('reverts on Escape without committing', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} testId="k-field" />)
    type('77')
    key('Escape')
    expect(onChange).not.toHaveBeenCalled()
    expect(input().value).toBe('10')
  })

  it('Escape with typed changes reverts them and keeps the Escape (a dialog stays open)', () => {
    render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={() => undefined} testId="k-field" />)
    type('77')
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    act(() => {
      input().dispatchEvent(escape)
    })
    expect(escape.defaultPrevented).toBe(true)
    expect(input().value).toBe('10')
  })

  it('Escape with nothing typed is the page\'s (a dialog closes)', () => {
    render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={() => undefined} testId="k-field" />)
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    act(() => {
      input().dispatchEvent(escape)
    })
    expect(escape.defaultPrevented).toBe(false)
    // Typed back to the value it shows: nothing to revert, so the page gets it too.
    type('10')
    const again = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    act(() => {
      input().dispatchEvent(again)
    })
    expect(again.defaultPrevented).toBe(false)
  })

  it('ArrowUp adds one step', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={100} step={5} onChange={onChange} testId="k-field" />)
    key('ArrowUp')
    expect(onChange).toHaveBeenCalledWith(15, true)
    expect(input().value).toBe('15')
  })

  it('rounds a committed value to the step precision, so float drift never reaches the caller', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={0.2} min={0} max={1} step={0.1} onChange={onChange} testId="k-field" />)
    key('ArrowUp')
    expect(onChange).toHaveBeenCalledWith(0.3, true)
    expect(input().value).toBe('0.3')
  })

  it('does not commit on Enter or blur when the clamped value equals the current one', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} testId="k-field" />)
    type('10')
    key('Enter')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('accepts a comma decimal', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={100} step={0.1} onChange={onChange} testId="k-field" />)
    type('12,5')
    key('Enter')
    expect(onChange).toHaveBeenCalledWith(12.5, true)
    expect(input().value).toBe('12.5')
  })

  it('commits a typed number on blur', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} testId="k-field" />)
    type('55')
    blur()
    expect(onChange).toHaveBeenCalledWith(55, true)
    expect(input().value).toBe('55')
  })

  it('reverts garbage text instead of committing it', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} testId="k-field" />)
    type('abc')
    key('Enter')
    expect(onChange).not.toHaveBeenCalled()
    expect(input().value).toBe('10')
  })

  it('scrubs the label by one step per 2 px, then commits on release', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} testId="k-field" />)
    pointer('pointerdown', 0)
    pointer('pointermove', 20)
    expect(onChange).toHaveBeenCalledWith(20, false)
    pointer('pointerup', 20)
    expect(onChange).toHaveBeenLastCalledWith(20, true)
  })

  it('a click on the label with no movement calls nothing', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} testId="k-field" />)
    pointer('pointerdown', 0)
    pointer('pointerup', 0)
    expect(onChange).not.toHaveBeenCalled()
    expect(input().value).toBe('10')
  })

  it('scrubs ten times faster while Shift is held', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={1000} step={1} onChange={onChange} testId="k-field" />)
    pointer('pointerdown', 0)
    pointer('pointermove', 20, { shiftKey: true })
    expect(onChange).toHaveBeenCalledWith(110, false)
  })

  it('scrubs ten times finer while Alt is held', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={1000} step={1} onChange={onChange} testId="k-field" />)
    pointer('pointerdown', 0)
    pointer('pointermove', 20, { altKey: true })
    expect(onChange).toHaveBeenCalledWith(11, false)
  })

  it('keeps the scrubbed text while a drag is in progress, even if the value prop changes underneath it', () => {
    const onChange = vi.fn()
    const root = render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} testId="k-field" />)
    pointer('pointerdown', 0)
    pointer('pointermove', 20)
    expect(input().value).toBe('20')
    act(() => root.render(<NumberField label="Size" value={50} min={0} max={100} step={1} onChange={onChange} testId="k-field" />))
    expect(input().value).toBe('20')
    pointer('pointerup', 20)
    expect(input().value).toBe('20')
    act(() => root.render(<NumberField label="Size" value={65} min={0} max={100} step={1} onChange={onChange} testId="k-field" />))
    expect(input().value).toBe('65')
  })

  it('ends a drag cleanly when disabled turns true mid-gesture, sending the last scrubbed value once', () => {
    const onChange = vi.fn()
    const root = render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} testId="k-field" />)
    pointer('pointerdown', 0)
    pointer('pointermove', 20)
    onChange.mockClear()
    act(() => root.render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} disabled testId="k-field" />))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(20, true)
  })

  it('ends a drag cleanly when disabled turns true before any move, sending nothing', () => {
    const onChange = vi.fn()
    const root = render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} testId="k-field" />)
    pointer('pointerdown', 0)
    act(() => root.render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} disabled testId="k-field" />))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('disabled ignores typing, keys, and dragging', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={10} min={0} max={100} step={1} onChange={onChange} disabled testId="k-field" />)
    type('42')
    key('Enter')
    pointer('pointerdown', 0)
    pointer('pointermove', 20)
    pointer('pointerup', 20)
    expect(onChange).not.toHaveBeenCalled()
    expect(input().disabled).toBe(true)
  })

  it('carries spinbutton semantics with min, max, now, and a unit value text', () => {
    const onChange = vi.fn()
    render(<NumberField label="Size" value={42} min={0} max={100} step={1} unit="%" onChange={onChange} testId="k-field" />)
    const field = input()
    expect(field.getAttribute('role')).toBe('spinbutton')
    expect(field.getAttribute('aria-valuemin')).toBe('0')
    expect(field.getAttribute('aria-valuemax')).toBe('100')
    expect(field.getAttribute('aria-valuenow')).toBe('42')
    expect(field.getAttribute('aria-valuetext')).toBe('42 %')
    expect(field.getAttribute('aria-label')).toBe('Size')
  })

  it('takes its accessible name and tooltip from `name` when its label is a symbol', () => {
    render(<NumberField label="VA" name="Tracking" value={0} min={-1000} max={10000} onChange={vi.fn()} testId="k-field" />)
    expect(input().getAttribute('aria-label')).toBe('Tracking')
    expect((host.querySelector('[data-testid="k-field"]') as HTMLElement).title).toBe('Tracking')
    expect(label().textContent).toBe('VA')
  })

  it('has no tooltip of its own without `name`', () => {
    render(<NumberField label="Size" value={1} min={0} max={10} onChange={vi.fn()} testId="k-field" />)
    expect((host.querySelector('[data-testid="k-field"]') as HTMLElement).hasAttribute('title')).toBe(false)
  })
})

describe('NumberField with a track', () => {
  const track = () => host.querySelector('[data-testid="k-field-track"]') as HTMLElement
  const slide = (type: 'pointerdown' | 'pointermove' | 'pointerup', clientX: number) =>
    act(() => {
      track().dispatchEvent(new PointerEvent(type, { clientX, pointerId: 2, button: 0, bubbles: true }))
    })
  const at = (left: number, width: number) => vi.spyOn(track(), 'getBoundingClientRect').mockReturnValue({ left, width, right: left + width, top: 0, bottom: 14, height: 14, x: left, y: 0, toJSON: () => ({}) } as DOMRect)

  it('draws the label and field on one line and a slider under them, with one text input', () => {
    render(<NumberField label="Opacity" value={40} min={0} max={100} unit="%" onChange={vi.fn()} testId="k-field" track />)
    const row = host.querySelector('[data-testid="k-field"]') as HTMLElement
    expect(row.className).toBe('kui-slider-row')
    expect(row.querySelectorAll('input')).toHaveLength(1)
    expect(row.querySelector('.kui-slider-row-head .kui-slider-row-label')?.textContent).toBe('Opacity')
    expect(track().getAttribute('role')).toBe('slider')
    expect(track().getAttribute('aria-valuenow')).toBe('40')
    expect((track().querySelector('.kui-slider-knob') as HTMLElement).style.left).toBe('40%')
  })

  it('a drag along the track reports each value, then the last one as final', () => {
    const onChange = vi.fn()
    render(<NumberField label="Opacity" value={0} min={0} max={100} onChange={onChange} testId="k-field" track />)
    at(100, 200)
    slide('pointerdown', 150)
    slide('pointermove', 200)
    slide('pointermove', 400)
    slide('pointerup', 400)
    expect(onChange.mock.calls).toEqual([
      [25, false],
      [50, false],
      [100, false],
      [100, true],
    ])
    expect(input().value).toBe('100')
  })

  it('a press that lands on the current value reports nothing', () => {
    const onChange = vi.fn()
    render(<NumberField label="Hue" value={0} min={-180} max={180} onChange={onChange} testId="k-field" track />)
    at(0, 360)
    slide('pointerdown', 180)
    slide('pointerup', 180)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('arrow keys, Home, and End on the slider commit at once', () => {
    const onChange = vi.fn()
    render(<NumberField label="Fill" value={50} min={0} max={100} onChange={onChange} testId="k-field" track />)
    const press = (key: string, shiftKey = false) => act(() => track().dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })))
    press('ArrowRight')
    press('ArrowLeft', true)
    press('End')
    press('Home')
    expect(onChange.mock.calls).toEqual([
      [51, true],
      [40, true],
      [100, true],
      [0, true],
    ])
  })

  it('a disabled slider takes no gesture', () => {
    const onChange = vi.fn()
    render(<NumberField label="Fill" value={50} min={0} max={100} onChange={onChange} testId="k-field" track disabled />)
    at(0, 100)
    slide('pointerdown', 90)
    slide('pointerup', 90)
    expect(onChange).not.toHaveBeenCalled()
    expect(track().getAttribute('tabindex')).toBe('-1')
  })
})

describe('NumberField hot text', () => {
  const hot = () => host.querySelector('[data-testid="k-hot-value"]') as HTMLElement
  function press(type: 'pointerdown' | 'pointermove' | 'pointerup', clientX: number, modifiers: Partial<PointerEventInit> = {}) {
    act(() => {
      // The primary button is down from the press until the release.
      hot().dispatchEvent(new PointerEvent(type, { clientX, pointerId: 1, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, ...modifiers }))
    })
  }

  it('draws the value with its unit as text, with no input until clicked', () => {
    render(<NumberField hot label="Scale" value={100} min={0} max={1000} step={0.1} unit="%" onChange={() => {}} testId="k-hot" uiId="control:x.value" />)
    expect(hot().textContent).toBe('100.0%')
    expect(host.querySelector('input')).toBeNull()
    expect(host.querySelector('[data-kit-ui-id="control:x.value"]')).not.toBeNull()
  })

  it('a horizontal drag scrubs by speed per pixel, then reports the last value once more as final', () => {
    const onChange = vi.fn()
    render(<NumberField hot label="Scale" value={100} min={0} max={1000} step={0.1} speed={0.5} onChange={onChange} testId="k-hot" />)
    press('pointerdown', 10)
    press('pointermove', 30)
    press('pointermove', 50)
    press('pointerup', 50)
    expect(onChange.mock.calls).toEqual([
      [110, false],
      [120, false],
      [120, true],
    ])
    expect(host.querySelector('input')).toBeNull()
  })

  it('reports the final value even when the caller already shows it', () => {
    const onChange = vi.fn()
    const root = render(<NumberField hot label="Scale" value={100} min={0} max={1000} step={1} speed={1} onChange={onChange} testId="k-hot" />)
    press('pointerdown', 0)
    press('pointermove', 20)
    act(() => root.render(<NumberField hot label="Scale" value={120} min={0} max={1000} step={1} speed={1} onChange={onChange} testId="k-hot" />))
    press('pointerup', 20)
    expect(onChange.mock.calls.at(-1)).toEqual([120, true])
  })

  it('Shift scrubs ten times faster and is clamped to the range', () => {
    const onChange = vi.fn()
    render(<NumberField hot label="Opacity" value={90} min={0} max={100} step={1} speed={0.5} onChange={onChange} testId="k-hot" />)
    press('pointerdown', 0)
    press('pointermove', 4, { shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith(100, false)
  })

  it('a click opens a field to type into; Enter commits, clamped, and says the edit is done', () => {
    const onChange = vi.fn()
    const onDone = vi.fn()
    render(<NumberField hot label="Scale" value={100} min={0} max={1000} step={0.1} unit="%" onChange={onChange} onDone={onDone} testId="k-hot" />)
    press('pointerdown', 10)
    press('pointerup', 11)
    expect(input()).not.toBeNull()
    expect(input().value).toBe('100.0')
    expect(document.activeElement).toBe(input())
    type('50%')
    key('Enter')
    expect(onChange).toHaveBeenCalledWith(50, true)
    expect(host.querySelector('input')).toBeNull()
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('Escape leaves the typed field without a change; a blur commits', () => {
    const onChange = vi.fn()
    render(<NumberField hot label="Scale" value={100} min={0} max={1000} step={1} onChange={onChange} testId="k-hot" />)
    press('pointerdown', 10)
    press('pointerup', 10)
    type('7')
    key('Escape')
    expect(onChange).not.toHaveBeenCalled()
    press('pointerdown', 10)
    press('pointerup', 10)
    type('70')
    blur()
    expect(onChange).toHaveBeenCalledWith(70, true)
  })

  it('a drag brought back to where it began still ends with a final value', () => {
    const onChange = vi.fn()
    render(<NumberField hot label="Scale" value={100} min={0} max={1000} step={1} speed={1} onChange={onChange} testId="k-hot" />)
    press('pointerdown', 0)
    press('pointermove', 10)
    press('pointermove', 0)
    press('pointerup', 0)
    expect(onChange.mock.calls).toEqual([
      [110, false],
      [100, false],
      [100, true],
    ])
  })

  it("keeps its arrow keys from the editor's own shortcuts", () => {
    const onChange = vi.fn()
    const outer = vi.fn()
    render(
      <div onKeyDown={outer}>
        <NumberField hot label="Scale" value={100} min={0} max={1000} step={1} onChange={onChange} testId="k-hot" />
      </div>,
    )
    act(() => hot().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })))
    expect(onChange).toHaveBeenCalledWith(101, true)
    expect(outer).not.toHaveBeenCalled()
  })

  it('a cancelled drag still ends with its last value as final, and opens no field', () => {
    const onChange = vi.fn()
    render(<NumberField hot label="Scale" value={100} min={0} max={1000} step={1} speed={1} onChange={onChange} testId="k-hot" />)
    press('pointerdown', 0)
    press('pointermove', 10)
    act(() => {
      hot().dispatchEvent(new PointerEvent('pointercancel', { clientX: 10, pointerId: 1, bubbles: true }))
    })
    expect(onChange.mock.calls).toEqual([
      [110, false],
      [110, true],
    ])
    expect(host.querySelector('input')).toBeNull()
  })

  it('a drag whose pointer capture is lost ends with its last value as final', () => {
    const onChange = vi.fn()
    render(<NumberField hot label="Scale" value={100} min={0} max={1000} step={1} speed={1} onChange={onChange} testId="k-hot" />)
    press('pointerdown', 0)
    press('pointermove', 20)
    act(() => {
      hot().dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1, bubbles: true }))
    })
    press('pointermove', 40)
    expect(onChange.mock.calls).toEqual([
      [120, false],
      [120, true],
    ])
  })

  it('a move with the button already up (a release that never arrived) ends the drag with its last value as final', () => {
    const onChange = vi.fn()
    render(<NumberField hot label="Scale" value={100} min={0} max={1000} step={1} speed={1} onChange={onChange} testId="k-hot" />)
    press('pointerdown', 0)
    press('pointermove', 10)
    press('pointermove', 30, { buttons: 0 })
    press('pointermove', 50)
    expect(onChange.mock.calls).toEqual([
      [110, false],
      [110, true],
    ])
    expect(host.querySelector('input')).toBeNull()
  })

  it('a cancelled press that never moved changes nothing', () => {
    const onChange = vi.fn()
    render(<NumberField hot label="Scale" value={100} min={0} max={1000} step={1} onChange={onChange} testId="k-hot" />)
    press('pointerdown', 0)
    act(() => {
      hot().dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true }))
    })
    expect(onChange).not.toHaveBeenCalled()
    expect(host.querySelector('input')).toBeNull()
  })

  it('Enter while an input method composes does not commit', () => {
    const onChange = vi.fn()
    render(<NumberField hot label="Scale" value={100} min={0} max={1000} step={1} onChange={onChange} testId="k-hot" />)
    press('pointerdown', 10)
    press('pointerup', 10)
    type('70')
    key('Enter', { isComposing: true })
    expect(onChange).not.toHaveBeenCalled()
    expect(input()).not.toBeNull()
    key('Enter')
    expect(onChange).toHaveBeenCalledWith(70, true)
  })

  it('a disabled hot number neither scrubs nor opens a field', () => {
    const onChange = vi.fn()
    render(<NumberField hot disabled label="Scale" value={100} min={0} max={1000} step={1} onChange={onChange} testId="k-hot" />)
    press('pointerdown', 0)
    press('pointermove', 30)
    press('pointerup', 30)
    expect(onChange).not.toHaveBeenCalled()
    expect(host.querySelector('input')).toBeNull()
  })
})

describe('NumberField hot text: a scrub cut short ends with its final value once', () => {
  const hot = () => host.querySelector('[data-testid="k-hot-value"]') as HTMLElement
  function press(type: string, clientX: number) {
    act(() => {
      hot().dispatchEvent(new PointerEvent(type, { clientX, pointerId: 1, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true }))
    })
  }
  const field = (onChange: (value: number, final: boolean) => void, disabled = false) => (
    <NumberField hot label="Scale" value={100} min={0} max={1000} step={1} speed={1} onChange={onChange} disabled={disabled} testId="k-hot" />
  )

  it('takes Escape mid-scrub before outer handlers, as the end of the scrub', () => {
    const onChange = vi.fn()
    const outer = vi.fn()
    window.addEventListener('keydown', outer)
    document.addEventListener('keydown', outer, true)
    try {
      render(field(onChange))
      press('pointerdown', 0)
      press('pointermove', 10)
      press('pointermove', 20)
      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      act(() => {
        hot().dispatchEvent(escape)
      })
      expect(escape.defaultPrevented).toBe(true)
      expect(outer).not.toHaveBeenCalled()
      press('pointermove', 40)
      press('pointerup', 40)
      expect(onChange.mock.calls).toEqual([
        [110, false],
        [120, false],
        [120, true],
      ])
      // Without a scrub, Escape is the page's again.
      act(() => {
        hot().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
      })
      expect(outer).toHaveBeenCalled()
    } finally {
      window.removeEventListener('keydown', outer)
      document.removeEventListener('keydown', outer, true)
    }
  })

  it('ends the scrub with its last value when the field unmounts', () => {
    const onChange = vi.fn()
    const root = render(field(onChange))
    press('pointerdown', 0)
    press('pointermove', 15)
    act(() => root.render(<span />))
    expect(onChange.mock.calls).toEqual([
      [115, false],
      [115, true],
    ])
  })

  it('ends the scrub with its last value when the field turns disabled', () => {
    const onChange = vi.fn()
    const root = render(field(onChange))
    press('pointerdown', 0)
    press('pointermove', 15)
    act(() => root.render(field(onChange, true)))
    // At once, without waiting for a release that may never come.
    expect(onChange.mock.calls).toEqual([
      [115, false],
      [115, true],
    ])
    press('pointermove', 30)
    press('pointerup', 30)
    expect(onChange.mock.calls).toEqual([
      [115, false],
      [115, true],
    ])
  })
})
