import { mount } from '@vue/test-utils'
import Send, { SEND_TYPES } from './Send'
import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'
import { TRANSACTION_STEPS } from '@/components/GddSend.vue'
import { sendCoins, createTransactionLink } from '@/graphql/mutations.js'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import flushPromises from 'flush-promises'

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
    $d: jest.fn((d) => d),
    $store: {
      state: {
        email: 'sender@example.org',
        firstName: 'Testy',
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
        const transactionForm = wrapper.findComponent({ name: 'TransactionForm' })
        await transactionForm.findAll('input[type="radio"]').at(0).setChecked()
        await transactionForm.find('input[type="email"]').setValue('user@example.org')
        await transactionForm.find('input[type="text"]').setValue('23.45')
        await transactionForm.find('textarea').setValue('Make the best of it!')
        await transactionForm.find('form').trigger('submit')
        await flushPromises()
      })

      it('steps forward in the dialog', () => {
        expect(wrapper.findComponent({ name: 'TransactionConfirmationSend' }).exists()).toBe(true)
      })

      describe('confirm transaction view', () => {
        describe('cancel confirmation', () => {
          beforeEach(async () => {
            await wrapper
              .findComponent({ name: 'TransactionConfirmationSend' })
              .find('button.btn-secondary')
              .trigger('click')
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
              .find('button.btn-primary')
              .trigger('click')
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
              .find('button.btn-primary')
              .trigger('click')
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

    describe('transaction form link', () => {
      const now = new Date().toISOString()
      beforeEach(async () => {
        apolloMutationMock.mockResolvedValue({
          data: {
            createTransactionLink: {
              link: 'http://localhost/redeem/0123456789',
              amount: '56.78',
              memo: 'Make the best of the link!',
              validUntil: now,
            },
          },
        })
        const transactionForm = wrapper.findComponent({ name: 'TransactionForm' })
        await transactionForm.findAll('input[type="radio"]').at(1).setChecked()
        await transactionForm.find('input[type="text"]').setValue('56.78')
        await transactionForm.find('textarea').setValue('Make the best of the link!')
        await transactionForm.find('form').trigger('submit')
        await flushPromises()
      })

      it('steps forward in the dialog', () => {
        expect(wrapper.findComponent({ name: 'TransactionConfirmationLink' }).exists()).toBe(true)
      })

      describe('transaction is confirmed and server response is success', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper
            .findComponent({ name: 'TransactionConfirmationLink' })
            .find('button.btn-primary')
            .trigger('click')
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

          describe('copy link with success', () => {
            beforeEach(async () => {
              navigatorClipboardMock.mockResolvedValue()
              await wrapper.findAll('button').at(1).trigger('click')
            })

            it('should call clipboard.writeText', () => {
              expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                'http://localhost/redeem/0123456789',
              )
            })
            it('toasts success message', () => {
              expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.link-copied')
            })
          })

          describe('copy link with error', () => {
            beforeEach(async () => {
              navigatorClipboardMock.mockRejectedValue()
              await wrapper.findAll('button').at(1).trigger('click')
            })

            it('toasts error message', () => {
              expect(toastErrorSpy).toBeCalledWith('gdd_per_link.not-copied')
            })
          })
        })

        describe('copy link and text with success', () => {
          const navigatorClipboard = navigator.clipboard
          beforeAll(() => {
            delete navigator.clipboard
            navigator.clipboard = { writeText: navigatorClipboardMock }
          })
          afterAll(() => {
            navigator.clipboard = navigatorClipboard
          })

          describe('copy link and text with success', () => {
            beforeEach(async () => {
              navigatorClipboardMock.mockResolvedValue()
              await wrapper.findAll('button').at(0).trigger('click')
            })

            it('should call clipboard.writeText', () => {
              expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                'http://localhost/redeem/0123456789\n' +
                  'Testy transaction-link.send_you 56.78 Gradido.\n' +
                  '"Make the best of the link!"\n' +
                  'gdd_per_link.credit-your-gradido gdd_per_link.validUntilDate\n' +
                  'gdd_per_link.link-hint',
              )
            })
            it('toasts success message', () => {
              expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.link-and-text-copied')
            })
          })

          describe('copy link and text with error', () => {
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
            await wrapper.findAll('button').at(3).trigger('click')
          })

          it('Shows the TransactionForm', () => {
            expect(wrapper.findComponent({ name: 'TransactionForm' }).exists()).toBe(true)
          })
        })
      })

      describe('apollo call returns error', () => {
        beforeEach(async () => {
          apolloMutationMock.mockRejectedValue({ message: 'OUCH!' })
          await wrapper
            .findComponent({ name: 'TransactionConfirmationLink' })
            .find('button.btn-primary')
            .trigger('click')
        })

        it('toasts an error message', () => {
          expect(toastErrorSpy).toBeCalledWith('OUCH!')
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
