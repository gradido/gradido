import router from './router'
import NotFound from '@/pages/NotFoundPage.vue'

describe('router', () => {
  describe('options', () => {
    const { options } = router
    const { scrollBehavior, routes } = options

    it('has "/" as base', () => {
      expect(options).toEqual(
        expect.objectContaining({
          base: '/',
        }),
      )
    })

    it('has "active" as linkActiveClass', () => {
      expect(options).toEqual(
        expect.objectContaining({
          linkActiveClass: 'active',
        }),
      )
    })

    it('has "history" as mode', () => {
      expect(options).toEqual(
        expect.objectContaining({
          mode: 'history',
        }),
      )
    })

    describe('scroll behavior', () => {
      it('returns save position when given', () => {
        expect(scrollBehavior({}, {}, 'given')).toBe('given')
      })

      it('returns selector when hash is given', () => {
        expect(scrollBehavior({ hash: '#to' }, {})).toEqual({ selector: '#to' })
      })

      it('returns top left coordinates as default', () => {
        expect(scrollBehavior({}, {})).toEqual({ x: 0, y: 0 })
      })
    })

    describe('routes', () => {
      it('has "/login" as default', () => {
        expect(routes.find((r) => r.path === '/').redirect()).toEqual({ path: '/login' })
      })

      it('has sixteen routes defined', () => {
        expect(routes).toHaveLength(17)
      })

      describe('overview', () => {
        it('requires authorization', () => {
          expect(routes.find((r) => r.path === '/overview').meta.requiresAuth).toBeTruthy()
        })

        it('loads the "Overview" page', async () => {
          const component = await routes.find((r) => r.path === '/overview').component()
          expect(component.default.name).toBe('Overview')
        })
      })

      describe('send', () => {
        it('requires authorization', () => {
          expect(routes.find((r) => r.path === '/send').meta.requiresAuth).toBeTruthy()
        })

        it('loads the "Send" page', async () => {
          const component = await routes.find((r) => r.path === '/send').component()
          expect(component.default.name).toBe('Send')
        })
      })

      describe('community', () => {
        it('requires community', () => {
          expect(routes.find((r) => r.path === '/community').meta.requiresAuth).toBeTruthy()
        })

        it('loads the "Community" page', async () => {
          const component = await routes.find((r) => r.path === '/community').component()
          expect(component.default.name).toBe('Community')
        })
      })

      describe('profile', () => {
        it('requires authorization', () => {
          expect(routes.find((r) => r.path === '/profile').meta.requiresAuth).toBeTruthy()
        })

        it('loads the "Profile" page', async () => {
          const component = await routes.find((r) => r.path === '/profile').component()
          expect(component.default.name).toBe('Profile')
        })
      })

      describe('transactions', () => {
        it('requires authorization', () => {
          expect(routes.find((r) => r.path === '/transactions').meta.requiresAuth).toBeTruthy()
        })

        it('loads the "Transactions" page', async () => {
          const component = await routes.find((r) => r.path === '/transactions').component()
          expect(component.default.name).toBe('Transactions')
        })
      })

      describe('community', () => {
        it('requires authorization', () => {
          expect(routes.find((r) => r.path === '/community').meta.requiresAuth).toBeTruthy()
        })

        it('loads the "Community" page', async () => {
          const component = await routes.find((r) => r.path === '/community').component()
          expect(component.default.name).toBe('Community')
        })
      })

      describe('login', () => {
        it('loads the "Login" page', async () => {
          const component = await routes.find((r) => r.path === '/login/:code?').component()
          expect(component.default.name).toBe('Login')
        })
      })

      describe('register', () => {
        it('loads the "register" page', async () => {
          const component = await routes.find((r) => r.path === '/register/:code?').component()
          expect(component.default.name).toBe('Register')
        })
      })

      describe('forgot password', () => {
        it('loads the "ForgotPassword" page', async () => {
          const component = await routes.find((r) => r.path === '/forgot-password').component()
          expect(component.default.name).toBe('ForgotPassword')
        })
      })

      describe('password with param comingFrom', () => {
        it('loads the "ForgotPassword" page', async () => {
          const component = await routes
            .find((r) => r.path === '/forgot-password/:comingFrom')
            .component()
          expect(component.default.name).toBe('ForgotPassword')
        })
      })

      describe('register-community', () => {
        it('loads the "registerCommunity" page', async () => {
          const component = await routes.find((r) => r.path === '/register-community').component()
          expect(component.default.name).toBe('RegisterCommunity')
        })
      })

      describe('select-community', () => {
        it('loads the "SelectCommunity" page', async () => {
          const component = await routes.find((r) => r.path === '/select-community').component()
          expect(component.default.name).toBe('SelectCommunity')
        })
      })

      describe('reset password', () => {
        it('loads the "ResetPassword" page', async () => {
          const component = await routes
            .find((r) => r.path === '/reset-password/:optin')
            .component()
          expect(component.default.name).toBe('ResetPassword')
        })
      })

      describe('checkEmail', () => {
        it('loads the "CheckEmail" page', async () => {
          const component = await routes
            .find((r) => r.path === '/checkEmail/:optin/:code?')
            .component()
          expect(component.default.name).toBe('ResetPassword')
        })
      })

      describe('redeem', () => {
        it('loads the "TransactionLink" page', async () => {
          const component = await routes.find((r) => r.path === '/redeem/:code').component()
          expect(component.default.name).toBe('TransactionLink')
        })
      })

      describe('not found page', () => {
        it('renders the "NotFound" page', async () => {
          expect(routes.find((r) => r.path === '*').component).toEqual(NotFound)
        })
      })
    })
  })
})
