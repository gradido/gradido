import { describe, it, expect, vi } from 'vitest'
import router from './router'
import routes from './routes'
import NotFound from '@/pages/NotFoundPage'

// This file checks the full route table, matching included, so it needs the flag
// on — routes.js reads it when the module loads, which is why this has to be a
// hoisted vi.mock rather than an assignment. The flag's own behaviour (on and
// off) is covered in routes.test.js.
vi.mock('@/config', async () => {
  const actual = await vi.importActual('@/config')
  return {
    default: { ...actual.default, MATCHING_ACTIVE: true },
  }
})

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    defineComponent: (options) => options,
  }
})

vi.mock('@/pages/Send', () => ({
  default: { name: 'Send' },
}))

vi.mock('@/pages/Transactions', () => ({
  default: { name: 'Transactions' },
}))

const getComponentName = (component) => {
  if (typeof component === 'object') {
    return (
      component.name ||
      component.displayName ||
      component.__name ||
      (component.setup && component.setup.name) ||
      (component.render && component.render.name)
    )
  }
  return undefined
}

describe('router', () => {
  describe('configuration', () => {
    it('uses createWebHistory', () => {
      expect(router.options.history.constructor.name).toBe('Object')
    })

    it('has empty string as base', () => {
      expect(router.options.history.base).toBe('')
    })

    it('has "active" as linkActiveClass', () => {
      expect(router.options.linkActiveClass).toBe('active')
    })

    describe('scroll behavior', () => {
      const { scrollBehavior } = router.options

      it('returns saved position when given', () => {
        const savedPosition = { left: 100, top: 100 }
        expect(scrollBehavior({}, {}, savedPosition)).toEqual(savedPosition)
      })

      it('returns selector when hash is given', () => {
        expect(scrollBehavior({ hash: '#to' }, {})).toEqual({ selector: '#to' })
      })

      it('returns top left coordinates as default', () => {
        expect(scrollBehavior({}, {})).toEqual({ left: 0, top: 0 })
      })
    })
  })

  describe('routes', () => {
    it('has "/" as default redirect to "/login"', () => {
      const defaultRoute = routes.find((r) => r.path === '/')
      expect(defaultRoute.redirect()).toEqual({ path: '/login' })
    })

    it('has 24 routes defined', () => {
      expect(routes).toHaveLength(24)
    })

    const testRoute = (path, expectedName, requiresAuth = true) => {
      describe(path, () => {
        const route = routes.find(
          (r) => r.path === path || (r.path.startsWith(path) && r.path.endsWith('?')),
        )

        if (requiresAuth) {
          it('requires authorization', () => {
            expect(route.meta.requiresAuth).toBe(true)
          })
        } else {
          // Passing `false` used to assert nothing at all, so a route that quietly became
          // guarded would still have passed here. On the public ones that flag is not a
          // detail: it decides whether somebody without an account gets through, and on
          // /u/:alias it also decides the layout -- App.vue picks it from this one field.
          it('does not require authorization', () => {
            expect(route.meta?.requiresAuth).not.toBe(true)
          })
        }

        it(`loads the "${expectedName}" page`, async () => {
          let component = route.component

          // Handle different component definition patterns
          if (typeof component === 'function') {
            const importedModule = await component()
            component = importedModule.default || importedModule
          }

          const componentName = getComponentName(component)

          expect(componentName).toBe(expectedName)
        })
      })
    }
    testRoute('/overview', 'Overview')
    testRoute('/send/:communityIdentifier?/:userIdentifier?', 'Send')
    testRoute('/transactions', 'Transactions')
    testRoute('/contributions', 'Contributions')
    testRoute('/information', 'InfoStatistic')
    testRoute('/usersearch', 'UserSearch')
    testRoute('/gdt', 'Transactions')
    testRoute('/login/:code?', 'Login', false)
    testRoute('/register/:code?', 'Register', false)
    testRoute('/forgot-password', 'ForgotPassword', false)
    testRoute('/register-community', 'RegisterCommunity', false)
    testRoute('/reset-password/:optin', 'ResetPassword', false)
    testRoute('/checkEmail/:optin/:code?', 'ResetPassword', false)
    testRoute('/redeem/:code', 'TransactionLink', false)
    // Declared ahead of the catch-all, which used to swallow it: every printed QR code on a
    // Gradido card landed on "page not found". Public on purpose -- a phone camera opens the
    // default browser, so most visitors arrive logged out.
    testRoute('/u/:alias', 'PublicProfile', false)

    // The order is the whole point, and `routes.find` cannot see it. This is the regression
    // that made every printed QR code land on "page not found": the address route did not
    // exist, so /u/... fell into the catch-all. A route declared after it would do the same,
    // and nothing else in this file would notice.
    it('declares the public profile ahead of the catch-all', () => {
      const profile = routes.findIndex((r) => r.path === '/u/:alias')
      const catchAll = routes.findIndex((r) => r.name === 'NotFound')

      expect(profile).toBeGreaterThanOrEqual(0)
      expect(profile).toBeLessThan(catchAll)
    })
    // Declared ahead of /matching/:tab, so this must not fall through to Matching.
    testRoute('/matching/karte', 'MatchingMap')

    describe('contributions without tab parameter', () => {
      it('redirects to contribute tab', () => {
        const route = routes.find((r) => r.path === '/contributions')
        expect(route.redirect()).toEqual({ path: '/contributions/contribute' })
      })
    })

    describe('not found page', () => {
      it('renders the "NotFound" page', () => {
        const notFoundRoute = routes.find(
          (r) => r.path === '/:pathMatch(.*)*' || r.path === '/:catchAll(.*)' || r.path === '*',
        )
        expect(notFoundRoute).toBeDefined()
        expect(notFoundRoute.component).toEqual(NotFound)
      })
    })
  })
})
