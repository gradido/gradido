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
      path: '/',
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

    it('has a main container div', () => {
      expect(wrapper.find('div.container').exists()).toBeTruthy()
    })

    it('has a footer inside the main container', () => {
      expect(wrapper.find('div.container').find('footer.footer').exists()).toBeTruthy()
    })

    it('has LanguageSwitch', () => {
      expect(wrapper.findComponent({ name: 'LanguageSwitch' }).exists()).toBeTruthy()
    })

    describe('check LanguageSwitch on register page', () => {
      beforeEach(() => {
        mocks.$route.path = '/register'
        wrapper = Wrapper()
      })

      it('has not LanguageSwitch', () => {
        expect(wrapper.findComponent({ name: 'LanguageSwitch' }).exists()).toBeFalsy()
      })
    })
  })
})
