import { mount } from '@vue/test-utils'
import GddSend from './GddSend'
import Vuex from 'vuex'

const localVue = global.localVue

describe('GddSend', () => {
  let wrapper

  let state = {
    user: {
      balance: 1234,
      balance_gdt: 9876,
    },
  }

  let store = new Vuex.Store({
    state,
  })

  let mocks = {
    $n: jest.fn((n) => n),
  }

  const Wrapper = () => {
    return mount(GddSend, { localVue, store, mocks })
  }

})
