import { describe, it, expect, vi, beforeEach } from 'vitest'
import addNavigationGuards from './guards'
import { verifyLogin } from '../graphql/verifyLogin'
import CONFIG from '../config'

vi.mock('../graphql/verifyLogin', () => ({
  verifyLogin: 'mocked-verify-login-query',
}))

vi.mock('../config', () => ({
  default: {
    DEBUG_DISABLE_AUTH: false,
  },
}))

describe('Navigation Guards', () => {
  let router, store, apollo, i18n, storeCommitMock, apolloQueryMock, i18nLocaleMock

  beforeEach(() => {
    vi.clearAllMocks()

    storeCommitMock = vi.fn()
    apolloQueryMock = vi.fn()
    i18nLocaleMock = vi.fn()

    router = {
      beforeEach: vi.fn(),
    }

    store = {
      commit: storeCommitMock,
      state: {
        token: null,
        moderator: null,
      },
    }

    apollo = {
      query: apolloQueryMock,
    }

    i18n = {
      global: {
        locale: {
          value: 'en',
        },
      },
    }

    addNavigationGuards(router, store, apollo, i18n)
  })

  describe('First Navigation Guard', () => {
    let firstGuard, next

    beforeEach(() => {
      firstGuard = router.beforeEach.mock.calls[0][0]
      next = vi.fn()
    })

    it('calls next() for non-authenticate routes', async () => {
      await firstGuard({ path: '/some-route' }, {}, next)
      expect(next).toHaveBeenCalledWith()
    })

    describe('Authenticate route', () => {
      beforeEach(() => {
        apolloQueryMock.mockResolvedValue({
          data: {
            verifyLogin: {
              roles: ['ADMIN'],
              language: 'de',
            },
          },
        })
      })

      it('commits token to store', async () => {
        await firstGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(storeCommitMock).toHaveBeenCalledWith('token', 'valid-token')
      })

      it('calls apollo query with correct parameters', async () => {
        await firstGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(apolloQueryMock).toHaveBeenCalledWith({
          query: verifyLogin,
          fetchPolicy: 'network-only',
        })
      })

      it('sets i18n locale', async () => {
        await firstGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(i18n.global.locale.value).toBe('de')
      })

      it('commits moderator to store', async () => {
        await firstGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(storeCommitMock).toHaveBeenCalledWith('moderator', {
          roles: ['ADMIN'],
          language: 'de',
        })
      })

      it('redirects to home on successful authentication', async () => {
        await firstGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(next).toHaveBeenCalledWith({ path: '/' })
      })

      it('redirects to not-found if no roles', async () => {
        apolloQueryMock.mockResolvedValue({
          data: {
            verifyLogin: {
              roles: [],
              language: 'de',
            },
          },
        })
        await firstGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(next).toHaveBeenCalledWith({ path: '/not-found' })
      })

      it('redirects to not-found on error', async () => {
        apolloQueryMock.mockRejectedValue(new Error('Auth error'))
        await firstGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(next).toHaveBeenCalledWith({ path: '/not-found' })
      })
    })
  })

  describe('Second Navigation Guard', () => {
    let secondGuard, next

    beforeEach(() => {
      secondGuard = router.beforeEach.mock.calls[1][0]
      next = vi.fn()
    })

    it('allows navigation when auth is disabled for debug', () => {
      CONFIG.DEBUG_DISABLE_AUTH = true
      secondGuard({ path: '/' }, {}, next)
      expect(next).toHaveBeenCalledWith()
      CONFIG.DEBUG_DISABLE_AUTH = false
    })

    it('redirects to not-found when no token', () => {
      secondGuard({ path: '/' }, {}, next)
      expect(next).toHaveBeenCalledWith({ path: '/not-found' })
    })

    it('redirects to not-found when no moderator', () => {
      store.state.token = 'valid-token'
      secondGuard({ path: '/' }, {}, next)
      expect(next).toHaveBeenCalledWith({ path: '/not-found' })
    })

    it('redirects to not-found when moderator has no roles', () => {
      store.state.token = 'valid-token'
      store.state.moderator = { roles: [] }
      secondGuard({ path: '/' }, {}, next)
      expect(next).toHaveBeenCalledWith({ path: '/not-found' })
    })

    it('allows navigation for authenticated admin', () => {
      store.state.token = 'valid-token'
      store.state.moderator = { roles: ['ADMIN'] }
      secondGuard({ path: '/' }, {}, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('allows navigation to not-found route', () => {
      secondGuard({ path: '/not-found' }, {}, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('allows navigation to logout route', () => {
      secondGuard({ path: '/logout' }, {}, next)
      expect(next).toHaveBeenCalledWith()
    })
  })
})
