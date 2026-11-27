// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, setSystemTime, spyOn } from 'bun:test'
import * as v from 'valibot'
import { location, otherTabStores } from '../../test/browserStub'
import { BIBI, BOB, member, tokenOf } from '../../test/member'

const NOW = 1760000000000
const STATE_KEY = 'gradido-frontend'
// The admin and the old wallet each hold a test of their own with the same key.
const AUTH_TOKEN_KEY = 'auth-token'

const kept = (token: string, at = NOW) => JSON.stringify({ token, at })
const keptToken = () => JSON.parse(localStorage.getItem(AUTH_TOKEN_KEY) ?? 'null')

// What the wallet finds at its start: a member kept from a session whose token is gone -- the
// admin interface signed out, and knows nothing of the wallet's entry.
localStorage.setItem(STATE_KEY, JSON.stringify({ member: member(BIBI), language: 'de' }))
const { AuthTokenStore, authToken, authTokenSchema, login, logout, session, sessionRuns } =
  await import('./Session')
/** What the store holds for `token`: with the gradidoID read out of it. */
const parsed = (token: string, at = NOW) => v.parse(authTokenSchema, { token, at })
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
    expect(JSON.parse(keptAtStart ?? '')).toEqual({
      member: null,
      language: 'de',
      redirectPath: '/overview',
      preLoginLanguage: null,
    })
    expect(openedAtStart).toBe(0)
  })

  it('login keeps the member and the page to go on to, and takes the language of the account', () => {
    session.set({
      member: null,
      language: 'en',
      redirectPath: '/send?art=email',
      preLoginLanguage: null,
    })
    login(member(BIBI))
    expect(session.state.member?.gradidoID).toBe(BIBI)
    expect(JSON.parse(localStorage.getItem(STATE_KEY) ?? '')).toMatchObject({
      member: { gradidoID: BIBI },
      language: 'de',
      redirectPath: '/send?art=email',
    })
  })

  it('login keeps a language chosen before it, once', () => {
    session.set({ member: null, language: 'fr', redirectPath: '/overview', preLoginLanguage: 'fr' })
    login(member(BIBI))
    expect(session.state.language).toBe('fr')
    expect(session.state.preLoginLanguage).toBeNull()
  })

  it('logout removes the token and the member, keeps the language, and opens the sign-in', () => {
    authToken.set(parsed(tokenOf(BIBI)))
    session.set({
      member: member(BIBI),
      language: 'de',
      redirectPath: '/send',
      preLoginLanguage: null,
    })
    logout()
    expect(authToken.state).toBeNull()
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
    expect(JSON.parse(localStorage.getItem(STATE_KEY) ?? '')).toEqual({
      member: null,
      language: 'de',
      redirectPath: '/overview',
      preLoginLanguage: null,
    })
    expect(location.assign).toHaveBeenCalledWith('/login')
  })

  it('logout keeps a language chosen while nobody was signed in, for the next sign-in', () => {
    // a token lay there, but nobody had signed in with it: the server did not take it
    authToken.set(parsed(tokenOf(BIBI)))
    session.set({ ...session.state, language: 'fr', preLoginLanguage: 'fr' })
    logout()
    expect(session.state).toMatchObject({ member: null, language: 'fr', preLoginLanguage: 'fr' })
  })

  it('logout opens the page it is told to instead', () => {
    authToken.set(parsed(tokenOf(BIBI)))
    logout('/redeem/abc')
    expect(authToken.state).toBeNull()
    expect(location.assign).toHaveBeenCalledWith('/redeem/abc')
  })
})

describe('AuthTokenStore', () => {
  describe('at its start', () => {
    it('has the token kept, with the time it was received', () => {
      expect(tabWith(tokenOf(BIBI)).state).toEqual({
        token: tokenOf(BIBI),
        at: NOW,
        tokenMemberId: BIBI,
        endsAt: NOW + 600_000,
      })
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

    // what lies in localStorage must not keep the wallet from starting
    it('has none for a token that cannot be read, names no gradido ID, or has no end', () => {
      expect(tabWith(tokenOf(BIBI, { exp: undefined })).state).toBeNull()
      expect(tabWith('no-dots').state).toBeNull()
      expect(tabWith('header.%%%.signature').state).toBeNull()
      expect(tabWith(`header.${btoa('no json')}.signature`).state).toBeNull()
      expect(tabWith(tokenOf(undefined)).state).toBeNull()
      expect(tabWith(tokenOf('dlt-connector')).state).toBeNull()
    })
  })

  describe('set', () => {
    it('keeps the token of a sign-in, and neither reloads nor opens the sign-in', () => {
      const store = tabWith(null)
      store.set(parsed(tokenOf(BIBI)))
      expect(keptToken()).toEqual(parsed(tokenOf(BIBI)))
      expect(location.reload).not.toHaveBeenCalled()
      expect(location.assign).not.toHaveBeenCalled()
    })

    // `sub` in capitals and a payload with the two characters base64url writes otherwise
    it('takes a renewal for the same member without a reload', () => {
      const store = tabWith(tokenOf(BIBI))
      const renewed = tokenOf(BIBI.toUpperCase(), { note: '??>>' })
      expect(renewed).toMatch(/\.[^.]*[-_][^.]*\./)
      store.set(parsed(renewed, NOW + 1000))
      expect(keptToken()).toEqual({
        token: renewed,
        at: NOW + 1000,
        tokenMemberId: BIBI,
        endsAt: NOW + 601_000,
      })
      expect(location.reload).not.toHaveBeenCalled()
    })

    // The stores and the drafts of this tab are Bibi's: everything starts over.
    it('reloads where the token names somebody else than the one before', () => {
      const store = tabWith(tokenOf(BIBI))
      store.set(parsed(tokenOf(BOB)))
      expect(location.reload).toHaveBeenCalledTimes(1)
      expect(keptToken()).toEqual(parsed(tokenOf(BOB)))
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

describe('sessionRuns', () => {
  it('is no where no token is kept', () => {
    expect(sessionRuns()).toBe(false)
  })

  // counted from when this device received the token, with the token's own lifetime
  it("is yes until five seconds before the token ends, by this device's clock", () => {
    authToken.set(parsed(tokenOf(BIBI, { iat: 1_000_000, exp: 1_000_600 })))
    setSystemTime(new Date(NOW + 594_999))
    expect(sessionRuns()).toBe(true)
    setSystemTime(new Date(NOW + 595_000))
    expect(sessionRuns()).toBe(false)
  })

  it('takes the end the token names where it does not say when it was issued', () => {
    authToken.set(parsed(tokenOf(BIBI, { iat: undefined, exp: NOW / 1000 + 60 })))
    setSystemTime(new Date(NOW + 54_999))
    expect(sessionRuns()).toBe(true)
    setSystemTime(new Date(NOW + 55_000))
    expect(sessionRuns()).toBe(false)
  })
})
