// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Send from './Send.vue'
import { useMutation } from '@vue/apollo-composable'
import { sendCoins, createTransactionLink } from '@/graphql/mutations.js'
import { encodeChatImage } from '@/utils/chatImage'
import { THANK_YOU_PICTURE_SMALL } from '@/utils/thankYouPicture'
import { SEND_TYPES } from '@/utils/sendTypes'

/**
 * A picture with a transfer (ZE-016), on the page that holds it: where the picture lives, what
 * of it the mutation carries, and what a failure leaves in the form.
 *
 * The children are stand-ins, as in Send.spec.js; the chat's encoder is watched -- jsdom paints
 * nothing -- and answers with a small rendition.
 */
// The form and the check view say what they were handed, and the form can say what it says.
vi.mock('@/components/GddSend/TransactionForm', () => ({
  default: {
    name: 'TransactionForm',
    props: { picture: { type: Object, default: null } },
    emits: ['update:picture', 'set-transaction'],
    template: '<div></div>',
  },
}))
vi.mock('@/components/GddSend/TransactionConfirmationSend', () => ({
  default: {
    name: 'TransactionConfirmationSend',
    props: { picture: { type: Object, default: null } },
    template: '<div></div>',
  },
}))
vi.mock('@/components/GddSend/TransactionConfirmationLink', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('@/components/GddSend/TransactionResultSendError', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('@/components/GddSend/TransactionResultLink', () => ({
  default: { template: '<div></div>' },
}))

const t = (key) => key
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t }) }))
vi.mock('vue-router', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))
vi.mock('@vue/apollo-composable', () => ({ useMutation: vi.fn() }))

const toastError = vi.hoisted(() => vi.fn())
vi.mock('@/composables/useToast', () => ({ useAppToast: () => ({ toastError }) }))

vi.mock('@/utils/chatImage', async (original) => ({
  ...(await original()),
  encodeChatImage: vi.fn(),
}))

const HOME = { uuid: 'home-uuid', name: 'Gradido Entwicklung', foreign: false }
const AWAY = { uuid: 'away-uuid', name: 'Gradido Wien', foreign: true }

// A decoded photo as the picture choice hands it over. Recognisable, so that it is found
// wherever it must not be.
const SOURCE = { image: { secret: 'THE-DECODED-PHOTO' }, width: 4000, height: 3000 }
const EDIT = { frame: 1.44 }
const PHOTO = { source: SOURCE, edit: EDIT, preview: 'data:image/jpeg;base64,UFJFVklFVw==' }
const SMALL = { data: 'U01BTEw=', width: 831, height: 577, bytes: 30000 }

const transfer = (rest = {}) => ({
  selected: SEND_TYPES.send,
  targetCommunity: HOME,
  identifier: 'Dave-Bank',
  amount: 50,
  memo: 'Für die Bank.',
  ...rest,
})

