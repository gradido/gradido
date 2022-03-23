import { mount } from '@vue/test-utils'
import Send, { SEND_TYPES } from './Send'
import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'
import { TRANSACTION_STEPS } from '@/components/GddSend.vue'
import { sendCoins, createTransactionLink } from '@/graphql/mutations.js'
import DashboardLayout from '@/layouts/DashboardLayout_gdd.vue'

const apolloMutationMock = jest.fn()
apolloMutationMock.mockResolvedValue('success')

const navigatorClipboardMock = jest.fn()

const localVue = global.localVue

describe('Send', () => {
  let wrapper

  const propsData = {
    balance: 123.45,
    GdtBalance: 1234.56,
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
      mutate: apolloMutationMock,
    },
    $route: {
      query: {},
    },
  }

  const Wrapper = () => {
    return mount(Send, {
      localVue,
      mocks,
      propsData,
      provide: DashboardLayout.provide,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a send field', () => {
      expect(wrapper.find('div.gdd-send').exists()).toBe(true)
    })

    describe('fill transaction form for send coins', () => {
      beforeEach(async () => {
        wrapper.findComponent({ name: 'TransactionForm' }).vm.$emit('set-transaction', {
          email: 'user@example.org',
          amount: 23.45,
          memo: 'Make the best of it!',
          selected: SEND_TYPES.send,
        })
      })

      it('steps forward in the dialog', () => {
        expect(wrapper.findComponent({ name: 'TransactionConfirmationSend' }).exists()).toBe(true)
      })

      describe('confirm transaction view', () => {
        describe('cancel confirmation', () => {
          beforeEach(async () => {
            await wrapper
              .findComponent({ name: 'TransactionConfirmationSend' })
              .vm.$emit('on-reset')
          })

          it('shows the transaction formular again', () => {
            expect(wrapper.findComponent({ name: 'TransactionForm' }).exists()).toBe(true)
          })

          it('restores the previous data in the formular', () => {
            expect(wrapper.find('#input-group-1').find('input').vm.$el.value).toBe(
              'user@example.org',
            )
            expect(wrapper.find('#input-group-2').find('input').vm.$el.value).toBe('23.45')
            expect(wrapper.find('#input-group-3').find('textarea').vm.$el.value).toBe(
              'Make the best of it!',
            )
          })
        })

        describe('confirm transaction with server succees', () => {
          beforeEach(async () => {
            jest.clearAllMocks()
            await wrapper
              .findComponent({ name: 'TransactionConfirmationSend' })
              .vm.$emit('send-transaction')
          })

          it('calls the API when send-transaction is emitted', async () => {
            expect(apolloMutationMock).toBeCalledWith(
              expect.objectContaining({
                mutation: sendCoins,
                variables: {
                  email: 'user@example.org',
                  amount: 23.45,
                  memo: 'Make the best of it!',
                  selected: SEND_TYPES.send,
                },
              }),
            )
          })

          it('emits update transactions', () => {
            expect(wrapper.emitted('update-transactions')).toBeTruthy()
            expect(wrapper.emitted('update-transactions')).toEqual(expect.arrayContaining([[{}]]))
          })

          it('shows the success page', () => {
            expect(wrapper.find('div.card-body').text()).toContain('form.send_transaction_success')
          })
        })

        describe('confirm transaction with server error', () => {
          beforeEach(async () => {
            jest.clearAllMocks()
            apolloMutationMock.mockRejectedValue({ message: 'recipient not known' })
            await wrapper
              .findComponent({ name: 'TransactionConfirmationSend' })
              .vm.$emit('send-transaction')
          })

          it('has a component TransactionResultSendError', () => {
            expect(wrapper.findComponent({ name: 'TransactionResultSendError' }).exists()).toBe(
              true,
            )
          })

          it('has an standard error text', () => {
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
    })

    /* LINK */

    describe('transaction form link', () => {
      beforeEach(async () => {
        apolloMutationMock.mockResolvedValue({
          data: { createTransactionLink: { code: '0123456789' } },
        })
        await wrapper.findComponent({ name: 'TransactionForm' }).vm.$emit('set-transaction', {
          amount: 56.78,
          memo: 'Make the best of the link!',
          selected: SEND_TYPES.link,
        })
      })

      it('steps forward in the dialog', () => {
        expect(wrapper.findComponent({ name: 'TransactionConfirmationLink' }).exists()).toBe(true)
      })

      describe('transaction is confirmed and server response is success', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper
            .findComponent({ name: 'TransactionConfirmationLink' })
            .vm.$emit('send-transaction')
        })

        it('calls the API when send-transaction is emitted', async () => {
          expect(apolloMutationMock).toBeCalledWith(
            expect.objectContaining({
              mutation: createTransactionLink,
              variables: {
                amount: 56.78,
                memo: 'Make the best of the link!',
              },
            }),
          )
        })

        it('emits update-transactions', () => {
          expect(wrapper.emitted('update-transactions')).toBeTruthy()
          expect(wrapper.emitted('update-transactions')).toEqual(expect.arrayContaining([[{}]]))
        })

        it('finds the clip board component', () => {
          expect(wrapper.findComponent({ name: 'ClipboardCopy' }).exists()).toBe(true)
        })

        it('shows the success message', () => {
          expect(wrapper.find('div.card-body').text()).toContain('gdd_per_link.created')
        })

        it('shows the close button', () => {
          expect(wrapper.find('div.card-body').text()).toContain('form.close')
        })

        describe('copy link to clipboard', () => {
          const navigatorClipboard = navigator.clipboard
          beforeAll(() => {
            delete navigator.clipboard
            navigator.clipboard = { writeText: navigatorClipboardMock }
          })
          afterAll(() => {
            navigator.clipboard = navigatorClipboard
          })

          describe('copy with success', () => {
            beforeEach(async () => {
              navigatorClipboardMock.mockResolvedValue()
              await wrapper.findAll('button').at(0).trigger('click')
            })

            it('toasts success message', () => {
              expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.link-copied')
            })
          })

          describe('copy with error', () => {
            beforeEach(async () => {
              navigatorClipboardMock.mockRejectedValue()
              await wrapper.findAll('button').at(0).trigger('click')
            })

            it('toasts error message', () => {
              expect(toastErrorSpy).toBeCalledWith('gdd_per_link.not-copied')
            })
          })
        })

        describe('close button click', () => {
          beforeEach(async () => {
            await wrapper.findAll('button').at(1).trigger('click')
          })

          it('Shows the TransactionForm', () => {
            expect(wrapper.findComponent({ name: 'TransactionForm' }).exists()).toBe(true)
          })
        })
      })

      describe('send apollo if transaction link with error', () => {
        beforeEach(() => {
          apolloMutationMock.mockRejectedValue({ message: 'OUCH!' })
          wrapper.find('button.btn-success').trigger('click')
        })

        it('toasts an error message', () => {
          expect(toastErrorSpy).toBeCalledWith({ message: 'OUCH!' })
        })
      })
    })

    describe('no field selected on send transaction', () => {
      const errorHandler = localVue.config.errorHandler

      beforeAll(() => {
        localVue.config.errorHandler = jest.fn()
      })

      afterAll(() => {
        localVue.config.errorHandler = errorHandler
      })

      beforeEach(async () => {
        await wrapper.setData({
          currentTransactionStep: TRANSACTION_STEPS.transactionConfirmationSend,
          transactionData: {
            email: 'user@example.org',
            amount: 23.45,
            memo: 'Make the best of it!',
            selected: 'not-valid',
          },
        })
      })

      it('throws an error', async () => {
        try {
          await wrapper
            .findComponent({ name: 'TransactionConfirmationSend' })
            .vm.$emit('send-transaction')
        } catch (error) {
          expect(error).toBe('undefined transactionData.selected : not-valid')
        }
      })
    })
  })
})
