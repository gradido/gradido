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

const createVuexStore = () =>
  createStore({
    state: {
      openCreations: 1,
      token: 'valid-token',
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
    it('has correct menu items', () => {
      const navItems = wrapper.findAll('.nav-item a')
      expect(navItems).toHaveLength(8)
      expect(navItems[0].attributes('href')).toBe('/user')
      expect(navItems[1].attributes('href')).toBe('/creation-confirm')
      expect(navItems[2].attributes('href')).toBe('/contribution-links')
      expect(navItems[3].attributes('href')).toBe('/federation')
      expect(navItems[4].attributes('href')).toBe('/projectBranding')
      expect(navItems[5].attributes('href')).toBe('/statistic')
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
