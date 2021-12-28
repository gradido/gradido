import { mount } from '@vue/test-utils'
import NavBar from './NavBar.vue'

const localVue = global.localVue

const storeDispatchMock = jest.fn()
const routerPushMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $store: {
    state: {
      openCreations: 1,
      token: 'valid-token',
    },
    dispatch: storeDispatchMock,
  },
  $router: {
    push: routerPushMock,
  },
}

describe('NavBar', () => {
  let wrapper

  const Wrapper = () => {
    return mount(NavBar, { mocks, localVue })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-nabvar', () => {
      expect(wrapper.find('.component-nabvar').exists()).toBeTruthy()
    })
  })

  describe('wallet', () => {
    const assignLocationSpy = jest.fn()
    beforeEach(async () => {
      await wrapper.findAll('a').at(5).trigger('click')
    })

    it.skip('changes widnow location to wallet', () => {
      expect(assignLocationSpy).toBeCalledWith('valid-token')
    })

    it('dispatches logout to store', () => {
      expect(storeDispatchMock).toBeCalledWith('logout')
    })
  })

  describe('logout', () => {
    // const assignLocationSpy = jest.fn()
    beforeEach(async () => {
      await wrapper.findAll('a').at(6).trigger('click')
    })

    it('redirects to /logout', () => {
      expect(routerPushMock).toBeCalledWith('/logout')
    })

    it('dispatches logout to store', () => {
      expect(storeDispatchMock).toBeCalledWith('logout')
    })
  })
})
