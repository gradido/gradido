import { mount, RouterLinkStub } from '@vue/test-utils'
import App from './App'

const localVue = global.localVue
const mockStoreCommit = jest.fn()

const stubs = {
  RouterLink: RouterLinkStub,
  RouterView: true,
}

describe('App', () => {
  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $store: {
      commit: mockStoreCommit,
      state: {
        token: null,
      },
    },
    $route: {
      meta: {
        requiresAuth: false,
      },
    },
  }

  let wrapper

  const Wrapper = () => {
    return mount(App, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the App', () => {
      expect(wrapper.find('#app').exists()).toBe(true)
    })

    it('has a component AuthLayout', () => {
      expect(wrapper.findComponent({ name: 'AuthLayout' }).exists()).toBe(true)
    })

    describe('route requires authorization', () => {
      beforeEach(() => {
        mocks.$route.meta.requiresAuth = true
        wrapper = Wrapper()
      })

      it('has a component DashboardLayout', () => {
        expect(wrapper.findComponent({ name: 'DashboardLayout' }).exists()).toBe(true)
      })
    })
  })
})
