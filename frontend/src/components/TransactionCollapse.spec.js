import { mount } from '@vue/test-utils'
import TransactionCollapse from './TransactionCollapse'

const localVue = global.localVue

const toastErrorMock = jest.fn()

describe('TransactionCollapse', () => {
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
    return mount(TransactionCollapse, { localVue, mocks })
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
