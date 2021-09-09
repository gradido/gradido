import { mount } from '@vue/test-utils'
import TransactionCollapse from './TransactionCollapse'

const localVue = global.localVue

describe('TransactionCollapse', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => n),
  }

  const propsData = {
    amount: 100,
    gdt: 110,
    factor: 22,
    gdtEntryType: 4,
  }

  const Wrapper = () => {
    return mount(TransactionCollapse, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-collapse').exists()).toBeTruthy()
    })

    it('checks the prop amount  ', () => {
      expect(wrapper.props().amount).toBe(100)
    })

    it('checks the prop gdt  ', () => {
      expect(wrapper.props().gdt).toBe(110)
    })

    it('checks the prop factor  ', () => {
      expect(wrapper.props().factor).toBe(22)
    })

    it('checks the prop gdtEntryType  ', () => {
      expect(wrapper.props().gdtEntryType).toBe(4)
    })
  })
})
