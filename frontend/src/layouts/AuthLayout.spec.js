import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import AuthLayout from './AuthLayout'
import {
  BAvatar,
  BButton,
  BCard,
  BCardBody,
  BCol,
  BImg,
  BLink,
  BPopover,
  BRow,
} from 'bootstrap-vue-next'

// Mock child components
vi.mock('@/components/Auth/AuthNavbar', () => ({
  default: { name: 'AuthNavbar', template: '<div>AuthNavbar</div>' },
}))
vi.mock('@/components/Auth/AuthNavbarSmall', () => ({
  default: { name: 'AuthNavbarSmall', template: '<div>AuthNavbarSmall</div>' },
}))
vi.mock('@/components/Auth/AuthCarousel', () => ({
  default: { name: 'AuthCarousel', template: '<div>AuthCarousel</div>' },
}))
vi.mock('@/components/LanguageSwitch2', () => ({
  default: { name: 'LanguageSwitch2', template: '<div>LanguageSwitch2</div>' },
}))
vi.mock('@/components/Auth/AuthFooter', () => ({
  default: { name: 'AuthFooter', template: '<div>AuthFooter</div>' },
}))

// Mock CONFIG
vi.mock('@/config', () => ({
  default: {
    COMMUNITY_NAME: 'Test Community',
  },
}))

describe('AuthLayout', () => {
  let wrapper
  const createVuexStore = () => {
    return createStore({
      state: {
        project: '',
      },
      actions: {
        project: vi.fn(),
      },
      mutations: {
        project: vi.fn(),
      },
    })
  }

  const createWrapper = () => {
    return mount(AuthLayout, {
      global: {
        components: {
          BLink,
          BButton,
          BRow,
          BCol,
          BCard,
          BCardBody,
          BAvatar,
          BImg,
          BPopover,
        },
        plugins: [createVuexStore()],
        mocks: {
          $i18n: {
            locale: 'en',
          },
          $t: (key) => key,
          $route: {
            meta: {
              hideFooter: false,
            },
          },
        },
        stubs: {
          RouterView: true,
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('.auth-template').exists()).toBe(true)
    })

    it('has Component AuthNavbar', () => {
      expect(wrapper.findComponent({ name: 'AuthNavbar' }).exists()).toBe(true)
    })

    it('has Component AuthCarousel', () => {
      expect(wrapper.findComponent({ name: 'AuthCarousel' }).exists()).toBe(true)
    })

    it('has Component AuthFooter', () => {
      expect(wrapper.findComponent({ name: 'AuthFooter' }).exists()).toBe(true)
    })

    it('has no sidebar', () => {
      expect(wrapper.find('nav#sidenav-main').exists()).toBe(false)
    })

    it('displays the community name', () => {
      expect(wrapper.find('.h1').text()).toBe('Test Community')
    })

    it('test size in setTextSize', async () => {
      const mockEl = { style: {} }
      vi.spyOn(document, 'querySelector').mockReturnValue(mockEl)

      await wrapper.vm.setTextSize(0.85)
      expect(mockEl.style.fontSize).toBe('0.85rem')
    })
  })

  describe('when hideFooter is true', () => {
    beforeEach(() => {
      wrapper = mount(AuthLayout, {
        global: {
          plugins: [createVuexStore()],
          mocks: {
            $i18n: {
              locale: 'en',
            },
            $t: (key) => key,
            $route: {
              meta: {
                hideFooter: true,
              },
            },
          },
          stubs: {
            BLink: true,
            BButton: true,
            BRow: true,
            BCol: true,
            BCard: true,
            BCardBody: true,
            BAvatar: true,
            BImg: true,
            BPopover: true,
            RouterView: true,
          },
        },
      })
    })

    it('does not render AuthFooter', () => {
      expect(wrapper.findComponent({ name: 'AuthFooter' }).exists()).toBe(false)
    })
  })
})
