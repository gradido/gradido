import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import addNavigationGuards from './guards'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { verifyLogin } from '../graphql/queries'
import { useEntryDraft } from '../composables/useEntryDraft'
import { takeHeldChatText } from '../utils/chatReturn'

vi.mock('../graphql/queries', () => ({
  verifyLogin: 'mocked-verify-login-query',
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/authenticate', name: 'Authenticate' },
    { path: '/overview', name: 'Overview' },
    { path: '/login', name: 'Login' },
    { path: '/register', name: 'Register' },
    { path: '/forgot-password', name: 'ForgotPassword' },
    { path: '/protected', name: 'Protected', meta: { requiresAuth: true } },
    { path: '/contributions', name: 'Contributions', meta: { requiresAuth: true } },
    {
      path: '/contributions/contribute',
      name: 'Contribute',
      meta: { requiresAuth: true },
    },
    // The flag is the real record's, see routes.test.js -- the guard reads it and never
    // the address, so these two spellings of the same page must be gated alike.
    {
      path: '/matching/karte',
      name: 'MatchingMap',
      meta: { requiresAuth: true, requiresFindable: true },
    },
    { path: '/matching/:tab', name: 'Matching', meta: { requiresAuth: true } },
  ],
})

const storeCommitMock = vi.fn()
const storeDispatchMock = vi.fn()
const apolloQueryMock = vi.fn().mockResolvedValue({
  data: {
    verifyLogin: {
      firstName: 'Peter',
      avatar: 'base64-picture',
      avatarVisibleToMembers: false,
    },
  },
})

const store = {
  commit: storeCommitMock,
  state: {
    token: null,
  },
  dispatch: storeDispatchMock,
}

const apollo = {
  query: apolloQueryMock,
}

const addedGuards = []
const originalBeforeEach = router.beforeEach.bind(router)
router.beforeEach = (guard) => {
  addedGuards.push(guard)
  return originalBeforeEach(guard)
}

addNavigationGuards(router, store, apollo)

