import { mount } from '@vue/test-utils'
import App from './App'

const localVue = global.localVue

const storeCommitMock = jest.fn()

const mocks = {
  $store: {
    commit: storeCommitMock,
  },
}

const localStorageMock = (() => {
  let store = {}

  return {
    getItem: (key) => {
      return store[key] || null
    },
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

describe('App', () => {
  let wrapper

  const Wrapper = () => {
    return mount(App, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a div with id "app"', () => {
      expect(wrapper.find('div#app').exists()).toBeTruthy()
    })
  })

  describe('window localStorage is undefined', () => {
    it('does not commit a token to the store', () => {
      expect(storeCommitMock).not.toBeCalled()
    })
  })

  describe('with token in local storage', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      })
      window.localStorage.setItem('vuex', JSON.stringify({ token: 1234 }))
    })

    it.skip('commits the token to the store', () => {
      expect(storeCommitMock).toBeCalledWith('token', 1234)
    })
  })
})
