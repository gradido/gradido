import router from './router'

describe('router', () => {
  describe('options', () => {
    const { options } = router
    const { scrollBehavior, routes } = options

    it('has "/admin" as base', () => {
      expect(options).toEqual(
        expect.objectContaining({
          base: '/admin',
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
      it('has nine routes defined', () => {
        expect(routes).toHaveLength(9)
      })

      it('has "/overview" as default', async () => {
        const component = await routes.find((r) => r.path === '/').component()
        expect(component.default.name).toBe('overview')
      })

      describe('logout', () => {
        it('loads the "NotFoundPage" component', async () => {
          const component = await routes.find((r) => r.path === '/logout').component()
          expect(component.default.name).toBe('not-found')
        })
      })

      describe('user', () => {
        it('loads the "UserSearch" component', async () => {
          const component = await routes.find((r) => r.path === '/user').component()
          expect(component.default.name).toBe('UserSearch')
        })
      })

      describe('creation', () => {
        it('loads the "Creation" component', async () => {
          const component = await routes.find((r) => r.path === '/creation').component()
          expect(component.default.name).toBe('Creation')
        })
      })

      describe('creation-confirm', () => {
        it('loads the "CreationConfirm" component', async () => {
          const component = await routes.find((r) => r.path === '/creation-confirm').component()
          expect(component.default.name).toBe('CreationConfirm')
        })
      })

      describe('contribution-links', () => {
        it('loads the "ContributionLinks" component', async () => {
          const component = await routes.find((r) => r.path === '/contribution-links').component()
          expect(component.default.name).toBe('ContributionLinks')
        })
      })

      describe('not found page', () => {
        it('renders the "NotFound" component', async () => {
          const component = await routes.find((r) => r.path === '*').component()
          expect(component.default.name).toEqual('not-found')
        })
      })
    })
  })
})
