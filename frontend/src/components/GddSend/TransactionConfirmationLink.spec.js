import { mount } from '@vue/test-utils'
import TransactionConfirmationLink from './TransactionConfirmationLink'

const localVue = global.localVue

describe('GddSend confirm', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
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
    return mount(TransactionConfirmationLink, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component div.transaction-confirm-link', () => {
      expect(wrapper.find('div.transaction-confirm-link').exists()).toBeTruthy()
    })

    describe('has selected "link"', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          selected: 'link',
        })
      })
    })

    describe('has totalBalance under 0', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          balance: 0,
        })
      })

      it('has send button disabled', () => {
        expect(wrapper.find('.send-button').attributes('disabled')).toBe('disabled')
      })
    })

    describe('send now button', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      describe('single click', () => {
        beforeEach(async () => {
          await wrapper.find('button.btn.btn-gradido').trigger('click')
        })

        it('emits send transaction one time', () => {
          expect(wrapper.emitted('send-transaction')).toHaveLength(1)
        })
      })

      describe('double click', () => {
        beforeEach(async () => {
          await wrapper.find('button.btn.btn-gradido').trigger('click')
          await wrapper.find('button.btn.btn-gradido').trigger('click')
        })

        it('emits send transaction one time', () => {
          expect(wrapper.emitted('send-transaction')).toHaveLength(1)
        })
      })
    })
  })
})