describe('navigation guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The store is shared by the whole file. Put back everything any block sets, or a case
    // added later inherits answers that are nowhere in its own body.
    store.state.token = null
    store.state.tokenTime = null
    store.state.creationAllowed = null
    store.state.gmsAllowed = null
    store.state.userLocation = null
  })

  describe('publisher ID', () => {
    it('commits the pid to the store when present', async () => {
      await router.push({ path: '/register', query: { pid: '42' } })
      expect(storeCommitMock).toHaveBeenCalledWith('publisherId', '42')
    })

    it('does not commit the pid when not present', async () => {
      await router.push({ path: '/forgot-password' })
      expect(storeCommitMock).not.toHaveBeenCalledWith('publisherId', expect.anything())
    })
  })

  describe('authenticate', () => {
    it('handles valid token correctly', async () => {
      await router.push({ path: '/authenticate', query: { token: 'valid-token' } })

      expect(storeCommitMock).toHaveBeenCalledWith('token', 'valid-token')
      expect(apolloQueryMock).toHaveBeenCalledWith({
        query: verifyLogin,
        fetchPolicy: 'network-only',
      })
      expect(storeDispatchMock).toHaveBeenCalledWith('login', {
        firstName: 'Peter',
        avatar: 'base64-picture',
        avatarVisibleToMembers: false,
      })
      expect(router.currentRoute.value.path).toBe('/overview')
    })

    // The picture and its visibility setting reach the store through the login ACTION now
    // -- both answers that feed that action carry them -- so this guard hands the whole
    // verifyLogin result over (asserted above) and commits neither itself. The two commits
    // that used to stand here wrote the same values a second time.
    //
    // Kept as a test of its own because "the action gets them" is the guarantee, not "the
    // guard commits them": what the action then does with them is store.test.js's.
    it('leaves the picture and its visibility setting to the login action', async () => {
      await router.push({ path: '/authenticate', query: { token: 'valid-token' } })

      expect(storeDispatchMock).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({ avatar: 'base64-picture', avatarVisibleToMembers: false }),
      )
      expect(storeCommitMock).not.toHaveBeenCalledWith('avatar', expect.anything())
      expect(storeCommitMock).not.toHaveBeenCalledWith('avatarVisibleToMembers', expect.anything())
    })

    it('handles server error correctly', async () => {
      apolloQueryMock.mockRejectedValueOnce(new Error('Server error'))

      await router.push({ path: '/authenticate', query: { token: 'invalid-token' } })

      expect(storeCommitMock).toHaveBeenCalledWith('token', 'invalid-token')
      expect(apolloQueryMock).toHaveBeenCalled()
      expect(storeDispatchMock).toHaveBeenCalledWith('logout')
      expect(router.currentRoute.value.path).toBe('/authenticate')
    })

    // The hand-over with a page to go on to: the admin interface opens the wallet's map in a
    // window of its own, on the member whose pin was pressed.
    describe('with a redirect', () => {
      const place = { latitude: 51.314472, longitude: 9.495606 }
      const WITH = '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d'
      const COMMUNITY = '9f8e7d6c-5b4a-4c3d-9e2f-1a0b9c8d7e6f'
      const MAP = `/matching/karte?with=${WITH}&community=${COMMUNITY}`

      // The store of this file is a mock: the commits of the hand-over change nothing in it.
      // What the guards behind the hand-over read -- a sign-in that runs, both answers for the
      // map -- is put there by hand, as the real commits would have left it. Without that the
      // way on ends at the sign-in form, whatever the hand-over did.
      //
      // And away to a page that is neither the overview nor the map first: every case below
      // names where it ends, and must not have stood there already.
      beforeEach(async () => {
        store.state.token = 'valid-token'
        store.state.tokenTime = Math.floor(Date.now() / 1000) + 600
        store.state.gmsAllowed = true
        store.state.userLocation = place
        await router.push('/register')
        vi.clearAllMocks()
      })

      const handsOver = (redirect) =>
        router.push({ path: '/authenticate', query: { token: 'valid-token', redirect } })

      it('goes on to the page named, with its query', async () => {
        await handsOver(MAP)

        // The hand-over itself, as without a redirect.
        expect(storeCommitMock).toHaveBeenCalledWith('token', 'valid-token')
        expect(storeDispatchMock).toHaveBeenCalledWith(
          'login',
          expect.objectContaining({ firstName: 'Peter' }),
        )
        // ⛔ fullPath and the query, not the path alone: a map that opens without them opens
        // on nobody, and `path` reads the same either way.
        expect(router.currentRoute.value.name).toBe('MatchingMap')
        expect(router.currentRoute.value.fullPath).toBe(MAP)
        expect(router.currentRoute.value.query).toEqual({ with: WITH, community: COMMUNITY })
      })

      it('goes on to any page of the wallet', async () => {
        await handsOver('/contributions/contribute')
        expect(router.currentRoute.value.fullPath).toBe('/contributions/contribute')
      })

      it('ends on the overview without one, as before', async () => {
        await router.push({ path: '/authenticate', query: { token: 'valid-token' } })
        expect(storeDispatchMock).toHaveBeenCalledWith('login', expect.anything())
        expect(router.currentRoute.value.fullPath).toBe('/overview')
      })

      // Only an address inside this wallet is followed (utils/safeWalletPath has the whole
      // list). The hand-over itself still takes place.
      it.each([
        ['an address somewhere else', 'https://example.org/matching/karte'],
        ['another host, as a browser spells it', '//example.org/matching/karte'],
        ['a script', 'javascript:alert(1)'],
        ['a backslash for a slash', '/\\example.org'],
        ['a path that does not start at the root', 'matching/karte'],
      ])('does not follow %s and ends on the overview', async (_name, redirect) => {
        await handsOver(redirect)
        expect(storeCommitMock).toHaveBeenCalledWith('token', 'valid-token')
        expect(storeDispatchMock).toHaveBeenCalledWith('login', expect.anything())
        expect(router.currentRoute.value.fullPath).toBe('/overview')
      })

      it('does not follow one given twice', async () => {
        await router.push('/authenticate?token=valid-token&redirect=/send&redirect=/register')
        expect(router.currentRoute.value.fullPath).toBe('/overview')
      })

      // The page named is entered like any other. The map asks for both of the member's own
      // answers, whoever sent them there: a moderator who is not on the map lands where the
      // answers are given, as every member does.
      it('lets the map send a member who is not findable to the position tab', async () => {
        store.state.gmsAllowed = false
        await handsOver(MAP)
        expect(router.currentRoute.value.path).toBe('/matching/position')
      })

      // The admin interface left open past the end of its session hands over a token that is
      // not accepted any more. The page named asks for the sign-in itself then, and keeps the
      // address for afterwards -- instead of a window that shows nothing.
      describe('where the token is not accepted', () => {
        beforeEach(() => {
          apolloQueryMock.mockRejectedValueOnce(new Error('Server error'))
          // What the real sign-out does first, and what the sign-in guard goes by.
          storeDispatchMock.mockImplementationOnce(() => {
            store.state.token = null
          })
        })

        it('goes to the page named all the same, which asks for the sign-in and keeps the address', async () => {
          await handsOver(MAP)
          expect(storeDispatchMock).toHaveBeenCalledWith('logout')
          expect(storeDispatchMock).not.toHaveBeenCalledWith('login', expect.anything())
          expect(router.currentRoute.value.path).toBe('/login')
          expect(storeCommitMock).toHaveBeenCalledWith('redirectPath', MAP)
        })

        it('stays where it is with an address that is not followed, as without one', async () => {
          await handsOver('//example.org/matching/karte')
          expect(storeDispatchMock).toHaveBeenCalledWith('logout')
          expect(router.currentRoute.value.path).toBe('/authenticate')
          expect(storeCommitMock).not.toHaveBeenCalledWith('redirectPath', expect.anything())
        })
      })
    })
  })

  // ES-021: the creation area is gone for a project account, from the address bar too.
  describe('the creation area and the project account', () => {
    beforeEach(() => {
      store.state.token = 'valid-token'
      // Signed in means a sign-in that still runs (the sign-in guard).
      store.state.tokenTime = Math.floor(Date.now() / 1000) + 600
    })

    it('sends a project account from the creation area to the overview', async () => {
      store.state.creationAllowed = false
      await router.push('/contributions/contribute')
      expect(router.currentRoute.value.path).toBe('/overview')
    })

    it('lets a person in, and an account the store does not know yet', async () => {
      store.state.creationAllowed = true
      await router.push('/contributions')
      expect(router.currentRoute.value.path).toBe('/contributions')
      store.state.creationAllowed = null
      await router.push('/contributions/contribute')
      expect(router.currentRoute.value.path).toBe('/contributions/contribute')
    })
  })

  // ⭐ Bernd's rule of 09.09.2026, and the way the map was built originally (7122a7b4e):
  // the find map opens only with a position AND findability. The page's own redirect was
  // the only lock before this, and it asked whether the location object EXISTS -- which an
  // account without a position answered with `{}`.
  describe('the find map and its two conditions', () => {
    const place = { latitude: 51.314472, longitude: 9.495606 }

    // Away from the map first, every time: vue-router drops a push to the location it is
    // already on, guards and all, so a test starting where the last one ended would
    // measure nothing and pass.
    beforeEach(async () => {
      store.state.token = 'valid-token'
      store.state.tokenTime = Math.floor(Date.now() / 1000) + 600
      store.state.gmsAllowed = true
      store.state.userLocation = place
      await router.push('/overview')
    })

    it('lets a member with both answers through', async () => {
      await router.push('/matching/karte')
      expect(router.currentRoute.value.path).toBe('/matching/karte')
    })

    it('sends a member without findability to the position tab', async () => {
      store.state.gmsAllowed = false
      await router.push('/matching/karte')
      expect(router.currentRoute.value.path).toBe('/matching/position')
    })

    it('sends a member without a position to the position tab', async () => {
      store.state.userLocation = null
      await router.push('/matching/karte')
      expect(router.currentRoute.value.path).toBe('/matching/position')
    })

    // The case that happened, and the reason this guard measures numbers rather than
    // truth: `{}` is what the backend used to answer, and it is still sitting in the
    // persisted store of every device that signed in before the fix. A truthy check here
    // would wave through exactly the members it exists to stop.
    it('sends a member whose stored position is an empty object to the position tab', async () => {
      store.state.userLocation = {}
      await router.push('/matching/karte')
      expect(router.currentRoute.value.path).toBe('/matching/position')
    })

    // vue-router matches this record non-strictly and case-insensitively and leaves
    // `to.path` as it was typed, so a guard comparing the address would let both of these
    // through -- a bookmark or a mail client that normalises the slash walks past the gate
    // and the map opens on nothing.
    it.each(['/matching/karte/', '/Matching/Karte'])('gates %s as well', async (address) => {
      store.state.userLocation = null
      await router.push(address)
      expect(router.currentRoute.value.path).toBe('/matching/position')
    })

    // The position tab is where both answers are given, so it can never be gated -- a
    // guard that caught it would send a member without a position round in circles.
    it('never stands in the way of the position tab itself', async () => {
      store.state.gmsAllowed = false
      store.state.userLocation = null
      await router.push('/matching/position')
      expect(router.currentRoute.value.path).toBe('/matching/position')
    })
  })

  describe('authorization', () => {
    it('redirects to login when not authorized', async () => {
      // fullPath as well as path: the real router always provides it, and the guard
      // stores it so a query or hash survives the login.
      const to = { path: '/protected', fullPath: '/protected', meta: { requiresAuth: true } }
      const from = {}
      let nextCalled = false
      let nextArg = null

      const next = (arg) => {
        nextCalled = true
        nextArg = arg
      }

      const authGuard = addedGuards.find(
        (guard) =>
          guard.toString().includes('requiresAuth') && guard.toString().includes('redirectPath'),
      )

      await authGuard(to, from, next)

      expect(nextCalled).toBe(true)
      expect(nextArg).toEqual({ path: '/login' })
      expect(storeCommitMock).toHaveBeenCalledWith('redirectPath', '/protected')
    })

    // The one that actually measures the fix: here path and fullPath differ, so a guard
    // that stored `path` would drop the query and the hash. Every deep link out of an
    // e-mail is made of exactly those two parts, and its reader is signed out.
    it('remembers query and hash, not just the path', async () => {
      const to = {
        path: '/contributions/own-contributions/1',
        fullPath: '/contributions/own-contributions/1?art=email#contributionListItem-42',
        meta: { requiresAuth: true },
      }

      const authGuard = addedGuards.find(
        (guard) =>
          guard.toString().includes('requiresAuth') && guard.toString().includes('redirectPath'),
      )

      await authGuard(to, {}, () => {})

      expect(storeCommitMock).toHaveBeenCalledWith(
        'redirectPath',
        '/contributions/own-contributions/1?art=email#contributionListItem-42',
      )
    })

    // The group's mails (P5) lead to `/contacts?group=`: after the sign-in, to that group.
    it("keeps the group of a group's mail for after the sign-in", async () => {
      const to = {
        path: '/contacts',
        fullPath: '/contacts?group=cafe-uuid',
        meta: { requiresAuth: true },
      }
      const authGuard = addedGuards.find(
        (guard) =>
          guard.toString().includes('requiresAuth') && guard.toString().includes('redirectPath'),
      )
      await authGuard(to, {}, () => {})
      expect(storeCommitMock).toHaveBeenCalledWith('redirectPath', '/contacts?group=cafe-uuid')
    })

    it('does not redirect to login when authorized', async () => {
      store.state.token = 'valid-token'
      // A sign-in counts while it runs, not merely because a token is kept.
      store.state.tokenTime = Math.floor(Date.now() / 1000) + 600

      // fullPath as well as path: the real router always provides it, and the guard
      // stores it so a query or hash survives the login.
      const to = { path: '/protected', fullPath: '/protected', meta: { requiresAuth: true } }
      const from = {}
      let nextCalled = false
      let nextArg = null

      const next = (arg) => {
        nextCalled = true
        nextArg = arg
      }

      const authGuard = addedGuards.find(
        (guard) =>
          guard.toString().includes('requiresAuth') && guard.toString().includes('redirectPath'),
      )

      await authGuard(to, from, next)

      expect(nextCalled).toBe(true)
      expect(nextArg).toBeUndefined()
    })

    /**
     * ⭐ A sign-in that has run out is no sign-in (Bernd, 28.09.2026): the reply button of a mail,
     * clicked more than a session after the wallet was closed, opened the page with the old token,
     * whose questions came back 403.13 -- and the logout behind them sent the member to the
     * overview after signing in. Put away first, the old sign-in cannot set that way back.
     */
    describe('a sign-in that has run out', () => {
      const authGuard = () =>
        addedGuards.find(
          (guard) =>
            guard.toString().includes('requiresAuth') && guard.toString().includes('redirectPath'),
        )
      const link = {
        path: '/contacts',
        fullPath: '/contacts?with=member-1&community=community-1',
        meta: { requiresAuth: true },
      }

      it('is put away before the link waits at the form, so the logout cannot overwrite it', async () => {
        store.state.token = 'old-token'
        store.state.tokenTime = Math.floor(Date.now() / 1000) - 3600
        const order = []
        // Done only after a turn, as an action that waits on something would be: the guard has
        // to wait for it, not merely start it.
        storeDispatchMock.mockImplementationOnce(async (action) => {
          await Promise.resolve()
          order.push(`dispatch ${action}`)
        })
        storeCommitMock.mockImplementation((mutation, value) => order.push(`${mutation} ${value}`))
        let nextArg
        await authGuard()(link, {}, (arg) => {
          nextArg = arg
        })
        storeCommitMock.mockReset()
        expect(order).toEqual([
          'dispatch logout',
          'redirectPath /contacts?with=member-1&community=community-1',
        ])
        expect(nextArg).toEqual({ path: '/login' })
      })

      it('goes to the form with the link even where clearing up after the logout fails', async () => {
        store.state.token = 'old-token'
        store.state.tokenTime = Math.floor(Date.now() / 1000) - 3600
        storeDispatchMock.mockRejectedValueOnce(new Error('storage refused'))
        let nextArg
        await authGuard()(link, {}, (arg) => {
          nextArg = arg
        })
        expect(storeCommitMock).toHaveBeenCalledWith(
          'redirectPath',
          '/contacts?with=member-1&community=community-1',
        )
        expect(nextArg).toEqual({ path: '/login' })
      })

      it('counts a token without an end as run out', async () => {
        store.state.token = 'old-token'
        store.state.tokenTime = null
        let nextArg
        await authGuard()(link, {}, (arg) => {
          nextArg = arg
        })
        expect(storeDispatchMock).toHaveBeenCalledWith('logout')
        expect(nextArg).toEqual({ path: '/login' })
      })

      it('signs nobody out who was never signed in', async () => {
        await authGuard()(link, {}, () => {})
        expect(storeDispatchMock).not.toHaveBeenCalled()
        expect(storeCommitMock).toHaveBeenCalledWith(
          'redirectPath',
          '/contacts?with=member-1&community=community-1',
        )
      })

      it('leaves a page without a sign-in alone, and the old token with it', async () => {
        store.state.token = 'old-token'
        store.state.tokenTime = Math.floor(Date.now() / 1000) - 3600
        let nextArg = 'not called'
        await authGuard()({ path: '/login', fullPath: '/login', meta: {} }, {}, (arg) => {
          nextArg = arg
        })
        expect(nextArg).toBeUndefined()
        expect(storeDispatchMock).not.toHaveBeenCalled()
        expect(storeCommitMock).not.toHaveBeenCalled()
      })
    })
  })
})

