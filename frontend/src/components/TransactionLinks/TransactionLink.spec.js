// import { mount } from '@vue/test-utils'
// import TransactionLink from './TransactionLink'
// import { deleteTransactionLink } from '@/graphql/mutations'
// import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'
//
// const localVue = global.localVue
//
// const mockAPIcall = jest.fn()
// const navigatorClipboardMock = jest.fn()
//
// const mocks = {
//   $t: jest.fn((t) => t),
//   $d: jest.fn((d) => d),
//   $apollo: {
//     mutate: mockAPIcall,
//   },
//   $store: {
//     state: {
//       firstName: 'Testy',
//     },
//   },
// }
//
// const propsData = {
//   amount: '75',
//   link: 'http://localhost/redeem/c00000000c000000c0000',
//   holdAvailableAmount: '5.13109484759482747111',
//   id: 12,
//   memo: 'Katzenauge, Eulenschrei, was verschwunden komm herbei!',
//   validUntil: '2022-03-30T14:22:40.000Z',
// }
//
// describe('TransactionLink', () => {
//   let wrapper
//
//   const Wrapper = () => {
//     return mount(TransactionLink, { localVue, mocks, propsData })
//   }
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('renders the component div.transaction-link', () => {
//       expect(wrapper.find('div.transaction-link').exists()).toBeTruthy()
//     })
//
//     describe('Link validUntil Date is not valid', () => {
//       it('has no copy link button', () => {
//         expect(wrapper.find('.test-copy-link').exists()).toBe(false)
//       })
//
//       it('has no Qr-Code Button ', () => {
//         expect(wrapper.find('.test-qr-code').exists()).toBe(false)
//       })
//
//       it('has delete link button ', () => {
//         expect(wrapper.find('.test-delete-link').exists()).toBe(true)
//       })
//     })
//
//     describe('Link validUntil Date is valid ', () => {
//       beforeEach(async () => {
//         const now = new Date()
//         jest.clearAllMocks()
//         await wrapper.setProps({
//           validUntil: `${new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)}`,
//         })
//       })
//
//       describe('Copy link to Clipboard', () => {
//         const navigatorClipboard = navigator.clipboard
//         beforeAll(() => {
//           delete navigator.clipboard
//           navigator.clipboard = { writeText: navigatorClipboardMock }
//         })
//         afterAll(() => {
//           navigator.clipboard = navigatorClipboard
//         })
//
//         describe('copy link with success', () => {
//           beforeEach(async () => {
//             navigatorClipboardMock.mockResolvedValue()
//             await wrapper.find('.test-copy-link .dropdown-item').trigger('click')
//           })
//
//           it('should call clipboard.writeText', () => {
//             expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
//               'http://localhost/redeem/c00000000c000000c0000',
//             )
//           })
//           it('toasts success message', () => {
//             expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.link-copied')
//           })
//         })
//
//         describe('copy link and text with success', () => {
//           beforeEach(async () => {
//             navigatorClipboardMock.mockResolvedValue()
//             await wrapper.find('.test-copy-text .dropdown-item').trigger('click')
//           })
//
//           it.skip('should call clipboard.writeText', () => {
//             expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
//               'http://localhost/redeem/c00000000c000000c0000\n' +
//                 'Testy transaction-link.send_you 75 Gradido.\n' +
//                 '"Katzenauge, Eulenschrei, was verschwunden komm herbei!"\n' +
//                 'gdd_per_link.credit-your-gradido gdd_per_link.validUntilDate\n' +
//                 'gdd_per_link.link-hint',
//             )
//           })
//           it('toasts success message', () => {
//             expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.link-and-text-copied')
//           })
//         })
//
//         describe('copy link with error', () => {
//           beforeEach(async () => {
//             navigatorClipboardMock.mockRejectedValue()
//             await wrapper.find('.test-copy-link .dropdown-item').trigger('click')
//           })
//
//           it('toasts an error', () => {
//             expect(toastErrorSpy).toBeCalledWith('gdd_per_link.not-copied')
//           })
//         })
//
//         describe('copy link and text with error', () => {
//           beforeEach(async () => {
//             navigatorClipboardMock.mockRejectedValue()
//             await wrapper.find('.test-copy-text .dropdown-item').trigger('click')
//           })
//
//           it('toasts an error', () => {
//             expect(toastErrorSpy).toBeCalledWith('gdd_per_link.not-copied')
//           })
//         })
//       })
//
//       describe('qr code modal', () => {
//         let spy
//
//         beforeEach(async () => {
//           jest.clearAllMocks()
//         })
//
//         describe('with success', () => {
//           beforeEach(async () => {
//             spy = jest.spyOn(wrapper.vm.$bvModal, 'show')
//             // spy.mockImplementation(() => Promise.resolve('some value'))
//             // mockAPIcall.mockResolvedValue()
//             await wrapper.find('.test-qr-code .dropdown-item').trigger('click')
//           })
//
//           it('opens the qr-code Modal', () => {
//             expect(spy).toBeCalled()
//           })
//         })
//       })
//
//       describe('delete link', () => {
//         let spy
//
//         beforeEach(async () => {
//           jest.clearAllMocks()
//         })
//
//         describe('with success', () => {
//           beforeEach(async () => {
//             spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//             spy.mockImplementation(() => Promise.resolve('some value'))
//             mockAPIcall.mockResolvedValue()
//             await wrapper.find('.test-delete-link .dropdown-item').trigger('click')
//           })
//
//           it('opens the modal ', () => {
//             expect(spy).toBeCalled()
//           })
//
//           it('calls the API', () => {
//             expect(mockAPIcall).toBeCalledWith(
//               expect.objectContaining({
//                 mutation: deleteTransactionLink,
//                 variables: {
//                   id: 12,
//                 },
//               }),
//             )
//           })
//
//           it('toasts a success message', () => {
//             expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.deleted')
//           })
//
//           it('emits reset transaction link list', () => {
//             expect(wrapper.emitted('reset-transaction-link-list')).toBeTruthy()
//           })
//         })
//
//         describe('with error', () => {
//           beforeEach(async () => {
//             spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//             spy.mockImplementation(() => Promise.resolve('some value'))
//             mockAPIcall.mockRejectedValue({ message: 'Something went wrong :(' })
//             await wrapper.find('.test-delete-link .dropdown-item').trigger('click')
//           })
//
//           it('toasts an error message', () => {
//             expect(toastErrorSpy).toBeCalledWith('Something went wrong :(')
//           })
//         })
//
//         describe('cancel delete', () => {
//           beforeEach(async () => {
//             spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//             spy.mockImplementation(() => Promise.resolve(false))
//             mockAPIcall.mockResolvedValue()
//             await wrapper.find('.test-delete-link .dropdown-item').trigger('click')
//           })
//
//           it('does not call the API', () => {
//             expect(mockAPIcall).not.toBeCalled()
//           })
//         })
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import TransactionLink from './TransactionLink'
import { deleteTransactionLink } from '@/graphql/mutations'
import {
  BButton,
  BCard,
  BCardText,
  BCol,
  BDropdown,
  BDropdownItem,
  BImg,
  BRow,
} from 'bootstrap-vue-next'

// Mock child components
vi.mock('@/components/TransactionRows/TypeIcon.vue', () => ({
  default: {
    name: 'TypeIcon',
    template: '<div class="mocked-type-icon" />',
  },
}))

vi.mock('@/components/TransactionRows/AmountAndNameRow.vue', () => ({
  default: {
    name: 'AmountAndNameRow',
    template: '<div class="mocked-amount-and-name-row" />',
    props: ['amount', 'text'],
  },
}))

vi.mock('@/components/TransactionRows/MemoRow.vue', () => ({
  default: {
    name: 'MemoRow',
    template: '<div class="mocked-memo-row" />',
    props: ['memo'],
  },
}))

vi.mock('@/components/TransactionRows/DateRow.vue', () => ({
  default: {
    name: 'DateRow',
    template: '<div class="mocked-date-row" />',
    props: ['date', 'diffNow', 'validLink'],
  },
}))

vi.mock('@/components/TransactionRows/DecayRow.vue', () => ({
  default: {
    name: 'DecayRow',
    template: '<div class="mocked-decay-row" />',
    props: ['decay'],
  },
}))

vi.mock('@/components/AppModal.vue', () => ({
  default: {
    name: 'AppModal',
    template: '<div class="mocked-app-modal"><slot></slot></div>',
    props: ['modelValue'],
    emits: ['update:modelValue', 'on-ok'],
  },
}))

vi.mock('@/components/QrCode/FigureQrCode.vue', () => ({
  default: {
    name: 'FigureQrCode',
    template: '<div class="mocked-figure-qr-code" />',
    props: ['link'],
  },
}))

// vi.mock('@/components/VariantIcon.vue', () => ({
//   default: {
//     name: 'VariantIcon',
//     template: '<div class="mocked-variant-icon" />',
//     props: ['icon', 'variant'],
//   },
// }))

// Mock composables
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

const mockCopyLink = vi.fn()
const mockCopyLinkWithText = vi.fn()
vi.mock('@/composables/useCopyLinks', () => ({
  useCopyLinks: () => ({
    copyLink: mockCopyLink,
    copyLinkWithText: mockCopyLinkWithText,
  }),
}))

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

// Mock Apollo
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))

