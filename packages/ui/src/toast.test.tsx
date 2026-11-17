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
  // Sticky and loading notices stay until dismissed.
  act(() => toast.dismiss())
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

describe('toast options', () => {
  it('replaces a notice by id, and keeps a loading notice until its result replaces it', async () => {
    let id: string | number = ''
    act(() => {
      id = toast.loading('Uploading')
    })
    expect(container.querySelector('.kui-toast[data-level="loading"] .kui-spinner')).not.toBeNull()
    act(() => vi.advanceTimersByTime(30_000))
    expect(shown()).toEqual(['Uploading'])
    act(() => toast.success('Uploaded', { id, description: '3 files' }))
    expect(shown()).toEqual(['Uploaded3 files'])
    expect(container.querySelector('.kui-toast')?.getAttribute('data-level')).toBe('success')
  })

  it('follows a promise from loading to its result', async () => {
    let finish: (value: number) => void = () => undefined
    const work = new Promise<number>((resolve) => (finish = resolve))
    act(() => {
      void toast.promise(work, { loading: 'Saving', success: (count) => `Saved ${count}`, error: 'Failed' })
    })
    expect(shown()).toEqual(['Saving'])
    await act(async () => {
      finish(2)
      await work
    })
    expect(shown()).toEqual(['Saved 2'])
  })

  it('runs an action and closes, closes from its button, keeps a sticky notice, and dismisses', () => {
    const undo = vi.fn()
    act(() => toast.info('Deleted', { action: { label: 'Undo', onClick: undo } }))
    act(() => (container.querySelector('.kui-toast-action') as HTMLButtonElement).click())
    expect(undo).toHaveBeenCalledOnce()
    expect(shown()).toEqual([])
    act(() => toast.error('Offline', { id: 'net', duration: Number.POSITIVE_INFINITY }))
    act(() => vi.advanceTimersByTime(60_000))
    expect(shown()).toEqual(['Offline'])
    act(() => toast.warning('Low space'))
    act(() => (container.querySelectorAll('.kui-toast-close')[1] as HTMLButtonElement).click())
    expect(shown()).toEqual(['Offline'])
    act(() => toast.dismiss('net'))
    expect(shown()).toEqual([])
  })

  it('sits offset from the top', () => {
    act(() => root.render(<Toaster offset={52} />))
    expect((container.querySelector('.kui-toasts') as HTMLElement).style.top).toBe('52px')
  })
})