/**
 * The same, through a router with the guards in their real order: the link out of a mail, opened
 * where the sign-in ran out an hour ago, waits at the form -- with its query -- instead of the
 * page opening with the old token. The start guard before it lets such a start through.
 */
describe('a link out of a mail after the sign-in ran out', () => {
  const Page = { render: () => null }
  const startAt = async (address, state) => {
    const started = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', redirect: () => ({ path: '/login' }) },
        { path: '/login/:code?', name: 'Login', component: Page },
        { path: '/overview', name: 'Overview', component: Page, meta: { requiresAuth: true } },
        { path: '/contacts', name: 'Contacts', component: Page, meta: { requiresAuth: true } },
      ],
    })
    const own = { commit: vi.fn(), dispatch: vi.fn(), state: { token: null, ...state } }
    addNavigationGuards(started, own, { query: vi.fn() })
    await started.push(address)
    return { at: started.currentRoute.value.fullPath, own }
  }
  const LINK = '/contacts?with=member-1&community=community-1'

  it('goes to the form with the link kept, the old sign-in put away', async () => {
    const { at, own } = await startAt(LINK, {
      token: 'old-token',
      tokenTime: Math.floor(Date.now() / 1000) - 3600,
    })
    expect(at).toBe('/login')
    expect(own.dispatch).toHaveBeenCalledWith('logout')
    expect(own.commit).toHaveBeenCalledWith('redirectPath', LINK)
  })

  it('opens the page itself while the sign-in runs', async () => {
    const { at, own } = await startAt(LINK, {
      token: 'running-token',
      tokenTime: Math.floor(Date.now() / 1000) + 600,
    })
    expect(at).toBe(LINK)
    expect(own.dispatch).not.toHaveBeenCalledWith('logout')
  })

  it('counts the last five seconds as over, as the start does', async () => {
    const { at, own } = await startAt(LINK, {
      token: 'ending-token',
      tokenTime: Math.floor(Date.now() / 1000) + 3,
    })
    expect(at).toBe('/login')
    expect(own.commit).toHaveBeenCalledWith('redirectPath', LINK)
  })
})

