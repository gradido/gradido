// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, mock, setSystemTime } from 'bun:test'

// As much of a browser as Session asks for; the stubs stand before Session.ts is loaded, which
// creates the wallet's one session at once.
const stored = new Map<string, string>()
const setItem = mock((key: string, value: string) => {
  stored.set(key, value)
})
let listeners: ((event: { key: string | null }) => void)[] = []
const location = { reload: mock(), assign: mock() }
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem,
    removeItem: (key: string) => stored.delete(key),
  },
  location,
  window: {
    addEventListener: (_: string, listener: (event: { key: string | null }) => void) =>
      listeners.push(listener),
  },
})

const { AUTH_TOKEN_KEY, Session, tokenMemberId } = await import('./Session')

const NOW = 1760000000000
const BIBI = '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d'
const BOB = '7a6b5c4d-3e2f-4a1b-8c0d-9e8f7a6b5c4d'

/** A token naming `sub`, written as the server writes one: base64url, without padding. */
const tokenOf = (sub: string | undefined, more = {}) =>
  `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ sub, ...more }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')}.signature`

const member = (gradidoID: string) => ({
  gradidoID,
  communityUuid: 'f1e2d3c4-b5a6-4978-8695-a4b3c2d1e0f9',
  alias: null,
  firstName: 'Bibi',
  lastName: 'Bloxberg',
  language: 'de',
  role: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  emailChecked: true,
  emailContact: null,
  klickTipp: null,
  avatar: null,
  avatarVisibleToMembers: null,
  creationAllowed: true,
  firstCreationStatus: null,
  transfersInChat: null,
  gmsAllowed: null,
  gmsPublishLocation: null,
  humhubAllowed: null,
  userLocation: null,
  hideAmountGDD: false,
  hideAmountGDT: false,
})

const keep = (kept: object) => stored.set(AUTH_TOKEN_KEY, JSON.stringify(kept))
const keptToken = () => JSON.parse(stored.get(AUTH_TOKEN_KEY) ?? 'null')

/** What the browser does when another tab of the origin changes localStorage. */
const changedElsewhere = (key: string | null = AUTH_TOKEN_KEY) => {
  for (const listener of listeners) {
    listener({ key })
  }
}
const changeTo = (kept: object | null) => {
  if (kept) {
    keep(kept)
  } else {
    stored.delete(AUTH_TOKEN_KEY)
  }
  changedElsewhere()
}

/** A session that has `token`, with what was kept at its start. */
const sessionWith = (token: string | null, keptAtStart?: object) => {
  if (keptAtStart) {
    keep(keptAtStart)
  }
  const session = new Session()
  session.token = token
  session.setToken = mock()
  session.logout = mock()
  return session
}

beforeEach(() => {
  stored.clear()
  listeners = []
  setItem.mockClear()
  location.reload.mockClear()
  location.assign.mockClear()
  setSystemTime(new Date(NOW))
})

