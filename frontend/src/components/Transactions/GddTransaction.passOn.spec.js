// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GddTransaction from './GddTransaction.vue'

/**
 * W2 of the waves of gratitude (Bernd, 26.10.2026): in the opened row of a thank-you received,
 * under the choice of a reaction, "Dank weitergeben?" with "Jemandem danken" and "Nicht jetzt" --
 * outwards, to somebody the member chooses, never back to the giver. The rule has its own spec
 * (utils/thanksNudge); here what the row makes of it. A file of its own beside GddTransaction.spec.js:
 * it needs a router and a clock.
 */

vi.mock('@/store/useWalletStore', () => ({
  useWalletStore: () => ({ username: 'bernd', gradidoID: 'me-id' }),
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))
vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))

const pushSpy = vi.hoisted(() => vi.fn())
vi.mock('vue-router', () => ({ useRouter: () => ({ push: pushSpy }) }))

// The client is asked for when an emoji is pressed, which nothing here does.
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    get client() {
      throw new Error('Apollo client with id default not found.')
    },
  }),
}))

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE
const CAME = new Date('2026-10-26T15:00:00.000Z')
const came = CAME.getTime()

/** A thank-you the member received from a member of this community, as the list delivers it. */
const RECEIVED = {
  id: 7,
  typeId: 'RECEIVE',
  amount: '12.5',
  balance: '112.5',
  previousBalance: '100',
  balanceDate: CAME,
  memo: 'Danke für die Kräuter',
  decay: { decay: '0', start: null, end: null, duration: 0 },
  linkedUser: { alias: 'lena', gradidoID: 'lena-id', avatarColorIndex: 3 },
  linkId: null,
  viaThankYouCard: false,
  thankYouCardLabel: null,
  reaction: null,
  canReact: true,
}
const ANSWERED = 'thanks-nudge:me-id:pass-on:7'

