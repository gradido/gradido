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
  render (h) {
    return this.$options._renderChildren
  }
})

describe('DashboardLayoutGdd', () => {
  let wrapper

  let mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $n: jest.fn(),
  }

  let state = {
    user: {
      name: 'Peter Lustig',
      balance: 2546,
      balance_gdt: 20,
    },
    email: 'peter.lustig@example.org',
  }

  let stubs = {
    RouterLink: RouterLinkStub,
    FadeTransition: transitionStub(),
  }

  let store = new Vuex.Store({
    state,
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

    it('has a notifications component', () => {
      expect(wrapper.find('div.notifications').exists()).toBeTruthy()
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
        expect(navbar.findAll('ul > li')).toHaveLength(5)
      })
      
      it('has first item "send" in navbar', () => {
        expect(navbar.findAll('ul > li').at(0).text()).toEqual('sent')
      })

      it('has first item "send" linked to overview in navbar', () => {
        navbar.findAll('ul > li').at(0).trigger('click')
        expect(wrapper.findComponent(RouterLinkStub).props().to).toBe('/overview')
      })

      it('has second item "transactions" in navbar', () => {
        expect(navbar.findAll('ul > li').at(1).text()).toEqual('transactions')
      })

      it('has second item "transactions" linked to transactions in navbar', async () => {
        console.log(wrapper.findComponent(RouterLinkStub).props().to)
        navbar.findAll('ul > li > a').at(1).trigger('click')
        await wrapper.vm.$nextTick()
        await flushPromises()
        await jest.runAllTimers()
        console.log(wrapper.findComponent(RouterLinkStub).props().to)
        expect(wrapper.findComponent(RouterLinkStub).props().to).toBe('/transactions')
      })
    })
  })
})
