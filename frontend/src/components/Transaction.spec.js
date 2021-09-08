import { mount } from '@vue/test-utils'
import Transaction from './Transaction'

const localVue = global.localVue

const toastErrorMock = jest.fn()

describe('Transaction', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => n),
    $d: jest.fn((d) => d),
    $toasted: {
      error: toastErrorMock,
    },
  }

  const propsData = {
    amount: 100,
    gdt: 110,
    factor: 22,
    comment: '',
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
  })
})
