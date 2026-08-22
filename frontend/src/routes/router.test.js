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

    it('has 38 routes defined', () => {
      expect(routes).toHaveLength(38)
    })

    // The settings are one route per area. That is what lets the same pages serve both
    // screen widths -- menu beside the content above 992px, list-then-page below it --
    // and what makes a section linkable from outside.
    describe('the settings areas', () => {
      const settingsRoutes = routes.filter(
        (r) => r.path === '/settings' || r.path.startsWith('/settings/'),
      )

      it('has one route per area, plus the index and the old address', () => {
        expect(settingsRoutes.map((r) => r.path)).toEqual([
          '/settings',
          '/settings/account',
          '/settings/appearance',
          '/settings/gradido-card',
          '/settings/thank-you-card',
          '/settings/visibility',
          '/settings/notifications',
          '/settings/extern',
        ])
      })

      it('guards every area and hands the layout the settings menu', () => {
        for (const route of settingsRoutes.filter((r) => !r.redirect)) {
          expect(route.meta.requiresAuth).toBe(true)
          expect(route.meta.settingsChrome).toBe(true)
        }
      })

      // The breadcrumb heading would repeat what the section already says, and it costs a
      // heading's height on the phone -- the device the list is built for.
      it('names no pageTitle, so no breadcrumb heading appears', () => {
        for (const route of settingsRoutes.filter((r) => !r.redirect)) {
          expect(route.meta.pageTitle).toBeUndefined()
        }
      })

      // Five entries in the news file and two cards on the overview still point at the old
      // address, and printed or mailed links keep arriving.
      it('keeps the old /settings/extern address alive', () => {
        const old = routes.find((r) => r.path === '/settings/extern')
        expect(old.redirect()).toEqual({ path: '/settings/communities' })
      })

      // ⛔ Not merely hidden from the menu: without GMS or HumHub the page would stand empty
      // and still be reachable by typing the address. Both flags are off under test.
      it('does not register the circles area while neither service is switched on', () => {
        expect(routes.find((r) => r.path === '/settings/communities')).toBeUndefined()
      })
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
    testRoute('/email-change/revoke/:code', 'EmailChange', false)
    testRoute('/email-change/:code', 'EmailChange', false)
    testRoute('/checkEmail/:optin/:code?', 'ResetPassword', false)
    testRoute('/redeem/:code', 'TransactionLink', false)
    // Declared ahead of the catch-all, which used to swallow it: every printed QR code on a
    // Gradido card landed on "page not found". Public on purpose -- a phone camera opens the
    // default browser, so most visitors arrive logged out.
    testRoute('/u/:alias', 'PublicProfile', false)
    testRoute('/dk/:code', 'ThankYouCardPayment')
    testRoute('/calculator', 'Calculator')
    testRoute('/scan', 'Scanner')
    testRoute('/my-gradido-card', 'MyGradidoCard')
    testRoute('/my-thank-you-card', 'MyThankYouCard')

    /**
     * ⛔ These two are the ONLY places a member's own codes are shown, and both must stay
     * behind the login. The thank-you card code is a bearer token: a public route would put
     * it one guessed address away from anybody, and the page would hand it out drawn large.
     */
    it.each([
      ['/my-gradido-card', 'my-gradido-card'],
      ['/my-thank-you-card', 'my-thank-you-card'],
    ])('gives %s a page title the breadcrumb can resolve, and its own head', (path, title) => {
      const route = routes.find((r) => r.path === path)
      expect(route.meta.pageTitle).toBe(title)
      expect(route.meta.bareChrome).toBe(true)
    })

    // Same two assertions as the calculator below, for the same reasons: the raw key
    // would print if the breadcrumb cannot resolve it, and without bareChrome the
    // translucent navbar would sit over the viewfinder.
    it('gives the scanner a page title the breadcrumb can resolve', () => {
      const route = routes.find((r) => r.path === '/scan')
      expect(route.meta.pageTitle).toBe('scanner')
    })

    it('lets the scanner bring its own head', () => {
      const route = routes.find((r) => r.path === '/scan')
      expect(route.meta.bareChrome).toBe(true)
    })

    // ⚠️ The page title is not a detail on this route: the breadcrumb prefixes `pageTitle.`
    // and prints the raw key when it finds nothing there. Counting routes cannot see that.
    it('gives the calculator a page title the breadcrumb can resolve', () => {
      const route = routes.find((r) => r.path === '/calculator')
      expect(route.meta.pageTitle).toBe('calculator')
    })

    /**
     * ⚠️ bareChrome is what gives the calculator the whole screen on a phone -- without it
     * the translucent navbar sits exactly over the total, which is the number two people
     * read at arm's length. The layout only drops its chrome for routes that carry the flag.
     */
    it('lets the calculator bring its own head', () => {
      const route = routes.find((r) => r.path === '/calculator')
      expect(route.meta.bareChrome).toBe(true)
    })

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