describe('GddTransaction, the suggestion to pass a thank-you on', () => {
  let wrapper

  const mountRow = (transaction = RECEIVED) => {
    wrapper = mount(GddTransaction, {
      props: { transaction },
      attachTo: document.body,
      global: {
        mocks: {
          $t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
          $d: (d) => String(d),
          $filters: { GDD: (a) => String(a) },
        },
        stubs: {
          BRow: { template: '<div><slot /></div>' },
          BCol: { template: '<div><slot /></div>' },
          BCollapse: { template: '<div data-test="opened-part"><slot /></div>' },
          BAvatar: true,
          AppAvatar: true,
          // The name opens the row's person; it is where the keyboard goes where there is no
          // choice of a reaction.
          Name: { template: '<button class="gdd-transaction-list-item-open" data-test="name" />' },
          CollapseIcon: true,
          DecayInformation: { template: '<div data-test="decay-stub" />' },
          VariantIcon: true,
          FavoriteHeart: true,
          IMdiPlus: true,
          IMdiEmoticonHappyOutline: true,
        },
      },
    })
    return wrapper
  }

  /** The row opened, as a tap on it does it, at the given moment. */
  const openAt = async (ms) => {
    vi.setSystemTime(came + ms)
    await wrapper.trigger('click')
    await flushPromises()
  }

  const line = () => wrapper.find('[data-test="transaction-pass-on"]')
  const press = async (which) => {
    await wrapper.find(`[data-test="thanks-nudge-${which}"]`).trigger('click')
    await flushPromises()
  }
  const isOpen = () => wrapper.vm.$.setupState.visible

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    pushSpy.mockClear()
    window.localStorage.removeItem(ANSWERED)
  })

  describe('where it stands', () => {
    it('in the opened row of a thank-you received, under the choice of a reaction', async () => {
      mountRow()
      await openAt(DAY)

      expect(line().find('[data-test="thanks-nudge-question"]').text()).toBe('thanksNudge.passOn')
      expect(line().find('[data-test="thanks-nudge-yes"]').text()).toBe('thanksNudge.someone')
      expect(line().find('[data-test="thanks-nudge-no"]').text()).toBe('thanksNudge.notNow')
      const inOrder = [...wrapper.find('[data-test="opened-part"]').element.children].map((child) =>
        child.getAttribute('data-test'),
      )
      expect(inOrder).toEqual(['transaction-react', 'transaction-pass-on', 'decay-stub'])
    })

    // Closed, the row says nothing of it: still water.
    it('not while the row is closed', () => {
      vi.setSystemTime(came + DAY)
      mountRow()

      expect(line().exists()).toBe(false)
    })

    // A thank-you from another community: no reaction to choose, the line all the same.
    it('also where the member may not react', async () => {
      mountRow({ ...RECEIVED, canReact: false })
      await openAt(DAY)

      expect(wrapper.find('[data-test="transaction-react"]').exists()).toBe(false)
      expect(line().exists()).toBe(true)
    })
  })

  describe('how long', () => {
    it('up to seven days after the thank-you came', async () => {
      mountRow()
      await openAt(7 * DAY)

      expect(line().exists()).toBe(true)
    })

    it('not seven days and a minute after it came', async () => {
      mountRow()
      await openAt(7 * DAY + MINUTE)

      expect(line().exists()).toBe(false)
    })

    // The moment it goes by is the opening, not when the list was drawn.
    it('by the moment the row is opened, not by when the list was drawn', async () => {
      vi.setSystemTime(came + 6 * DAY)
      mountRow()

      await openAt(7 * DAY + MINUTE)

      expect(line().exists()).toBe(false)
    })
  })

  describe('where it does not stand', () => {
    it('in a row of one’s own sending', async () => {
      mountRow({ ...RECEIVED, typeId: 'SEND', amount: '-12.5', canReact: false })
      await openAt(DAY)

      expect(line().exists()).toBe(false)
    })

    it('in a creation', async () => {
      mountRow({ ...RECEIVED, typeId: 'CREATION', linkedUser: { alias: 'Gradido-Akademie' } })
      await openAt(DAY)

      expect(line().exists()).toBe(false)
    })

    it('where it was answered on this device', async () => {
      window.localStorage.setItem(ANSWERED, '1')
      mountRow()
      await openAt(DAY)

      expect(line().exists()).toBe(false)
    })
  })

  describe('the answers', () => {
    it('"Jemandem danken": the send form with nobody named, and answered', async () => {
      mountRow()
      await openAt(DAY)

      await press('yes')

      expect(pushSpy).toHaveBeenCalledTimes(1)
      expect(pushSpy).toHaveBeenCalledWith({ path: '/send', query: { art: 'send' } })
      expect(window.localStorage.getItem(ANSWERED)).toBe('1')
      expect(line().exists()).toBe(false)
      // A press in it is no press on the row: the booking stays open under the member's hand.
      expect(isOpen()).toBe(true)
    })

    it('"Nicht jetzt": answered, and the line does not come back for this thank-you', async () => {
      mountRow()
      await openAt(DAY)

      await press('no')

      expect(pushSpy).not.toHaveBeenCalled()
      expect(window.localStorage.getItem(ANSWERED)).toBe('1')
      expect(line().exists()).toBe(false)
      expect(isOpen()).toBe(true)

      // Closed and opened again: still gone.
      await wrapper.trigger('click')
      await openAt(DAY + MINUTE)
      expect(isOpen()).toBe(true)
      expect(line().exists()).toBe(false)
    })
  })

  describe('where the keyboard goes after "Nicht jetzt"', () => {
    const fromNotNow = async () => {
      const button = wrapper.find('[data-test="thanks-nudge-no"]')
      button.element.focus()
      expect(document.activeElement).toBe(button.element)
      await press('no')
    }

    it('to the choice of a reaction above it', async () => {
      mountRow()
      await openAt(DAY)

      await fromNotNow()

      const choice = wrapper.find('[data-test="transaction-react"]').element
      expect(choice.contains(document.activeElement)).toBe(true)
      expect(document.activeElement.getAttribute('tabindex')).toBe('0')
    })

    it('to the row’s name, where there is no choice of a reaction', async () => {
      mountRow({ ...RECEIVED, canReact: false })
      await openAt(DAY)

      await fromNotNow()

      expect(document.activeElement).toBe(wrapper.find('[data-test="name"]').element)
    })
  })
})
