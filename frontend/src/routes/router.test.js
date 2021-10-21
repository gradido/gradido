import router from './router'
import NotFound from '@/views/NotFoundPage.vue'

describe('router', () => {
  describe('options', () => {
    const { options } = router
    const { scrollBehavior, routes } = options

    it('has "/vue" as base', () => {
      expect(options).toEqual(
        expect.objectContaining({
          base: '/vue',
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

      it('has twelve routes defined', () => {
        expect(routes).toHaveLength(13)
      })

      describe('overview', () => {
        it('requires authorization', () => {
          expect(routes.find((r) => r.path === '/overview').meta.requiresAuth).toBeTruthy()
        })

        it('loads the "Overview" component', async () => {
          const component = await routes.find((r) => r.path === '/overview').component()
          expect(component.default.name).toBe('Overview')
        })
      })

      describe('send', () => {
        it('requires authorization', () => {
          expect(routes.find((r) => r.path === '/send').meta.requiresAuth).toBeTruthy()
        })

        it('loads the "Send" component', async () => {
          const component = await routes.find((r) => r.path === '/send').component()
          expect(component.default.name).toBe('SendOverview')
        })
      })

      describe('profile', () => {
        it('requires authorization', () => {
          expect(routes.find((r) => r.path === '/profile').meta.requiresAuth).toBeTruthy()
        })

        it('loads the "UserProfile" component', async () => {
          const component = await routes.find((r) => r.path === '/profile').component()
          expect(component.default.name).toBe('UserProfile')
        })
      })

      describe('transactions', () => {
        it('requires authorization', () => {
          expect(routes.find((r) => r.path === '/transactions').meta.requiresAuth).toBeTruthy()
        })

        it('loads the "UserProfileTransactionList" component', async () => {
          const component = await routes.find((r) => r.path === '/transactions').component()
          expect(component.default.name).toBe('UserProfileTransactionList')
        })
      })

      describe('login', () => {
        it('loads the "Login" component', async () => {
          const component = await routes.find((r) => r.path === '/login').component()
          expect(component.default.name).toBe('login')
        })
      })

      describe('register', () => {
        it('loads the "register" component', async () => {
          const component = await routes.find((r) => r.path === '/register').component()
          expect(component.default.name).toBe('register')
        })
      })

      describe('thx', () => {
        const thx = routes.find((r) => r.path === '/thx/:comingFrom')

        it('loads the "Thx" component', async () => {
          const component = await thx.component()
          expect(component.default.name).toBe('Thx')
        })

        describe('beforeEnter', () => {
          const beforeEnter = thx.beforeEnter
          const next = jest.fn()

          it('redirects to login when not coming from a valid page', () => {
            beforeEnter({}, { path: '' }, next)
            expect(next).toBeCalledWith({ path: '/login' })
          })

          it('enters the page when coming from a valid page', () => {
            jest.resetAllMocks()
            beforeEnter({}, { path: '/password' }, next)
            expect(next).toBeCalledWith()
          })
        })
      })

      describe('password', () => {
        it('loads the "Password" component', async () => {
          const component = await routes.find((r) => r.path === '/password').component()
          expect(component.default.name).toBe('password')
        })
      })

      describe('register-community', () => {
        it('loads the "registerCommunity" component', async () => {
          const component = await routes.find((r) => r.path === '/register-community').component()
          expect(component.default.name).toBe('registerCommunity')
        })
      })

      describe('select-community', () => {
        it('loads the "registerSelectCommunity" component', async () => {
          const component = await routes.find((r) => r.path === '/select-community').component()
          expect(component.default.name).toBe('registerSelectCommunity')
        })
      })

      describe('reset', () => {
        it('loads the "ResetPassword" component', async () => {
          const component = await routes.find((r) => r.path === '/reset/:optin').component()
          expect(component.default.name).toBe('ResetPassword')
        })
      })

      describe('checkEmail', () => {
        it('loads the "CheckEmail" component', async () => {
          const component = await routes.find((r) => r.path === '/checkEmail/:optin').component()
          expect(component.default.name).toBe('CheckEmail')
        })
      })

      describe('not found page', () => {
        it('renders the "NotFound" component', async () => {
          expect(routes.find((r) => r.path === '*').component).toEqual(NotFound)
        })
      })
    })
  })
})
