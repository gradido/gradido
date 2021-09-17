import { mount } from '@vue/test-utils'
import AccountOverview from './AccountOverview'

const sendMock = jest.fn()
sendMock.mockResolvedValue('success')

const localVue = global.localVue

window.scrollTo = jest.fn()

describe('AccountOverview', () => {
  let wrapper

  const propsData = {
    balance: 123.45,
    transactionCount: 1,
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
      query: sendMock,
    },
  }

  const Wrapper = () => {
    return mount(AccountOverview, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a status line', () => {
      expect(wrapper.find('div.gdd-status').exists()).toBeTruthy()
    })

    it('has a send field', () => {
      expect(wrapper.find('div.gdd-send').exists()).toBeTruthy()
    })

    it('has a transactions table', () => {
      expect(wrapper.find('div.gdd-transaction-list').exists()).toBeTruthy()
    })

    describe('transaction form', () => {
      it('steps forward in the dialog', async () => {
        await wrapper.findComponent({ name: 'TransactionForm' }).vm.$emit('set-transaction', {
          email: 'user@example.org',
          amount: 23.45,
          memo: 'Make the best of it!',
        })
        expect(wrapper.findComponent({ name: 'TransactionConfirmation' }).exists()).toBeTruthy()
      })
    })

    describe('confirm transaction', () => {
      beforeEach(() => {
        wrapper.setData({
          currentTransactionStep: 1,
          transactionData: {
            email: 'user@example.org',
            amount: 23.45,
            memo: 'Make the best of it!',
          },
        })
      })

      it('resets the transaction process when on-reset is emitted', async () => {
        await wrapper.findComponent({ name: 'TransactionConfirmation' }).vm.$emit('on-reset')
        expect(wrapper.findComponent({ name: 'TransactionForm' }).exists()).toBeTruthy()
        expect(wrapper.vm.transactionData).toEqual({
          email: '',
          amount: 0,
          memo: '',
        })
      })

      describe('transaction is confirmed and server response is success', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper
            .findComponent({ name: 'TransactionConfirmation' })
            .vm.$emit('send-transaction')
        })

        it('calls the API when send-transaction is emitted', async () => {
          expect(sendMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                email: 'user@example.org',
                amount: 23.45,
                memo: 'Make the best of it!',
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
          sendMock.mockRejectedValue({ message: 'receiver not found' })
          await wrapper
            .findComponent({ name: 'TransactionConfirmation' })
            .vm.$emit('send-transaction')
        })

        it('shows the error page', () => {
          expect(wrapper.find('div.card-body').text()).toContain('form.send_transaction_error')
        })

        it('shows recipient not found', () => {
          expect(wrapper.text()).toContain('transaction.receiverNotFound')
        })
      })
    })
  })
})
