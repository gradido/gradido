import { mount } from '@vue/test-utils'
import Thx from './thx'

const localVue = global.localVue

describe('Thx', () => {
  let wrapper

  const Wrapper = (mocks) => {
    return mount(Thx, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper({
        $t: jest.fn((t) => t),
        $route: {
          params: {
            comingFrom: 'password',
          },
        },
      })
    })

    it('renders the thx page', () => {
      expect(wrapper.find('div.header').exists()).toBeTruthy()
    })

    it('renders the title', () => {
      expect(wrapper.find('p.h1').text()).toBe('site.thx.title')
    })
  })

  describe('coming from /password', () => {
    beforeEach(() => {
      wrapper = Wrapper({
        $t: jest.fn((t) => t),
        $route: {
          params: {
            comingFrom: 'password',
          },
        },
      })
    })

    it('renders the thanks text', () => {
      expect(wrapper.find('p.h4').text()).toBe('site.thx.email')
    })

    it('renders the thanks redirect button', () => {
      expect(wrapper.find('a.btn').text()).toBe('login')
    })

    it('links the redirect button to /login', () => {
      expect(wrapper.find('a.btn').attributes('href')).toBe('/login')
    })
  })

  describe('coming from /reset', () => {
    beforeEach(() => {
      wrapper = Wrapper({
        $t: jest.fn((t) => t),
        $route: {
          params: {
            comingFrom: 'reset',
          },
        },
      })
    })

    it('renders the thanks text', () => {
      expect(wrapper.find('p.h4').text()).toBe('site.thx.reset')
    })

    it('renders the thanks redirect button', () => {
      expect(wrapper.find('a.btn').text()).toBe('login')
    })

    it('links the redirect button to /login', () => {
      expect(wrapper.find('a.btn').attributes('href')).toBe('/login')
    })
  })

  describe('coming from /register', () => {
    beforeEach(() => {
      wrapper = Wrapper({
        $t: jest.fn((t) => t),
        $route: {
          params: {
            comingFrom: 'register',
          },
        },
      })
    })

    it('renders the thanks text', () => {
      expect(wrapper.find('p.h4').text()).toBe('site.thx.register')
    })

    it('renders the thanks redirect button', () => {
      expect(wrapper.find('a.btn').text()).toBe('site.login.signin')
    })

    it('links the redirect button to /login', () => {
      expect(wrapper.find('a.btn').attributes('href')).toBe('/overview')
    })
  })
})
