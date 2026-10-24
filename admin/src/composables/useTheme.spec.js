// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { THEME_MODE_STORAGE_KEY, themeMode, useTheme, writeThemeMode } from './useTheme'

const SYSTEM_DARK = '(prefers-color-scheme: dark)'

/**
 * A system preference to switch: `matchMedia` answers the dark query with one list, which the
 * test can flip and which tells its listeners, as a browser does. Any other query gets a list
 * that never matches -- a wrong query in the composable would show as a system that is never
 * dark. `legacy`: the engine of Safari before 14, which knows only `addListener`.
 */
const systemPreference = ({ dark = false, legacy = false } = {}) => {
  const listeners = new Set()
  const media = { matches: dark }
  if (legacy) {
    media.addListener = vi.fn((listener) => listeners.add(listener))
    media.removeListener = vi.fn((listener) => listeners.delete(listener))
  } else {
    media.addEventListener = vi.fn((type, listener) => type === 'change' && listeners.add(listener))
    media.removeEventListener = vi.fn(
      (type, listener) => type === 'change' && listeners.delete(listener),
    )
  }
  window.matchMedia = vi.fn((query) => (query === SYSTEM_DARK ? media : { matches: false }))
  return {
    media,
    listeners,
    switchTo(next) {
      media.matches = next
      for (const listener of [...listeners]) {
        listener({ matches: next })
      }
    },
  }
}

/** What another tab does: write the key (which this tab sees without an event), then tell. */
const anotherTab = {
  writes(value) {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, value)
  },
  tells(key) {
    window.dispatchEvent(new StorageEvent('storage', { key }))
  },
}

const markedDark = () => document.documentElement.getAttribute('data-bs-theme') === 'dark'

const ThemedApp = defineComponent({
  setup() {
    useTheme()
    return () => null
  },
})

