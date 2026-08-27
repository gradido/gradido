import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import Sidebar from './Sidebar.vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import CONFIG from '../../config'
import { BBadge, BImg, BNav, BNavItem } from 'bootstrap-vue-next'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    path: '/',
  })),
}))

// Mock Apollo
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useResult: vi.fn(),
}))

// Mock i18n
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      navigation: {
        overview: 'Overview',
        send: 'Send',
        calculator: 'Calculator',
        transactions: 'Transactions',
        matching: 'Matching',
        circles: 'Circles',
        usersearch: 'User Search',
        settings: 'Settings',
        admin_area: 'Admin Area',
        logout: 'Logout',
      },
      info: 'Info',
      creation: 'Creation',
    },
  },
})

// Mock Vuex store
const createVuexStore = (state = {}) =>
  createStore({
    state: () => ({
      hasElopage: true,
      roles: [],
      ...state,
    }),
    getters: {
      isAdmin: (state) => state.roles.includes('admin'),
    },
  })

CONFIG.GMS_ACTIVE = true
CONFIG.HUMHUB_ACTIVE = true
// The suite below counts nav items and addresses matching by index, so it needs
// the flag on. The off state is covered in its own block at the end.
CONFIG.MATCHING_ACTIVE = true

describe('Sidebar', () => {
  let wrapper
  let store

  const mountComponent = (storeState = {}) => {
    store = createVuexStore(storeState)
    return mount(Sidebar, {
      global: {
        plugins: [store, i18n],
        stubs: ['router-link', 'i-bi-cash'],
        components: {
          BNav,
          BBadge,
          BNavItem,
          BImg,
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = mountComponent()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#component-sidebar').exists()).toBe(true)
    })

    describe('the general section', () => {
      it('has five nav-items', () => {
        const generalSection = wrapper.findAll('ul')[0]
        expect(generalSection.findAll('.nav-item')).toHaveLength(5)
      })

      it('has nav-item "navigation.overview" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(0).text()).toContain('Overview')
      })

      it('has nav-item "navigation.send" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(1).text()).toContain('Send')
      })

      /**
       * ⛔ The calculator is deliberately NOT a menu entry any more. It moved to a small
       * symbol above the menu (navbar on the phone, above the sidebar on desktop) -- the
       * menu was getting long, and the calculator is a tool for those who run a till, not a
       * page everybody visits. (Bernd, 20.08.2026)
       */
      it('does not list the calculator as a menu entry', () => {
        expect(wrapper.text()).not.toContain('Calculator')
      })

      it('has nav-item "navigation.transactions" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(2).text()).toContain('Transactions')
      })

      it('has nav-item "creation" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(3).text()).toContain('Creation')
      })

      it('has nav-item "matching" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(4).text()).toContain('Matching')
      })

      it('has nav-item "info" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(5).text()).toContain('Info')
      })
    })

    describe('the specific section', () => {
      describe('for standard users', () => {
        beforeEach(() => {
          wrapper = mountComponent({ roles: [] })
        })

        it('has two nav-items', () => {
          expect(wrapper.findAll('.nav-item').slice(6)).toHaveLength(2)
        })

        it('has nav-item "navigation.settings" in navbar', () => {
          expect(wrapper.find('[data-test="settings-menu"]').text()).toContain('Settings')
        })

        it('has nav-item "navigation.logout" in navbar', () => {
          expect(wrapper.find('[data-test="logout-menu"]').text()).toContain('Logout')
        })
      })

      describe('for admin users', () => {
        beforeEach(() => {
          wrapper = mountComponent({ roles: ['admin'] })
        })

        it('has three nav-items', () => {
          expect(wrapper.findAll('.nav-item').slice(6)).toHaveLength(3)
        })

        it('has nav-item "navigation.settings" in navbar', () => {
          expect(wrapper.find('[data-test="settings-menu"]').text()).toContain('Settings')
        })

        it('has nav-item "navigation.admin_area" in navbar', () => {
          const adminItems = wrapper.findAll('.nav-item').slice(6)
          expect(adminItems.length).toBeGreaterThan(1)
          expect(adminItems[1].text()).toContain('Admin Area')
        })

        it('has nav-item "navigation.logout" in navbar', () => {
          expect(wrapper.find('[data-test="logout-menu"]').text()).toContain('Logout')
        })
      })
    })
  })
})

describe('Sidebar with MATCHING_ACTIVE off', () => {
  const mountSidebar = () =>
    mount(Sidebar, {
      global: {
        plugins: [createVuexStore(), i18n],
        stubs: ['router-link', 'i-bi-cash'],
        components: { BNav, BBadge, BNavItem, BImg },
      },
    })

  beforeEach(() => {
    CONFIG.MATCHING_ACTIVE = false
  })

  afterEach(() => {
    // Leave the flag as the rest of this file expects it, whatever the order.
    CONFIG.MATCHING_ACTIVE = true
  })

  it('does not offer the matching menu item', () => {
    expect(mountSidebar().text()).not.toContain('Matching')
  })

  it('drops the item from the general section, leaving four', () => {
    const generalSection = mountSidebar().findAll('ul')[0]
    expect(generalSection.findAll('.nav-item')).toHaveLength(4)
  })

  it('keeps every other menu item', () => {
    // No 'Calculator' in this list any more: it moved out of the menu altogether, to the
    // small symbol above it. See the main describe.
    const text = mountSidebar().text()
    for (const label of ['Overview', 'Send', 'Transactions', 'Creation', 'Info', 'Settings']) {
      expect(text).toContain(label)
    }
  })

  it('mounts without the matching link the active-route watcher looks for', () => {
    // syncNavActive runs on mount and reaches for matchingLink; with the item
    // gone the ref stays null. This asserts the guard in setLinkActive holds.
    expect(() => mountSidebar()).not.toThrow()
  })
})
