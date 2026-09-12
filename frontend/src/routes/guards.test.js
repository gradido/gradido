import { describe, it, expect, beforeEach, vi } from 'vitest'
import addNavigationGuards from './guards'
import { createRouter, createWebHistory } from 'vue-router'
import { verifyLogin } from '../graphql/queries'

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
