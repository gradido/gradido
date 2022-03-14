import { mount } from '@vue/test-utils'
import Send from './Send'
import { toastErrorSpy } from '../../test/testSetup'

const sendCoinsMock = jest.fn()
sendCoinsMock.mockResolvedValue('success')

const createTransactionLinkMock = jest.fn()
createTransactionLinkMock.mockResolvedValue('error')

const localVue = global.localVue

// window.scrollTo = jest.fn()

describe('Send', () => {
  let wrapper

  const propsData = {
    balance: 123.45,
    GdtBalance: 1234.56,
    transactions: [{ balance: 0.1 }],
    pending: true,
  }

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => String(n)),
    $store: {
      state: {
        email: 'sender@example.org',
      },
    },
    $apollo: {
      mutate: sendCoinsMock,
    },
  }

  const Wrapper = () => {
    return mount(Send, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a send field', () => {
      expect(wrapper.find('div.gdd-send').exists()).toBeTruthy()
    })

    /* SEND */
    describe('transaction form', () => {
      beforeEach(async () => {
        wrapper.findComponent({ name: 'TransactionForm' }).vm.$emit('set-transaction', {
          email: 'user@example.org',
          amount: 23.45,
          memo: 'Make the best of it!',
          selected: 'send',
        })
      })
      it('steps forward in the dialog', () => {
        expect(wrapper.findComponent({ name: 'TransactionConfirmationSend' }).exists()).toBe(true)
      })
    })

    describe('confirm transaction if selected:send', () => {
      beforeEach(() => {
        wrapper.setData({
          currentTransactionStep: 1,
          transactionData: {
            email: 'user@example.org',
            amount: 23.45,
            memo: 'Make the best of it!',
            selected: 'send',
          },
        })
      })

      it('resets the transaction process when on-reset is emitted', async () => {
        await wrapper.findComponent({ name: 'TransactionConfirmationSend' }).vm.$emit('on-reset')
        expect(wrapper.findComponent({ name: 'TransactionForm' }).exists()).toBeTruthy()
        expect(wrapper.vm.transactionData).toEqual({
          email: 'user@example.org',
          amount: 23.45,
          memo: 'Make the best of it!',
          selected: 'send',
        })
      })

      describe('transaction is confirmed and server response is success', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper
            .findComponent({ name: 'TransactionConfirmationSend' })
            .vm.$emit('send-transaction')
        })

        it('calls the API when send-transaction is emitted', async () => {
          expect(sendCoinsMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                email: 'user@example.org',
                amount: 23.45,
                memo: 'Make the best of it!',
                selected: 'send',
              },
            }),
          )
        })

        it('emits update-balance', () => {
          expect(wrapper.emitted('update-balance')).toBeTruthy()
          expect(wrapper.emitted('update-balance')).toEqual([[23.45]])
        })

        it('shows the succes page', () => {
          expect(wrapper.find('div.card-body').text()).toContain('form.send_transaction_success')
        })
      })

      describe('transaction is confirmed and server response is error', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          sendCoinsMock.mockRejectedValue({ message: 'recipient not known' })
          await wrapper
            .findComponent({ name: 'TransactionConfirmationSend' })
            .vm.$emit('send-transaction')
        })

        it('shows the error page', () => {
          expect(wrapper.find('.test-send_transaction_error').text()).toContain(
            'form.send_transaction_error',
          )
        })

        it('shows recipient not found', () => {
          expect(wrapper.find('.test-receiver-not-found').text()).toContain(
            'transaction.receiverNotFound',
          )
        })
      })
    })

    /* LINK */
    describe('transaction form', () => {
      beforeEach(async () => {
        wrapper.findComponent({ name: 'TransactionForm' }).vm.$emit('set-transaction', {
          amount: 23.45,
          memo: 'Make the best of it!',
          selected: 'link',
        })
      })
      it('steps forward in the dialog', () => {
        expect(wrapper.findComponent({ name: 'TransactionConfirmationLink' }).exists()).toBe(true)
      })
    })

    describe('send apollo if transaction link with error', () => {
      beforeEach(() => {
        createTransactionLinkMock.mockRejectedValue({ message: 'OUCH!' })
        wrapper = Wrapper()
        wrapper.find('button.btn-success').trigger('click')
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('unregister_mail.error')
      })
    })

    describe('confirm transaction if selected:link', () => {
      beforeEach(() => {
        wrapper.setData({
          currentTransactionStep: 1,
          transactionData: {
            amount: 23.45,
            memo: 'Make the best of it!',
            selected: 'link',
          },
        })
      })

      it('resets the transaction process when on-reset is emitted', async () => {
        await wrapper.findComponent({ name: 'TransactionConfirmationSend' }).vm.$emit('on-reset')
        expect(wrapper.findComponent({ name: 'TransactionForm' }).exists()).toBeTruthy()
        expect(wrapper.vm.transactionData).toEqual({
          email: '',
          amount: 23.45,
          memo: 'Make the best of it!',
          selected: 'link',
        })
      })
    })
  })
})