describe('useTheme', () => {
  let wrapper

  const startApp = () => {
    wrapper = mount(ThemedApp)
    return wrapper
  }

  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-bs-theme')
    // The mark of the menu lives in the module, beyond each test.
    themeMode.value = 'system'
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-bs-theme')
    delete window.matchMedia
    vi.restoreAllMocks()
  })

  it("marks the document dark for 'dark'", () => {
    systemPreference({ dark: false })
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, 'dark')
    startApp()
    expect(markedDark()).toBe(true)
  })

  it("follows prefers-color-scheme for 'system' and for a missing key", () => {
    systemPreference({ dark: true })
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, 'system')
    startApp()
    expect(markedDark()).toBe(true)
    wrapper.unmount()
    wrapper = undefined

    document.documentElement.removeAttribute('data-bs-theme')
    window.localStorage.removeItem(THEME_MODE_STORAGE_KEY)
    startApp()
    expect(markedDark()).toBe(true)
    wrapper.unmount()
    wrapper = undefined

    // ... and a light system leaves the document light.
    systemPreference({ dark: false })
    startApp()
    expect(markedDark()).toBe(false)
  })

  it("takes an unknown value as 'system'", () => {
    systemPreference({ dark: true })
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, 'blue')
    startApp()
    expect(markedDark()).toBe(true)
  })

  it("removes the mark for 'light'", () => {
    // Dark system and a mark left from before: 'light' wins over both.
    systemPreference({ dark: true })
    document.documentElement.setAttribute('data-bs-theme', 'dark')
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, 'light')
    startApp()
    expect(document.documentElement.hasAttribute('data-bs-theme')).toBe(false)
  })

  it('applies at once when the key changes in another tab', () => {
    systemPreference({ dark: false })
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, 'light')
    startApp()
    expect(markedDark()).toBe(false)

    // Another key changes: the theme is not read again (it was written silently meanwhile).
    anotherTab.writes('dark')
    anotherTab.tells('auth-token')
    expect(markedDark()).toBe(false)

    // The other tab cleared all of its storage: the key is read again.
    anotherTab.tells(null)
    expect(markedDark()).toBe(true)

    // The wallet's switch, back and forth.
    anotherTab.writes('light')
    anotherTab.tells(THEME_MODE_STORAGE_KEY)
    expect(markedDark()).toBe(false)
    anotherTab.writes('dark')
    anotherTab.tells(THEME_MODE_STORAGE_KEY)
    expect(markedDark()).toBe(true)
  })

  it("applies at once when the system switches while in 'system'", () => {
    const system = systemPreference({ dark: false })
    startApp()
    expect(markedDark()).toBe(false)
    system.switchTo(true)
    expect(markedDark()).toBe(true)
    system.switchTo(false)
    expect(markedDark()).toBe(false)

    // In 'light' or 'dark' the system has no say.
    anotherTab.writes('light')
    anotherTab.tells(THEME_MODE_STORAGE_KEY)
    system.switchTo(true)
    expect(markedDark()).toBe(false)
  })

  it('follows the system on an engine that only knows addListener', () => {
    const system = systemPreference({ dark: false, legacy: true })
    startApp()
    system.switchTo(true)
    expect(markedDark()).toBe(true)
    wrapper.unmount()
    wrapper = undefined
    expect(system.media.removeListener).toHaveBeenCalledWith(
      system.media.addListener.mock.calls[0][0],
    )
  })

  it('stops listening when the app unmounts', () => {
    const system = systemPreference({ dark: false })
    startApp()
    const listener = system.media.addEventListener.mock.calls[0][1]
    wrapper.unmount()
    wrapper = undefined

    expect(system.media.removeEventListener).toHaveBeenCalledWith('change', listener)
    expect(system.listeners.size).toBe(0)
    system.switchTo(true)
    expect(markedDark()).toBe(false)
    anotherTab.writes('dark')
    anotherTab.tells(THEME_MODE_STORAGE_KEY)
    expect(markedDark()).toBe(false)
  })

  it('throws nothing where the storage refuses to be read, and lets the system decide', () => {
    systemPreference({ dark: true })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })
    expect(() => startApp()).not.toThrow()
    expect(markedDark()).toBe(true)
  })

  it('throws nothing without matchMedia, and stays light for the system', () => {
    startApp()
    expect(markedDark()).toBe(false)
  })

  // The switch in the account menu (NavBar.tsx) writes the wallet's key. The `storage` event never
  // reaches the tab that wrote, so the write applies by itself.
  describe('writeThemeMode', () => {
    it('stores a valid mode and applies it at once', () => {
      systemPreference({ dark: true })
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, 'light')
      startApp()
      expect(markedDark()).toBe(false)

      writeThemeMode('dark')
      expect(window.localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark')
      expect(markedDark()).toBe(true)
      expect(themeMode.value).toBe('dark')

      writeThemeMode('light')
      expect(window.localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('light')
      expect(markedDark()).toBe(false)
      expect(themeMode.value).toBe('light')

      // The system's choice, and the system is dark.
      writeThemeMode('system')
      expect(window.localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('system')
      expect(markedDark()).toBe(true)
      expect(themeMode.value).toBe('system')
    })

    it('refuses an unknown mode', () => {
      systemPreference({ dark: false })
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, 'dark')
      startApp()

      writeThemeMode('blue')
      expect(window.localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark')
      expect(markedDark()).toBe(true)
      expect(themeMode.value).toBe('dark')
    })

    it('survives a refused storage and still applies', () => {
      systemPreference({ dark: false })
      startApp()
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
      })

      expect(() => writeThemeMode('dark')).not.toThrow()
      // Not kept, but the page follows the choice, as the wallet's does.
      expect(window.localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBeNull()
      expect(markedDark()).toBe(true)
      expect(themeMode.value).toBe('dark')
    })

    it('keeps a choice the storage refused through a change of the system', () => {
      const system = systemPreference({ dark: false })
      startApp()
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
      })
      writeThemeMode('dark')

      // Nothing is stored, so the stored mode is the system's: it would go light here.
      system.switchTo(true)
      system.switchTo(false)
      expect(markedDark()).toBe(true)
      expect(themeMode.value).toBe('dark')
    })
  })

  // What the menu marks follows every apply: the start, another tab, the switch itself.
  it('themeMode follows every apply', () => {
    systemPreference({ dark: false })
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, 'light')
    startApp()
    expect(themeMode.value).toBe('light')

    // The wallet's switch in another tab.
    anotherTab.writes('dark')
    anotherTab.tells(THEME_MODE_STORAGE_KEY)
    expect(themeMode.value).toBe('dark')

    // Another tab cleared its storage: nothing stored is the system's choice.
    window.localStorage.clear()
    anotherTab.tells(null)
    expect(themeMode.value).toBe('system')
  })
})
