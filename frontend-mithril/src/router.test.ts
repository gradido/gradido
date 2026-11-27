// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, mock, setSystemTime } from 'bun:test'
import * as v from 'valibot'
import { location } from '../test/browserStub'
import { BIBI, member, tokenOf } from '../test/member'

const goneTo = mock()
mock.module('mithril', () => ({ default: { route: { set: goneTo } } }))
mock.module('@frontend/config', () => ({ default: {} }))

const { openedBefore, routeResolvers } = await import('./router')
const { authToken, authTokenSchema, login, session } = await import('@/store/Session')

const NOW = 1760000000000
const Page = { view: () => null }
const resolvers = routeResolvers(
  {
    '/login': { page: Page },
    '/login/:code': { page: Page },
    '/send': { page: Page, requiresAuth: true },
    '/authenticate': { leadsOn: async () => undefined },
  },
  Page,
)
/** What opening `address` gives: the page, or nothing where the guard led elsewhere. */
const open = (pattern: string, address = pattern) =>
  resolvers[pattern].onmatch?.({}, address, pattern)

beforeEach(() => {
  localStorage.clear()
  authToken.set(null, false)
  session.set(undefined, false)
  goneTo.mockClear()
  location.assign.mockClear()
  setSystemTime(new Date(NOW))
})

describe('routeResolvers', () => {
  // first: no page has opened yet, so this is the wallet's start
  it('goes on from the sign-in page to the overview where the wallet starts with a session', async () => {
    authToken.set(v.parse(authTokenSchema, { token: tokenOf(BIBI), at: NOW }))
    expect(await open('/login')).toBeUndefined()
    expect(goneTo).toHaveBeenCalledWith('/overview', null, { replace: true })
  })

  it('goes on from the sign-in with the code of a link to that link, where the wallet starts with a session', async () => {
    authToken.set(v.parse(authTokenSchema, { token: tokenOf(BIBI), at: NOW }))
    expect(await open('/login/:code', '/login/c0de?codeCommunityUuid=abc#top')).toBeUndefined()
    expect(goneTo).toHaveBeenCalledWith('/redeem/c0de?codeCommunityUuid=abc', null, {
      replace: true,
    })
  })

  it('leads nobody to a page for members, and keeps the address for after the sign-in', async () => {
    expect(await open('/send', '/send?art=email#top')).toBeUndefined()
    expect(goneTo).toHaveBeenCalledWith('/login', null, { replace: true })
    expect(session.state.redirectPath).toBe('/send?art=email#top')
    // nobody was signed in: nobody is signed out
    expect(location.assign).not.toHaveBeenCalled()
  })

  // the sign-out puts the overview back, so it comes first
  it('puts a sign-in that ran out away before it keeps the address', async () => {
    authToken.set(v.parse(authTokenSchema, { token: tokenOf(BIBI), at: NOW - 600_000 }))
    login(member(BIBI))
    await open('/send', '/send?art=email')
    expect(authToken.state).toBeNull()
    expect(session.state.member).toBeNull()
    expect(session.state.redirectPath).toBe('/send?art=email')
  })

  it('opens the page while the session runs, and leaves the way on alone', async () => {
    authToken.set(v.parse(authTokenSchema, { token: tokenOf(BIBI), at: NOW }))
    // nothing has opened so far: every way led elsewhere
    expect(openedBefore()).toBe(false)
    // a way that leads on opens no page: back from the page it leads to leaves the wallet
    await open('/authenticate')
    expect(await open('/send')).toBe(Page)
    expect(goneTo).not.toHaveBeenCalled()
    expect(session.state.redirectPath).toBe('/overview')
    // the first page of the wallet has none before it, the second has
    expect(openedBefore()).toBe(false)
    await open('/send')
    expect(openedBefore()).toBe(true)
  })

  // The test above opened a page: the wallet has started. Before it, the same address led on
  // to the overview (data/Guard.logic.test.ts).
  it('keeps the sign-in form on a way in from inside the running wallet', async () => {
    authToken.set(v.parse(authTokenSchema, { token: tokenOf(BIBI), at: NOW }))
    expect(await open('/login')).toBe(Page)
  })
})
