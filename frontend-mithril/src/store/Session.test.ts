// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, setSystemTime, spyOn } from 'bun:test'
import { location, otherTabStores } from './browserStub'

const NOW = 1760000000000
const BIBI = '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d'
const BOB = '7a6b5c4d-3e2f-4a1b-8c0d-9e8f7a6b5c4d'
const STATE_KEY = 'gradido-frontend'
// The admin and the old wallet each hold a test of their own with the same key.
const AUTH_TOKEN_KEY = 'auth-token'

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

const kept = (token: string, at = NOW) => JSON.stringify({ token, at })
const keptToken = () => JSON.parse(localStorage.getItem(AUTH_TOKEN_KEY) ?? 'null')

// What the wallet finds at its start: a member kept from a session whose token is gone -- the
// admin interface signed out, and knows nothing of the wallet's entry.
localStorage.setItem(STATE_KEY, JSON.stringify({ member: member(BIBI), language: 'de' }))
const { AuthTokenStore, authToken, login, logout, session } = await import('./Session')
const memberAtStart = session.state.member
const keptAtStart = localStorage.getItem(STATE_KEY)
const openedAtStart = location.assign.mock.calls.length

/** The store of a tab that starts with `token` kept, or with none. */
const tabWith = (token: string | null) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, kept(token))
  }
  return new AuthTokenStore()
}

beforeEach(() => {
  localStorage.clear()
  authToken.set(null, false)
  session.set(undefined, false)
  location.reload.mockClear()
  location.assign.mockClear()
  setSystemTime(new Date(NOW))
})

describe('the session', () => {
  it('drops at its start a member kept without a token, keeps the language, opens nothing', () => {
    expect(memberAtStart).toBeNull()
    expect(JSON.parse(keptAtStart ?? '')).toEqual({ member: null, language: 'de' })
    expect(openedAtStart).toBe(0)
  })

  it('login keeps the member, and the language as it is', () => {
    session.set({ member: null, language: 'en' })
    login(member(BIBI))
    expect(session.state.member?.gradidoID).toBe(BIBI)
    expect(JSON.parse(localStorage.getItem(STATE_KEY) ?? '')).toMatchObject({
      member: { gradidoID: BIBI },
      language: 'en',
    })
  })

  it('logout removes the token and the member, keeps the language, and opens the sign-in', () => {
    authToken.set({ token: tokenOf(BIBI), at: NOW })
    session.set({ member: member(BIBI), language: 'de' })
    logout()
    expect(authToken.state).toBeNull()
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
    expect(JSON.parse(localStorage.getItem(STATE_KEY) ?? '')).toEqual({
      member: null,
      language: 'de',
    })
    expect(location.assign).toHaveBeenCalledWith('/login')
  })
})

describe('AuthTokenStore', () => {
  describe('at its start', () => {
    it('has the token kept, with the time it was received', () => {
      expect(tabWith(tokenOf(BIBI)).state).toEqual({ token: tokenOf(BIBI), at: NOW })
    })

    it('has none where none is kept, or what is kept is no token with its time', () => {
      expect(tabWith(null).state).toBeNull()
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify({ token: '', at: NOW }))
      expect(new AuthTokenStore().state).toBeNull()
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify({ token: tokenOf(BIBI) }))
      expect(new AuthTokenStore().state).toBeNull()
      localStorage.setItem(AUTH_TOKEN_KEY, 'not json')
      expect(new AuthTokenStore().state).toBeNull()
    })

    // The wallet does not start with it: nearly every request would fail anyway.
    it('throws for a token that cannot be read, or names no gradido ID', () => {
      expect(() => tabWith('header.%%%.signature')).toThrow()
      expect(() => tabWith(tokenOf('dlt-connector'))).toThrow()
    })
  })

  describe('set', () => {
    it('keeps the token of a sign-in, and neither reloads nor opens the sign-in', () => {
      const store = tabWith(null)
      store.set({ token: tokenOf(BIBI), at: NOW })
      expect(keptToken()).toEqual({ token: tokenOf(BIBI), at: NOW })
      expect(location.reload).not.toHaveBeenCalled()
      expect(location.assign).not.toHaveBeenCalled()
    })

    // `sub` in capitals and a payload with the two characters base64url writes otherwise
    it('takes a renewal for the same member without a reload', () => {
      const store = tabWith(tokenOf(BIBI))
      const renewed = tokenOf(BIBI.toUpperCase(), { note: '??>>' })
      expect(renewed).toMatch(/\.[^.]*[-_][^.]*\./)
      store.set({ token: renewed, at: NOW + 1000 })
      expect(keptToken()).toEqual({ token: renewed, at: NOW + 1000 })
      expect(location.reload).not.toHaveBeenCalled()
    })

    // The stores and the drafts of this tab are Bibi's: everything starts over.
    it('reloads where the token names somebody else than the one before', () => {
      const store = tabWith(tokenOf(BIBI))
      store.set({ token: tokenOf(BOB), at: NOW })
      expect(location.reload).toHaveBeenCalledTimes(1)
      expect(keptToken()).toEqual({ token: tokenOf(BOB), at: NOW })
    })

    it('removes the token and opens the sign-in, only where there was a token', () => {
      const signedIn = tabWith(tokenOf(BIBI))
      signedIn.set(null)
      expect(signedIn.state).toBeNull()
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
      expect(location.assign).toHaveBeenCalledWith('/login')

      location.assign.mockClear()
      tabWith(null).set(null)
      expect(location.assign).not.toHaveBeenCalled()
    })
  })

  describe('where another tab changes the kept token', () => {
    it('takes over a renewal for the member signed in here, and does not write it again', () => {
      const store = tabWith(tokenOf(BIBI, { iat: 1 }))
      const written = spyOn(localStorage, 'setItem')
      otherTabStores(AUTH_TOKEN_KEY, kept(tokenOf(BIBI, { iat: 2 })))
      expect(store.state?.token).toBe(tokenOf(BIBI, { iat: 2 }))
      expect(location.reload).not.toHaveBeenCalled()
      expect(written).not.toHaveBeenCalled()
      written.mockRestore()
    })

    it('reloads where somebody else signs in', () => {
      tabWith(tokenOf(BIBI))
      otherTabStores(AUTH_TOKEN_KEY, kept(tokenOf(BOB)))
      expect(location.reload).toHaveBeenCalledTimes(1)
    })

    it('takes the token where nobody is signed in here, without a reload', () => {
      const store = tabWith(null)
      otherTabStores(AUTH_TOKEN_KEY, kept(tokenOf(BOB)))
      expect(store.state?.token).toBe(tokenOf(BOB))
      expect(location.reload).not.toHaveBeenCalled()
    })

    it('opens the sign-in where the token is gone, or all of localStorage cleared', () => {
      const store = tabWith(tokenOf(BIBI))
      otherTabStores(AUTH_TOKEN_KEY, null)
      expect(store.state).toBeNull()
      expect(location.assign).toHaveBeenCalledWith('/login')

      location.assign.mockClear()
      tabWith(tokenOf(BIBI))
      otherTabStores(null, null)
      expect(location.assign).toHaveBeenCalledWith('/login')
    })

    it('leaves alone a change of any other key', () => {
      const store = tabWith(tokenOf(BIBI))
      otherTabStores('gradido-theme-mode', 'dark')
      expect(store.state?.token).toBe(tokenOf(BIBI))
      expect(location.reload).not.toHaveBeenCalled()
      expect(location.assign).not.toHaveBeenCalled()
    })
  })
})
