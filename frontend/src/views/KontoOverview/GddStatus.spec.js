import { mount } from '@vue/test-utils'
import GddStatus from './GddStatus'
import Vuex from 'vuex'

const localVue = global.localVue

describe('GddStatus', () => {
  let wrapper

  let state = {
    user: {
      balance_gdt: 9876,
    },
  }

  let store = new Vuex.Store({
    state,
  })

  let mocks = {
    $n: jest.fn((n) => n),
  }

  let propsData = {
    balance: 1234,
  }

  const Wrapper = () => {
    return mount(GddStatus, { localVue, store, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('it displays the ammount of GDD', () => {
      expect(wrapper.findAll('div.card-body').at(0).text()).toEqual('1234 GDD')
    })

    it('it displays the ammount of GDT', () => {
      expect(wrapper.findAll('div.card-body').at(1).text()).toEqual('9876 GDT')
    })
  })
})
