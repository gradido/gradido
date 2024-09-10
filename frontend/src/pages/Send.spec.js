// import { mount } from '@vue/test-utils'
// import Send from './Send'
// import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'
// import { TRANSACTION_STEPS } from '@/components/GddSend'
// import { sendCoins, createTransactionLink } from '@/graphql/mutations.js'
// import DashboardLayout from '@/layouts/DashboardLayout'
// import flushPromises from 'flush-promises'
//
// const apolloMutationMock = jest.fn()
// apolloMutationMock.mockResolvedValue('success')
//
// const navigatorClipboardMock = jest.fn()
// const routerPushMock = jest.fn()
//
// const localVue = global.localVue
//
// describe('Send', () => {
//   let wrapper
//
//   const propsData = {
//     balance: 123.45,
//     GdtBalance: 1234.56,
//     pending: true,
//   }
//
//   const mocks = {
//     $t: jest.fn((t) => t),
//     $n: jest.fn((n) => String(n)),
//     $d: jest.fn((d) => d),
//     $store: {
//       state: {
//         email: 'sender@example.org',
//         firstName: 'Testy',
//       },
//     },
//     $apollo: {
//       mutate: apolloMutationMock,
//     },
//     $route: {
//       query: {},
//       params: {},
//     },
//     $router: {
//       push: routerPushMock,
//     },
//   }
//
//   const Wrapper = () => {
//     return mount(Send, {
//       localVue,
//       mocks,
//       propsData,
//       provide: DashboardLayout.provide,
//     })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('has a send field', () => {
//       expect(wrapper.find('div.gdd-send').exists()).toBe(true)
//     })
//
//     describe('fill transaction form for send coins', () => {
//       beforeEach(async () => {
//         const transactionForm = wrapper.findComponent({ name: 'TransactionForm' })
//         await transactionForm.findAll('input[type="radio"]').at(0).setChecked()
//         await transactionForm
//           .find('[data-test="input-identifier"]')
//           .find('input')
//           .setValue('user@example.org')
//         await transactionForm.find('[data-test="input-amount"]').find('input').setValue('23.45')
//         await transactionForm.find('textarea').setValue('Make the best of it!')
//         await transactionForm.find('form').trigger('submit')
//         await flushPromises()
//       })
//
//       it('steps forward in the dialog', () => {
//         expect(wrapper.findComponent({ name: 'TransactionConfirmationSend' }).exists()).toBe(true)
//       })
//
//       describe('confirm transaction view', () => {
//         describe('cancel confirmation', () => {
//           beforeEach(async () => {
//             await wrapper
//               .findComponent({ name: 'TransactionConfirmationSend' })
//               .find('button.btn-secondary')
//               .trigger('click')
//           })
//
//           it('shows the transaction formular again', () => {
//             expect(wrapper.findComponent({ name: 'TransactionForm' }).exists()).toBe(true)
//           })
//
//           it('restores the previous data in the formular', () => {
//             expect(wrapper.find('[data-test="input-identifier"]').find('input').vm.$el.value).toBe(
//               'user@example.org',
//             )
//             expect(wrapper.find('[data-test="input-amount"]').find('input').vm.$el.value).toBe(
//               '23.45',
//             )
//             expect(wrapper.find('textarea').vm.$el.value).toBe('Make the best of it!')
//           })
//         })
//
//         describe('confirm transaction with server succees', () => {
//           beforeEach(async () => {
//             jest.clearAllMocks()
//             await wrapper
//               .findComponent({ name: 'TransactionConfirmationSend' })
//               .find('button.btn-gradido')
//               .trigger('click')
//           })
//
//           it('calls the API when send-transaction is emitted', async () => {
//             expect(apolloMutationMock).toBeCalledWith(
//               expect.objectContaining({
//                 mutation: sendCoins,
//                 variables: {
//                   recipientIdentifier: 'user@example.org',
//                   amount: 23.45,
//                   memo: 'Make the best of it!',
//                   recipientCommunityIdentifier: '',
//                 },
//               }),
//             )
//           })
//
//           it('emits update transactions', () => {
//             expect(wrapper.emitted('update-transactions')).toBeTruthy()
//             expect(wrapper.emitted('update-transactions')).toEqual(expect.arrayContaining([[{}]]))
//           })
//
//           it('shows the success message', () => {
//             expect(
//               wrapper
//                 .findComponent({ name: 'TransactionResultSendSuccess' })
//                 .find('div[data-test="send-transaction-success-text"]')
//                 .text(),
//             ).toContain('form.send_transaction_success')
//           })
//         })
//
//         describe('confirm transaction with server error', () => {
//           beforeEach(async () => {
//             jest.clearAllMocks()
//             apolloMutationMock.mockRejectedValue({ message: 'recipient not known' })
//             await wrapper
//               .findComponent({ name: 'TransactionConfirmationSend' })
//               .find('button.btn-gradido')
//               .trigger('click')
//           })
//
//           it('has a component TransactionResultSendError', () => {
//             expect(wrapper.findComponent({ name: 'TransactionResultSendError' }).exists()).toBe(
//               true,
//             )
//           })
//
//           it('has an standard error text', () => {
//             expect(wrapper.find('.test-send_transaction_error').text()).toContain(
//               'form.send_transaction_error',
//             )
//           })
//
//           it('shows recipient not found', () => {
//             expect(wrapper.find('.test-receiver-not-found').text()).toContain(
//               'transaction.receiverNotFound',
//             )
//           })
//         })
//       })
//     })
//
//     describe('with gradidoID query', () => {
//       beforeEach(() => {
//         jest.clearAllMocks()
//         mocks.$route.params.userIdentifier = 'gradido-ID'
//         mocks.$route.params.communityIdentifier = 'community-ID'
//         wrapper = Wrapper()
//       })
//
//       it('has no email input field', () => {
//         expect(
//           wrapper
//             .findComponent({ name: 'TransactionForm' })
//             .find('[data-test="input-identifier"]')
//             .exists(),
//         ).toBe(false)
//       })
//
//       describe('submit form', () => {
//         beforeEach(async () => {
//           jest.clearAllMocks()
//           const transactionForm = wrapper.findComponent({ name: 'TransactionForm' })
//           await transactionForm.find('[data-test="input-amount"]').find('input').setValue('34.56')
//           await transactionForm.find('textarea').setValue('Make the best of it!')
//           await transactionForm.find('form').trigger('submit')
//           await flushPromises()
//         })
//
//         it('steps forward in the dialog', () => {
//           expect(wrapper.findComponent({ name: 'TransactionConfirmationSend' }).exists()).toBe(true)
//         })
//
//         describe('confirm transaction', () => {
//           beforeEach(async () => {
//             jest.clearAllMocks()
//             await wrapper
//               .findComponent({ name: 'TransactionConfirmationSend' })
//               .find('button.btn-gradido')
//               .trigger('click')
//           })
//
//           it('calls the API', async () => {
//             expect(apolloMutationMock).toBeCalledWith(
//               expect.objectContaining({
//                 mutation: sendCoins,
//                 variables: {
//                   recipientIdentifier: 'gradido-ID',
//                   amount: 34.56,
//                   memo: 'Make the best of it!',
//                   recipientCommunityIdentifier: '',
//                 },
//               }),
//             )
//           })
//
//           it('resets the gradido ID query in route', () => {
//             expect(routerPushMock).toBeCalledWith({ path: '/send' })
//           })
//         })
//       })
//     })
//
//     describe('transaction form link', () => {
//       const now = new Date().toISOString()
//       beforeEach(async () => {
//         apolloMutationMock.mockResolvedValue({
//           data: {
//             createTransactionLink: {
//               link: 'http://localhost/redeem/0123456789',
//               amount: '56.78',
//               memo: 'Make the best of the link!',
//               validUntil: now,
//             },
//           },
//         })
//         const transactionForm = wrapper.findComponent({ name: 'TransactionForm' })
//         await transactionForm.findAll('input[type="radio"]').at(1).setChecked()
//         await transactionForm.find('[data-test="input-amount"]').find('input').setValue('56.78')
//         await transactionForm.find('textarea').setValue('Make the best of the link!')
//         await transactionForm.find('form').trigger('submit')
//         await flushPromises()
//       })
//
//       it('steps forward in the dialog', () => {
//         expect(wrapper.findComponent({ name: 'TransactionConfirmationLink' }).exists()).toBe(true)
//       })
//
//       describe('transaction is confirmed and server response is success', () => {
//         beforeEach(async () => {
//           jest.clearAllMocks()
//           await wrapper
//             .findComponent({ name: 'TransactionConfirmationLink' })
//             .find('button.btn-gradido')
//             .trigger('click')
//         })
//
//         it('calls the API when send-transaction is emitted', async () => {
//           expect(apolloMutationMock).toBeCalledWith(
//             expect.objectContaining({
//               mutation: createTransactionLink,
//               variables: {
//                 amount: 56.78,
//                 memo: 'Make the best of the link!',
//               },
//             }),
//           )
//         })
//
//         it('emits update-transactions', () => {
//           expect(wrapper.emitted('update-transactions')).toBeTruthy()
//           expect(wrapper.emitted('update-transactions')).toEqual(expect.arrayContaining([[{}]]))
//         })
//
//         it('shows the success message', () => {
//           expect(
//             wrapper.findComponent({ name: 'TransactionResultLink' }).find('.h3').text(),
//           ).toContain('gdd_per_link.created')
//         })
//
//         it('shows the clip board component', () => {
//           expect(wrapper.findComponent({ name: 'ClipboardCopy' }).exists()).toBe(true)
//         })
//
//         it('shows the qr code', () => {
//           expect(
//             wrapper
//               .findComponent({ name: 'TransactionResultLink' })
//               .find('.figure-qr-code')
//               .exists(),
//           ).toBe(true)
//         })
//
//         it('shows the close button', () => {
//           expect(
//             wrapper
//               .findComponent({ name: 'TransactionResultLink' })
//               .find('button[data-test="close-btn"]')
//               .text(),
//           ).toEqual('form.close')
//         })
//
//         describe('copy link to clipboard', () => {
//           const navigatorClipboard = navigator.clipboard
//           beforeAll(() => {
//             delete navigator.clipboard
//             navigator.clipboard = { writeText: navigatorClipboardMock }
//           })
//           afterAll(() => {
//             navigator.clipboard = navigatorClipboard
//           })
//
//           describe('copy link with success', () => {
//             beforeEach(async () => {
//               navigatorClipboardMock.mockResolvedValue()
//               await wrapper.find('div[data-test="copyLink"]').trigger('click')
//             })
//
//             it('should call clipboard.writeText', () => {
//               expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
//                 'http://localhost/redeem/0123456789',
//               )
//             })
//             it('toasts success message', () => {
//               expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.link-copied')
//             })
//           })
//
//           describe('copy link with error', () => {
//             beforeEach(async () => {
//               navigatorClipboardMock.mockRejectedValue()
//               await wrapper.find('div[data-test="copyLink"]').trigger('click')
//             })
//
//             it('toasts error message', () => {
//               expect(toastErrorSpy).toBeCalledWith('gdd_per_link.not-copied')
//             })
//           })
//         })
//
//         describe('copy link and text to clipboard', () => {
//           const navigatorClipboard = navigator.clipboard
//           beforeAll(() => {
//             delete navigator.clipboard
//             navigator.clipboard = { writeText: navigatorClipboardMock }
//           })
//           afterAll(() => {
//             navigator.clipboard = navigatorClipboard
//           })
//
//           describe('copy link and text with success', () => {
//             beforeEach(async () => {
//               navigatorClipboardMock.mockResolvedValue()
//               await wrapper.find('div[data-test="copyLinkWithText"]').trigger('click')
//             })
//
//             it('should call clipboard.writeText', () => {
//               expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
//                 'http://localhost/redeem/0123456789\n' +
//                   'Testy transaction-link.send_you 56.78 Gradido.\n' +
//                   '"Make the best of the link!"\n' +
//                   'gdd_per_link.credit-your-gradido gdd_per_link.validUntilDate\n' +
//                   'gdd_per_link.link-hint',
//               )
//             })
//             it('toasts success message', () => {
//               expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.link-and-text-copied')
//             })
//           })
//
//           describe('copy link and text with error', () => {
//             beforeEach(async () => {
//               navigatorClipboardMock.mockRejectedValue()
//               await wrapper.find('div[data-test="copyLinkWithText"]').trigger('click')
//             })
//
//             it('toasts error message', () => {
//               expect(toastErrorSpy).toBeCalledWith('gdd_per_link.not-copied')
//             })
//           })
//         })
//
//         describe('close button click', () => {
//           beforeEach(async () => {
//             await wrapper
//               .findComponent({ name: 'TransactionResultLink' })
//               .find('button[data-test="close-btn"]')
//               .trigger('click')
//           })
//
//           it('shows the transaction form', () => {
//             expect(wrapper.findComponent({ name: 'TransactionForm' }).exists()).toBe(true)
//           })
//         })
//       })
//
//       describe('apollo call returns error', () => {
//         beforeEach(async () => {
//           apolloMutationMock.mockRejectedValue({ message: 'OUCH!' })
//           await wrapper
//             .findComponent({ name: 'TransactionConfirmationLink' })
//             .find('button.btn-gradido')
//             .trigger('click')
//         })
//
//         it('toasts an error message', () => {
//           expect(toastErrorSpy).toBeCalledWith('OUCH!')
//         })
//       })
//     })
//
//     describe('no field selected on send transaction', () => {
//       const errorHandler = localVue.config.errorHandler
//
//       beforeAll(() => {
//         localVue.config.errorHandler = jest.fn()
//       })
//
//       afterAll(() => {
//         localVue.config.errorHandler = errorHandler
//       })
//
//       beforeEach(async () => {
//         await wrapper.setData({
//           currentTransactionStep: TRANSACTION_STEPS.transactionConfirmationSend,
//           transactionData: {
//             email: 'user@example.org',
//             amount: 23.45,
//             memo: 'Make the best of it!',
//             selected: 'not-valid',
//           },
//         })
//       })
//
//       it('throws an error', async () => {
//         try {
//           await wrapper
//             .findComponent({ name: 'TransactionConfirmationSend' })
//             .vm.$emit('send-transaction')
//         } catch (error) {
//           expect(error).toBe('undefined transactionData.selected : not-valid')
//         }
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import flushPromises from 'flush-promises'
import Send from './Send.vue'
import { TRANSACTION_STEPS } from '@/components/GddSend'
import { sendCoins, createTransactionLink } from '@/graphql/mutations.js'
import GddSend from '@/components/GddSend.vue'
import { SEND_TYPES } from '@/utils/sendTypes'
import { nextTick } from 'vue'

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: mockRouterPush,
  })),
}))

