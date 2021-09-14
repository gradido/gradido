import { mount } from '@vue/test-utils'
import Transaction from './Transaction'

const localVue = global.localVue

describe('Transaction', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => n),
    $d: jest.fn((d) => d),
  }

  const Wrapper = () => {
    return mount(Transaction, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-list-item').exists()).toBeTruthy()
    })
  })
})
