import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createWebHistory, RouterLink } from 'vue-router'
import { createStore } from 'vuex'
import Navbar from './Navbar.vue'
import { BImg, BNavbar, BNavbarBrand, BNavbarNav } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import { createI18n } from 'vue-i18n'
import CONFIG from '@/config'
import { communityHost } from '@/utils/gradidoAddress'

// The real toast needs a mounted container. Without this the copy test still passed --
// the clipboard is written before the message is shown -- while an error flew past it.
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess }),
}))

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
          // The avatar button brings its own apollo and toast dependencies. What matters
          // here is what the navbar hands it; the button itself has its own spec.
          AvatarButton: {
            name: 'AvatarButton',
            props: ['name', 'initials', 'color', 'size'],
            template: '<div class="avatar-button-stub"></div>',
          },
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
      expect(wrapper.findComponent({ name: 'AvatarButton' }).exists()).toBe(true)
    })

    it("has the user's initials", () => {
      const avatar = wrapper.findComponent({ name: 'AvatarButton' })
      expect(avatar.props('initials')).toBe('TU')
    })
  })

  describe('user info', () => {
    const addressLine = () => wrapper.find('div[data-test="navbar-item-gradido-address"]')

    it('has the full name', () => {
      expect(wrapper.find('[data-test="navbar-item-username"]').text()).toBe('Testy User')
    })

    it('shows the Gradido address, without a scheme', () => {
      expect(addressLine().text()).toBe(`${communityHost(CONFIG.COMMUNITY_URL)}/u/username`)
    })

    // The line exists for everybody. It used to sit inside the settings link for members
    // without a user name, with no way to copy it -- and the Gradido ID resolves just as
    // well, so there was never a reason to treat them differently.
    it('shows it for a member who has no user name yet', () => {
      wrapper = mountComponent({ username: '' })
      expect(addressLine().text()).toBe(`${communityHost(CONFIG.COMMUNITY_URL)}/u/current-user-id`)
    })

    // Shown without a scheme, copied with one (P-019): what lands in the clipboard has to
    // work when it is pasted into a browser, not only when it is read.
    it('copies the address WITH the scheme', async () => {
      const writeText = vi.fn()
      vi.stubGlobal('navigator', { clipboard: { writeText } })

      await addressLine().find('button').trigger('click')

      expect(writeText).toHaveBeenCalledWith(`${CONFIG.COMMUNITY_URL}/u/username`)
      expect(mockToastSuccess).toHaveBeenCalledWith('gradidoid-copied-to-clipboard')
      vi.unstubAllGlobals()
    })

    // A button, not an anchor. An anchor without a target is in no tab order, so the
    // address could not be copied by anybody working without a mouse.
    it('offers the copy control to the keyboard', () => {
      const control = addressLine().find('button')
      expect(control.exists()).toBe(true)
      expect(control.attributes('type')).toBe('button')
      expect(addressLine().find('a').exists()).toBe(false)
    })

    // Bernd's decision on the mockup: the icon sits behind the address, not in front of it.
    it('puts the copy icon behind the address', () => {
      const html = addressLine().html()
      expect(html.indexOf('username')).toBeLessThan(html.indexOf('ibicopy'))
    })
  })
})
