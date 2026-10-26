// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster, toast } from './ui'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => root.render(<Toaster />))
})
afterEach(() => {
  // Let every notice of this test expire, so the next one starts with none.
  act(() => vi.advanceTimersByTime(60_000))
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

const shown = () => [...container.querySelectorAll('.kui-toast')].map((item) => item.textContent)

describe('toast', () => {
  it('refreshes an identical notice that is still showing instead of stacking another', () => {
    act(() => toast('error', 'The command failed', 'not a pixel layer'))
    act(() => vi.advanceTimersByTime(5000))
    act(() => toast('error', 'The command failed', 'not a pixel layer'))
    act(() => toast('error', 'The command failed', 'not a pixel layer'))
    expect(shown()).toEqual(['The command failednot a pixel layer'])
    // The repeat restarted its count: it is still showing six seconds after the first one.
    act(() => vi.advanceTimersByTime(5000))
    expect(shown()).toHaveLength(1)
    act(() => vi.advanceTimersByTime(1000))
    expect(shown()).toEqual([])
  })

  it('stacks notices that differ, and shows one again once it has gone', () => {
    act(() => toast('error', 'The command failed', 'not a pixel layer'))
    act(() => toast('error', 'The command failed', 'the layer is locked'))
    act(() => toast('info', 'The command failed', 'not a pixel layer'))
    expect(shown()).toHaveLength(3)
    act(() => vi.advanceTimersByTime(6000))
    expect(shown()).toEqual([])
    act(() => toast('error', 'The command failed', 'not a pixel layer'))
    expect(shown()).toHaveLength(1)
  })
})
