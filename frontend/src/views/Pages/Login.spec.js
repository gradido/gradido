import { mount, RouterLinkStub } from '@vue/test-utils'
import Vuex from 'vuex'

import Login from './Login'

const localVue = global.localVue

describe('Login', () => {
  let wrapper

  let mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
  }

  let store = new Vuex.Store({
    getters: {
      'auth/isModerator': () => false,
      'auth/user': () => {
        return { id: 'some-user' }
      },
    },
  })

  let stubs = {
    RouterLink: RouterLinkStub,
  }

  const Wrapper = () => {
    return mount(Login, { localVue, mocks, store, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Login form', () => {
      expect(wrapper.find('div.login-form').exists()).toBeTruthy()
    })
  })
})