describe('TransactionLink', () => {
  let wrapper

  const defaultProps = {
    amount: 75,
    link: 'http://localhost/redeem/c00000000c000000c0000',
    holdAvailableAmount: '5.13109484759482747111',
    id: 12,
    memo: 'Katzenauge, Eulenschrei, was verschwunden komm herbei!',
    validUntil: '2022-03-30T14:22:40.000Z',
  }

  const createWrapper = (props = {}) => {
    return mount(TransactionLink, {
      props: { ...defaultProps, ...props },
      global: {
        components: {
          BCol,
          BImg,
          BRow,
          BCardText,
          BCard,
          BButton,
        },
        stubs: {
          IBiThreeDotsVertical: true,
          IBiClipboard: true,
          IBiClipboardPlus: true,
          IBiTrash: true,
          IBiCheck: true,
          IBiXCircle: true,
          IBiLink45deg: true,
          IBiLink: true,
          IBiDropletHalf: true,
          IBiQuestion: true,
          IBiBellFill: true,
          IBiExclamationTriangle: true,
          IBiHeart: true,
          IBiPersonCheck: true,
          IBiGift: true,
          IBiX: true,
          BDropdown: { template: '<div><slot /></div>' },
          BDropdownItem: { template: '<span data-test="dropdown-item"/>' },
        },
        mocks: {
          $t: (key) => key,
          $store: {
            state: {
              firstName: 'Testy',
            },
          },
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('renders the component div.transaction-link', () => {
    wrapper = createWrapper()
    expect(wrapper.find('div.transaction-link').exists()).toBe(true)
  })

  describe('Link validUntil Date is not valid', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('has no copy link button', () => {
      expect(wrapper.find('.test-copy-link').exists()).toBe(false)
    })

    it('has no Qr-Code Button', () => {
      expect(wrapper.find('.test-qr-code').exists()).toBe(false)
    })

    it('has delete link button', () => {
      expect(wrapper.find('.test-delete-link').exists()).toBe(true)
    })
  })

  describe('Link validUntil Date is valid', () => {
    beforeEach(() => {
      const now = new Date()
      wrapper = createWrapper({
        validUntil: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString(),
      })
    })

    describe('Copy link to Clipboard', () => {
      it('copies link with success', async () => {
        mockCopyLink.mockResolvedValue()
        await wrapper.find('.test-copy-link').trigger('click')
        expect(mockCopyLink).toHaveBeenCalled()
        expect(mockToastSuccess).toHaveBeenCalledWith('gdd_per_link.link-copied')
      })

      it('copies link and text with success', async () => {
        mockCopyLinkWithText.mockResolvedValue()
        await wrapper.find('.test-copy-text').trigger('click')
        expect(mockCopyLinkWithText).toHaveBeenCalled()
        expect(mockToastSuccess).toHaveBeenCalledWith('gdd_per_link.link-and-text-copied')
      })

      it('handles copy link error', async () => {
        mockCopyLink.mockRejectedValue(new Error())
        await wrapper.find('.test-copy-link').trigger('click')
        expect(mockCopyLink).toHaveBeenCalled()
        expect(mockToastError).toHaveBeenCalledWith('gdd_per_link.not-copied')
      })

      it('handles copy link and text error', async () => {
        mockCopyLinkWithText.mockRejectedValue(new Error())
        await wrapper.find('.test-copy-text').trigger('click')
        expect(mockCopyLinkWithText).toHaveBeenCalled()
        expect(mockToastError).toHaveBeenCalledWith('gdd_per_link.not-copied')
      })
    })

    describe('qr code modal', () => {
      it('opens the qr-code Modal', async () => {
        await wrapper.find('.test-qr-code').trigger('click')
        expect(wrapper.find('#qr-code-modal').exists()).toBe(true)
      })
    })

    describe('delete link', () => {
      it('opens the delete modal', async () => {
        await wrapper.find('.test-delete-link').trigger('click')
        expect(wrapper.find('#delete-link-modal').exists()).toBe(true)
      })

      it('deletes link with success', async () => {
        const { mutate } = useMutation(deleteTransactionLink)
        mutate.mockResolvedValue()

        await wrapper.find('.test-delete-link').trigger('click')
        await wrapper.find('#delete-link-modal .btn-primary').trigger('click')

        expect(mutate).toHaveBeenCalledWith({ id: defaultProps.id })
        expect(mockToastSuccess).toHaveBeenCalledWith('gdd_per_link.deleted')
        expect(wrapper.emitted('reset-transaction-link-list')).toBeTruthy()
      })

      it('handles delete link error', async () => {
        const { mutate } = useMutation(deleteTransactionLink)
        mutate.mockRejectedValue(new Error('Something went wrong :('))

        await wrapper.find('.test-delete-link').trigger('click')
        await wrapper.find('#delete-link-modal .btn-primary').trigger('click')

        expect(mockToastError).toHaveBeenCalledWith('Something went wrong :(')
      })
    })
  })
})
