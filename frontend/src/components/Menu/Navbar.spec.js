import { mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import AuthNavbar from './Navbar'

const localVue = global.localVue
localVue.use(VueRouter)

const router = new VueRouter()

const propsData = {
  balance: 1234,
}

const mocks = {
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $store: {
    state: {
      firstName: 'Testy',
      lastName: 'User',
      username: 'te_u',
    },
  },
}

describe('AuthNavbar', () => {
  let wrapper

  const Wrapper = () => {
    return mount(AuthNavbar, { localVue, router, propsData, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.navbar-component').exists()).toBeTruthy()
    })

    it('has a .navbar-brand element', () => {
      expect(wrapper.find('div.navbar-brand').exists()).toBeTruthy()
    })

    describe('.avatar element', () => {
      it('is rendered', () => {
        expect(wrapper.find('div.vue-avatar--wrapper').exists()).toBeTruthy()
      })

      it("has the user's initials", () => {
        expect(wrapper.find('.vue-avatar--wrapper').text()).toBe('TU')
      })
    })

    describe('user info', () => {
      it('has the full name', () => {
        expect(wrapper.find('div[data-test="navbar-item-fullName"]').text()).toBe('Testy User')
      })

      it('has the username', () => {
        expect(wrapper.find('div[data-test="navbar-item-username"]').text()).toBe('te_u')
      })
    })
  })
})
