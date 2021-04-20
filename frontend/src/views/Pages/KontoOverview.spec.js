import { shallowMount } from '@vue/test-utils'
import KontoOverview from './KontoOverview'
import Vuex from 'vuex'

const localVue = global.localVue

describe('KontoOverview', () => {
  let wrapper

  let actions = {
    accountBalance: jest.fn(),
  }

  let store = new Vuex.Store({
    actions,
  })

  let mocks = {
    $t: jest.fn((t) => t),
  }

  const Wrapper = () => {
    return shallowMount(KontoOverview, { localVue, store, mocks })
  }

  describe('shallow Mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a header', () => {
      expect(wrapper.find('base-header-stub').exists()).toBeTruthy()
    })

    it('has a status line', () => {
      expect(wrapper.find('gdd-status-stub').exists()).toBeTruthy()
    })

    it('has a send field', () => {
      expect(wrapper.find('gdd-send-stub').exists()).toBeTruthy()
    })

    it('has a transactions table', () => {
      expect(wrapper.find('gdd-table-stub').exists()).toBeTruthy()
    })

    it('calls "accountBalance" action from store on creation', () => {
      const spy = jest.spyOn(actions, 'accountBalance')
      expect(spy).toHaveBeenCalled()
    })

    it('updates transctions data when change-transactions is emitted', async () => {
      wrapper.find('gdd-table-stub').vm.$emit('change-transactions', [0, 1])
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.transactions).toEqual(expect.arrayContaining([0, 1]))
    })

    describe('setRows method', () => {
      beforeEach(async () => {
        wrapper.find('gdd-send-stub').vm.$emit('change-rows', {
          row_form: false,
          row_check: true,
          row_thx: true,
        })
        await wrapper.vm.$nextTick()
      })

      it('updates row_form data when change-rows is emitted', () => {
        expect(wrapper.vm.row_form).toBeFalsy()
      })

      it('updates row_check data when change-rows is emitted', () => {
        expect(wrapper.vm.row_check).toBeTruthy()
      })

      it('updates row_thx data when change-rows is emitted', () => {
        expect(wrapper.vm.row_thx).toBeTruthy()
      })
    })
  })
})
