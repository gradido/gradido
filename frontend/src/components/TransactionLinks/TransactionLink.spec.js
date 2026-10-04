import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import TransactionLink from './TransactionLink.vue'
import { createFilters } from '@/filters/amount'
import {
  forgetAllGreetingPictures,
  rememberGreetingPicture,
  requestGreetingPicture,
} from '@/composables/useGreetingPictures'

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

const mockShare = vi.fn()
// What the row hands the composable is kept: a stand-in that takes anything would agree to a
// row that forgot to hand the greeting on.
const mockUseCopyLinks = vi.fn()
vi.mock('@/composables/useCopyLinks', () => ({
  useCopyLinks: (link) => {
    mockUseCopyLinks(link)
    return {
      copyLink: vi.fn(),
      share: (...args) => mockShare(...args),
    }
  },
}))

const mockDownloadThankYouCheque = vi.fn()
vi.mock('@/composables/useThankYouCheque', () => ({
  useThankYouCheque: () => ({
    drawThankYouCheque: vi.fn(),
    downloadThankYouCheque: (...args) => mockDownloadThankYouCheque(...args),
  }),
}))

// What the row hands the composable is kept here too: the sheet of a greeting is drawn from it.
const mockPrintGreetingSheet = vi.fn()
const mockSaveGreetingSheet = vi.fn()
const mockUseThankYouGreetingSheet = vi.fn()
vi.mock('@/composables/useThankYouGreetingSheet', () => ({
  useThankYouGreetingSheet: (...args) => {
    mockUseThankYouGreetingSheet(...args)
    return {
      printGreetingSheet: (...taps) => mockPrintGreetingSheet(...taps),
      saveGreetingSheet: (...taps) => mockSaveGreetingSheet(...taps),
    }
  },
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
        chatThread: { imageMissing: 'Picture not available' },
        'thank-you-greeting': {
          name: 'Thank-you greeting',
          'photo-of': 'Photo from {name}',
          list: { for: 'Thank-you greeting for {name}' },
          paper: { print: 'Print card', save: 'Save card as a picture' },
          motif: {
            'heart-leaves': 'Heart and leaves',
            'giving-hands': 'Giving hands',
            bouquet: 'Bouquet',
            'glowing-swirl': 'Glowing swirl',
            'morning-light': 'Morning light',
          },
        },
        gdd_per_link: {
          'copy-link': 'Copy Link',
          share: 'Share',
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
        // The member whose list this is, as far as the row reads the store.
        provide: { store: { state: { username: 'Oma-Emma', gradidoID: 'uuid-emma' } } },
        stubs: {
          // The photo of a greeting has its own spec; here it is what the row hands it.
          ThankYouGreetingPhoto: {
            name: 'ThankYouGreetingPhoto',
            props: { linkId: Number, alt: String, saysMissing: Boolean },
            template: '<span data-test="photo-stub" />',
          },
          BDropdown: { template: '<div class="dropdown"><slot /></div>' },
          BDropdownItem: { template: '<div class="dropdown-item"><slot /></div>' },
          BCard: true,
          BCardText: true,
          IBiThreeDotsVertical: true,
          IBiClipboard: true,
          IBiShare: true,
          IBiQrCode: true,
          IBiDownload: true,
          IBiPrinter: true,
          IBiImage: true,
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

    it('carries the amount and the decay in one column that takes only its own width', async () => {
      // the decay stands only under a link that can still be redeemed
      await wrapper.setProps({ validUntil: new Date(Date.now() + 1000000).toISOString() })
      const amount = wrapper.find('[data-test="link-amount"]')
      expect(amount.text()).toBe('+ 200.00 GDD')
      expect(amount.element.parentElement.classList.contains('col-auto')).toBe(true)
      expect(wrapper.find('[data-test="link-decay"]').text()).toBe('+ 100.00 GDD')
    })

    /**
     * Bernd, 22.09.2026: an expired link shows no decay. The server reports its hold as the
     * amount itself, so the line could only say 0 -- the fixture's 100 is there to show that
     * the row does not merely hide a zero.
     */
    it('shows no decay under an expired link', () => {
      expect(wrapper.find('[data-test="link-validity"]').text()).toBe('Expired on')
      expect(wrapper.find('[data-test="link-amount"]').text()).toBe('+ 200.00 GDD')
      expect(wrapper.find('[data-test="link-decay"]').exists()).toBe(false)
    })

    /**
     * ⛔ A wiring line with nothing else holding it. The row centres its columns, so the
     * second line is what keeps the amount level with the state word: without it the amount
     * dropped 9.6 points on the desk. An expired link keeps the line, empty and of the same
     * class, so its amount stands where an open link's does.
     */
    it("keeps an expired link's amount column two lines high, the second one empty", async () => {
      const amountCol = () => wrapper.find('[data-test="link-amount"]').element.parentElement
      const spacer = wrapper.find('[data-test="link-decay-spacer"]')
      expect(amountCol().children).toHaveLength(2)
      expect(spacer.exists()).toBe(true)
      expect(spacer.classes()).toContain('small')
      expect(spacer.text()).toBe('')
      await wrapper.setProps({ validUntil: new Date(Date.now() + 1000000).toISOString() })
      expect(amountCol().children).toHaveLength(2)
      expect(wrapper.find('[data-test="link-decay-spacer"]').exists()).toBe(false)
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

    /**
     * Bernd, 22.09.2026: the grey rounded card under the row goes. It has no side padding,
     * so in light mode the text ran into its rounded corners; in dark mode it took the
     * list's colour and was never seen.
     */
    it('stands on the list without a surface of its own', () => {
      expect(wrapper.classes()).toContain('transaction-link')
      expect(wrapper.classes()).not.toContain('gradido-custom-background')
    })
  })

  // A thank-you greeting is a link with a motif and a name: the list says so in the block of
  // the memo, and leaves the row above it as it is.
  describe('a thank-you greeting', () => {
    const GREETING = { motif: 'morning-light', line: 'Just because', recipientName: 'Sarah' }
    const MEMO = 'Just because\nDear Sarah, thank you.'
    const mark = () => wrapper.find('[data-test="link-greeting"]')

    it('is marked above its memo: the motif small, and whom it is for', () => {
      mountLink({ greeting: GREETING, memo: MEMO })

      expect(mark().find('[data-test="link-greeting-label"]').text()).toBe(
        'Thank-you greeting for Sarah',
      )
      const motif = mark().find('img')
      expect(motif.attributes('src')).toBe('/img/thank-you-greeting/morning-light.svg')
      expect(motif.attributes('alt')).toBe('Morning light')
      // In the memo's block, right above the memo.
      const memoCol = wrapper.find('.transaction-link-memo-col')
      expect([...memoCol.element.children].map((child) => child.className)).toEqual([
        'transaction-link-greeting',
        'transaction-link-memo',
      ])
    })

    it('is marked without a name where it names nobody', () => {
      for (const recipientName of [null, '']) {
        mountLink({ greeting: { ...GREETING, recipientName }, memo: MEMO })

        expect(mark().find('[data-test="link-greeting-label"]').text()).toBe('Thank-you greeting')
      }
    })

    it('keeps its mark without a picture where this wallet does not know the motif', () => {
      mountLink({ greeting: { ...GREETING, motif: 'sunset' }, memo: MEMO })

      expect(mark().find('img').exists()).toBe(false)
      expect(mark().text()).toBe('Thank-you greeting for Sarah')
    })

    it('shows its memo under the mark as every link does, whole', () => {
      mountLink({ greeting: GREETING, memo: MEMO })

      expect(wrapper.find('[data-test="link-memo"]').text()).toContain('Dear Sarah, thank you.')
      expect(wrapper.find('[data-test="link-memo"]').text()).toContain('Just because')
    })

    // ⛔ Bernd's decisions of 12., 22. and 23.09.2026 stand in the notes of the row: one line at
    // every width, no picture and no circle before it.
    it('leaves the row above as it is: state, amount, menu -- no picture among them', () => {
      mountLink()
      const plain = [...wrapper.find('.transaction-link-row').element.children]
        .slice(0, 4)
        .map((child) => child.outerHTML)

      mountLink({ greeting: GREETING })
      const greeted = [...wrapper.find('.transaction-link-row').element.children]
        .slice(0, 4)
        .map((child) => child.outerHTML)

      expect(greeted).toEqual(plain)
      expect(greeted.join('')).not.toContain('<img')
    })

    it('shares with the greeting’s own sentence: the row hands the greeting to the composable', () => {
      mockUseCopyLinks.mockClear()
      mountLink({ greeting: GREETING, memo: MEMO })

      expect(mockUseCopyLinks).toHaveBeenCalledTimes(1)
      expect(mockUseCopyLinks.mock.calls[0][0]).toMatchObject({
        link: 'https://example.com/link',
        memo: MEMO,
        greeting: GREETING,
      })
    })
  })

  /**
   * A greeting with a photo of the member's own in the place of a motif (ZE-019): the row shows
   * the small rendition, which the photo's own component asks for by the id of the link.
   */
  describe('a thank-you greeting with a photo', () => {
    const GREETING = { motif: null, line: 'Just because', recipientName: 'Sarah', hasPicture: true }
    const MEMO = 'Just because\nDear Sarah, thank you.'
    const mark = () => wrapper.find('[data-test="link-greeting"]')
    const photo = () => wrapper.findComponent({ name: 'ThankYouGreetingPhoto' })
    const missing = () => wrapper.find('[data-test="link-greeting-photo-missing"]')
    /** An Apollo client that answers every picture with what it is handed. */
    const clientWith = (base64) => ({
      query: () => Promise.resolve({ data: { thankYouGreetingPicture: base64 } }),
    })
    const settled = () => new Promise((resolve) => setTimeout(resolve, 0))

    beforeEach(() => {
      forgetAllGreetingPictures()
    })

    it('shows the photo in the place of the motif, asked for by the id of the link', () => {
      mountLink({ id: 4711, greeting: GREETING, memo: MEMO })

      expect(photo().exists()).toBe(true)
      expect(photo().props('linkId')).toBe(4711)
      // the room of a motif, 46 pixels wide: the same class
      expect(photo().classes()).toContain('transaction-link-greeting-motif')
      expect(mark().find('img').exists()).toBe(false)
      expect(mark().find('[data-test="link-greeting-label"]').text()).toBe(
        'Thank-you greeting for Sarah',
      )
    })

    // The list is the member's own: the photo in it is theirs, under their user name.
    it('says whose photo it is: the member’s own user name', () => {
      mountLink({ greeting: GREETING, memo: MEMO })

      expect(photo().props('alt')).toBe('Photo from Oma-Emma')
    })

    // A room of 46 pixels holds no sentence: the row says it beside the room.
    it('leaves the room free of words', () => {
      mountLink({ greeting: GREETING, memo: MEMO })

      expect(photo().props('saysMissing')).toBe(false)
    })

    it('says under the label that the picture is not available where the server gave none', async () => {
      requestGreetingPicture(clientWith(null), 4711)
      await settled()

      mountLink({ id: 4711, greeting: GREETING, memo: MEMO })

      expect(missing().text()).toBe('Picture not available')
      expect(mark().find('[data-test="link-greeting-label"]').text()).toBe(
        'Thank-you greeting for Sarah Picture not available',
      )
    })

    it('says nothing of a photo that is here, or that nobody has asked for yet', () => {
      mountLink({ id: 4711, greeting: GREETING, memo: MEMO })
      expect(missing().exists()).toBe(false)

      rememberGreetingPicture(4712, 'U01BTEw=')
      mountLink({ id: 4712, greeting: GREETING, memo: MEMO })
      expect(missing().exists()).toBe(false)
    })

    // The sentence belongs to the photo of THIS link.
    it('says nothing of a photo another link is missing', async () => {
      requestGreetingPicture(clientWith(null), 4711)
      await settled()

      mountLink({ id: 4712, greeting: GREETING, memo: MEMO })

      expect(missing().exists()).toBe(false)
    })

    it('keeps the motif for a greeting that carries no photo, and asks for none', () => {
      mountLink({
        greeting: { ...GREETING, motif: 'morning-light', hasPicture: false },
        memo: MEMO,
      })

      expect(photo().exists()).toBe(false)
      expect(mark().find('img').attributes('src')).toBe('/img/thank-you-greeting/morning-light.svg')
      expect(missing().exists()).toBe(false)
    })

    it('hands the greeting to the composable that shares it, as it is', () => {
      mockUseCopyLinks.mockClear()
      mountLink({ greeting: GREETING, memo: MEMO })

      expect(mockUseCopyLinks.mock.calls[0][0].greeting).toEqual(GREETING)
    })
  })

  describe('a plain link', () => {
    it('has no mark, and is handed on as no greeting', () => {
      mockUseCopyLinks.mockClear()
      mountLink()

      expect(wrapper.find('[data-test="link-greeting"]').exists()).toBe(false)
      expect([...wrapper.find('.transaction-link-memo-col').element.children]).toHaveLength(1)
      expect(mockUseCopyLinks.mock.calls[0][0].greeting).toBeNull()

      mountLink({ greeting: null })
      expect(wrapper.find('[data-test="link-greeting"]').exists()).toBe(false)
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

    it('offers copying, sharing, the cheque, the code and deleting, in that order', () => {
      const order = [
        'test-copy-link',
        'test-share-link',
        'test-download-cheque',
        'test-qr-code',
        'test-delete-link',
      ]
      expect(entries().map((classes) => order.find((name) => classes.includes(name)))).toEqual(
        order,
      )
    })

    // "Share" took the place of "copy link and text": the share sheet where the device has
    // one, and copying the same text where it has none (useCopyLinks.spec.js).
    it('hands the link to the share sheet on one click', async () => {
      mockShare.mockClear()
      await wrapper.find('.test-share-link').trigger('click')

      expect(mockShare).toHaveBeenCalledTimes(1)
    })

    it('hands the cheque out on one click, without opening the code first', async () => {
      await wrapper.find('.test-download-cheque').trigger('click')

      expect(mockDownloadThankYouCheque).toHaveBeenCalled()
      expect(wrapper.vm.showQrModal).toBe(false)
    })
  })

  /**
   * A greeting can go onto paper: two entries more in its menu, over the cheque -- "Karte
   * drucken" and "Karte als Bild sichern". ⛔ Only where the row is a greeting AND its link is
   * open: a plain link keeps the menu it had, and an expired greeting offers neither.
   */
  describe('the menu of a thank-you greeting', () => {
    const GREETING = { motif: 'morning-light', line: 'Just because', recipientName: 'Sarah' }
    const MEMO = 'Just because\nDear Sarah, thank you.'
    const OPEN = new Date(Date.now() + 1000000).toISOString()
    const EXPIRED = '2022-01-01T00:00:00Z'
    const ORDER = [
      'test-copy-link',
      'test-share-link',
      'test-print-greeting',
      'test-save-greeting',
      'test-download-cheque',
      'test-qr-code',
      'test-delete-link',
    ]
    const entries = () =>
      wrapper
        .findAll('.dropdown-item')
        .map((item) => ORDER.find((name) => item.classes().includes(name)))
    const print = () => wrapper.find('.test-print-greeting')
    const save = () => wrapper.find('.test-save-greeting')

    beforeEach(() => {
      mockPrintGreetingSheet.mockClear()
      mockSaveGreetingSheet.mockClear()
      mockUseThankYouGreetingSheet.mockClear()
    })

    it('has printing and saving as a picture over the cheque, seven entries in all', () => {
      mountLink({ greeting: GREETING, memo: MEMO, validUntil: OPEN })

      expect(entries()).toEqual(ORDER)
      expect(print().text()).toBe('Print card')
      expect(save().text()).toBe('Save card as a picture')
    })

    it('marks them with a printer and with a picture', () => {
      mountLink({ greeting: GREETING, memo: MEMO, validUntil: OPEN })

      expect(print().find('i-bi-printer-stub').exists()).toBe(true)
      expect(save().find('i-bi-image-stub').exists()).toBe(true)
    })

    // ⛔ The four cases, one by one: a greeting and open is the only one that offers them.
    it.each([
      ['a greeting whose link is open', GREETING, OPEN, true],
      ['a greeting whose link has expired', GREETING, EXPIRED, false],
      ['a plain link that is open', null, OPEN, false],
      ['a plain link that has expired', null, EXPIRED, false],
    ])('offers them for %s: %s', (_, greeting, validUntil, offered) => {
      mountLink({ greeting, memo: MEMO, validUntil })

      expect(print().exists()).toBe(offered)
      expect(save().exists()).toBe(offered)
    })

    it('leaves a plain link the menu it had', () => {
      mountLink({ validUntil: OPEN })

      expect(entries()).toEqual([
        'test-copy-link',
        'test-share-link',
        'test-download-cheque',
        'test-qr-code',
        'test-delete-link',
      ])
    })

    it('leaves an expired greeting deleting, and nothing else', () => {
      mountLink({ greeting: GREETING, memo: MEMO, validUntil: EXPIRED })

      expect(entries()).toEqual(['test-delete-link'])
    })

    it('prints on one click, and saves on one click', async () => {
      mountLink({ greeting: GREETING, memo: MEMO, validUntil: OPEN })

      await print().trigger('click')
      expect(mockPrintGreetingSheet).toHaveBeenCalledTimes(1)
      expect(mockSaveGreetingSheet).not.toHaveBeenCalled()

      await save().trigger('click')
      expect(mockSaveGreetingSheet).toHaveBeenCalledTimes(1)
      expect(mockPrintGreetingSheet).toHaveBeenCalledTimes(1)
    })

    // The click event is not the composable's business.
    it('hands the click on without the event', async () => {
      mountLink({ greeting: GREETING, memo: MEMO, validUntil: OPEN })

      await print().trigger('click')
      await save().trigger('click')

      expect(mockPrintGreetingSheet).toHaveBeenCalledWith()
      expect(mockSaveGreetingSheet).toHaveBeenCalledWith()
    })

    // A tap on the menu must not also close the list the row stands in.
    it('keeps the click to itself', async () => {
      const outside = vi.fn()
      wrapper = mountLink({ greeting: GREETING, memo: MEMO, validUntil: OPEN })
      wrapper.element.addEventListener('click', outside)

      await print().trigger('click')
      await save().trigger('click')

      expect(outside).not.toHaveBeenCalled()
    })

    /**
     * ⛔ What the sheet is drawn from. The id is what the photo of a greeting is asked for by,
     * the link carries its code -- a row that forgot one of them would print a greeting with a
     * photo as "could not be made".
     */
    it('hands the composable the whole greeting: id, link, amount, memo, until when, the greeting', () => {
      mountLink({
        id: 4711,
        amount: 20,
        link: 'https://example.com/redeem/a3f9c2d41b7e19981fa0c4e2',
        greeting: { ...GREETING, hasPicture: true },
        memo: MEMO,
        validUntil: OPEN,
      })

      expect(mockUseThankYouGreetingSheet).toHaveBeenCalledTimes(1)
      expect(mockUseThankYouGreetingSheet.mock.calls[0]).toEqual([
        {
          id: 4711,
          amount: 20,
          validUntil: OPEN,
          link: 'https://example.com/redeem/a3f9c2d41b7e19981fa0c4e2',
          memo: MEMO,
          greeting: { ...GREETING, hasPicture: true },
        },
      ])
    })

    // No second argument: a menu has no place to offer a second tap, and holds no photo itself.
    it('asks for no second tap, and hands in no picture of its own', () => {
      mountLink({ greeting: GREETING, memo: MEMO, validUntil: OPEN })

      const [link, options] = mockUseThankYouGreetingSheet.mock.calls[0]
      expect(options).toBeUndefined()
      expect(link).not.toHaveProperty('picture')
    })
  })
})
