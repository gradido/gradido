import { mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import AuthNavbar from './Navbar.vue'

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
      email: 'testy.user@example.com',
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

    describe('.b-avatar element', () => {
      it('is rendered', () => {
        expect(wrapper.find('button.b-avatar').exists()).toBeTruthy()
      })

      it("has the user's initials", () => {
        expect(
          wrapper.find('button.b-avatar').find('.b-avatar-text > span:nth-child(1)').text(),
        ).toBe(`${wrapper.vm.$store.state.firstName[0]}${wrapper.vm.$store.state.lastName[0]}`)
      })
    })

    describe('user info', () => {
      it('has the full name', () => {
        expect(wrapper.find('div.small').text()).toBe(
          `${wrapper.vm.$store.state.firstName} ${wrapper.vm.$store.state.lastName}`,
        )
      })

      it('has the email address', () => {
        expect(wrapper.find('div.small:nth-child(2)').text()).toBe(wrapper.vm.$store.state.email)
      })
    })
  })
})