const mockSendCoinsMutation = vi.fn()
const mockCreateTransactionLinkMutation = vi.fn()
vi.mock('@vue/apollo-composable', () => {
  return {
    useMutation: vi.fn((mutation) => {
      console.log('useMutation called with:', JSON.stringify(mutation, null, 2))

      const mutationBody = mutation.loc.source.body

      if (mutationBody.includes('sendCoins(')) {
        console.log('Identified as sendCoins mutation')
        return { mutate: mockSendCoinsMutation }
      }
      if (mutationBody.includes('createTransactionLink(')) {
        console.log('Identified as createTransactionLink mutation')
        return { mutate: mockCreateTransactionLinkMutation }
      }

      console.error('Unexpected mutation:', mutationBody)
      throw new Error('Unexpected mutation')
    }),
  }
})

describe('Send', () => {
  let wrapper

  const propsData = {
    balance: 123.45,
    GdtBalance: 1234.56,
    pending: true,
  }

  const createWrapper = (routeParams = {}) => {
    return mount(Send, {
      props: propsData,
      global: {
        mocks: {
          $t: (key) => key,
          $n: (n) => String(n),
          $d: (d) => d,
          $store: {
            state: {
              email: 'sender@example.org',
              firstName: 'Testy',
            },
          },
        },
        stubs: {
          GddSend,
          TransactionForm: true,
          TransactionConfirmationSend: true,
          TransactionConfirmationLink: true,
          TransactionResultSendSuccess: true,
          TransactionResultSendError: true,
          TransactionResultLink: true,
          ClipboardCopy: true,
        },
        provide: {
          route: {
            params: routeParams,
          },
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  it('has a send field', () => {
    expect(wrapper.find('div.gdd-send').exists()).toBe(true)
  })

  describe('fill transaction form for send coins', () => {
    beforeEach(async () => {
      const transactionForm = wrapper.findComponent({ name: 'TransactionForm' })
      await transactionForm.vm.$emit('set-transaction', {
        selected: 'send',
        identifier: 'user@example.org',
        amount: 23.45,
        memo: 'Make the best of it!',
      })
      await flushPromises()
    })

    it('steps forward in the dialog', () => {
      expect(wrapper.findComponent({ name: 'TransactionConfirmationSend' }).exists()).toBe(true)
    })

    describe('confirm transaction view', () => {
      describe('cancel confirmation', () => {
        beforeEach(async () => {
          await wrapper.findComponent({ name: 'TransactionConfirmationSend' }).vm.$emit('on-back')
        })

        it('shows the transaction form again', () => {
          expect(wrapper.findComponent({ name: 'TransactionForm' }).exists()).toBe(true)
        })
      })

      describe('confirm transaction with server success', () => {
        beforeEach(async () => {
          mockSendCoinsMutation.mockResolvedValue({ data: { sendCoins: { success: true } } })

          wrapper.vm.transactionData = {
            selected: SEND_TYPES.send,
            identifier: 'user@example.org',
            amount: 23.45,
            memo: 'Make the best of it!',
            targetCommunity: { uuid: '' },
          }

          console.log('Initial transactionData:', wrapper.vm.transactionData)
          console.log('Initial currentTransactionStep:', wrapper.vm.currentTransactionStep)

          try {
            await wrapper.vm.sendTransaction()
          } catch (error) {
            console.error('Error in sendTransaction:', error)
          }

          console.log('Final transactionData:', wrapper.vm.transactionData)
          console.log('Final currentTransactionStep:', wrapper.vm.currentTransactionStep)

          await flushPromises()
        })

        it('calls the API when send-transaction is emitted', async () => {
          console.log('mockSendCoinsMutation calls:', mockSendCoinsMutation.mock.calls)
          console.log('mockToastError calls:', mockToastError.mock.calls)

          expect(mockSendCoinsMutation).toHaveBeenCalledWith({
            recipientCommunityIdentifier: '',
            recipientIdentifier: 'user@example.org',
            amount: 23.45,
            memo: 'Make the best of it!',
          })
        })

        it('does not show an error message', () => {
          expect(mockToastError).not.toHaveBeenCalled()
        })

        it('updates the transaction step to success', () => {
          expect(wrapper.vm.currentTransactionStep).toBe(
            TRANSACTION_STEPS.transactionResultSendSuccess,
          )
        })
      })

      describe('with gradidoID query', () => {
        beforeEach(() => {
          wrapper = createWrapper({
            userIdentifier: 'gradido-ID',
            communityIdentifier: 'community-ID',
          })
        })

        describe('confirm transaction', () => {
          beforeEach(async () => {
            mockSendCoinsMutation.mockResolvedValue({ data: { sendCoins: { success: true } } })
            wrapper.vm.transactionData = {
              selected: SEND_TYPES.send,
              identifier: 'gradido-ID',
              amount: 34.56,
              memo: 'Make the best of it!',
              targetCommunity: { uuid: 'community-ID' },
            }
            await wrapper.vm.sendTransaction()
            await flushPromises()
          })

          it('calls the API', async () => {
            expect(mockSendCoinsMutation).toHaveBeenCalledWith({
              recipientCommunityIdentifier: 'community-ID',
              recipientIdentifier: 'gradido-ID',
              amount: 34.56,
              memo: 'Make the best of it!',
            })
          })

          it('resets the gradido ID query in route', () => {
            expect(mockRouterPush).toHaveBeenCalledWith({ path: '/send' })
          })
        })
      })

      describe('confirm transaction with server error', () => {
        beforeEach(async () => {
          mockSendCoinsMutation.mockRejectedValue({ message: 'recipient not known' })
          await wrapper
            .findComponent({ name: 'TransactionConfirmationSend' })
            .vm.$emit('send-transaction')
          await flushPromises()
        })

        it('has a component TransactionResultSendError', () => {
          expect(wrapper.findComponent({ name: 'TransactionResultSendError' }).exists()).toBe(true)
        })
      })
    })
  })

  describe('with gradidoID query', () => {
    beforeEach(() => {
      wrapper = createWrapper({ userIdentifier: 'gradido-ID', communityIdentifier: 'community-ID' })
    })

    describe('submit form', () => {
      beforeEach(async () => {
        const transactionForm = wrapper.findComponent({ name: 'TransactionForm' })
        await transactionForm.vm.$emit('set-transaction', {
          selected: 'send',
          amount: 34.56,
          memo: 'Make the best of it!',
        })
        await flushPromises()
      })

      it('steps forward in the dialog', () => {
        expect(wrapper.findComponent({ name: 'TransactionConfirmationSend' }).exists()).toBe(true)
      })

      describe('confirm transaction', () => {
        beforeEach(async () => {
          mockSendCoinsMutation.mockResolvedValue('success')
          await wrapper
            .findComponent({ name: 'TransactionConfirmationSend' })
            .vm.$emit('send-transaction')
          await flushPromises()
        })

        it('calls the API', async () => {
          expect(mockSendCoinsMutation).toHaveBeenCalledWith({
            recipientIdentifier: 'gradido-ID',
            amount: 34.56,
            memo: 'Make the best of it!',
            recipientCommunityIdentifier: '',
          })
        })

        it('resets the gradido ID query in route', () => {
          expect(mockRouterPush).toHaveBeenCalledWith({ path: '/send' })
        })
      })
    })
  })

  describe('transaction form link', () => {
    const now = new Date().toISOString()
    beforeEach(async () => {
      mockCreateTransactionLinkMutation.mockResolvedValue({
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
      await transactionForm.vm.$emit('set-transaction', {
        selected: 'link',
        amount: 56.78,
        memo: 'Make the best of the link!',
      })
      await flushPromises()
    })

    it('steps forward in the dialog', () => {
      expect(wrapper.findComponent({ name: 'TransactionConfirmationLink' }).exists()).toBe(true)
    })

    describe('transaction is confirmed and server response is success', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ name: 'TransactionConfirmationLink' })
          .vm.$emit('send-transaction')
        await flushPromises()
      })

      it('calls the API when send-transaction is emitted', async () => {
        expect(mockCreateTransactionLinkMutation).toHaveBeenCalledWith({
          amount: 56.78,
          memo: 'Make the best of the link!',
        })
      })

      it('emits update-transactions', () => {
        expect(wrapper.emitted('update-transactions')).toBeTruthy()
        expect(wrapper.emitted('update-transactions')).toEqual(expect.arrayContaining([[{}]]))
      })

      it('shows the transaction result link component', () => {
        expect(wrapper.findComponent({ name: 'TransactionResultLink' }).exists()).toBe(true)
      })
    })

    describe('apollo call returns error', () => {
      beforeEach(async () => {
        mockCreateTransactionLinkMutation.mockRejectedValue({ message: 'OUCH!' })
        await wrapper
          .findComponent({ name: 'TransactionConfirmationLink' })
          .vm.$emit('send-transaction')
        await flushPromises()
      })

      it('toasts an error message', () => {
        expect(mockToastError).toHaveBeenCalledWith('OUCH!')
      })
    })
  })

  describe('no field selected on send transaction', () => {
    beforeEach(async () => {
      wrapper.vm.transactionData = {
        identifier: 'user@example.org',
        amount: 23.45,
        memo: 'Make the best of it!',
        selected: 'not-valid',
      }
      wrapper.vm.currentTransactionStep = TRANSACTION_STEPS.transactionConfirmationSend
    })

    it('throws an error', async () => {
      await expect(wrapper.vm.sendTransaction()).rejects.toThrow(
        'undefined transactionData.selected : not-valid',
      )
    })
  })
})
