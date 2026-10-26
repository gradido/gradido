// AI-GENERATED — not an architecture reference
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import GddTransaction from './GddTransaction.vue'
import { markTransferSeen } from '@/graphql/chat.graphql'

/**
 * Chat E-086 (Bernd, 26.10.2026): a transfer the member received counts as unread at the sender's
 * name until it was seen -- in the booking list "nur wenn die Transaktion geöffnet wurde". The row
 * says so when it is opened: that one transfer, once.
 */

const { mutate, pollChatNow } = vi.hoisted(() => ({
  mutate: vi.fn(),
  pollChatNow: vi.fn(),
}))

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { mutate } }),
}))

vi.mock('@/composables/useChatUpdates', () => ({ pollChatNow }))

vi.mock('@/store/useWalletStore', () => ({
  useWalletStore: () => ({ firstName: 'Max', lastName: 'Mustermann' }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))

const RECEIVED = {
  id: 41,
  typeId: 'RECEIVE',
  amount: '20',
  balance: '120',
  previousBalance: '100',
  balanceDate: new Date('2026-10-26T10:31:00Z'),
  memo: 'Danke für die Kräuter',
  decay: { decay: '0', start: null, end: null, duration: 0 },
  linkedUser: { alias: 'anna', avatarColorIndex: 3 },
  linkId: null,
  viaThankYouCard: false,
  thankYouCardLabel: null,
}

describe('GddTransaction, a received transfer opened', () => {
  let wrapper

  const mountWith = (extra = {}) => {
    wrapper = mount(GddTransaction, {
      props: { transaction: { ...RECEIVED, ...extra } },
      global: {
        mocks: { $t: (key) => key, $d: (d) => String(d), $filters: { GDD: (a) => String(a) } },
        stubs: {
          BRow: { template: '<div><slot /></div>' },
          BCol: { template: '<div><slot /></div>' },
          BCollapse: { template: '<div><slot /></div>' },
          BAvatar: true,
          AppAvatar: true,
          Name: true,
          CollapseIcon: true,
          DecayInformation: true,
          VariantIcon: true,
          FavoriteHeart: true,
          ChatReactionChoice: true,
        },
      },
    })
    return wrapper
  }

  /** The member taps the row, as `toggleVisible` takes it. */
  const toggle = async () => {
    await wrapper.trigger('click')
    await flushPromises()
  }

  beforeEach(() => {
    mutate.mockReset()
    pollChatNow.mockReset()
    mutate.mockResolvedValue({ data: { markTransferSeen: true } })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('says nothing while the row is closed', async () => {
    mountWith()
    await flushPromises()

    expect(mutate).not.toHaveBeenCalled()
  })

  it('says the transfer seen when the row is opened, and asks the beat at once', async () => {
    mountWith()
    await toggle()

    expect(mutate.mock.calls).toEqual([
      [{ mutation: markTransferSeen, variables: { transactionId: 41 } }],
    ])
    expect(pollChatNow).toHaveBeenCalledTimes(1)
  })

  it('says it once, however often the row is opened', async () => {
    mountWith()
    await toggle()
    await toggle()
    await toggle()

    expect(mutate).toHaveBeenCalledTimes(1)
  })

  // Nothing of it reached the server: the next opening says it again.
  it('says it again after a failure', async () => {
    mutate.mockRejectedValueOnce(new Error('offline'))
    mountWith()
    await toggle()
    await toggle()
    await toggle()

    expect(mutate).toHaveBeenCalledTimes(2)
    expect(pollChatNow).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['one the member sent', { typeId: 'SEND', amount: '-20' }],
    ['a creation', { typeId: 'CREATION', linkedUser: { alias: 'Gradido-Akademie' } }],
    ['a transfer without a person', { linkedUser: null }],
  ])('says nothing for %s', async (_name, extra) => {
    mountWith(extra)
    await toggle()

    expect(mutate).not.toHaveBeenCalled()
  })
})
