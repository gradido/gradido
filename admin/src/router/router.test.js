import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

const mockComponents = {
  dashboard: { name: 'dashboard' },
  notFound: { name: 'not-found' },
  UserSearch: { name: 'UserSearch' },
  CreationConfirm: { name: 'CreationConfirm' },
  ContributionLinks: { name: 'ContributionLinks' },
  FederationVisualize: { name: 'FederationVisualize' },
}

vi.mock('./routes', () => ({
  routes: [
    { path: '/', component: () => Promise.resolve(mockComponents.dashboard) },
    { path: '/logout', component: () => Promise.resolve(mockComponents.notFound) },
    { path: '/user', component: () => Promise.resolve(mockComponents.UserSearch) },
    { path: '/creation-confirm', component: () => Promise.resolve(mockComponents.CreationConfirm) },
    {
      path: '/contribution-links',
      component: () => Promise.resolve(mockComponents.ContributionLinks),
    },
    { path: '/federation', component: () => Promise.resolve(mockComponents.FederationVisualize) },
    { path: '/:pathMatch(.*)*', component: () => Promise.resolve(mockComponents.notFound) },
  ],
}))

vi.mock('vue-router', () => ({
  createRouter: vi.fn(() => ({
    options: {
      routes: [],
      linkActiveClass: '',
      scrollBehavior: vi.fn(),
    },
  })),
  createWebHistory: vi.fn(() => 'mockedHistory'),
}))

describe('Router', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    await import('./router')
  })

  describe('options', () => {
    it('uses createWebHistory with correct base', () => {
      expect(createWebHistory).toHaveBeenCalledWith('/admin/')
    })

    it('has "active" as linkActiveClass', () => {
      expect(createRouter).toHaveBeenCalledWith(
        expect.objectContaining({
          linkActiveClass: 'active',
        }),
      )
    })

    describe('scroll behavior', () => {
      let scrollBehavior

      beforeEach(() => {
        scrollBehavior = createRouter.mock.calls[0][0].scrollBehavior
      })

      it('returns saved position when given', () => {
        const savedPosition = { left: 100, top: 100 }
        expect(scrollBehavior({}, {}, savedPosition)).toBe(savedPosition)
      })

      it('returns selector when hash is given', () => {
        expect(scrollBehavior({ hash: '#to' }, {})).toEqual({ selector: '#to' })
      })

      it('returns top left coordinates as default', () => {
        expect(scrollBehavior({}, {})).toEqual({ left: 0, top: 0 })
      })
    })

    describe('routes', () => {
      let routes

      beforeEach(() => {
        routes = createRouter.mock.calls[0][0].routes
      })

      it('has seven routes defined', () => {
        expect(routes).toHaveLength(7)
      })

      it('has "/" as default', async () => {
        const component = await routes.find((r) => r.path === '/').component()
        expect(component.name).toBe('dashboard')
      })

      it('loads the "NotFoundPage" component for logout', async () => {
        const component = await routes.find((r) => r.path === '/logout').component()
        expect(component.name).toBe('not-found')
      })

      it('loads the "UserSearch" component for user', async () => {
        const component = await routes.find((r) => r.path === '/user').component()
        expect(component.name).toBe('UserSearch')
      })

      it('loads the "CreationConfirm" component for creation-confirm', async () => {
        const component = await routes.find((r) => r.path === '/creation-confirm').component()
        expect(component.name).toBe('CreationConfirm')
      })

      it('loads the "ContributionLinks" page for contribution-links', async () => {
        const component = await routes.find((r) => r.path === '/contribution-links').component()
        expect(component.name).toBe('ContributionLinks')
      })

      it('loads the "FederationVisualize" page for federation', async () => {
        const component = await routes.find((r) => r.path === '/federation').component()
        expect(component.name).toBe('FederationVisualize')
      })

      it('renders the "NotFound" component for not found page', async () => {
        const component = await routes.find((r) => r.path === '/:pathMatch(.*)*').component()
        expect(component.name).toEqual('not-found')
      })
    })
  })
})
