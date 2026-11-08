import { beforeEach, describe, expect, it } from 'vitest'
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

  it('keeps the model that wrote the draft beside it, and persists both', () => {
    const { lastResponseModel, setLastResponse } = useCreaClipboard()
    setLastResponse('a draft', 'claude-test')
    expect(lastResponseModel.value).toBe('claude-test')
    expect(localStorage.getItem('crea.lastResponseModel')).toBe('claude-test')
    // A draft stored without a model names none.
    setLastResponse('typed by hand')
    expect(lastResponseModel.value).toBe('')
  })

  it('shares one value across all callers', () => {
    const a = useCreaClipboard()
    const b = useCreaClipboard()
    a.setLastResponse('shared')
    expect(b.lastResponse.value).toBe('shared')
  })
})