describe('Send, a picture with a transfer', () => {
  let wrapper
  let sendCoinsMock
  let createLinkMock

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sendCoinsMock = vi.fn().mockResolvedValue({ data: { sendCoins: true } })
    createLinkMock = vi.fn().mockResolvedValue({
      data: { createTransactionLink: { link: 'l', amount: 5, memo: 'm', validUntil: 'v' } },
    })
    vi.mocked(useMutation).mockImplementation((mutation) => {
      if (mutation === sendCoins) return { mutate: sendCoinsMock }
      if (mutation === createTransactionLink) return { mutate: createLinkMock }
      return { mutate: vi.fn() }
    })
    vi.mocked(encodeChatImage).mockResolvedValue(SMALL)
    wrapper = shallowMount(Send, {
      props: { balance: 1000, GdtBalance: 500 },
      global: { mocks: { $t: t }, stubs: { 'gdd-send': true } },
    })
  })

  const choose = async (picture) => {
    wrapper.vm.picture = picture
    await nextTick()
  }
  const sentWith = () => sendCoinsMock.mock.calls[0][0]

  describe('what the mutation carries', () => {
    it('a motif, as `motif` and nothing else of a picture', async () => {
      await choose({ motif: 'giving-hands' })
      wrapper.vm.setTransaction(transfer())

      await wrapper.vm.sendTransaction()

      expect(sendCoinsMock).toHaveBeenCalledTimes(1)
      expect(sentWith()).toEqual({
        recipientCommunityIdentifier: 'home-uuid',
        recipientIdentifier: 'Dave-Bank',
        amount: '50',
        memo: 'Für die Bank.',
        motif: 'giving-hands',
      })
      expect(sentWith()).not.toHaveProperty('picture')
      expect(encodeChatImage).not.toHaveBeenCalled()
    })

    it('a photo, as `picture`: the small rendition alone, encoded with the chat’s encoder right before', async () => {
      await choose({ photo: PHOTO })
      wrapper.vm.setTransaction(transfer())
      expect(encodeChatImage).not.toHaveBeenCalled()

      await wrapper.vm.sendTransaction()

      expect(encodeChatImage).toHaveBeenCalledTimes(1)
      expect(encodeChatImage).toHaveBeenCalledWith(SOURCE, EDIT, THANK_YOU_PICTURE_SMALL)
      expect(sentWith().picture).toEqual({ data: 'U01BTEw=', width: 831, height: 577 })
      expect(Object.keys(sentWith().picture)).toEqual(['data', 'width', 'height'])
      expect(sentWith()).not.toHaveProperty('motif')
      expect(encodeChatImage.mock.invocationCallOrder[0]).toBeLessThan(
        sendCoinsMock.mock.invocationCallOrder[0],
      )
    })

    it('neither of the two arguments without a picture', async () => {
      wrapper.vm.setTransaction(transfer())

      await wrapper.vm.sendTransaction()

      expect(sentWith()).not.toHaveProperty('motif')
      expect(sentWith()).not.toHaveProperty('picture')
      expect(Object.keys(sentWith()).sort()).toEqual([
        'amount',
        'memo',
        'recipientCommunityIdentifier',
        'recipientIdentifier',
      ])
    })

    it('no picture to a member of another community -- and the picture stays in the page', async () => {
      await choose({ photo: PHOTO })
      wrapper.vm.setTransaction(transfer({ targetCommunity: AWAY }))

      expect(wrapper.vm.pictureToSend).toBeNull()
      await wrapper.vm.sendTransaction()

      expect(sentWith()).not.toHaveProperty('motif')
      expect(sentWith()).not.toHaveProperty('picture')
      expect(encodeChatImage).not.toHaveBeenCalled()
    })

    it('no picture with a link', async () => {
      await choose({ motif: 'bouquet' })
      wrapper.vm.setTransaction({ selected: SEND_TYPES.link, amount: 5, memo: 'Ein Link' })

      expect(wrapper.vm.pictureToSend).toBeNull()
      await wrapper.vm.sendTransaction()

      expect(createLinkMock).toHaveBeenCalledWith({ amount: '5', memo: 'Ein Link' })
      expect(sendCoinsMock).not.toHaveBeenCalled()
    })
  })

  describe('what the check view is handed', () => {
    it('the picture that goes with this transfer', async () => {
      await choose({ motif: 'bouquet' })
      wrapper.vm.setTransaction(transfer())

      expect(wrapper.vm.pictureToSend).toEqual({ motif: 'bouquet' })
    })

    it('none where none goes: another community, and back again once the recipient is at home', async () => {
      await choose({ motif: 'bouquet' })

      wrapper.vm.setTransaction(transfer({ targetCommunity: AWAY }))
      expect(wrapper.vm.pictureToSend).toBeNull()

      wrapper.vm.onBack()
      wrapper.vm.setTransaction(transfer({ targetCommunity: HOME }))
      expect(wrapper.vm.pictureToSend).toEqual({ motif: 'bouquet' })
    })
  })

  describe('where the picture lives', () => {
    // ⛔ `transactionData` is reactive and bound as a whole onto the form and the check view.
    it('beside the transfer’s fields, never among them', async () => {
      await choose({ photo: PHOTO })
      wrapper.vm.setTransaction(transfer())

      expect(wrapper.vm.transactionData).not.toHaveProperty('picture')
      expect(Object.keys(wrapper.vm.transactionData)).not.toContain('photo')
    })

    it('"Zurück" from the check view finds it where it was', async () => {
      await choose({ photo: PHOTO })
      wrapper.vm.setTransaction(transfer())

      wrapper.vm.onBack()

      expect(wrapper.vm.currentTransactionStep).toBe('transactionForm')
      expect(wrapper.vm.picture).toEqual({ photo: PHOTO })
    })

    it('is gone after the transfer was sent, with the other entries', async () => {
      await choose({ photo: PHOTO })
      wrapper.vm.setTransaction(transfer())

      await wrapper.vm.sendTransaction()

      expect(wrapper.vm.currentTransactionStep).toBe('transactionResultSendSuccess')
      expect(wrapper.vm.picture).toBeNull()
      expect(wrapper.vm.transactionData.memo).toBe('')
    })

    it('stands with the other entries again where the sending failed', async () => {
      sendCoinsMock.mockRejectedValue(new Error('Unable to save the picture of the transfer'))
      await choose({ photo: PHOTO })
      wrapper.vm.setTransaction(transfer())

      await wrapper.vm.sendTransaction()

      expect(wrapper.vm.currentTransactionStep).toBe('transactionResultSendError')
      expect(wrapper.vm.picture).toEqual({ photo: PHOTO })
      expect(wrapper.vm.transactionData.memo).toBe('Für die Bank.')
    })

    it('is gone after a link was made, too: nothing lingers for the next transfer', async () => {
      await choose({ motif: 'bouquet' })
      wrapper.vm.setTransaction({ selected: SEND_TYPES.link, amount: 5, memo: 'Ein Link' })

      await wrapper.vm.sendTransaction()

      expect(wrapper.vm.picture).toBeNull()
    })

    // ⛔ Never the store (mirrored into localStorage), never the device's storage.
    it('leaves nothing of the photo in the device’s storage', async () => {
      await choose({ photo: PHOTO })
      wrapper.vm.setTransaction(transfer())
      await wrapper.vm.sendTransaction()

      const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })
      expect(stored).not.toContain('U01BTEw=')
      expect(stored).not.toContain('UFJFVklFVw==')
      expect(stored).not.toContain('THE-DECODED-PHOTO')
      expect(localStorage.length).toBe(0)
    })
  })

  describe('a photo that cannot be made ready', () => {
    beforeEach(() => {
      vi.mocked(encodeChatImage).mockRejectedValue(
        Object.assign(new Error('NOT_SMALL_ENOUGH'), { problem: 'NOT_SMALL_ENOUGH' }),
      )
    })

    it('sends nothing, says why in the chat’s sentence, and puts the entries back', async () => {
      await choose({ photo: PHOTO })
      wrapper.vm.setTransaction(transfer())

      await wrapper.vm.sendTransaction()

      expect(sendCoinsMock).not.toHaveBeenCalled()
      expect(toastError).toHaveBeenCalledWith('chatThread.imageTooBig')
      expect(wrapper.vm.currentTransactionStep).toBe('transactionForm')
      expect(wrapper.vm.picture).toEqual({ photo: PHOTO })
      expect(wrapper.vm.transactionData).toMatchObject({
        identifier: 'Dave-Bank',
        memo: 'Für die Bank.',
      })
      expect(wrapper.vm.error).toBe(false)
    })

    it('can be sent again afterwards', async () => {
      await choose({ photo: PHOTO })
      wrapper.vm.setTransaction(transfer())
      await wrapper.vm.sendTransaction()
      vi.mocked(encodeChatImage).mockResolvedValue(SMALL)

      wrapper.vm.setTransaction(transfer())
      await wrapper.vm.sendTransaction()

      expect(sendCoinsMock).toHaveBeenCalledTimes(1)
    })
  })

  // The photo is encoded before the mutation goes out: a second press in that time must not
  // send a second transfer.
  it('makes ONE transfer of a double press, with a photo', async () => {
    let encoded
    vi.mocked(encodeChatImage).mockReturnValue(new Promise((resolve) => (encoded = resolve)))
    await choose({ photo: PHOTO })
    wrapper.vm.setTransaction(transfer())

    const first = wrapper.vm.sendTransaction()
    const second = wrapper.vm.sendTransaction()
    encoded(SMALL)
    await Promise.all([first, second])

    expect(encodeChatImage).toHaveBeenCalledTimes(1)
    expect(sendCoinsMock).toHaveBeenCalledTimes(1)
  })

  /**
   * The two lines that tie the page's picture to its children. The mounts above leave the steps
   * out (`gdd-send` is a stand-in there), so neither line was held by anything: with the check
   * view bound to the page's picture instead of the one that goes with THIS transfer, a picture
   * would stand in the check view of a transfer to another community -- and not be sent.
   */
  describe('what the steps are handed', () => {
    const FormStub = { name: 'TransactionForm' }
    const CheckStub = { name: 'TransactionConfirmationSend' }
    const mountWithSteps = () =>
      mount(Send, { props: { balance: 1000, GdtBalance: 500 }, global: { mocks: { $t: t } } })

    it('the form gets the page’s picture, and what the form says of it is the page’s from then on', async () => {
      const page = mountWithSteps()
      const form = page.findComponent(FormStub)
      expect(form.props('picture')).toBeNull()

      form.vm.$emit('update:picture', { motif: 'bouquet' })
      await nextTick()

      expect(page.vm.picture).toEqual({ motif: 'bouquet' })
      expect(page.findComponent(FormStub).props('picture')).toEqual({ motif: 'bouquet' })
    })

    it('the check view gets the picture that goes with this transfer', async () => {
      const page = mountWithSteps()
      page.vm.picture = { motif: 'bouquet' }
      page.vm.setTransaction(transfer())
      await nextTick()

      expect(page.findComponent(CheckStub).props('picture')).toEqual({ motif: 'bouquet' })
    })

    it('the check view gets none for a member of another community, though the page still holds one', async () => {
      const page = mountWithSteps()
      page.vm.picture = { motif: 'bouquet' }
      page.vm.setTransaction(transfer({ targetCommunity: AWAY }))
      await nextTick()

      expect(page.findComponent(CheckStub).props('picture')).toBeNull()
      expect(page.vm.picture).toEqual({ motif: 'bouquet' })
    })
  })

  it('makes ONE transfer of a double press without a picture, too', async () => {
    wrapper.vm.setTransaction(transfer())

    await Promise.all([wrapper.vm.sendTransaction(), wrapper.vm.sendTransaction()])

    expect(sendCoinsMock).toHaveBeenCalledTimes(1)
  })
})
