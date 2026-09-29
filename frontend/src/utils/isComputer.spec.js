// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isComputer } from './isComputer'

describe('isComputer', () => {
  /** The one question the device is asked: a mouse or a touchpad, which can hover. */
  const COMPUTER = '(pointer: fine) and (hover: hover)'

  /**
   * A device as the browser describes it. The stand-in for `matchMedia` answers to that one
   * question only, so a test sees which question is asked.
   */
  const device = ({ userAgent, maxTouchPoints = 0, fine }) => {
    vi.stubGlobal('navigator', { userAgent, maxTouchPoints })
    vi.stubGlobal('matchMedia', (query) => ({ matches: query === COMPUTER && fine }))
  }

  const MAC_CHROME =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
  const IPAD_SAFARI =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15'
  const WINDOWS_CHROME =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
  const LINUX_FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0'
  const ANDROID_CHROME =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
  const IPHONE_SAFARI =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
  const OLD_IPAD_SAFARI =
    'Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1'

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['a Mac with a mouse', MAC_CHROME, 0],
    ['a Linux desktop', LINUX_FIREFOX, 0],
    // Its pointer is fine and hovers, whatever the screen can be touched with.
    ['a Windows laptop with a touchscreen', WINDOWS_CHROME, 10],
  ])('says yes for %s: a fine pointer that hovers', (_, userAgent, maxTouchPoints) => {
    device({ userAgent, maxTouchPoints, fine: true })
    expect(isComputer()).toBe(true)
  })

  it('says no where the pointer is a finger', () => {
    device({ userAgent: WINDOWS_CHROME, maxTouchPoints: 10, fine: false })
    expect(isComputer()).toBe(false)
  })

  // The caller decides what a no costs; the check itself does not guess.
  it('says no where the browser cannot be asked', () => {
    device({ userAgent: MAC_CHROME, fine: true })
    vi.stubGlobal('matchMedia', undefined)
    expect(isComputer()).toBe(false)
  })

  it.each([
    ['an Android phone with a mouse', ANDROID_CHROME],
    ['an iPhone', IPHONE_SAFARI],
    ['an iPad that says so', OLD_IPAD_SAFARI],
  ])('says no for %s, whatever its pointer', (_, userAgent) => {
    device({ userAgent, maxTouchPoints: 5, fine: true })
    expect(isComputer()).toBe(false)
  })

  // ⛔ Safari on an iPad calls itself a Mac (iPadOS 13 on), and with a trackpad its pointer is
  // fine and hovers: the points to touch give it away.
  it('says no for an iPad that calls itself a Mac, even with a trackpad', () => {
    device({ userAgent: IPAD_SAFARI, maxTouchPoints: 5, fine: true })
    expect(isComputer()).toBe(false)
  })

  // Nothing kept: the next call asks again.
  it('asks anew at every call', () => {
    device({ userAgent: MAC_CHROME, fine: true })
    expect(isComputer()).toBe(true)

    device({ userAgent: MAC_CHROME, fine: false })
    expect(isComputer()).toBe(false)
  })
})
