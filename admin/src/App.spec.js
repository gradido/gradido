import { mount } from '@vue/test-utils'
import App from './App'

const localVue = global.localVue

const storeCommitMock = jest.fn()

const mocks = {
  $store: {
    commit: storeCommitMock,
  },
}

const storageMock = () => {
  let storage = {}

  return {
    setItem: function(key, value) {
      console.log('SET CALLED')
      storage[key] = value || ''
    },
    getItem: function(key) {
      console.log('GET CALLED')
      return key in storage ? storage[key] : null
    }
  }
}

// window.localStorage = storageMock()

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
      console.log('Test', window.localStorage)
      window.localStorage = { 'foo': 'bar' }
      console.log('Test', window.localStorage)
      //window.localStorage.setItem('vuex', { token: 1234 })
    })
      
    it('commits the token to the store', () => {
      expect(storeCommitMock).toBeCalledWith('token', 1234)
    })
  })
})

