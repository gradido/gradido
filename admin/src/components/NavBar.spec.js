import { mount } from '@vue/test-utils'
import NavBar from './NavBar.vue'

const localVue = global.localVue

const apolloMutateMock = jest.fn()
const storeDispatchMock = jest.fn()
const routerPushMock = jest.fn()

const stubs = {
  RouterLink: true,
}

const mocks = {
  $t: jest.fn((t) => t),
  $apollo: {
    mutate: apolloMutateMock,
  },
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
    return mount(NavBar, { mocks, localVue, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-nabvar', () => {
      expect(wrapper.find('.component-nabvar').exists()).toBeTruthy()
    })
  })

  describe('Navbar Menu', () => {
    it('has a link to overview', () => {
      expect(wrapper.findAll('.nav-item').at(0).find('a').attributes('href')).toBe('/')
    })

    it('has a link to /user', () => {
      expect(wrapper.findAll('.nav-item').at(1).find('a').attributes('href')).toBe('/user')
    })

    it('has a link to /creation', () => {
      expect(wrapper.findAll('.nav-item').at(2).find('a').attributes('href')).toBe('/creation')
    })

    it('has a link to /creation-confirm', () => {
      expect(wrapper.findAll('.nav-item').at(3).find('a').attributes('href')).toBe(
        '/creation-confirm',
      )
    })

    it('has a link to /contribution-links', () => {
      expect(wrapper.findAll('.nav-item').at(4).find('a').attributes('href')).toBe(
        '/contribution-links',
      )
    })

    it('has a link to /statistic', () => {
      expect(wrapper.findAll('.nav-item').at(5).find('a').attributes('href')).toBe('/statistic')
    })
  })

  describe('wallet', () => {
    const assignLocationSpy = jest.fn()
    beforeEach(async () => {
      await wrapper.findAll('.nav-item').at(6).find('a').trigger('click')
    })

    it.skip('changes window location to wallet', () => {
      expect(assignLocationSpy).toBeCalledWith('valid-token')
    })

    it('dispatches logout to store', () => {
      expect(storeDispatchMock).toBeCalledWith('logout')
    })
  })

  describe('logout', () => {
    const windowLocationMock = jest.fn()
    beforeEach(async () => {
      delete window.location
      window.location = {
        assign: windowLocationMock,
      }
      await wrapper.findAll('.nav-item').at(7).find('a').trigger('click')
    })

    it('redirects to /logout', () => {
      expect(windowLocationMock).toBeCalledWith('http://localhost/login')
    })

    it('dispatches logout to store', () => {
      expect(storeDispatchMock).toBeCalledWith('logout')
    })

    it('has called logout mutation', () => {
      expect(apolloMutateMock).toBeCalled()
    })
  })
})