/**
 * A wallet that starts on the sign-in page while its session still runs goes on (Bernd, 26. and
 * 27.09.2026: the wallet on an iPhone's home screen starts over when another app needs the
 * memory, and came back on the form). Each case builds a router of its own, because what counts
 * is whether the wallet STARTS there: a router's first navigation comes from START_LOCATION,
 * every later one from inside the wallet.
 */
describe('a start with a running session', () => {
  const now = () => Math.floor(Date.now() / 1000)
  const RUNNING = { token: 'running-token', tokenTime: now() + 600 }
  const Page = { render: () => null }

  /** A router with the real records that matter here, started at `address` with `state`. */
  const startAt = async (address, state) => {
    const started = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', redirect: () => ({ path: '/login' }) },
        { path: '/login/:code?', name: 'Login', component: Page },
        { path: '/overview', name: 'Overview', component: Page, meta: { requiresAuth: true } },
        { path: '/contacts', name: 'Contacts', component: Page, meta: { requiresAuth: true } },
        { path: '/redeem/:code', name: 'Redeem', component: Page },
        { path: '/register/:code?', name: 'Register', component: Page },
      ],
    })
    const own = { commit: vi.fn(), dispatch: vi.fn(), state: { token: null, ...state } }
    addNavigationGuards(started, own, { query: vi.fn() })
    await started.push(address)
    return started
  }
  const whereAfter = async (address, state) =>
    (await startAt(address, state)).currentRoute.value.fullPath

  it('goes on from the sign-in page to the overview', async () => {
    expect(await whereAfter('/login', RUNNING)).toBe('/overview')
  })

  it('goes on from /, which leads to the sign-in page', async () => {
    expect(await whereAfter('/', RUNNING)).toBe('/overview')
  })

  // As the sign-in itself does (Login.vue): a redeem code goes on to its link, with its query.
  it('takes a redeem code on to its link, with the query', async () => {
    expect(await whereAfter('/login/abc123?referrer=Anna-Sonne', RUNNING)).toBe(
      '/redeem/abc123?referrer=Anna-Sonne',
    )
  })

  // `redirectPath` is written for somebody signed out; with a session running it is left over.
  it('goes to the overview, not to a place left over from an earlier sign-in', async () => {
    expect(await whereAfter('/login', { ...RUNNING, redirectPath: '/transactions' })).toBe(
      '/overview',
    )
  })

  it.each([
    ['no token', { token: null, tokenTime: now() + 600 }],
    ['a token without an end', { token: 'running-token', tokenTime: null }],
    ['a session that has ended', { token: 'running-token', tokenTime: now() - 60 }],
    // The margin the redeem page allows too (TransactionLink.vue).
    ['the last five seconds of a session', { token: 'running-token', tokenTime: now() + 3 }],
  ])('keeps the form with %s', async (_, state) => {
    expect(await whereAfter('/login', state)).toBe('/login')
  })

  // That page signs in FOR a project and hands the member over to it (Login.vue).
  it('keeps the form for a sign-in for a project', async () => {
    expect(await whereAfter('/login?project=probe', RUNNING)).toBe('/login?project=probe')
  })

  // ⛔ Signing in over an open session stays possible from inside the wallet: after a
  // registration on a phone where somebody is still signed in, "Sign in" leads to the form.
  it('keeps the form on a way in from inside the running wallet', async () => {
    const started = await startAt('/register', RUNNING)
    await started.push('/login')
    expect(started.currentRoute.value.fullPath).toBe('/login')
  })

  it('leaves every other start as it was', async () => {
    expect(await whereAfter('/register', RUNNING)).toBe('/register')
    expect(await whereAfter('/redeem/abc123', RUNNING)).toBe('/redeem/abc123')
  })

  /**
   * ⭐ Back into the conversation (Bernd, 27.09.2026: "not in the dialog thread any more"): where
   * a thread was open as the wallet went out of sight and did not come back, it left a note
   * (utils/chatReturn), and the start opens that conversation again.
   */
  describe('with a conversation to come back to', () => {
    const ME = { ...RUNNING, gradidoID: 'me-id' }
    const note = (value = {}, me = 'me-id') =>
      window.localStorage.setItem(
        `chat-return:${me}`,
        JSON.stringify({
          gradidoID: 'anna-id',
          communityUuid: 'other-uuid',
          at: Date.now(),
          ...value,
        }),
      )
    const noted = (me = 'me-id') => window.localStorage.getItem(`chat-return:${me}`)
    const ANNA_THREAD = '/contacts?with=anna-id&community=other-uuid'
    afterEach(() => {
      window.localStorage.clear()
      takeHeldChatText({ gradidoID: '' })
    })

    it.each(['/login', '/', '/overview'])('opens it again from a start on %s', async (address) => {
      note()
      expect(await whereAfter(address, ME)).toBe(ANNA_THREAD)
    })

    // ⭐ The words not sent yet (Bernd, 27.09.2026) go to that conversation's field in memory:
    // an address would put them in the browser's history.
    it('hands the words not sent yet to that conversation, never through the address', async () => {
      note({ text: 'Hier ist die Datei:' })
      const at = await whereAfter('/login', ME)

      expect(at).toBe(ANNA_THREAD)
      expect(decodeURIComponent(at)).not.toContain('Datei')
      expect(takeHeldChatText({ gradidoID: 'anna-id' })).toBe('Hier ist die Datei:')
    })

    it('holds no words where the start does not open the conversation', async () => {
      note({ text: 'Hier ist die Datei:' })
      await whereAfter('/login', { ...ME, tokenTime: now() - 60 })
      expect(takeHeldChatText({ gradidoID: 'anna-id' })).toBe('')

      note({ text: 'Hier ist die Datei:' })
      await whereAfter('/register', ME)
      expect(takeHeldChatText({ gradidoID: 'anna-id' })).toBe('')
    })

    // A group's thread (P5) comes back as the group's mails open it.
    it("opens a group's window again, with its words held for it", async () => {
      window.localStorage.setItem(
        'chat-return:me-id',
        JSON.stringify({ groupUuid: 'cafe-uuid', at: Date.now(), text: 'Bis Samstag' }),
      )
      expect(await whereAfter('/overview', ME)).toBe('/contacts?group=cafe-uuid')
      expect(takeHeldChatText({ groupUuid: 'cafe-uuid' })).toBe('Bis Samstag')
    })

    it('names no community for a conversation in this one', async () => {
      note({ communityUuid: null })
      expect(await whereAfter('/overview', ME)).toBe('/contacts?with=anna-id')
    })

    it('comes back to it once: the note goes with the start', async () => {
      note()
      await whereAfter('/login', ME)
      expect(noted()).toBeNull()
      expect(await whereAfter('/login', ME)).toBe('/overview')
    })

    it('lets an hour-old note go', async () => {
      note({ at: Date.now() - 60 * 60 * 1000 - 1000 })
      expect(await whereAfter('/overview', ME)).toBe('/overview')
      expect(noted()).toBeNull()
    })

    // One browser serves several members.
    it("does not take another member's conversation", async () => {
      note({}, 'other-member')
      expect(await whereAfter('/login', ME)).toBe('/overview')
      expect(noted('other-member')).not.toBeNull()
    })

    // Without a running session the member signs in anew; a conversation from before is nowhere
    // to come back to, and the note goes all the same.
    it('lets the note go where the session has ended, and shows the form', async () => {
      note()
      expect(await whereAfter('/login', { ...ME, tokenTime: now() - 60 })).toBe('/login')
      expect(noted()).toBeNull()
    })

    it('lets a redeem code go first', async () => {
      note()
      expect(await whereAfter('/login/abc123', ME)).toBe('/redeem/abc123')
      expect(noted()).toBeNull()
    })

    it('keeps the form for a sign-in for a project, and lets the note go', async () => {
      note()
      expect(await whereAfter('/login?project=probe', ME)).toBe('/login?project=probe')
      expect(noted()).toBeNull()
    })

    // The note serves the one start after it, whatever that start becomes.
    it('is let go by a start anywhere else, which it leaves as it was', async () => {
      note()
      const started = await startAt('/register', ME)
      expect(started.currentRoute.value.fullPath).toBe('/register')
      expect(noted()).toBeNull()

      await started.push('/overview')
      expect(started.currentRoute.value.fullPath).toBe('/overview')
    })

    // Only a start: on the way from page to page nothing is taken, and nothing opens.
    it('is not taken on a way from inside the running wallet', async () => {
      const started = await startAt('/register', ME)
      note()
      await started.push('/overview')
      expect(started.currentRoute.value.fullPath).toBe('/overview')
      expect(noted()).not.toBeNull()
    })
  })
})

