// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { kitStoreKey, readKitStore, useKitStore, writeKitStore, type KitStoreOptions, type KitStoreWrite } from './kitStore'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Colors = { fg: string }
const validColors = (raw: unknown): Colors | undefined => (raw && typeof raw === 'object' && typeof (raw as Colors).fg === 'string' ? { fg: (raw as Colors).fg } : undefined)

let host: HTMLDivElement
let root: Root | null = null
beforeEach(() => localStorage.clear())
afterEach(() => {
  if (root) act(() => root!.unmount())
  root = null
  host?.remove()
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

/** Mounts a component using the store; the returned object always holds its latest value and setter. */
function mount(kit: string, name: string, options: KitStoreOptions<Colors>) {
  const seen: { value: Colors | null; set: ((next: Colors) => KitStoreWrite) | null } = { value: null, set: null }
  function Probe() {
    const [value, set] = useKitStore(kit, name, options)
    seen.value = value
    seen.set = set
    return null
  }
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() => root!.render(<Probe />))
  return seen
}

describe('kit store', () => {
  it("names a kit's value apart from every other kit's", () => {
    expect(kitStoreKey('kit.photo', 'colors')).toBe('kit:kit.photo:colors')
    writeKitStore('kit.photo', 'colors', { fg: '#ff0000' })
    writeKitStore('kit.vector', 'colors', { fg: '#00ff00' })
    expect(readKitStore('kit.photo', 'colors', validColors)).toEqual({ fg: '#ff0000' })
    expect(readKitStore('kit.vector', 'colors', validColors)).toEqual({ fg: '#00ff00' })
  })

  it('reads corrupt JSON, a value of another shape, or nothing as nothing', () => {
    localStorage.setItem('kit:k:colors', '{oops')
    expect(readKitStore('k', 'colors', validColors)).toBeUndefined()
    localStorage.setItem('kit:k:colors', '[1, 2]')
    expect(readKitStore('k', 'colors', validColors)).toBeUndefined()
    expect(readKitStore('k', 'missing', validColors)).toBeUndefined()
  })

  it('refuses a value over its cap, and reports a storage that refuses it', () => {
    expect(writeKitStore('k', 'big', 'x'.repeat(100), 50)).toBe('tooLarge')
    expect(localStorage.getItem('kit:k:big')).toBeNull()
    // The cap counts UTF-8 bytes: 20 three-byte characters are 62 bytes of JSON.
    expect(writeKitStore('k', 'wide', '中'.repeat(20), 61)).toBe('tooLarge')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(writeKitStore('k', 'colors', { fg: '#000000' })).toBe('unavailable')
  })

  it('starts from the stored value, or the initial one, and writes every set through', () => {
    writeKitStore('k', 'colors', { fg: '#123456' })
    const stored = mount('k', 'colors', { initial: { fg: '#000000' }, validate: validColors })
    expect(stored.value).toEqual({ fg: '#123456' })
    let answer: KitStoreWrite = 'unavailable'
    act(() => {
      answer = stored.set!({ fg: '#abcdef' })
    })
    expect(answer).toBe('stored')
    expect(stored.value).toEqual({ fg: '#abcdef' })
    expect(JSON.parse(localStorage.getItem('kit:k:colors')!)).toEqual({ fg: '#abcdef' })
  })

  it('keeps a value over its cap for this page only, and says so', () => {
    const store = mount('k', 'colors', { initial: { fg: '' }, validate: validColors, maxBytes: 20 })
    let answer: KitStoreWrite = 'stored'
    act(() => {
      answer = store.set!({ fg: 'x'.repeat(40) })
    })
    expect(answer).toBe('tooLarge')
    expect(store.value?.fg).toHaveLength(40)
    expect(localStorage.getItem('kit:k:colors')).toBeNull()
  })

  it('writes a delayed value once it rests, and at once when the page goes away', () => {
    vi.useFakeTimers()
    const store = mount('k', 'colors', { initial: { fg: '' }, validate: validColors, delayMs: 400 })
    act(() => {
      store.set!({ fg: '#111111' })
      store.set!({ fg: '#222222' })
    })
    expect(localStorage.getItem('kit:k:colors')).toBeNull()
    act(() => vi.advanceTimersByTime(400))
    expect(JSON.parse(localStorage.getItem('kit:k:colors')!)).toEqual({ fg: '#222222' })
    act(() => {
      store.set!({ fg: '#333333' })
    })
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    expect(JSON.parse(localStorage.getItem('kit:k:colors')!)).toEqual({ fg: '#333333' })
  })

  it("follows another tab's write, valid values only, and tells the caller", () => {
    const onExternal = vi.fn()
    const store = mount('k', 'colors', { initial: { fg: '#000000' }, validate: validColors, onExternal })
    const storage = (key: string, newValue: string | null) =>
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
      })
    storage('kit:k:colors', JSON.stringify({ fg: '#00ff00' }))
    expect(store.value).toEqual({ fg: '#00ff00' })
    expect(onExternal).toHaveBeenCalledWith({ fg: '#00ff00' })
    storage('kit:other:colors', JSON.stringify({ fg: '#ff0000' }))
    storage('kit:k:colors', '{oops')
    storage('kit:k:colors', JSON.stringify({ nope: 1 }))
    storage('kit:k:colors', null)
    expect(store.value).toEqual({ fg: '#00ff00' })
    expect(onExternal).toHaveBeenCalledTimes(1)
    // The page's own writes are not another tab's.
    act(() => {
      store.set!({ fg: '#0000ff' })
    })
    expect(onExternal).toHaveBeenCalledTimes(1)
  })

  it('reads the new value when the name changes, and never writes the old one under it', () => {
    writeKitStore('k', 'one', { fg: '#111111' })
    writeKitStore('k', 'two', { fg: '#222222' })
    const seen: { value: Colors | null; set: ((next: Colors) => KitStoreWrite) | null } = { value: null, set: null }
    function Probe({ name }: { name: string }) {
      const [value, set] = useKitStore('k', name, { initial: { fg: '' }, validate: validColors })
      seen.value = value
      seen.set = set
      return null
    }
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
    act(() => root!.render(<Probe name="one" />))
    expect(seen.value).toEqual({ fg: '#111111' })
    act(() => root!.render(<Probe name="two" />))
    expect(seen.value).toEqual({ fg: '#222222' })
    act(() => root!.render(<Probe name="three" />))
    expect(seen.value).toEqual({ fg: '' })
    act(() => {
      seen.set!({ fg: '#333333' })
    })
    expect(JSON.parse(localStorage.getItem('kit:k:three')!)).toEqual({ fg: '#333333' })
    expect(JSON.parse(localStorage.getItem('kit:k:two')!)).toEqual({ fg: '#222222' })
  })
})
