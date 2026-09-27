import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import addNavigationGuards from './guards'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { verifyLogin } from '../graphql/queries'
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
  })

  // ES-021: the creation area is gone for a project account, from the address bar too.
  describe('the creation area and the project account', () => {
    beforeEach(() => {
      store.state.token = 'valid-token'
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

    it('does not redirect to login when authorized', async () => {
      store.state.token = 'valid-token'

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