/**
 * The hand-over as the pin of the admin interface uses it: a window of its own, whose FIRST
 * page is `/authenticate?token=…&redirect=…`. What comes of the hand-over is entered from
 * START_LOCATION then, not from inside a wallet that is running -- so the start guard has its
 * say as well. A router of its own per case, as in the block above, and a store that keeps what
 * it is told: the guards behind the hand-over read the sign-in and the member's two answers for
 * the map off it.
 */
describe('a start on the hand-over, with a page to go on to', () => {
  const now = () => Math.floor(Date.now() / 1000)
  const Page = { render: () => null }
  const place = { latitude: 51.314472, longitude: 9.495606 }
  const MODERATOR = { gradidoID: 'me-id', gmsAllowed: true, userLocation: place }
  const SIGNED_OUT = {
    token: null,
    tokenTime: null,
    gradidoID: null,
    gmsAllowed: null,
    userLocation: null,
  }
  const MAP =
    '/matching/karte?with=1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d&community=9f8e7d6c-5b4a-4c3d-9e2f-1a0b9c8d7e6f'
  const handOver = (redirect) =>
    '/authenticate?token=handed-token' +
    (redirect === undefined ? '' : `&redirect=${encodeURIComponent(redirect)}`)

  /**
   * A window that starts at `address`. `answer` is what the server says to the token handed
   * over: the member it belongs to, or an Error where it is not accepted. `state` is what an
   * earlier use of the wallet left in this browser.
   */
  const startAt = async (address, { answer = MODERATOR, state = {} } = {}) => {
    const started = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/authenticate', name: 'Authenticate', component: Page },
        { path: '/login/:code?', name: 'Login', component: Page },
        { path: '/overview', name: 'Overview', component: Page, meta: { requiresAuth: true } },
        { path: '/contacts', name: 'Contacts', component: Page, meta: { requiresAuth: true } },
        {
          path: '/matching/karte',
          name: 'MatchingMap',
          component: Page,
          meta: { requiresAuth: true, requiresFindable: true },
        },
        { path: '/matching/:tab', name: 'Matching', component: Page, meta: { requiresAuth: true } },
      ],
    })
    // The three things the real store does that the guards behind the hand-over go by: a token
    // runs for a session from when it is taken, a sign-in brings the member, a sign-out takes
    // both away.
    const own = {
      state: { ...SIGNED_OUT, ...state },
      commit: vi.fn((name, value) => {
        if (name === 'token') {
          Object.assign(own.state, { token: value, tokenTime: value ? now() + 600 : null })
        }
      }),
      dispatch: vi.fn((name, member) => {
        if (name === 'login') Object.assign(own.state, member)
        if (name === 'logout') Object.assign(own.state, SIGNED_OUT)
      }),
    }
    const server = {
      query:
        answer instanceof Error
          ? vi.fn().mockRejectedValue(answer)
          : vi.fn().mockResolvedValue({ data: { verifyLogin: answer } }),
    }
    addNavigationGuards(started, own, server)
    await started.push(address)
    return { at: started.currentRoute.value.fullPath, own, server }
  }

  it('starts the window on the page named, with its query, signed in by the token handed over', async () => {
    const { at, own, server } = await startAt(handOver(MAP))

    expect(at).toBe(MAP)
    expect(own.commit).toHaveBeenCalledWith('token', 'handed-token')
    expect(server.query).toHaveBeenCalledTimes(1)
    expect(own.dispatch).toHaveBeenCalledWith('login', MODERATOR)
    expect(own.commit).not.toHaveBeenCalledWith('redirectPath', expect.anything())
  })

  it('starts it on the overview without a page named, as before', async () => {
    expect((await startAt(handOver())).at).toBe('/overview')
  })

  it('starts it on the overview with an address that is not followed', async () => {
    expect((await startAt(handOver('//example.org/matching/karte'))).at).toBe('/overview')
  })

  // The rule of the map, for a moderator as for every member.
  it('starts it where the two answers are given, for a moderator who is not on the map', async () => {
    const { at } = await startAt(handOver(MAP), { answer: { ...MODERATOR, gmsAllowed: false } })
    expect(at).toBe('/matching/position')
  })

  // The admin interface left open past the end of its session hands over a token that ran out.
  describe('where the token is not accepted', () => {
    const REFUSED = new Error('403.13 - Client certificate revoked')

    it('starts the window on the form, with the page named kept for after the sign-in', async () => {
      const { at, own } = await startAt(handOver(MAP), { answer: REFUSED })

      expect(at).toBe('/login')
      expect(own.dispatch).toHaveBeenCalledWith('logout')
      expect(own.dispatch).not.toHaveBeenCalledWith('login', expect.anything())
      expect(own.commit).toHaveBeenCalledWith('redirectPath', MAP)
      expect(own.state.token).toBeNull()
    })

    // The token handed over takes the place of the one that was there before the server is
    // asked about it. So a window in which the wallet was signed in is signed out by a
    // hand-over that is refused -- which is why the pin keeps the admin interface's own
    // sign-in from running out while a moderator works with it (MemberWalletLink.vue).
    it('ends a sign-in that was running in this window', async () => {
      const { at, own } = await startAt(handOver(MAP), {
        answer: REFUSED,
        state: { ...MODERATOR, token: 'the-window-s-own', tokenTime: now() + 600 },
      })

      expect(at).toBe('/login')
      expect(own.state.token).toBeNull()
      expect(own.commit).toHaveBeenCalledWith('redirectPath', MAP)
    })
  })

  /**
   * The note the chat leaves for a wallet that went out of sight with a conversation open
   * (utils/chatReturn) serves the one start after it, whatever that start becomes -- and a
   * window opened by a pin is such a start. It is taken, and only a start that ends on the
   * overview opens the conversation: the hand-over without a page named does, as it did for
   * "Mein Konto" before; the one with a page named goes to that page.
   */
  describe('with a conversation left open in this browser', () => {
    const noted = () => window.localStorage.getItem('chat-return:me-id')
    beforeEach(() => {
      window.localStorage.setItem(
        'chat-return:me-id',
        JSON.stringify({
          gradidoID: 'anna-id',
          communityUuid: 'other-uuid',
          at: Date.now(),
          text: 'Hier ist die Datei:',
        }),
      )
    })
    afterEach(() => {
      window.localStorage.clear()
      takeHeldChatText({ gradidoID: '' })
    })

    it('goes to the page named, and the note goes with this start', async () => {
      expect((await startAt(handOver(MAP))).at).toBe(MAP)
      expect(noted()).toBeNull()
      expect(takeHeldChatText({ gradidoID: 'anna-id' })).toBe('')
    })

    it('opens the conversation without a page named, as before', async () => {
      expect((await startAt(handOver())).at).toBe('/contacts?with=anna-id&community=other-uuid')
      expect(noted()).toBeNull()
      expect(takeHeldChatText({ gradidoID: 'anna-id' })).toBe('Hier ist die Datei:')
    })
  })
})

