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

  const propsData = {
    amount: 100,
    gdt: 110,
    factor: 22,
    comment: 'this is the comment for a gdt transaction',
    date: '2020-04-10T13:28:00+00:00',
    gdtEntryType: 4,
  }

  const Wrapper = () => {
    return mount(Transaction, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-list-item').exists()).toBeTruthy()
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

    it('checks the prop comment  ', () => {
      expect(wrapper.props().comment).toBe('this is the comment for a gdt transaction')
    })

    it('checks the prop date  ', () => {
      expect(wrapper.props().date).toBe('2020-04-10T13:28:00+00:00')
    })

    it('checks the prop gdtEntryType  ', () => {
      expect(wrapper.props().gdtEntryType).toBe(4)
    })
  })
})
