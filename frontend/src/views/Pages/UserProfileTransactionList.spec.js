import { mount } from '@vue/test-utils'
import UserProfileTransactionList from './UserProfileTransactionList'

const localVue = global.localVue

describe('UserProfileTransactionList', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
  }

  const Wrapper = () => {
    return mount(UserProfileTransactionList, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the transaction table', () => {
      expect(wrapper.findComponent({ name: 'GddTransactionList' }).exists()).toBeTruthy()
    })

    it('emits update-transactions after creation', () => {
      expect(wrapper.emitted('update-transactions')).toEqual(
        expect.arrayContaining([expect.arrayContaining([{ firstPage: 1, items: 25 }])]),
      )
    })

    it('emist update-transactions when update-transactions is called', () => {
      wrapper
        .findComponent({ name: 'GddTransactionList' })
        .vm.$emit('update-transactions', { firstPage: 2, items: 25 })
      expect(wrapper.emitted('update-transactions')).toEqual(
        expect.arrayContaining([expect.arrayContaining([{ firstPage: 2, items: 25 }])]),
      )
    })
  })
})