describe('Session', () => {
  // The admin and the old wallet each hold a test of their own with the same key.
  it('keeps the token under the key both apps read', () => {
    expect(AUTH_TOKEN_KEY).toBe('auth-token')
  })

  describe('at its start', () => {
    it('takes the member, the language and the token that names the member', () => {
      stored.set('gradido-frontend', JSON.stringify({ member: member(BIBI), language: 'de' }))
      keep({ token: tokenOf(BIBI.toUpperCase()), at: NOW })
      const session = new Session()
      expect(session.state.member?.gradidoID).toBe(BIBI)
      expect(session.state.language).toBe('de')
      expect(session.token).toBe(tokenOf(BIBI.toUpperCase()))
    })

    it('leaves the token of somebody else where it is', () => {
      stored.set('gradido-frontend', JSON.stringify({ member: member(BIBI), language: 'de' }))
      keep({ token: tokenOf(BOB), at: NOW })
      expect(new Session().token).toBeNull()
      expect(keptToken()).toEqual({ token: tokenOf(BOB), at: NOW })
    })

    it('has no token where none is kept, nobody is stored, or what is kept is no token', () => {
      expect(new Session().token).toBeNull()
      keep({ token: tokenOf(BIBI), at: NOW })
      expect(new Session().token).toBeNull()
      stored.set('gradido-frontend', JSON.stringify({ member: member(BIBI), language: 'de' }))
      keep({ token: '', at: NOW })
      expect(new Session().token).toBeNull()
      keep({ token: tokenOf(BIBI) })
      expect(new Session().token).toBeNull()
      stored.set(AUTH_TOKEN_KEY, 'not json')
      expect(new Session().token).toBeNull()
    })
  })

  describe('setToken', () => {
    it('keeps a token with the time it was received', () => {
      new Session().setToken('the-token')
      expect(keptToken()).toEqual({ token: 'the-token', at: NOW })
    })

    it('keeps the time of the token kept already, and does not write it again', () => {
      keep({ token: 'the-token', at: NOW })
      const session = new Session()
      setSystemTime(new Date(NOW + 1000))
      session.setToken('the-token')
      expect(keptToken()).toEqual({ token: 'the-token', at: NOW })
      expect(setItem).not.toHaveBeenCalled()
      session.setToken('the-renewed-token')
      expect(keptToken()).toEqual({ token: 'the-renewed-token', at: NOW + 1000 })
    })

    it('removes the token kept where there is none', () => {
      keep({ token: 'the-token', at: NOW })
      new Session().setToken(null)
      expect(stored.has(AUTH_TOKEN_KEY)).toBe(false)
    })
  })

  it('logout removes the token and the member, keeps the language, and opens the sign-in', () => {
    stored.set('gradido-frontend', JSON.stringify({ member: member(BIBI), language: 'de' }))
    keep({ token: tokenOf(BIBI), at: NOW })
    const session = new Session()
    session.logout()
    expect(session.token).toBeNull()
    expect(stored.has(AUTH_TOKEN_KEY)).toBe(false)
    expect(JSON.parse(stored.get('gradido-frontend') ?? '')).toEqual({
      member: null,
      language: 'de',
    })
    expect(location.assign).toHaveBeenCalledWith('/login')
  })

  describe('tokenMemberId', () => {
    it('reads whom the token names, lowercased', () => {
      expect(tokenMemberId(tokenOf(BIBI.toUpperCase()))).toBe(BIBI)
    })

    // A payload whose base64url needs the two characters base64 writes otherwise.
    it('reads a payload with the characters of base64url', () => {
      const token = tokenOf(BIBI, { note: '??>>' })
      expect(token).toMatch(/[-_]/)
      expect(tokenMemberId(token)).toBe(BIBI)
    })

    it('is null for a token that names nobody, or is none', () => {
      expect(tokenMemberId(tokenOf(''))).toBeNull()
      expect(tokenMemberId(tokenOf(undefined))).toBeNull()
      expect(tokenMemberId('no-token')).toBeNull()
      expect(tokenMemberId(null)).toBeNull()
    })

    it('throws for a token that cannot be read', () => {
      expect(() => tokenMemberId('header.%%%.signature')).toThrow()
    })
  })

  describe('where another tab changes the kept token', () => {
    it('takes over a renewal for the member signed in here', () => {
      const session = sessionWith(tokenOf(BIBI, { iat: 1 }))
      changeTo({ token: tokenOf(BIBI, { iat: 2 }), at: NOW })
      expect(session.setToken).toHaveBeenCalledWith(tokenOf(BIBI, { iat: 2 }))
      expect(location.reload).not.toHaveBeenCalled()
    })

    // ⛔ Not taken over: the stores and the drafts here are Bibi's. And not signed out: that
    // would remove Bob's token, kept just now.
    it('reloads where somebody else signs in, and signs nobody out', () => {
      const session = sessionWith(tokenOf(BIBI))
      changeTo({ token: tokenOf(BOB), at: NOW })
      expect(location.reload).toHaveBeenCalledTimes(1)
      expect(session.setToken).not.toHaveBeenCalled()
      expect(session.logout).not.toHaveBeenCalled()
    })

    it('reloads where somebody signs in while nobody is signed in here', () => {
      const session = sessionWith(null)
      changeTo({ token: tokenOf(BOB), at: NOW })
      expect(location.reload).toHaveBeenCalledTimes(1)
      expect(session.setToken).not.toHaveBeenCalled()
    })

    // The other app renews with every answer. A tab signed in as nobody that reloaded on each
    // would reload with every click there.
    it('reloads once, not on every renewal, while nobody is signed in here', () => {
      sessionWith(null)
      changeTo({ token: tokenOf(BOB, { iat: 1 }), at: NOW })
      changeTo({ token: tokenOf(BOB, { iat: 2 }), at: NOW })
      expect(location.reload).toHaveBeenCalledTimes(1)
    })

    it('does not reload for a renewal of the token it found at the start', () => {
      sessionWith(null, { token: tokenOf(BOB, { iat: 1 }), at: NOW })
      changeTo({ token: tokenOf(BOB, { iat: 2 }), at: NOW })
      expect(location.reload).not.toHaveBeenCalled()
    })

    it('reloads again where somebody signs in after a logout there', () => {
      sessionWith(null, { token: tokenOf(BOB), at: NOW })
      changeTo(null)
      changeTo({ token: tokenOf(BOB), at: NOW })
      expect(location.reload).toHaveBeenCalledTimes(1)
    })

    it('signs out where the token is gone, and only where somebody is signed in', () => {
      const signedIn = sessionWith(tokenOf(BIBI))
      changeTo(null)
      expect(signedIn.logout).toHaveBeenCalled()
      expect(location.reload).not.toHaveBeenCalled()

      listeners = []
      const signedOut = sessionWith(null)
      changeTo(null)
      expect(signedOut.logout).not.toHaveBeenCalled()
    })

    it('follows where the other tab cleared all of localStorage', () => {
      const session = sessionWith(tokenOf(BIBI), { token: tokenOf(BIBI), at: NOW })
      stored.clear()
      changedElsewhere(null)
      expect(session.logout).toHaveBeenCalled()
    })

    it('leaves alone a change of any other key', () => {
      const session = sessionWith(tokenOf(BIBI))
      changedElsewhere('gradido-theme-mode')
      expect(session.logout).not.toHaveBeenCalled()
      expect(location.reload).not.toHaveBeenCalled()
    })
  })
})
