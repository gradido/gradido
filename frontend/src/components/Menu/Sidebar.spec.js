import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
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
        transactions: 'Transactions',
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
      it('has seven nav-items', () => {
        const generalSection = wrapper.findAll('ul')[0]
        expect(generalSection.findAll('.nav-item')).toHaveLength(5)
      })

      it('has nav-item "navigation.overview" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(0).text()).toContain('Overview')
      })

      it('has nav-item "navigation.send" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(1).text()).toContain('Send')
      })

      it('has nav-item "navigation.transactions" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(2).text()).toContain('Transactions')
      })

      it('has nav-item "creation" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(3).text()).toContain('Creation')
      })

      it('has nav-item "info" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(4).text()).toContain('Info')
      })
    })

    describe('the specific section', () => {
      describe('for standard users', () => {
        beforeEach(() => {
          wrapper = mountComponent({ roles: [] })
        })

        it('has two nav-items', () => {
          expect(wrapper.findAll('.nav-item').slice(6)).toHaveLength(1)
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
          expect(wrapper.findAll('.nav-item').slice(6)).toHaveLength(2)
        })

        it('has nav-item "navigation.settings" in navbar', () => {
          expect(wrapper.find('[data-test="settings-menu"]').text()).toContain('Settings')
        })

        it('has nav-item "navigation.admin_area" in navbar', () => {
          const adminItems = wrapper.findAll('.nav-item').slice(6)
          expect(adminItems.length).toBeGreaterThan(0)
          expect(adminItems[0].text()).toContain('Admin Area')
        })

        it('has nav-item "navigation.logout" in navbar', () => {
          expect(wrapper.find('[data-test="logout-menu"]').text()).toContain('Logout')
        })
      })
    })
  })
})
