import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONFIG } from '../config'
import { verifyLogin } from '../graphql/verifyLogin'
import { addNavigationGuards } from './guards'

vi.mock('../graphql/verifyLogin', () => ({
  verifyLogin: 'mocked-verify-login-query',
}))

vi.mock('../config', () => ({
  CONFIG: {
    DEBUG_DISABLE_AUTH: false,
  },
}))

describe('Navigation Guards', () => {
  let router
  let store
  let apollo
  let i18n
  let setTokenMock
  let setModeratorMock
  let apolloQueryMock

  beforeEach(() => {
    vi.clearAllMocks()

    setTokenMock = vi.fn()
    setModeratorMock = vi.fn()
    apolloQueryMock = vi.fn()

    router = {
      beforeEach: vi.fn(),
    }

    store = {
      setToken: setTokenMock,
      setModerator: setModeratorMock,
      token: null,
      moderator: null,
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
    let firstGuard
    let next

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
              role: 'ADMIN',
              language: 'de',
            },
          },
        })
      })

      it('sets the token in the store', async () => {
        await firstGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(setTokenMock).toHaveBeenCalledWith('valid-token')
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

      it('sets the moderator in the store', async () => {
        await firstGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(setModeratorMock).toHaveBeenCalledWith({
          role: 'ADMIN',
          language: 'de',
        })
      })

      it('redirects to home on successful authentication', async () => {
        await firstGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(next).toHaveBeenCalledWith({ path: '/' })
      })

      // The wallet's way back (its bar "Zurück zum Admin", frontend/src/utils/adminWayBack.js)
      // names the page a pin, a bubble or an arrow was pressed on; the sign-in goes there.
      it('goes on to the page the wallet names, with its own query', async () => {
        await firstGuard(
          {
            path: '/authenticate',
            query: { token: 'valid-token', redirect: '/creation-confirm?tab=open' },
          },
          {},
          next,
        )
        expect(next).toHaveBeenCalledWith('/creation-confirm?tab=open')
      })

      it.each([
        ['another site', '//evil.example/admin'],
        ['another site, the other way round', '/\\evil.example'],
        ['an address of its own', 'https://evil.example/'],
        ['no page', ''],
        ['the sign-in itself', '/authenticate?token=x'],
        ['more than one', ['/user', '/creation-confirm']],
      ])('goes to the start when the wallet names %s', async (_, redirect) => {
        await firstGuard(
          { path: '/authenticate', query: { token: 'valid-token', redirect } },
          {},
          next,
        )
        expect(next).toHaveBeenCalledWith({ path: '/' })
      })

      it('redirects to not-found if no role', async () => {
        apolloQueryMock.mockResolvedValue({
          data: {
            verifyLogin: {
              role: null,
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

      // The cases above have the wallet on another origin, as in development. On a deployment
      // it shares this one, and the one token both apps keep (utils/authToken): that one is
      // taken, and one in the address is not.
      describe('with the wallet on this origin', () => {
        beforeEach(() => {
          CONFIG.WALLET_AUTH_URL = `${window.location.origin}/authenticate?token=`
        })

        afterEach(() => {
          delete CONFIG.WALLET_AUTH_URL
          localStorage.removeItem('auth-token')
        })

        it('takes the token kept for both apps, and not the one in the address', async () => {
          localStorage.setItem(
            'auth-token',
            JSON.stringify({ token: 'handed-token', at: Date.now() }),
          )
          await firstGuard({ path: '/authenticate', query: { token: 'from-a-link' } }, {}, next)
          expect(setTokenMock).toHaveBeenCalledWith('handed-token')
          expect(setTokenMock).not.toHaveBeenCalledWith('from-a-link')
          expect(next).toHaveBeenCalledWith({ path: '/' })
        })

        it('signs nobody in by a token in the address alone', async () => {
          await firstGuard({ path: '/authenticate', query: { token: 'from-a-link' } }, {}, next)
          expect(setTokenMock).not.toHaveBeenCalled()
          expect(apolloQueryMock).not.toHaveBeenCalled()
          expect(next).toHaveBeenCalledWith()
        })
      })
    })
  })

  describe('Second Navigation Guard', () => {
    let secondGuard
    let next

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
      store.token = 'valid-token'
      secondGuard({ path: '/' }, {}, next)
      expect(next).toHaveBeenCalledWith({ path: '/not-found' })
    })

    it('redirects to not-found when moderator has no role', () => {
      store.token = 'valid-token'
      store.moderator = { role: null }
      secondGuard({ path: '/' }, {}, next)
      expect(next).toHaveBeenCalledWith({ path: '/not-found' })
    })

    it('allows navigation for authenticated admin', () => {
      store.token = 'valid-token'
      store.moderator = { role: 'ADMIN' }
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

  // Menu visibility is a convenience, not an access boundary. This third guard enforces the
  // administrator-only routes for the route itself; the backend rights remain the final word.
  describe('Third Navigation Guard — administrator-only routes', () => {
    let thirdGuard
    let next

    beforeEach(() => {
      thirdGuard = router.beforeEach.mock.calls[2][0]
      next = vi.fn()
      store.token = 'valid-token'
    })

    it('lets an administrator in', () => {
      store.moderator = { role: 'ADMIN' }
      thirdGuard({ path: '/contribution-links', meta: { requiresAdmin: true } }, {}, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('turns a moderator away', () => {
      store.moderator = { role: 'MODERATOR' }
      thirdGuard({ path: '/contribution-links', meta: { requiresAdmin: true } }, {}, next)
      expect(next).toHaveBeenCalledWith({ path: '/not-found' })
    })

    it('turns a KI-Moderator away just the same', () => {
      store.moderator = { role: 'MODERATOR_AI' }
      thirdGuard({ path: '/projectBranding', meta: { requiresAdmin: true } }, {}, next)
      expect(next).toHaveBeenCalledWith({ path: '/not-found' })
    })

    it('leaves the ordinary routes alone', () => {
      store.moderator = { role: 'MODERATOR' }
      thirdGuard({ path: '/creation-confirm', meta: {} }, {}, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('leaves a route without meta alone', () => {
      store.moderator = { role: 'MODERATOR' }
      thirdGuard({ path: '/user' }, {}, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('allows navigation when auth is disabled for debug', () => {
      CONFIG.DEBUG_DISABLE_AUTH = true
      store.moderator = { role: 'MODERATOR' }
      thirdGuard({ path: '/contribution-links', meta: { requiresAdmin: true } }, {}, next)
      expect(next).toHaveBeenCalledWith()
      CONFIG.DEBUG_DISABLE_AUTH = false
    })
  })
})
