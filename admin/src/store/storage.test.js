import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { clearStoragePreservingPreferences, PREFERENCE_KEY_PREFIX } from './storage'

// Minimal in-memory localStorage with the length/key iteration the helper uses.
function createLocalStorageMock(initial = {}) {
  let store = { ...initial }
  return {
    get length() {
      return Object.keys(store).length
    },
    key(i) {
      return Object.keys(store)[i] ?? null
    },
    getItem(k) {
      return k in store ? store[k] : null
    },
    setItem(k, v) {
      store[k] = String(v)
    },
    removeItem(k) {
      delete store[k]
    },
    clear() {
      store = {}
    },
  }
}

describe('clearStoragePreservingPreferences', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'localStorage',
      createLocalStorageMock({
        'gradido-theme-mode': 'dark',
        [`${PREFERENCE_KEY_PREFIX}someFutureSetting`]: 'on',
        'gradido-admin': '{"token":"secret"}',
        someAuthKey: 'x',
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the dark-mode theme key', () => {
    clearStoragePreservingPreferences()
    expect(localStorage.getItem('gradido-theme-mode')).toBe('dark')
  })

  it('keeps any key using the preference prefix', () => {
    clearStoragePreservingPreferences()
    expect(localStorage.getItem(`${PREFERENCE_KEY_PREFIX}someFutureSetting`)).toBe('on')
  })

  it('wipes session and auth keys', () => {
    clearStoragePreservingPreferences()
    expect(localStorage.getItem('gradido-admin')).toBeNull()
    expect(localStorage.getItem('someAuthKey')).toBeNull()
  })

  it('does not resurrect a preference that was not stored', () => {
    localStorage.removeItem('gradido-theme-mode')
    clearStoragePreservingPreferences()
    expect(localStorage.getItem('gradido-theme-mode')).toBeNull()
  })
})
