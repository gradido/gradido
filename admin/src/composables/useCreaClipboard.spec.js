import { describe, it, expect, beforeEach } from 'vitest'
import { useCreaClipboard } from './useCreaClipboard'

describe('useCreaClipboard', () => {
  beforeEach(() => {
    localStorage.clear()
    useCreaClipboard().setLastResponse('')
  })

  it('stores and exposes the last response reactively', () => {
    const { lastResponse, setLastResponse } = useCreaClipboard()
    expect(lastResponse.value).toBe('')
    setLastResponse('Liebe Maria, danke dir!')
    expect(lastResponse.value).toBe('Liebe Maria, danke dir!')
  })

  it('persists the value to localStorage', () => {
    useCreaClipboard().setLastResponse('a draft')
    expect(localStorage.getItem('crea.lastResponse')).toBe('a draft')
  })

  it('shares one value across all callers', () => {
    const a = useCreaClipboard()
    const b = useCreaClipboard()
    a.setLastResponse('shared')
    expect(b.lastResponse.value).toBe('shared')
  })
})
