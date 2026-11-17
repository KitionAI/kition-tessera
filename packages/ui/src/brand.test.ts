import { describe, expect, it, vi } from 'vitest'
import { brandTokens, contrast, textOn, validBrand } from './brand'

describe('brand colors', () => {
  it('measures WCAG contrast', () => {
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 5)
    expect(contrast('#2b5fd9', '#ffffff')).toBeCloseTo(5.61, 1)
  })

  it('puts white text on a light-scheme brand and black on a dark-scheme one', () => {
    expect(textOn('#2b5fd9')).toBe('#ffffff')
    expect(textOn('#6b9bff')).toBe('#000000')
  })

  it('makes the primary tokens for a scheme', () => {
    const brand = { light: '#2b5fd9', dark: '#6b9bff' }
    expect(brandTokens(brand, 'light')).toEqual({ '--kit-primary': '#2b5fd9', '--kit-primary-text': '#ffffff', '--kit-primary-soft': 'rgba(43, 95, 217, 0.1)' })
    expect(brandTokens(brand, 'dark')).toEqual({ '--kit-primary': '#6b9bff', '--kit-primary-text': '#000000', '--kit-primary-soft': 'rgba(107, 155, 255, 0.2)' })
  })

  it('validates a brand before it becomes a color', () => {
    const brand = { light: '#2b5fd9', dark: '#6b9bff' }
    expect(validBrand(brand)).toEqual(brand)
    expect(validBrand(undefined)).toBeNull()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(validBrand({ light: '#fff', dark: '#6b9bff' })).toBeNull()
    expect(validBrand({ light: '#gggggg', dark: '#6b9bff' })).toBeNull()
    expect(validBrand('blue')).toBeNull()
    expect(warn).toHaveBeenCalledTimes(3)
    warn.mockRestore()
  })
})
