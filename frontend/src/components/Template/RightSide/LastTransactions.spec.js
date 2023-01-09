import { mount } from '@vue/test-utils'
import LastTransactions from './LastTransactions'

const localVue = global.localVue

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
}

describe('TransactionLink', () => {
  let wrapper

  const Wrapper = () => {
    return mount(LastTransactions, { localVue, mocks })
  }
  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component div.rightside-last-transactions', () => {
      expect(wrapper.find('div.rightside-last-transactions').exists()).toBe(true)
    })
  })
})
