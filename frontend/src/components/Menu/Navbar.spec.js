import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createWebHistory, RouterLink } from 'vue-router'
import { createStore } from 'vuex'
import Navbar from './Navbar.vue'
import { BImg, BNavbar, BNavbarBrand, BNavbarNav } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import { createI18n } from 'vue-i18n'
import CONFIG from '@/config'

// Mock vue-avatar
vi.mock('vue-avatar', () => ({
  default: {
    name: 'Avatar',
    render: () => null,
    props: {
      initials: null,
    },
  },
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'copied-to-clipboard': 'copied-to-clipboard',
    },
  },
})

const createVuexStore = (state = {}) =>
  createStore({
    state: () => ({
      firstName: 'Testy',
      lastName: 'User',
      gradidoID: 'current-user-id',
      email: 'test@example.com',
      username: 'username',
      ...state,
    }),
  })

const router = createRouter({
  history: createWebHistory(),
  routes: [],
})

describe('Navbar', () => {
  let wrapper
  let store

  const mountComponent = (storeState = {}) => {
    store = createVuexStore(storeState)
    return mount(Navbar, {
      global: {
        plugins: [store, router, i18n],
        stubs: {
          IBiClipboard: true,
        },
        mocks: {
          $t: (msg) => msg,
        },
        components: {
          BNavbar,
          BNavbarNav,
          BNavbarBrand,
          BImg,
          RouterLink,
          AppAvatar,
        },
      },
      props: {
        balance: 1234,
      },
    })
  }

  beforeEach(() => {
    wrapper = mountComponent()
  })

  it('renders the component', () => {
    expect(wrapper.find('div.navbar-component').exists()).toBe(true)
  })

  it('has a .navbar-brand element', () => {
    expect(wrapper.find('div.navbar-brand').exists()).toBe(true)
  })

  describe('.avatar element', () => {
    it('is rendered', () => {
      expect(wrapper.findComponent({ name: 'AppAvatar' }).exists()).toBe(true)
    })

    it("has the user's initials", () => {
      const avatar = wrapper.findComponent({ name: 'AppAvatar' })
      expect(avatar.props('initials')).toBe('TU')
    })
  })

  describe('user info', () => {
    it('has the full name', () => {
      expect(wrapper.find('div[data-test="navbar-item-username"]').text()).toBe('Testy User')
    })

    it('has the email address', () => {
      expect(wrapper.find('div[data-test="navbar-item-gradido-id"]').text()).toBe(
        `${CONFIG.COMMUNITY_NAME}/username`,
      )
    })
  })
})
