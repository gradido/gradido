import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import NavBar from './NavBar'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import CONFIG from '../config'
import { BNavbar, BNavbarNav, BNavItem } from 'bootstrap-vue-next'

// Mock vue-router
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRoute: vi.fn(() => ({
      name: 'user',
    })),
  }
})

const createVuexStore = (roles = ['ADMIN']) =>
  createStore({
    state: {
      openCreations: 1,
      token: 'valid-token',
      moderator: { roles },
    },
    actions: {
      logout: vi.fn(),
    },
  })

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))

describe('NavBar', () => {
  let wrapper
  let store
  let router
  let originalWindow

  const createWrapper = () => {
    return mount(NavBar, {
      global: {
        components: {
          BNavbarNav,
          BNavItem,
          BNavbar,
        },
        plugins: [store, router],
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          BCollapse: { template: '<div><slot></slot></div>' },
          BNavbarBrand: { template: '<div><slot></slot></div>' },
          BBadge: { template: '<div><slot></slot></div>' },
          BNavbarToggle: { template: '<div><slot></slot></div>' },
        },
        directives: {
          vBToggle: {},
          vBColorMode: {},
        },
      },
    })
  }

  beforeEach(() => {
    store = createVuexStore()
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/user', name: 'user' },
        { path: '/creation-confirm', name: 'creation-confirm' },
        { path: '/contribution-links', name: 'contribution-links' },
        { path: '/federation', name: 'federation' },
        { path: '/projectBranding', name: 'projectBranding' },
        { path: '/creaSettings', name: 'creaSettings' },
        { path: '/statistic', name: 'statistic' },
      ],
    })
    originalWindow = global.window
    const windowMock = {
      location: {
        assign: vi.fn(),
      },
    }
    vi.stubGlobal('window', windowMock)

    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    global.window = originalWindow
  })

  it('renders the component', () => {
    expect(wrapper.find('.component-nabvar').exists()).toBe(true)
  })

  describe('Navbar Menu', () => {
    const hrefs = () => wrapper.findAll('.nav-item a').map((item) => item.attributes('href'))

    it('has correct menu items', () => {
      expect(hrefs()).toEqual([
        '/user',
        '/creation-confirm',
        '/contribution-links',
        '/federation',
        '/projectBranding',
        '/creaSettings',
        '/statistic',
        '#',
        '#',
      ])
    })

    // Instances, projects and Crea are administrators' business. Menu visibility is only a
    // convenience — the route guard and the backend rights are the boundary.
    describe('as a moderator', () => {
      beforeEach(() => {
        store = createVuexStore(['MODERATOR'])
        wrapper = createWrapper()
      })

      it('leaves out the administrator-only entries', () => {
        // Starting balance stays: a moderator may look the links up and pass them on. What
        // they cannot do — create, change, delete — is hidden on the page itself.
        expect(hrefs()).toEqual([
          '/user',
          '/creation-confirm',
          '/contribution-links',
          '/statistic',
          '#',
          '#',
        ])
      })
    })

    describe('as a KI-Moderator', () => {
      beforeEach(() => {
        store = createVuexStore(['MODERATOR_AI'])
        wrapper = createWrapper()
      })

      it('leaves them out just the same', () => {
        expect(hrefs()).toEqual([
          '/user',
          '/creation-confirm',
          '/contribution-links',
          '/statistic',
          '#',
          '#',
        ])
      })
    })
  })

  describe('wallet', () => {
    it('changes window location to wallet and dispatches logout', async () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch')
      await wrapper.vm.handleWallet()
      expect(window.location).toBe(CONFIG.WALLET_AUTH_URL + 'valid-token')
      expect(dispatchSpy).toHaveBeenCalledWith('logout')
    })
  })

  describe('logout', () => {
    it('redirects to login page and dispatches logout', async () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch')
      await wrapper.vm.handleLogout()
      expect(window.location.assign).toHaveBeenCalledWith(CONFIG.WALLET_LOGIN_URL)
      expect(dispatchSpy).toHaveBeenCalledWith('logout')
    })
  })
})
