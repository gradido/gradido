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

    it('emist update-transactions when update-transactions is called', async () => {
      wrapper.findComponent({ name: 'GddTransactionList' }).vm.$emit('update-transactions')
      expect(wrapper.emitted('update-transactions')).toEqual(
        expect.arrayContaining([expect.arrayContaining([{ firstPage: 1, items: 25 }])]),
      )
    })
  })
})
