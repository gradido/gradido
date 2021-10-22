import { mount } from '@vue/test-utils'
import AuthLayoutGdd from './AuthLayout_gdd'

const localVue = global.localVue

describe('AuthLayoutGdd', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $route: {
      meta: {
        hideFooter: false,
      },
    },
    $store: {
      state: {},
      commit: jest.fn(),
    },
  }

  const stubs = {
    // RouterLink: RouterLinkStub,
    RouterView: true,
  }

  const Wrapper = () => {
    return mount(AuthLayoutGdd, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has no sidebar', () => {
      expect(wrapper.find('nav#sidenav-main').exists()).not.toBeTruthy()
    })

    it('has a main content div', () => {
      expect(wrapper.find('div.main-content').exists()).toBeTruthy()
    })

    it('has a footer inside the main content', () => {
      expect(wrapper.find('div.main-content').find('footer.footer').exists()).toBeTruthy()
    })
  })
})
