// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { Scrollbar } from './Scrollbar'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

it('keeps viewport navigation within bounds and keeps keys out of the editor', () => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  const onChange = vi.fn()
  const editorKey = vi.fn()
  document.addEventListener('keydown', editorKey)
  const render = (value: number, max = 1200) => act(() => root.render(<Scrollbar label="Document scroll" value={value} max={max} page={400} onChange={onChange} />))
  try {
    render(200)
    const scrollbar = host.querySelector('[role="scrollbar"]') as HTMLElement
    const key = (name: string) => act(() => scrollbar.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true })))
    key('PageDown')
    expect(onChange).toHaveBeenLastCalledWith(600)
    key('Home')
    expect(onChange).toHaveBeenLastCalledWith(0)
    key('End')
    expect(onChange).toHaveBeenLastCalledWith(1200)
    render(1195)
    key('ArrowDown')
    expect(onChange).toHaveBeenLastCalledWith(1200)
    render(5)
    key('PageUp')
    expect(onChange).toHaveBeenLastCalledWith(0)
    expect(editorKey).not.toHaveBeenCalled()
    expect(scrollbar.getAttribute('aria-valuenow')).toBe('5')
    render(0, 0)
    expect(scrollbar.getAttribute('aria-disabled')).toBe('true')
    expect(scrollbar.tabIndex).toBe(-1)
  } finally {
    act(() => root.unmount())
    document.removeEventListener('keydown', editorKey)
    host.remove()
    vi.unstubAllGlobals()
  }
})
