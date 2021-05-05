import { shallowMount } from '@vue/test-utils'
import KontoOverview from './KontoOverview'

const localVue = global.localVue

describe('KontoOverview', () => {
  let wrapper

  let mocks = {
    $t: jest.fn((t) => t),
  }

  const Wrapper = () => {
    return shallowMount(KontoOverview, { localVue, mocks })
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

    it('updates transctions data when update-transactions is emitted', async () => {
      wrapper.find('gdd-table-stub').vm.$emit('update-transactions', [0, 1])
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.transactions).toEqual(expect.arrayContaining([0, 1]))
    })

    describe('updateBalance method', () => {
      beforeEach(async () => {
        wrapper.find('gdd-send-stub').vm.$emit('update-balance', {
          ammount: 42,
        })
        await wrapper.vm.$nextTick()
      })

      it('emmits updateBalance with correct value', () => {
        expect(wrapper.emitted('update-balance')).toEqual([[42]])
      })
    })

    describe('toggleShowList method', () => {
      beforeEach(async () => {
        wrapper.setProps({ showTransactionList: false })
        wrapper.find('gdd-send-stub').vm.$emit('toggle-show-list', true)
        await wrapper.vm.$nextTick()
      })

      it('changes the value of property showTransactionList', () => {
        expect(wrapper.vm.showTransactionList).toBeTruthy()
      })
    })
  })
})
