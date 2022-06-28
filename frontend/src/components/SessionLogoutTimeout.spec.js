import { mount } from '@vue/test-utils'
import SessionLogoutTimeout from './SessionLogoutTimeout'

const localVue = global.localVue

const apolloQueryMock = jest.fn()

const state = {
  token: '1234',
  tokenTime: '123456789',
}

const mocks = {
  $store: {
    state,
  },
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $apollo: {
    query: apolloQueryMock,
  },
  $route: {
    meta: {
      requiresAuth: true,
    },
  },
}

describe('SessionLogoutTimeout', () => {
  let wrapper

  const Wrapper = () => {
    return mount(SessionLogoutTimeout, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component div.session-logout-timeout', () => {
      expect(wrapper.find('div.session-logout-timeout').exists()).toBe(true)
    })
  })
})