/**
 * The event link, `/event?interest=…` (Event-Matching): what a host hands to the people of a
 * congress. Each case builds a router of its own, for the reason given above -- whether the
 * wallet STARTS on the link decides what a running session does with it.
 */
describe('the event link', () => {
  const now = () => Math.floor(Date.now() / 1000)
  const RUNNING = { token: 'running-token', tokenTime: now() + 600 }
  const RUN_OUT = { token: 'old-token', tokenTime: now() - 3600 }
  const Page = { render: () => null }
  const LINK = '/event?interest=Kongress%20Frequency%20Healing&details=Selbstheilung&remote=1&v=1'
  const ENTRY = { summary: 'Kongress Frequency Healing', details: 'Selbstheilung', remote: true }
  // As the store keeps it: with the moment it was kept.
  const KEPT = { ...ENTRY, keptAt: expect.any(Number) }
  const entryDraft = useEntryDraft()

  /** A router with the records that matter here, and a store that can be signed in later. */
  const wallet = (state) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', redirect: () => ({ path: '/login' }) },
        { path: '/login/:code?', name: 'Login', component: Page },
        { path: '/register/:code?', name: 'Register', component: Page },
        { path: '/overview', name: 'Overview', component: Page, meta: { requiresAuth: true } },
        { path: '/event', name: 'EventMatchingLanding', component: Page },
        { path: '/matching/:tab', name: 'Matching', component: Page, meta: { requiresAuth: true } },
      ],
    })
    const own = { commit: vi.fn(), dispatch: vi.fn(), state: { token: null, ...state } }
    addNavigationGuards(router, own, { query: vi.fn() })
    return { router, own, at: () => router.currentRoute.value.fullPath }
  }
  const startAt = async (address, state) => {
    const started = wallet(state)
    await started.router.push(address)
    return started
  }
  /** One step of the browser's history, waited for until the wallet stands somewhere. */
  const step = (router, delta) =>
    new Promise((resolve) => {
      const off = router.afterEach(() => {
        off()
        resolve()
      })
      router.go(delta)
    })

  // The draft lives in a module: nothing a case leaves behind may open the next one's form.
  afterEach(() => {
    entryDraft.take()
  })

  describe('opened by somebody who is not signed in', () => {
    it('shows its page and keeps the entry for the sign-in that follows', async () => {
      const { at, own } = await startAt(LINK)

      expect(at()).toBe(LINK)
      expect(own.commit).toHaveBeenCalledWith('eventMatchingEntry', KEPT)
    })

    // Nobody is signed in, so the entry is nobody's: it counts for an hour from now
    // (keptEventMatchingEntry), and "now" is what is written beside it.
    it('writes the moment beside it', async () => {
      const before = Date.now()
      const { own } = await startAt(LINK)
      const after = Date.now()

      const [, kept] = own.commit.mock.calls.find(([name]) => name === 'eventMatchingEntry')
      expect(kept.keptAt).toBeGreaterThanOrEqual(before)
      expect(kept.keptAt).toBeLessThanOrEqual(after)
    })

    it('hands nothing to the form: there is nobody to offer it to', async () => {
      await startAt(LINK)

      expect(entryDraft.take()).toBeNull()
    })

    // Of the two wishes kept for after a sign-in the younger one counts (Login.vue): the link
    // is the latest, so a page that waited from an earlier visit goes.
    it('puts the way back to the overview', async () => {
      const { own } = await startAt(LINK, { redirectPath: '/contacts?with=member-1' })

      expect(own.commit).toHaveBeenCalledWith('redirectPath', '/overview')
    })

    /**
     * A session that has run out counts as nobody -- and is put away first. Left in the store,
     * the old token would be signed out by the next page that asks for a sign-in (the overview
     * a bookmark opens), and that sign-out lets go of what is kept here: the member would sign
     * in and find nothing of the link.
     */
    it('puts a session that has run out away first, and keeps the entry after that', async () => {
      const { at, own } = await startAt(LINK, RUN_OUT)

      expect(at()).toBe(LINK)
      expect(own.dispatch).toHaveBeenCalledWith('logout')
      expect(own.commit).toHaveBeenCalledWith('eventMatchingEntry', KEPT)
      // In this order: the sign-out lets go of a kept entry itself (store.js).
      const signedOut = own.dispatch.mock.invocationCallOrder[0]
      const kept =
        own.commit.mock.invocationCallOrder[
          own.commit.mock.calls.findIndex(([name]) => name === 'eventMatchingEntry')
        ]
      expect(kept).toBeGreaterThan(signedOut)
    })

    it('signs nobody out where no token lies in the store', async () => {
      const { own } = await startAt(LINK)

      expect(own.dispatch).not.toHaveBeenCalled()
    })

    // The sign-out takes the token first; what can fail after that is clearing up -- storage
    // refused in a private window. That must not keep the visitor from the page.
    it('shows the page and keeps the entry all the same where the clearing-up fails', async () => {
      const started = wallet(RUN_OUT)
      started.own.dispatch.mockRejectedValue(new Error('storage refused'))

      await started.router.push(LINK)

      expect(started.at()).toBe(LINK)
      expect(started.own.commit).toHaveBeenCalledWith('eventMatchingEntry', KEPT)
    })

    it('counts the last five seconds of a session as over, as every guard here does', async () => {
      const { at } = await startAt(LINK, { token: 'ending-token', tokenTime: now() + 3 })

      expect(at()).toBe(LINK)
    })

    it('keeps the newer entry where a second link is opened', async () => {
      const { router, own } = await startAt(LINK)
      await router.push('/event?interest=Training%20X&remote=0')

      expect(own.commit).toHaveBeenLastCalledWith('redirectPath', '/overview')
      expect(own.commit).toHaveBeenCalledWith('eventMatchingEntry', {
        summary: 'Training X',
        details: null,
        remote: false,
        keptAt: expect.any(Number),
      })
    })

    // Back on the page by the browser's back button, from the sign-in or from another site:
    // the visitor reads what the link offers once more, and it is kept from that moment.
    it('keeps the entry anew where the visitor comes back to the page', async () => {
      const { router, own, at } = await startAt(LINK)
      await router.push('/login')
      own.commit.mockClear()

      await step(router, -1)

      expect(at()).toBe(LINK)
      expect(own.commit).toHaveBeenCalledWith('eventMatchingEntry', KEPT)
    })
  })

  describe('without a sentence', () => {
    it.each([['/event'], ['/event?interest='], ['/event?interest=%20%20'], ['/event?details=x']])(
      'is no event link, and %s leads to the sign-in page',
      async (address) => {
        const { at, own } = await startAt(address)

        expect(at()).toBe('/login')
        expect(own.commit).not.toHaveBeenCalledWith('eventMatchingEntry', expect.anything())
      },
    )

    // The sign-in page of a wallet that starts with its session running goes on to the
    // overview (the guard above); the form opens with nothing in it.
    it('leads a running session to the overview, with nothing for the form', async () => {
      const { at } = await startAt('/event', RUNNING)

      expect(at()).toBe('/overview')
      expect(entryDraft.take()).toBeNull()
    })

    it('leaves an entry kept from an earlier link where it is', async () => {
      const { own } = await startAt('/event', { eventMatchingEntry: ENTRY })

      expect(own.commit).not.toHaveBeenCalledWith('eventMatchingEntry', expect.anything())
    })
  })

  describe('opened with a session running', () => {
    it('leads on to the entries at once, and its page is never shown', async () => {
      const { at } = await startAt(LINK, RUNNING)

      expect(at()).toBe('/matching/entries')
    })

    it('hands the entry to the form: an interest, with the answer the link gives for afar', async () => {
      await startAt(LINK, RUNNING)

      expect(entryDraft.take()).toEqual({
        summary: 'Kongress Frequency Healing',
        details: 'Selbstheilung',
        remote: true,
        matchingType: 'interesse',
        unlessThere: true,
      })
    })

    it('hands over empty details as the form holds them, and "only here" as the link says it', async () => {
      await startAt('/event?interest=Training%20X&remote=0', RUNNING)

      expect(entryDraft.take()).toEqual({
        summary: 'Training X',
        details: '',
        remote: false,
        matchingType: 'interesse',
        unlessThere: true,
      })
    })

    // The member has the form to decide in; the store is for somebody not signed in.
    it('keeps nothing in the store', async () => {
      const { own } = await startAt(LINK, RUNNING)

      expect(own.commit).not.toHaveBeenCalledWith('eventMatchingEntry', expect.anything())
      expect(own.commit).not.toHaveBeenCalledWith('redirectPath', expect.anything())
    })

    it('takes none of the link along in the address', async () => {
      const { router } = await startAt(LINK, RUNNING)

      expect(router.currentRoute.value.query).toEqual({})
    })

    // vue-router matches the record whatever the case and with a slash behind it, and leaves
    // the address as it was typed. Read off the route's name, every spelling is the link. And
    // a blank may be written as a plus, as a form writes it: the router reads it as a blank.
    it.each([
      ['/EVENT?interest=Kongress%20X'],
      ['/event/?interest=Kongress%20X'],
      ['/event?interest=Kongress+X'],
    ])('reads %s as the link too', async (address) => {
      const { at } = await startAt(address, RUNNING)

      expect(at()).toBe('/matching/entries')
      expect(entryDraft.take()?.summary).toBe('Kongress X')
    })
  })

  /**
   * Whoever saw the page signed out, went on to the sign-in and signed in has the link one step
   * behind the entries. That step is not a start on the link: it opens no form again over
   * what the member saved or closed, and it does not stay in the way -- it becomes the
   * entries, so the step after it leads out of the wallet.
   */
  describe('come back to by the back button, signed in meanwhile', () => {
    const signedInAfterTheLink = async () => {
      const started = await startAt(LINK)
      await started.router.push('/login')
      // The sign-in: a session runs, and Login.vue goes on to the entries in the form's place.
      Object.assign(started.own.state, RUNNING)
      await started.router.replace('/matching/entries')
      started.own.commit.mockClear()
      return started
    }

    it('ends on the entries', async () => {
      const { router, at } = await signedInAfterTheLink()

      await step(router, -1)

      expect(at()).toBe('/matching/entries')
    })

    it('opens no form again', async () => {
      const { router } = await signedInAfterTheLink()

      await step(router, -1)

      expect(entryDraft.take()).toBeNull()
    })

    it('keeps nothing in the store either', async () => {
      const { router, own } = await signedInAfterTheLink()

      await step(router, -1)

      expect(own.commit).not.toHaveBeenCalledWith('eventMatchingEntry', expect.anything())
    })

    // Replaced, not pushed: a step pushed here would lie BEHIND the link, and every press of
    // the back button would land on the link again and be sent forward -- no way out.
    //
    // And written at all: the step back comes from the entries, and vue-router drops a
    // navigation to the page it stands on. Without `force` nothing is written, and the
    // address bar keeps the link while the entries are shown.
    it('takes the place of the link in the history instead of adding a step behind it', async () => {
      const { router, at } = await signedInAfterTheLink()
      const history = router.options.history
      const replace = vi.spyOn(history, 'replace')
      const push = vi.spyOn(history, 'push')

      await step(router, -1)

      expect(at()).toBe('/matching/entries')
      expect(replace).toHaveBeenCalledWith('/matching/entries', expect.anything())
      expect(push).not.toHaveBeenCalled()
      expect(history.location).toBe('/matching/entries')
    })

    it('does the same where the step back comes from another page', async () => {
      const { router, at } = await signedInAfterTheLink()
      await router.replace('/overview')
      const history = router.options.history

      await step(router, -1)

      expect(at()).toBe('/matching/entries')
      expect(history.location).toBe('/matching/entries')
    })
  })
})
