import { mount, RouterLinkStub } from '@vue/test-utils'
import AuthLayoutGdd from './AuthLayout_gdd'
import VueRouter from 'vue-router'

const localVue = global.localVue

describe('AuthLayoutGdd', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $store: {
      state: {},
      commit: jest.fn(),
    },
  }

  localVue.use(VueRouter)
  const router = new VueRouter()

  const stubs = {
    RouterLink: RouterLinkStub,
    RouterView: true,
  }

  const Wrapper = () => {
    return mount(AuthLayoutGdd, { localVue, mocks, stubs, router })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has Component AuthHeader', () => {
      expect(wrapper.findComponent({ name: 'AuthHeader' }).exists()).toBe(true)
    })

    it('has Component AuthCarousel', () => {
      expect(wrapper.findComponent({ name: 'AuthCarousel' }).exists()).toBe(true)
    })

    it('has Component AuthFooter', () => {
      expect(wrapper.findComponent({ name: 'AuthFooter' }).exists()).toBe(true)
    })

    it('has no sidebar', () => {
      expect(wrapper.find('nav#sidenav-main').exists()).not.toBeTruthy()
    })

    it('has LanguageSwitch', () => {
      expect(wrapper.findComponent({ name: 'LanguageSwitch' }).exists()).toBeTruthy()
    })

    test('test size in setTextSize ', () => {
      wrapper.vm.setTextSize('85')
      expect(wrapper.vm.$refs.pageFontSize.style.fontSize).toBe('85rem')
    })

    // describe('check LanguageSwitch on register page', () => {
    //   beforeEach(() => {
    //     mocks.$route.path = '/register'
    //     wrapper = Wrapper()
    //   })
    //
    //   it('has not LanguageSwitch', () => {
    //     expect(wrapper.findComponent({ name: 'LanguageSwitch' }).exists()).toBeFalsy()
    //   })
    // })
  })
})
