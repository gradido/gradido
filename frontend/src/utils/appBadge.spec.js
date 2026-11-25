// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { APP_BADGE_HIDDEN_INTERVAL_MS, appBadgeShown, showAppBadge } from './appBadge'

/** The two calls of the Badging API, as a browser that has it hands them out. */
const giveBadgingApi = (set = vi.fn(() => Promise.resolve())) => {
  const clear = vi.fn(() => Promise.resolve())
  Object.defineProperty(navigator, 'setAppBadge', { configurable: true, value: set })
  Object.defineProperty(navigator, 'clearAppBadge', { configurable: true, value: clear })
  return { set, clear }
}

/** The page in its own window (`display-mode: standalone`), or in a tab. */
const runAsApp = (app) => {
  window.matchMedia = vi.fn((query) => ({
    matches: app && query === '(display-mode: standalone)',
  }))
}

describe('appBadge', () => {
  beforeEach(() => {
    delete window.matchMedia
  })

  afterEach(() => {
    delete navigator.setAppBadge
    delete navigator.clearAppBadge
    delete navigator.standalone
    delete window.matchMedia
  })

  it('asks once a minute while out of sight', () => {
    expect(APP_BADGE_HIDDEN_INTERVAL_MS).toBe(60000)
  })

  describe('a browser without the Badging API', () => {
    it('shows nothing and fails nowhere, also as an app', () => {
      runAsApp(true)
      expect(appBadgeShown()).toBe(false)
      expect(() => showAppBadge(3)).not.toThrow()
    })
  })

  describe('a tab', () => {
    it('leaves the icon alone, also where the API is there', () => {
      const { set, clear } = giveBadgingApi()
      runAsApp(false)

      expect(appBadgeShown()).toBe(false)
      showAppBadge(3)
      showAppBadge(0)

      expect(set).not.toHaveBeenCalled()
      expect(clear).not.toHaveBeenCalled()
    })

    it('leaves it alone where the browser knows no display mode', () => {
      const { set } = giveBadgingApi()
      showAppBadge(3)
      expect(set).not.toHaveBeenCalled()
    })
  })

  describe('the installed app', () => {
    it('puts the number on the icon', () => {
      const { set, clear } = giveBadgingApi()
      runAsApp(true)

      expect(appBadgeShown()).toBe(true)
      showAppBadge(4)

      expect(set).toHaveBeenCalledWith(4)
      expect(clear).not.toHaveBeenCalled()
    })

    it('takes the number away at 0', () => {
      const { set, clear } = giveBadgingApi()
      runAsApp(true)

      showAppBadge(0)

      expect(clear).toHaveBeenCalledTimes(1)
      expect(set).not.toHaveBeenCalled()
    })

    it("counts Safari's home-screen app on iOS as the app", () => {
      const { set } = giveBadgingApi()
      runAsApp(false)
      Object.defineProperty(navigator, 'standalone', { configurable: true, value: true })

      showAppBadge(2)

      expect(set).toHaveBeenCalledWith(2)
    })

    it('lets a refusal go -- no permission for notifications', async () => {
      const refused = vi.fn(() => Promise.reject(new DOMException('no', 'NotAllowedError')))
      giveBadgingApi(refused)
      runAsApp(true)
      const unhandled = vi.fn()
      process.on('unhandledRejection', unhandled)
      try {
        showAppBadge(1)
        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(refused).toHaveBeenCalledWith(1)
        expect(unhandled).not.toHaveBeenCalled()
      } finally {
        process.off('unhandledRejection', unhandled)
      }
    })
  })
})
