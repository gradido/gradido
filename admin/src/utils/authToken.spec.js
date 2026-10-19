// AI-GENERATED — not an architecture reference

import { describe, it, expect, vi } from 'vitest'
import {
  AUTH_TOKEN_KEY,
  handOverAddress,
  keepAuthToken,
  onAuthTokenChange,
  readAuthToken,
  sharesOrigin,
  takeHandedOverToken,
} from './authToken'

/**
 * The token kept for both apps under one key: what an app on the same origin finds there, and
 * the address the token goes in to the other app where there is no same origin (two vite
 * servers).
 */
describe('authToken', () => {
  const OTHER_HERE = 'https://gradido.example/other/authenticate?token='
  const OTHER_ELSEWHERE = 'http://localhost:8080/authenticate?token='
  const NOW = 1760000000000

  /** A storage that keeps what it is given, or refuses every write and read. */
  const storage = ({ refuses = false } = {}) => {
    const items = new Map()
    const refuse = () => {
      throw new Error('SecurityError')
    }
    return {
      items,
      getItem: (key) => (refuses ? refuse() : (items.get(key) ?? null)),
      setItem: vi.fn((key, value) => (refuses ? refuse() : items.set(key, String(value)))),
      removeItem: (key) => (refuses ? refuse() : items.delete(key)),
    }
  }

  const windowOn = (localStorage = storage()) => {
    const listeners = []
    return {
      location: { href: 'https://gradido.example/overview', origin: 'https://gradido.example' },
      localStorage,
      addEventListener: (type, listener) => type === 'storage' && listeners.push(listener),
      /** What the browser does when another window of the origin changes localStorage. */
      changedElsewhere: (key) => listeners.forEach((listener) => listener({ key })),
    }
  }

  const keeping = (kept) => {
    const win = windowOn()
    win.localStorage.items.set(AUTH_TOKEN_KEY, JSON.stringify(kept))
    return win
  }

  // The other app holds a test of its own with the same key (frontend/src/utils/authToken.spec.js).
  it('keeps under the key both apps read', () => {
    expect(AUTH_TOKEN_KEY).toBe('auth-token')
  })

  describe('readAuthToken', () => {
    it('gives the token kept, with when it was received', () => {
      expect(readAuthToken(keeping({ token: 'the-token', at: NOW }))).toEqual({
        token: 'the-token',
        at: NOW,
      })
    })

    it('gives none where none is kept, or what is kept is no token', () => {
      expect(readAuthToken(windowOn())).toBeNull()
      expect(readAuthToken(keeping({ token: '', at: NOW }))).toBeNull()
      expect(readAuthToken(keeping({ token: 'the-token' }))).toBeNull()
      const win = windowOn()
      win.localStorage.items.set(AUTH_TOKEN_KEY, 'not json')
      expect(readAuthToken(win)).toBeNull()
      expect(readAuthToken(windowOn(storage({ refuses: true })))).toBeNull()
    })
  })

  describe('keepAuthToken', () => {
    it('keeps a token with the time it was received', () => {
      const win = windowOn()
      keepAuthToken('the-token', win, NOW)
      expect(readAuthToken(win)).toEqual({ token: 'the-token', at: NOW })
    })

    it('keeps the time of the token kept already, and does not write it again', () => {
      const win = keeping({ token: 'the-token', at: NOW })
      keepAuthToken('the-token', win, NOW + 1000)
      expect(readAuthToken(win)).toEqual({ token: 'the-token', at: NOW })
      expect(win.localStorage.setItem).not.toHaveBeenCalled()
      keepAuthToken('the-renewed-token', win, NOW + 1000)
      expect(readAuthToken(win)).toEqual({ token: 'the-renewed-token', at: NOW + 1000 })
    })

    it('removes the token kept where there is none', () => {
      const win = keeping({ token: 'the-token', at: NOW })
      keepAuthToken(null, win, NOW)
      expect(win.localStorage.items.has(AUTH_TOKEN_KEY)).toBe(false)
    })

    it('does not throw where localStorage refuses', () => {
      expect(() => keepAuthToken('the-token', windowOn(storage({ refuses: true })))).not.toThrow()
      expect(() => keepAuthToken(null, windowOn(storage({ refuses: true })))).not.toThrow()
    })
  })

  describe('onAuthTokenChange', () => {
    it('hands on the token kept when another window changes it, or clears all', () => {
      const win = keeping({ token: 'the-token', at: NOW })
      const handle = vi.fn()
      onAuthTokenChange(handle, win)
      win.changedElsewhere(AUTH_TOKEN_KEY)
      expect(handle).toHaveBeenLastCalledWith({ token: 'the-token', at: NOW })
      win.localStorage.items.clear()
      win.changedElsewhere(null)
      expect(handle).toHaveBeenLastCalledWith(null)
      expect(handle).toHaveBeenCalledTimes(2)
    })

    it('leaves alone a change of any other key', () => {
      const win = windowOn()
      const handle = vi.fn()
      onAuthTokenChange(handle, win)
      win.changedElsewhere('gradido-theme-mode')
      expect(handle).not.toHaveBeenCalled()
    })
  })

  describe('sharesOrigin', () => {
    it('is true for an address on the origin the app is opened on', () => {
      expect(sharesOrigin(OTHER_HERE, windowOn())).toBe(true)
      expect(sharesOrigin('/other/authenticate?token=', windowOn())).toBe(true)
    })

    it('is false for another port, host or scheme', () => {
      expect(sharesOrigin('https://gradido.example:8443/other/', windowOn())).toBe(false)
      expect(sharesOrigin('https://other.gradido.example/', windowOn())).toBe(false)
      expect(sharesOrigin('http://gradido.example/other/', windowOn())).toBe(false)
    })

    it('is false where there is no address to compare', () => {
      expect(sharesOrigin(undefined, windowOn())).toBe(false)
      expect(sharesOrigin('', windowOn())).toBe(false)
      expect(sharesOrigin('http://', windowOn())).toBe(false)
    })
  })

  describe('handOverAddress', () => {
    it('on a shared origin: names no token in the address', () => {
      expect(handOverAddress(OTHER_HERE, 'the-token', windowOn())).toBe(OTHER_HERE)
    })

    it('on another origin: puts the token into the address', () => {
      expect(handOverAddress(OTHER_ELSEWHERE, 'the/token', windowOn())).toBe(
        `${OTHER_ELSEWHERE}the%2Ftoken`,
      )
    })
  })

  describe('takeHandedOverToken', () => {
    it('on a shared origin: takes the token kept', () => {
      const win = keeping({ token: 'the-token', at: NOW })
      expect(takeHandedOverToken(undefined, OTHER_HERE, win)).toBe('the-token')
    })

    // ⛔ The point of it all: on a deployment a link with `?token=` signs nobody in.
    it('on a shared origin: never takes the token out of the address', () => {
      expect(takeHandedOverToken('from-a-link', OTHER_HERE, windowOn())).toBeNull()
      const win = keeping({ token: 'the-token', at: NOW })
      expect(takeHandedOverToken('from-a-link', OTHER_HERE, win)).toBe('the-token')
    })

    it('on another origin: takes the token out of the address, not the one kept', () => {
      const win = keeping({ token: 'the-token', at: NOW })
      expect(takeHandedOverToken('from-the-address', OTHER_ELSEWHERE, win)).toBe('from-the-address')
      expect(takeHandedOverToken(undefined, OTHER_ELSEWHERE, win)).toBeNull()
      expect(takeHandedOverToken('', OTHER_ELSEWHERE, win)).toBeNull()
    })
  })
})
