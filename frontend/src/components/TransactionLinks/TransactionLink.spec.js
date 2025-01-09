import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import TransactionLink from './TransactionLink.vue'

vi.mock('@/components/TransactionRows/TypeIcon', () => ({
  default: {
    name: 'TypeIcon',
    template: '<div>TypeIcon</div>',
  },
}))
vi.mock('@/components/TransactionRows/AmountAndNameRow', () => ({
  default: {
    name: 'AmountAndNameRow',
    template: '<div>AmountAndNameRow</div>',
  },
}))
vi.mock('@/components/TransactionRows/MemoRow', () => ({
  default: {
    name: 'MemoRow',
    template: '<div>MemoRow</div>',
  },
}))
vi.mock('@/components/TransactionRows/DateRow', () => ({
  default: {
    name: 'DateRow',
    template: '<div>DateRow</div>',
  },
}))
vi.mock('@/components/TransactionRows/DecayRow', () => ({
  default: {
    name: 'DecayRow',
    template: '<div>DecayRow</div>',
  },
}))
vi.mock('@/components/AppModal', () => ({
  default: {
    name: 'AppModal',
    template: '<div>AppModal</div>',
  },
}))
vi.mock('@/components/QrCode/FigureQrCode', () => ({
  default: {
    name: 'FigureQrCode',
    template: '<div>FigureQrCode</div>',
  },
}))
vi.mock('@/components/VariantIcon.vue', () => ({
  default: {
    name: 'VariantIcon',
    template: '<div>VariantIcon</div>',
  },
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: mockToastSuccess,
    toastError: mockToastError,
  }),
}))

vi.mock('@/composables/useCopyLinks', () => ({
  useCopyLinks: () => ({
    copyLink: vi.fn(),
    copyLinkWithText: vi.fn(),
  }),
}))

const mockMutate = vi.fn().mockResolvedValue({})
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: mockMutate,
  })),
}))

describe('TransactionLink.vue', () => {
  let wrapper

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        'form.amount': 'Amount',
        'gdd_per_link.copy-link': 'Copy Link',
        'gdd_per_link.copy-link-with-text': 'Copy Link with Text',
        qrCode: 'QR Code',
        delete: 'Delete',
        'gdd_per_link.delete-the-link': 'Delete the Link',
        'gdd_per_link.deleted': 'Link Deleted',
      },
    },
  })

  beforeEach(() => {
    wrapper = mount(TransactionLink, {
      global: {
        plugins: [i18n],
        stubs: {
          BRow: true,
          BCol: true,
          BDropdown: true,
          BDropdownItem: true,
          BCard: true,
          BCardText: true,
          IBiThreeDotsVertical: true,
          IBiClipboard: true,
          IBiClipboardPlus: true,
          BImg: true,
          IBiTrash: true,
        },
      },
      props: {
        holdAvailableAmount: '100',
        id: 1,
        amount: 200,
        validUntil: '2024-12-31T23:59:59Z',
        link: 'https://example.com/link',
        memo: 'Test memo',
      },
    })
  })

  it('computes decay correctly', () => {
    expect(wrapper.vm.decay).toBe('100')
  })

  it('computes validLink correctly when link is valid', async () => {
    await wrapper.setProps({ validUntil: new Date(new Date().getTime() + 1000000) })
    expect(wrapper.vm.validLink).toBe(true)
  })

  it('computes validLink correctly when link is expired', async () => {
    await wrapper.setProps({ validUntil: '2022-01-01T00:00:00Z' })
    expect(wrapper.vm.validLink).toBe(false)
  })

  it('toggles QR modal', async () => {
    expect(wrapper.vm.showQrModal).toBe(false)
    await wrapper.vm.toggleQrModal()
    expect(wrapper.vm.showQrModal).toBe(true)
    await wrapper.vm.toggleQrModal()
    expect(wrapper.vm.showQrModal).toBe(false)
  })

  it('toggles delete modal', async () => {
    expect(wrapper.vm.showDeleteLinkModal).toBe(false)
    await wrapper.vm.toggleDeleteModal()
    expect(wrapper.vm.showDeleteLinkModal).toBe(true)
    await wrapper.vm.toggleDeleteModal()
    expect(wrapper.vm.showDeleteLinkModal).toBe(false)
  })

  it('calls deleteTransactionLinkMutation when deleteLink is called', async () => {
    await wrapper.vm.deleteLink()

    expect(mockMutate).toHaveBeenCalledWith({ id: 1 })

    expect(mockToastSuccess).toHaveBeenCalledWith('Link Deleted')

    expect(wrapper.emitted('reset-transaction-link-list')).toBeTruthy()
  })

  it('handles error when deleteLink fails', async () => {
    const error = new Error('Delete failed')
    mockMutate.mockRejectedValueOnce(error)

    await wrapper.vm.deleteLink()

    expect(mockMutate).toHaveBeenCalledWith({ id: 1 })
    expect(mockToastError).toHaveBeenCalledWith(error.message)
    expect(wrapper.emitted('reset-transaction-link-list')).toBeFalsy()
  })
})
