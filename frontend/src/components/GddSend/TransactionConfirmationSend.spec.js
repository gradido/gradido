import { mount } from '@vue/test-utils'
import TransactionConfirmationSend from './TransactionConfirmationSend'

const localVue = global.localVue

describe('GddSend confirm', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
    $n: jest.fn((n) => String(n)),
  }

  const propsData = {
    balance: 1234,
    email: 'user@example.org',
    amount: 12.34,
    memo: 'Pessimisten stehen im Regen, Optimisten duschen unter den Wolken.',
    loading: false,
    selected: 'send',
  }

  const Wrapper = () => {
    return mount(TransactionConfirmationSend, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component div.transaction-confirm-send', () => {
      expect(wrapper.find('div.transaction-confirm-send').exists()).toBeTruthy()
    })

    describe('has selected "send"', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          selected: 'send',
        })
      })

      it('renders the component div.confirm-box-send', () => {
        expect(wrapper.find('div.confirm-box-send').exists()).toBeTruthy()
      })
    })
  })
})
