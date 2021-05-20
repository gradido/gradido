import { mount, RouterLinkStub } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import flushPromises from 'flush-promises'
import routes from '../../routes/routes'
import DashboardLayoutGdd from './DashboardLayout_gdd'

jest.useFakeTimers()

const localVue = global.localVue

const router = new VueRouter({ routes })

const transitionStub = () => ({
  render(h) {
    return this.$options._renderChildren
  },
})

describe('DashboardLayoutGdd', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $n: jest.fn(),
  }

  const state = {
    user: {
      name: 'Peter Lustig',
      balance: 2546,
      balance_gdt: 20,
    },
    email: 'peter.lustig@example.org',
  }

  const stubs = {
    RouterLink: RouterLinkStub,
    FadeTransition: transitionStub(),
  }

  const store = new Vuex.Store({
    state,
    mutations: {
      language: jest.fn(),
    },
  })

  const Wrapper = () => {
    return mount(DashboardLayoutGdd, { localVue, mocks, router, store, stubs })
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

      it('has five items in the navbar', () => {
        expect(navbar.findAll('ul > a')).toHaveLength(2)
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

      // to do: get this working!
      it.skip('has second item "transactions" linked to transactions in navbar', async () => {
        navbar.findAll('ul > a').at(1).trigger('click')
        await flushPromises()
        await jest.runAllTimers()
        await flushPromises()
        expect(wrapper.findComponent(RouterLinkStub).props().to).toBe('/transactions')
      })

      // it('has tree items in the navbar', () => {
      //  expect(navbar.findAll('ul > li')).toHaveLength(3)
      // })
      //
      // it('has third item "My profile" in navbar', () => {
      //  expect(navbar.findAll('ul > li').at(2).text()).toEqual('site.navbar.my-profil')
      // })
      //
      // it.skip('has third item "My profile" linked to profile in navbar', async () => {
      //  navbar.findAll('ul > li > a').at(2).trigger('click')
      //  await flushPromises()
      //  await jest.runAllTimers()
      //  await flushPromises()
      //  expect(wrapper.findComponent(RouterLinkStub).props().to).toBe('/profile')
      // })

      // it('has fourth item "Settigs" in navbar', () => {
      //  expect(navbar.findAll('ul > li').at(3).text()).toEqual('site.navbar.settings')
      // })
      //
      // it.skip('has fourth item "Settings" linked to profileedit in navbar', async () => {
      //  navbar.findAll('ul > li > a').at(3).trigger('click')
      //  await flushPromises()
      //  await jest.runAllTimers()
      //  await flushPromises()
      //  expect(wrapper.findComponent(RouterLinkStub).props().to).toBe('/profileedit')
      // })

      // it('has fifth item "Activity" in navbar', () => {
      //  expect(navbar.findAll('ul > li').at(4).text()).toEqual('site.navbar.activity')
      // })
      //
      // it.skip('has fourth item "Activity" linked to activity in navbar', async () => {
      //  navbar.findAll('ul > li > a').at(4).trigger('click')
      //  await flushPromises()
      //  await jest.runAllTimers()
      //  await flushPromises()
      //  expect(wrapper.findComponent(RouterLinkStub).props().to).toBe('/activity')
      // })
    })
  })
})
