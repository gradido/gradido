import { mount, RouterLinkStub } from '@vue/test-utils'
import DashboardLayoutGdd from './DashboardLayout_gdd'
import flushPromises from 'flush-promises'
import loginAPI from '../../apis/loginAPI'

jest.mock('../../apis/loginAPI')

const localVue = global.localVue

const transitionStub = () => ({
  render(h) {
    return this.$options._renderChildren
  },
})

const logoutMock = jest.fn()
const storeDispatchMock = jest.fn()
const storeCommitMock = jest.fn()
const routerPushMock = jest.fn()

loginAPI.logout = logoutMock

describe('DashboardLayoutGdd', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $n: jest.fn(),
    $route: {
      meta: {
        hideFooter: false,
      },
    },
    $router: {
      push: routerPushMock,
    },
    $store: {
      state: {
        sessionId: 1,
        email: 'user@example.org',
      },
      dispatch: storeDispatchMock,
      commit: storeCommitMock,
    },
  }

  const stubs = {
    RouterLink: RouterLinkStub,
    FadeTransition: transitionStub(),
    RouterView: transitionStub(),
  }

  const Wrapper = () => {
    return mount(DashboardLayoutGdd, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a sidebar', () => {
      expect(wrapper.find('nav#sidenav-main').exists()).toBeTruthy()
    })

    it('has a main content div', () => {
      expect(wrapper.find('div.main-content').exists()).toBeTruthy()
    })

    it('has a footer inside the main content', () => {
      expect(wrapper.find('div.main-content').find('footer.footer').exists()).toBeTruthy()
    })

    describe('navigation bar', () => {
      let navbar

      beforeEach(() => {
        navbar = wrapper.findAll('ul.navbar-nav').at(0)
      })

      it('has three items in the navbar', () => {
        expect(navbar.findAll('ul > a')).toHaveLength(3)
      })

      it('has first item "send" in navbar', () => {
        expect(navbar.findAll('ul > a').at(0).text()).toEqual('send')
      })

      it('has first item "send" linked to overview in navbar', () => {
        navbar.findAll('ul > a').at(0).trigger('click')
        expect(wrapper.findComponent(RouterLinkStub).props().to).toBe('/overview')
      })

      it('has second item "transactions" in navbar', () => {
        expect(navbar.findAll('ul > a').at(1).text()).toEqual('transactions')
      })

      it('has second item "transactions" linked to transactions in navbar', async () => {
        expect(wrapper.findAll('a').at(3).attributes('href')).toBe('/transactions')
      })

      it('has tree items in the navbar', () => {
        expect(navbar.findAll('ul > a')).toHaveLength(3)
      })

      it('has third item "My profile" in navbar', () => {
        expect(navbar.findAll('ul > a').at(2).text()).toEqual('site.navbar.my-profil')
      })

      it('has third item "My profile" linked to profile in navbar', async () => {
        expect(wrapper.findAll('a').at(5).attributes('href')).toBe('/profile')
      })

      it('has a link to the members area', () => {
        expect(wrapper.findAll('ul').at(2).text()).toBe('members_area')
        expect(wrapper.findAll('ul').at(2).find('a').attributes('href')).toBe(
          'https://elopage.com/s/gradido/sign_in?locale=en',
        )
      })

      it('has a locale switch', () => {
        expect(wrapper.find('div.language-switch').exists()).toBeTruthy()
      })

      it('has a logout button', () => {
        expect(wrapper.findAll('ul').at(3).text()).toBe('logout')
      })

      describe('logout', () => {
        beforeEach(async () => {
          await wrapper.findComponent({ name: 'sidebar' }).vm.$emit('logout')
          await flushPromises()
        })

        it('calls the API', () => {
          expect(logoutMock).toBeCalledWith(1)
        })

        it('dispatches logout to store', () => {
          expect(storeDispatchMock).toBeCalledWith('logout')
        })

        it('redirects to login page', () => {
          expect(routerPushMock).toBeCalledWith('/login')
        })
      })
    })
  })
})
