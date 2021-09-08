import { mount } from '@vue/test-utils'
import TransactionCollaps from './TransactionCollaps'

const localVue = global.localVue

const toastErrorMock = jest.fn()

describe('TransactionCollaps', () => {
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

  const Wrapper = () => {
    return mount(TransactionCollaps, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-collaps').exists()).toBeTruthy()
    })
  })
})
