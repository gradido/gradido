// AI-GENERATED — not an architecture reference

import { describe, it, expect, vi } from 'vitest'
import {
  AUTH_TOKEN_KEY,
  followAuthToken,
  handOverAddress,
  keepAuthToken,
  onAuthTokenChange,
  readAuthToken,
  sharesOrigin,
  takeHandedOverToken,
  tokenBelongsTo,
  tokenSubject,
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

  /** A token naming `sub`, written as the server writes one: base64url, without padding. */
  const tokenOf = (sub, more = {}) =>
    `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ sub, ...more }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')}.signature`
  const BIBI = '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d'
  const BOB = '7a6b5c4d-3e2f-4a1b-8c0d-9e8f7a6b5c4d'

  const windowOn = (localStorage = storage()) => {
    const listeners = []
    return {
      location: {
        href: 'https://gradido.example/overview',
        origin: 'https://gradido.example',
        reload: vi.fn(),
      },
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

  describe('tokenSubject', () => {
    it('reads whom the token names, lowercased', () => {
      expect(tokenSubject(tokenOf(BIBI.toUpperCase()))).toBe(BIBI)
    })

    // A payload whose base64url needs the two characters base64 writes otherwise.
    it('reads a payload with the characters of base64url', () => {
      const token = tokenOf(BIBI, { note: '??>>' })
      expect(token).toMatch(/[-_]/)
      expect(tokenSubject(token)).toBe(BIBI)
    })

    it('is null for a token that names nobody, or is none', () => {
      expect(tokenSubject(tokenOf(''))).toBeNull()
      expect(tokenSubject(tokenOf(undefined))).toBeNull()
      expect(tokenSubject('no-token')).toBeNull()
      expect(tokenSubject(null)).toBeNull()
    })
  })

  describe('tokenBelongsTo', () => {
    it('is true for the member the token names, however the id is written', () => {
      expect(tokenBelongsTo(tokenOf(BIBI), BIBI.toUpperCase())).toBe(true)
    })

    it('is false for anybody else, and where either names nobody', () => {
      expect(tokenBelongsTo(tokenOf(BIBI), BOB)).toBe(false)
      expect(tokenBelongsTo(tokenOf(BIBI), null)).toBe(false)
      expect(tokenBelongsTo('no-token', null)).toBe(false)
      expect(tokenBelongsTo(null, undefined)).toBe(false)
    })
  })

  describe('followAuthToken', () => {
    const followed = (token, keptAtStart) => {
      const win = windowOn()
      if (keptAtStart) win.localStorage.items.set(AUTH_TOKEN_KEY, JSON.stringify(keptAtStart))
      const store = {
        state: { token },
        commit: vi.fn(),
        dispatch: vi.fn(() => Promise.resolve()),
      }
      followAuthToken(store, win)
      const changeTo = (kept) => {
        if (kept) win.localStorage.items.set(AUTH_TOKEN_KEY, JSON.stringify(kept))
        else win.localStorage.items.delete(AUTH_TOKEN_KEY)
        win.changedElsewhere(AUTH_TOKEN_KEY)
      }
      return { win, store, changeTo }
    }

    it('takes over a renewal for the member signed in here', () => {
      const { win, store, changeTo } = followed(tokenOf(BIBI, { iat: 1 }))
      changeTo({ token: tokenOf(BIBI, { iat: 2 }), at: NOW })
      expect(store.commit).toHaveBeenCalledWith('token', tokenOf(BIBI, { iat: 2 }))
      expect(win.location.reload).not.toHaveBeenCalled()
    })

    // ⛔ Not taken over: the store, the cache and the drafts here are Bibi's. And not signed
    // out: that would remove Bob's token, kept just now.
    it('reloads where somebody else signs in, and signs nobody out', () => {
      const { win, store, changeTo } = followed(tokenOf(BIBI))
      changeTo({ token: tokenOf(BOB), at: NOW })
      expect(win.location.reload).toHaveBeenCalledTimes(1)
      expect(store.commit).not.toHaveBeenCalled()
      expect(store.dispatch).not.toHaveBeenCalled()
    })

    it('reloads where somebody signs in while nobody is signed in here', () => {
      const { win, store, changeTo } = followed(null)
      changeTo({ token: tokenOf(BOB), at: NOW })
      expect(win.location.reload).toHaveBeenCalledTimes(1)
      expect(store.commit).not.toHaveBeenCalled()
    })

    // The other app renews with every answer. A window signed in as nobody that reloaded on
    // each would reload with every click there.
    it('reloads once, not on every renewal, while nobody is signed in here', () => {
      const { win, changeTo } = followed(null)
      changeTo({ token: tokenOf(BOB, { iat: 1 }), at: NOW })
      changeTo({ token: tokenOf(BOB, { iat: 2 }), at: NOW })
      expect(win.location.reload).toHaveBeenCalledTimes(1)
    })

    it('does not reload for a renewal of the token it found at the start', () => {
      const { win, changeTo } = followed(null, { token: tokenOf(BOB, { iat: 1 }), at: NOW })
      changeTo({ token: tokenOf(BOB, { iat: 2 }), at: NOW })
      expect(win.location.reload).not.toHaveBeenCalled()
    })

    it('reloads again where somebody signs in after a logout there', () => {
      const { win, changeTo } = followed(null, { token: tokenOf(BOB), at: NOW })
      changeTo(null)
      changeTo({ token: tokenOf(BOB), at: NOW })
      expect(win.location.reload).toHaveBeenCalledTimes(1)
    })

    it('signs out where the token is gone, and only where somebody is signed in', () => {
      const signedIn = followed(tokenOf(BIBI))
      signedIn.changeTo(null)
      expect(signedIn.store.dispatch).toHaveBeenCalledWith('logout')
      expect(signedIn.win.location.reload).not.toHaveBeenCalled()

      const signedOut = followed(null)
      signedOut.changeTo(null)
      expect(signedOut.store.dispatch).not.toHaveBeenCalled()
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
