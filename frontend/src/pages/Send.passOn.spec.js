// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import Send from './Send.vue'
import { useMutation } from '@vue/apollo-composable'
import { sendCoins, createTransactionLink } from '@/graphql/mutations.js'
import { clearPassOnDraft, usePassOnDraft } from '@/composables/usePassOnDraft'
import { SEND_TYPES } from '@/utils/sendTypes'
import { walletStore } from '@test/walletStore'

/**
 * A thank-you passed on, on the page that sends it (the trail): "Jemandem danken" hands the
 * member's RECEIVE booking over (usePassOnDraft), the page takes it once when it is made, and the
 * transfer to a member of this community names it to sendCoins as `passOnOf`. Nothing of it is
 * shown. The children are stand-ins, as in Send.spec.js.
 */
vi.mock('@/components/GddSend/TransactionForm', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('@/components/GddSend/TransactionConfirmationSend', () => ({
  default: { template: '<div></div>' },
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
// `useI18n` only: the store the page asks loads the wallet's own i18n, made with `createI18n`.
vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal()),
  useI18n: () => ({ t }),
}))
vi.mock('vue-router', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))
vi.mock('@vue/apollo-composable', () => ({ useMutation: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => ({ toastError: vi.fn() }) }))

const EMMA = 'uuid-emma'
const HOME = { uuid: 'home-uuid', name: 'Gradido Entwicklung', foreign: false }
const AWAY = { uuid: 'away-uuid', name: 'Gradido Wien', foreign: true }
// Emma's own RECEIVE booking of the thank-you she passes on.
const RECEIVED = 1002

const transfer = (rest = {}) => ({
  selected: SEND_TYPES.send,
  targetCommunity: HOME,
  identifier: 'Dave-Bank',
  amount: 50,
  memo: 'Für die Bank, weitergegeben.',
  ...rest,
})

/** What the line under a thank-you does before it leads to the form: as the member signed in. */
const handOver = (transactionId) => {
  mount(
    {
      setup() {
        usePassOnDraft().put(transactionId)
        return () => null
      },
    },
    { global: { plugins: [walletStore({ gradidoID: EMMA })] } },
  ).unmount()
}

/** Whatever is held still, taken as the page would take it. */
const stillHeld = () => {
  let held
  mount(
    {
      setup() {
        held = usePassOnDraft().take()
        return () => null
      },
    },
    { global: { plugins: [walletStore({ gradidoID: EMMA })] } },
  ).unmount()
  return held
}

describe('Send, a thank-you passed on', () => {
  let sendCoinsMock
  let createLinkMock

  beforeEach(() => {
    vi.clearAllMocks()
    // What is held lives at module level, so one test must not hand anything to the next.
    clearPassOnDraft()
    sendCoinsMock = vi.fn().mockResolvedValue({ data: { sendCoins: true } })
    createLinkMock = vi.fn().mockResolvedValue({
      data: { createTransactionLink: { link: 'l', amount: 5, memo: 'm', validUntil: 'v' } },
    })
    vi.mocked(useMutation).mockImplementation((mutation) => {
      if (mutation === sendCoins) return { mutate: sendCoinsMock }
      if (mutation === createTransactionLink) return { mutate: createLinkMock }
      return { mutate: vi.fn() }
    })
  })

  const mountPage = () =>
    shallowMount(Send, {
      props: { balance: 1000, GdtBalance: 500 },
      global: {
        plugins: [walletStore({ gradidoID: EMMA })],
        mocks: { $t: t },
        stubs: { 'gdd-send': true },
      },
    })
  const sentWith = (call = 0) => sendCoinsMock.mock.calls[call][0]

  it('takes what was handed over, once, and the transfer names it', async () => {
    handOver(RECEIVED)
    const page = mountPage()
    // Taken when the page was made: nothing is left for anybody else.
    expect(stillHeld()).toBeNull()

    page.vm.setTransaction(transfer())
    await page.vm.sendTransaction()

    expect(sendCoinsMock).toHaveBeenCalledTimes(1)
    expect(sentWith()).toEqual({
      recipientCommunityIdentifier: 'home-uuid',
      recipientIdentifier: 'Dave-Bank',
      amount: '50',
      memo: 'Für die Bank, weitergegeben.',
      passOnOf: RECEIVED,
    })
  })

  it('names none where nothing was handed over: not even as a variable', async () => {
    const page = mountPage()

    page.vm.setTransaction(transfer())
    await page.vm.sendTransaction()

    expect(sentWith()).not.toHaveProperty('passOnOf')
  })

  // ⛔ Within the community only: the server keeps no trail across the border.
  it('names none to a member of another community', async () => {
    handOver(RECEIVED)
    const page = mountPage()

    page.vm.setTransaction(transfer({ targetCommunity: AWAY }))
    await page.vm.sendTransaction()

    expect(sendCoinsMock).toHaveBeenCalledTimes(1)
    expect(sentWith()).not.toHaveProperty('passOnOf')
  })

  it('names none with a link', async () => {
    handOver(RECEIVED)
    const page = mountPage()

    page.vm.setTransaction(transfer({ selected: SEND_TYPES.link }))
    await page.vm.sendTransaction()

    expect(sendCoinsMock).not.toHaveBeenCalled()
    expect(createLinkMock.mock.calls[0][0]).toEqual({
      amount: '50',
      memo: 'Für die Bank, weitergegeben.',
    })
  })

  // The form is taken down between the steps and has nothing to hand back: the page keeps it.
  it('still names it after "Zurück" and a changed transfer', async () => {
    handOver(RECEIVED)
    const page = mountPage()

    page.vm.setTransaction(transfer())
    page.vm.onBack()
    page.vm.setTransaction(transfer({ amount: 25 }))
    await page.vm.sendTransaction()

    expect(sentWith()).toMatchObject({ amount: '25', passOnOf: RECEIVED })
  })

  it('lets it go with a transfer that was sent: the next one of the visit names none', async () => {
    handOver(RECEIVED)
    const page = mountPage()
    page.vm.setTransaction(transfer())
    await page.vm.sendTransaction()

    page.vm.setTransaction(transfer({ memo: 'Und noch eine Überweisung.' }))
    await page.vm.sendTransaction()

    expect(sentWith(0)).toHaveProperty('passOnOf', RECEIVED)
    expect(sentWith(1)).not.toHaveProperty('passOnOf')
  })

  it('keeps it where the transfer failed: the next attempt names it', async () => {
    handOver(RECEIVED)
    sendCoinsMock.mockRejectedValueOnce(new Error('Send failed'))
    const page = mountPage()
    page.vm.setTransaction(transfer())
    await page.vm.sendTransaction()
    expect(page.vm.currentTransactionStep).toBe('transactionResultSendError')

    page.vm.setTransaction(transfer())
    await page.vm.sendTransaction()

    expect(sentWith(1)).toHaveProperty('passOnOf', RECEIVED)
  })
})
