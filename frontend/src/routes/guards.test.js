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
    store.state.token = null
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

    // Two fields the login store action deliberately does not read off its payload,
    // because the other caller of that action feeds it a login result, which cannot carry
    // either. Whoever holds a verifyLogin result puts them in the store -- here that is
    // free, the result is already in hand. Nothing held these two commits before, and the
    // one for the setting is the repair for a switch that showed every member "hidden".
    it('puts the picture and its visibility setting in the store', async () => {
      await router.push({ path: '/authenticate', query: { token: 'valid-token' } })

      expect(storeCommitMock).toHaveBeenCalledWith('avatar', 'base64-picture')
      expect(storeCommitMock).toHaveBeenCalledWith('avatarVisibleToMembers', false)
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

  describe('authorization', () => {
    it('redirects to login when not authorized', async () => {
      const to = { path: '/protected', meta: { requiresAuth: true } }
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

    it('does not redirect to login when authorized', async () => {
      store.state.token = 'valid-token'

      const to = { path: '/protected', meta: { requiresAuth: true } }
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
