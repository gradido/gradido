import { describe, it, expect, vi } from 'vitest'
import router from './router'
import routes from './routes'
import NotFound from '@/pages/NotFoundPage'

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

    it('has 21 routes defined', () => {
      expect(routes).toHaveLength(21)
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
    testRoute('/community', 'Community')
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

    describe('community without tab parameter', () => {
      it('redirects to contribute tab', () => {
        const route = routes.find((r) => r.path === '/community')
        expect(route.redirect()).toEqual({ path: '/community/contribute' })
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
