import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import TransactionLink from './TransactionLink.vue'
import { createFilters } from '@/filters/amount'

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

const mockDownloadThankYouCheque = vi.fn()
vi.mock('@/composables/useThankYouCheque', () => ({
  useThankYouCheque: () => ({
    drawThankYouCheque: vi.fn(),
    downloadThankYouCheque: (...args) => mockDownloadThankYouCheque(...args),
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
    // ⚠️ The real formats, not a stub that returns the date object. This row shows the date
    // and the time as two separate pieces, and only a real formatter can say whether they
    // came out as two.
    // the wallet's own decimal shape, so the filter below formats for real
    numberFormats: {
      en: { decimal: { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 } },
    },
    datetimeFormats: {
      en: {
        short: { year: 'numeric', month: 'numeric', day: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit', hour12: false },
      },
    },
    messages: {
      en: {
        form: { amount: 'Amount' },
        qrCode: 'QR Code',
        delete: 'Delete',
        'thank-you-cheque': { download: 'Download cheque' },
        gdd_per_link: {
          'copy-link': 'Copy Link',
          'copy-link-with-text': 'Copy Link with Text',
          'delete-the-link': 'Delete the Link',
          deleted: 'Link Deleted',
          validUntil: 'Valid until',
          expiredOn: 'Expired on',
        },
      },
    },
  })

  // The real filter, so the amount in the row is the string a member reads rather than one
  // this file made up.
  const filters = createFilters(i18n)

  const mountLink = (props) => {
    wrapper = mount(TransactionLink, {
      global: {
        plugins: [i18n],
        mocks: { $filters: { GDD: filters.GDD } },
        stubs: {
          BDropdown: { template: '<div class="dropdown"><slot /></div>' },
          BDropdownItem: { template: '<div class="dropdown-item"><slot /></div>' },
          BCard: true,
          BCardText: true,
          IBiThreeDotsVertical: true,
          IBiClipboard: true,
          IBiClipboardPlus: true,
          IBiQrCode: true,
          IBiDownload: true,
          IBiDropletHalf: true,
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
        ...props,
      },
    })
    return wrapper
  }

  beforeEach(() => {
    mountLink()
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

  /**
   * The shape of the row, drawn like a booking (Bernd, 12.09.2026). What is held here is
   * what he reported as broken on a phone: a two-column label table, and a menu that left
   * the line. The old row put every value in a `col-7` beside a `col-5` label; the amount
   * broke over two lines there and the menu, on `cols=12`, stood alone at the bottom.
   */
  describe('the shape of the row', () => {
    const row = () => wrapper.find('.transaction-link-row')

    it('leads with the state of the link, not with a label column', () => {
      expect(wrapper.find('[data-test="link-validity"]').text()).toBe('Expired on')
      // ⛔ The guard against the label table coming back: a 5/12 column is what squeezed
      // the amount on a phone, and nothing in this row may have one again.
      expect(row().findAll('.col-5')).toHaveLength(0)
      expect(row().findAll('.col-7')).toHaveLength(0)
    })

    it('says "valid until" while the link can still be redeemed', async () => {
      await wrapper.setProps({ validUntil: new Date(Date.now() + 1000000).toISOString() })
      expect(wrapper.find('[data-test="link-validity"]').text()).toBe('Valid until')
    })

    it('shows the date and the time as two pieces under it', () => {
      const small = wrapper.find('.col.min-w-0').findAll('span.small')
      expect(small).toHaveLength(2)
      expect(small[0].text()).toBe('12/31/2024')
      // whatever zone the machine runs in, a time is two pairs of digits
      expect(small[1].text()).toMatch(/^\d{2}:\d{2}$/)
    })

    it('carries the amount and the decay in one column that takes only its own width', () => {
      const amount = wrapper.find('[data-test="link-amount"]')
      expect(amount.text()).toBe('+ 200.00 GDD')
      expect(amount.element.parentElement.classList.contains('col-auto')).toBe(true)
      expect(wrapper.find('[data-test="link-decay"]').text()).toBe('+ 100.00 GDD')
    })

    /**
     * ⛔ The fault Bernd photographed. `cols=12` put the menu on a line of its own below
     * everything else on a phone; `col-auto` keeps it beside the amount at every width.
     */
    it('keeps the menu on the line instead of giving it a line of its own', () => {
      const menu = wrapper.find('.dropdown').element.parentElement
      expect(menu.classList.contains('col-auto')).toBe(true)
      expect(menu.classList.contains('col-12')).toBe(false)
    })

    /**
     * ⛔ A wiring line with nothing else holding it: the booking row is pushed onto a new
     * line by the `offset` under its face, and this row has no face. Measured without it --
     * the memo stands BESIDE the row from `md` on, not under it.
     */
    it('breaks the line before the memo, so it stands under the row and not beside it', () => {
      const children = [...row().element.children]
      const memoCol = wrapper.find('.transaction-link-memo-col').element
      const before = children[children.indexOf(memoCol) - 1]
      expect(before.classList.contains('w-100')).toBe(true)
    })

    it('shows the memo whole rather than cut to one line', () => {
      const memo = wrapper.find('[data-test="link-memo"]')
      expect(memo.text()).toBe('Test memo')
      // the booking row clamps its memo because it can be opened; this one cannot be
      expect(memo.classes()).not.toContain('transaction-memo-clamped')
    })
  })

  // The cheque used to be reachable only by opening the QR window first. It is a menu
  // entry now, and it sits between copying and the code - what you hand out on paper
  // belongs next to what you hand out as a link.
  describe('the menu of a valid link', () => {
    // the default props carry an expired link, and four of the five entries are only
    // offered while the link can still be redeemed
    beforeEach(async () => {
      await wrapper.setProps({ validUntil: new Date(Date.now() + 1000000).toISOString() })
    })

    const entries = () => wrapper.findAll('.dropdown-item').map((item) => item.classes())

    it('offers copying, the cheque, the code and deleting, in that order', () => {
      const order = [
        'test-copy-link',
        'test-copy-text',
        'test-download-cheque',
        'test-qr-code',
        'test-delete-link',
      ]
      expect(entries().map((classes) => order.find((name) => classes.includes(name)))).toEqual(
        order,
      )
    })

    it('hands the cheque out on one click, without opening the code first', async () => {
      await wrapper.find('.test-download-cheque').trigger('click')

      expect(mockDownloadThankYouCheque).toHaveBeenCalled()
      expect(wrapper.vm.showQrModal).toBe(false)
    })
  })
})
