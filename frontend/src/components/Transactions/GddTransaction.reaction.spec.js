// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GddTransaction from './GddTransaction.vue'
import { reactToTransaction } from '@/composables/useTransactionReactions'
import { setTransactionReaction } from '@/graphql/transactions.graphql'

/**
 * The reaction to a transfer in the booking list (Bernd, 11.10.2026): the emoji behind the time,
 * on the recipient's row and on the sender's, and in the opened row of what one received the
 * choice that sets it. A file of its own beside GddTransaction.spec.js: it needs a server.
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

const toasts = vi.hoisted(() => ({ error: [] }))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: () => {},
    toastError: (message) => toasts.error.push(message),
  }),
}))

/**
 * The client, as the original hands it out: `client` is looked up when it is READ, and throws
 * where none is provided. A row drawn in a place without one must not read it in its setup.
 *
 * The opened row of what one received says the transfer seen as well (Chat E-086,
 * GddTransaction.seen.spec.js): that question is answered here at once and kept apart, so the
 * calls the tests read are the reactions' alone.
 */
const apollo = vi.hoisted(() => ({ client: null, seen: [] }))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    get client() {
      if (!apollo.client) throw new Error('Apollo client with id default not found.')
      const server = apollo.client
      return {
        mutate: (asked) => {
          if (asked.mutation.definitions[0].name.value !== 'markTransferSeen') {
            return server.mutate(asked)
          }
          apollo.seen.push(asked.variables.transactionId)
          return Promise.resolve({ data: { markTransferSeen: true } })
        },
      }
    },
  }),
}))
vi.mock('@/composables/useChatUpdates', () => ({ pollChatNow: () => {} }))

/** How often the row began and stopped listening for reactions set elsewhere. */
const listening = vi.hoisted(() => ({ begun: 0, stopped: 0 }))
vi.mock('@/composables/useTransactionReactions', async (original) => {
  const real = await original()
  return {
    ...real,
    onTransactionReaction: (listener) => {
      listening.begun += 1
      const stop = real.onTransactionReaction(listener)
      return () => {
        listening.stopped += 1
        stop()
      }
    },
  }
})

const THUMB = '👍'
const HEART = '❤️'
const PARTY = '🎉'

/** A transfer the member received from a member of this community, as the list delivers it. */
const RECEIVED = {
  id: 7,
  typeId: 'RECEIVE',
  amount: '12.5',
  balance: '112.5',
  previousBalance: '100',
  balanceDate: new Date('2026-10-10T10:31:00Z'),
  memo: 'Danke für die Kräuter',
  decay: { decay: '0', start: null, end: null, duration: 0 },
  linkedUser: { alias: 'lena', gradidoID: 'lena-id', avatarColorIndex: 3 },
  linkId: null,
  viaThankYouCard: false,
  thankYouCardLabel: null,
  reaction: null,
  canReact: true,
}
/** One they sent: the reaction on it is the other person's, and theirs alone to set. */
const SENT = { ...RECEIVED, id: 8, typeId: 'SEND', amount: '-12.5', canReact: false }

describe('GddTransaction, the reaction to a transfer', () => {
  let wrapper

  const mountRow = (transaction) => {
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
          Name: true,
          CollapseIcon: { props: ['visible'], template: '<i :data-open="String(visible)" />' },
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

  /** A server that answers each question when the test says so. */
  const serverWaiting = () => {
    const answers = []
    apollo.client = {
      mutate: vi.fn(() => new Promise((resolve, reject) => answers.push({ resolve, reject }))),
    }
    return answers
  }
  /** A server that answers at once: the emoji it was sent, as the real one does. */
  const serverAnswering = () => {
    apollo.client = {
      mutate: vi.fn(async ({ variables }) => ({
        data: { setTransactionReaction: variables.emoji },
      })),
    }
    return apollo.client
  }

  const chip = () => wrapper.find('[data-test="transaction-reaction"]')
  const said = () => wrapper.find('[data-test="transaction-reaction-said"]')
  const choice = () => wrapper.find('[data-test="transaction-react"]')
  const quick = () => wrapper.findAll('[data-test="chat-reaction-quick"]')
  const quickOf = (emoji) => quick().find((button) => button.text() === emoji)
  const pressed = () =>
    quick()
      .filter((button) => button.attributes('aria-pressed') === 'true')
      .map((button) => button.text())
  const isOpen = () => wrapper.find('[data-open]').attributes('data-open') === 'true'
  const open = async () => {
    await wrapper.trigger('click')
  }
  const press = async (emoji) => {
    await quickOf(emoji).trigger('click')
    await flushPromises()
  }

  afterEach(() => {
    wrapper?.unmount()
    apollo.client = null
    apollo.seen.length = 0
    toasts.error.length = 0
    listening.begun = 0
    listening.stopped = 0
  })

  describe('behind the time', () => {
    it('is not there on a booking nobody reacted to', () => {
      mountRow(RECEIVED)

      expect(chip().exists()).toBe(false)
    })

    it('stands in the closed row of what one received, as one’s own', () => {
      mountRow({ ...RECEIVED, reaction: THUMB })

      expect(isOpen()).toBe(false)
      expect(chip().find('.transaction-reaction-emoji').text()).toBe(THUMB)
      expect(chip().classes()).toContain('is-mine')
    })

    // The sender reads what the recipient answered: not their own, and no rim.
    it('stands in the row of what one sent, as the other person’s', () => {
      mountRow({ ...SENT, reaction: HEART })

      expect(chip().find('.transaction-reaction-emoji').text()).toBe(HEART)
      expect(chip().classes()).not.toContain('is-mine')
    })

    it('stands in the line of the date and the time, after them', () => {
      mountRow({ ...RECEIVED, reaction: THUMB })

      const line = chip().element.parentElement
      const spans = [...line.children].filter((child) => child.tagName === 'SPAN')
      expect(spans[spans.length - 1]).toBe(chip().element)
      expect(spans.length).toBeGreaterThanOrEqual(3)
    })

    // For the ear a lead, then the reaction in one piece; the drawn emoji is left out for it.
    it('is said with a lead and in one piece: the emoji, and that it is one’s own', () => {
      mountRow({ ...RECEIVED, reaction: THUMB })

      expect(chip().find('.visually-hidden').text()).toBe('chatThread.reactionsLead')
      expect(said().text()).toBe(`${THUMB}, chatThread.reactionMine`)
      expect(said().classes()).toContain('visually-hidden')
      expect(chip().find('.transaction-reaction-emoji').attributes('aria-hidden')).toBe('true')
    })

    it('is said as the emoji alone on the sender’s row', () => {
      mountRow({ ...SENT, reaction: HEART })

      expect(said().text()).toBe(HEART)
    })

    // Not a control: it is set in the opened row.
    it('is no button, and no stop for the keyboard', () => {
      mountRow({ ...RECEIVED, reaction: THUMB })

      expect(chip().element.tagName).toBe('SPAN')
      expect(chip().findAll('button, [tabindex]')).toHaveLength(0)
    })

    it('takes a booking from a server that says nothing of it for one without', () => {
      const { reaction: _reaction, canReact: _canReact, ...older } = RECEIVED
      mountRow(older)

      expect(chip().exists()).toBe(false)
    })

    it('follows the booking when the list is read again', async () => {
      mountRow({ ...RECEIVED, reaction: THUMB })

      await wrapper.setProps({ transaction: { ...RECEIVED, reaction: PARTY } })
      expect(chip().find('.transaction-reaction-emoji').text()).toBe(PARTY)

      await wrapper.setProps({ transaction: { ...RECEIVED, reaction: null } })
      expect(chip().exists()).toBe(false)
    })

    // ⛔ The server's word by the booking it hands in, not by a changed value: the booking came
    // without a reaction, one was set here, and the list read again says there is none -- it
    // was taken back on another device.
    it('takes the list’s word when it is read again, over what was set here in between', async () => {
      apollo.client = {
        mutate: vi.fn(async ({ variables }) => ({
          data: { setTransactionReaction: variables.emoji },
        })),
      }
      mountRow({ ...RECEIVED, reaction: null })
      await open()
      await press(THUMB)
      expect(chip().exists()).toBe(true)

      await wrapper.setProps({ transaction: { ...RECEIVED, reaction: null } })

      expect(chip().exists()).toBe(false)
      expect(pressed()).toEqual([])
    })

    // The same booking handed in again -- nothing was read -- changes nothing.
    it('keeps what was set here while the booking is the one it was', async () => {
      apollo.client = {
        mutate: vi.fn(async ({ variables }) => ({
          data: { setTransactionReaction: variables.emoji },
        })),
      }
      const booking = { ...RECEIVED, reaction: null }
      mountRow(booking)
      await open()
      await press(THUMB)

      await wrapper.setProps({ transaction: booking })

      expect(chip().find('.transaction-reaction-emoji').text()).toBe(THUMB)
    })
  })

  describe('the choice in the opened row', () => {
    it('is not made in a closed row', () => {
      mountRow(RECEIVED)

      expect(choice().exists()).toBe(false)
      expect(quick()).toHaveLength(0)
    })

    it('stands over the booking’s numbers once the row is opened: six emoji and "more"', async () => {
      mountRow(RECEIVED)
      await open()

      expect(quick().map((button) => button.text())).toEqual([
        THUMB,
        HEART,
        '🙏',
        '😊',
        PARTY,
        '🌱',
      ])
      expect(wrapper.find('[data-test="chat-reaction-more"]').exists()).toBe(true)
      const part = wrapper.find('[data-test="opened-part"]').element
      expect(part.firstElementChild).toBe(choice().element)
      expect(part.lastElementChild).toBe(wrapper.find('[data-test="decay-stub"]').element)
    })

    // The word over it is the eye's: the row of emoji names itself for the ear.
    it('has the word "react" over it, for the eye', async () => {
      mountRow(RECEIVED)
      await open()

      const word = choice().element.firstElementChild
      expect(word.textContent.trim()).toBe('chatThread.react')
      expect(word.getAttribute('aria-hidden')).toBe('true')
      expect(wrapper.find('[data-test="chat-reaction-row"]').attributes('aria-label')).toBe(
        'chatThread.react',
      )
    })

    // ⛔ Only the recipient reacts, and whether the member may is the server's word.
    it.each([
      ['what one sent, with the other person’s reaction', { ...SENT, reaction: HEART }],
      ['what one sent, without one', SENT],
      ['what one received from another community', { ...RECEIVED, canReact: false }],
      [
        'a booking from a server that says nothing of it',
        { ...RECEIVED, canReact: undefined, reaction: undefined },
      ],
      ['a creation', { ...RECEIVED, typeId: 'CREATION', canReact: false }],
    ])('is not offered for %s', async (_name, booking) => {
      mountRow(booking)
      await open()

      expect(isOpen()).toBe(true)
      expect(choice().exists()).toBe(false)
      expect(quick()).toHaveLength(0)
    })

    it('shows one’s own reaction as the pressed one', async () => {
      mountRow({ ...RECEIVED, reaction: HEART })
      await open()

      expect(pressed()).toEqual([HEART])
    })

    // Made at the first opening and kept: closing takes nothing out from under the fold.
    it('is kept when the row is closed again', async () => {
      mountRow(RECEIVED)
      await open()
      await open()

      expect(isOpen()).toBe(false)
      expect(choice().exists()).toBe(true)
    })

    // Looked at after EACH press: two that both reached the row would close it and open it again.
    it('does not close the row under a press in it', async () => {
      serverAnswering()
      mountRow(RECEIVED)
      await open()

      await press(THUMB)
      expect(isOpen()).toBe(true)

      await choice().trigger('click')
      expect(isOpen()).toBe(true)
    })
  })

  describe('a press on an emoji', () => {
    it('sends the reaction by the id of the booking, past the cache, and shows it behind the time', async () => {
      const client = serverAnswering()
      mountRow(RECEIVED)
      await open()

      await press(THUMB)

      expect(client.mutate.mock.calls).toEqual([
        [
          {
            mutation: setTransactionReaction,
            variables: { transactionId: 7, emoji: THUMB },
            fetchPolicy: 'no-cache',
          },
        ],
      ])
      expect(chip().find('.transaction-reaction-emoji').text()).toBe(THUMB)
      expect(chip().classes()).toContain('is-mine')
      expect(pressed()).toEqual([THUMB])
      expect(toasts.error).toEqual([])
      // The opening said the transfer seen, a question of its own.
      expect(apollo.seen).toEqual([7])
    })

    it('takes the reaction back where the emoji is the booking’s already', async () => {
      const client = serverAnswering()
      mountRow({ ...RECEIVED, reaction: THUMB })
      await open()

      await press(THUMB)

      expect(client.mutate.mock.calls[0][0].variables).toEqual({ transactionId: 7, emoji: null })
      expect(chip().exists()).toBe(false)
      expect(pressed()).toEqual([])
    })

    it('sends another emoji as it is, and shows that one', async () => {
      const client = serverAnswering()
      mountRow({ ...RECEIVED, reaction: THUMB })
      await open()

      await press(HEART)

      expect(client.mutate.mock.calls[0][0].variables).toEqual({ transactionId: 7, emoji: HEART })
      expect(chip().find('.transaction-reaction-emoji').text()).toBe(HEART)
      expect(pressed()).toEqual([HEART])
    })

    // ⛔ Read off the reaction as the ROW holds it now -- the booking it was given is as old
    // as the list: the same emoji a second time takes back what the first one set.
    it('reads what to send off the reaction the row holds now, not off the booking as it came', async () => {
      const client = serverAnswering()
      mountRow(RECEIVED)
      await open()

      await press(THUMB)
      await press(THUMB)

      expect(client.mutate.mock.calls.map(([asked]) => asked.variables.emoji)).toEqual([
        THUMB,
        null,
      ])
      expect(chip().exists()).toBe(false)
    })

    // The server's word counts, not what was pressed.
    it('shows what the server answered', async () => {
      apollo.client = {
        mutate: vi.fn(async () => ({ data: { setTransactionReaction: PARTY } })),
      }
      mountRow(RECEIVED)
      await open()

      await press(THUMB)

      expect(chip().find('.transaction-reaction-emoji').text()).toBe(PARTY)
    })

    it('sends one of the forty-eight from behind "more" the same way', async () => {
      const client = serverAnswering()
      mountRow(RECEIVED)
      await open()

      await wrapper.find('[data-test="chat-reaction-more"]').trigger('click')
      const all = wrapper.findAll('[data-test="chat-reaction-emoji"]')
      expect(all).toHaveLength(48)
      const picked = all[20].text()
      await all[20].trigger('click')
      await flushPromises()

      expect(client.mutate.mock.calls[0][0].variables).toEqual({ transactionId: 7, emoji: picked })
      expect(chip().find('.transaction-reaction-emoji').text()).toBe(picked)
      // The choice stays in the opened row: the six are back, the one that was picked among
      // them in the place of the last, pressed.
      expect(wrapper.findAll('[data-test="chat-reaction-emoji"]')).toHaveLength(0)
      expect(quick()).toHaveLength(6)
      expect(pressed()).toEqual([picked])
    })

    // As a menu that is opened again is the menu: the six, not the forty-eight left open.
    it('begins with the six again when the row is closed and opened again', async () => {
      mountRow(RECEIVED)
      await open()
      await wrapper.find('[data-test="chat-reaction-more"]').trigger('click')
      expect(wrapper.findAll('[data-test="chat-reaction-emoji"]')).toHaveLength(48)

      await open()
      // While it closes, nothing is taken out of the row.
      expect(wrapper.findAll('[data-test="chat-reaction-emoji"]')).toHaveLength(48)
      await open()

      expect(wrapper.findAll('[data-test="chat-reaction-emoji"]')).toHaveLength(0)
      expect(quick()).toHaveLength(6)
    })

    describe('while the reaction is on its way', () => {
      // ⛔ A second press would be read off a state that is about to change.
      it('lets no emoji take a press, and shows it', async () => {
        const answers = serverWaiting()
        mountRow(RECEIVED)
        await open()

        await quickOf(THUMB).trigger('click')
        expect(wrapper.find('[data-test="chat-reaction-choice"]').classes()).toContain('is-busy')
        expect(quickOf(HEART).attributes('aria-disabled')).toBe('true')
        await quickOf(HEART).trigger('click')
        await quickOf(THUMB).trigger('click')
        expect(apollo.client.mutate).toHaveBeenCalledTimes(1)
        // Nothing is shown before the server has answered.
        expect(chip().exists()).toBe(false)

        answers[0].resolve({ data: { setTransactionReaction: THUMB } })
        await flushPromises()

        expect(wrapper.find('[data-test="chat-reaction-choice"]').classes()).not.toContain(
          'is-busy',
        )
        expect(quickOf(HEART).attributes('aria-disabled')).toBeUndefined()
        expect(chip().exists()).toBe(true)
      })
    })

    describe('where the server refuses', () => {
      it('says so, and the row keeps what it had', async () => {
        apollo.client = {
          mutate: vi.fn(async () => {
            throw new Error('TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER')
          }),
        }
        mountRow({ ...RECEIVED, reaction: HEART })
        await open()

        await press(THUMB)

        expect(toasts.error).toEqual(['chatThread.reactionFailed'])
        expect(chip().find('.transaction-reaction-emoji').text()).toBe(HEART)
        expect(pressed()).toEqual([HEART])
        // And the next press is taken.
        serverAnswering()
        await press(THUMB)
        expect(chip().find('.transaction-reaction-emoji').text()).toBe(THUMB)
      })

      it('says so where the page holds no client at all', async () => {
        mountRow(RECEIVED)
        await open()

        await press(THUMB)

        expect(toasts.error).toEqual(['chatThread.reactionFailed'])
        expect(chip().exists()).toBe(false)
      })
    })
  })

  // A row is drawn in places that provide no client: its setup must not ask for one.
  it('is drawn where no client is provided, opened too', async () => {
    mountRow({ ...RECEIVED, reaction: THUMB })
    await open()

    expect(chip().exists()).toBe(true)
    expect(choice().exists()).toBe(true)
  })

  describe('a reaction set elsewhere', () => {
    const elsewhere = (emoji) => ({
      mutate: vi.fn(async () => ({ data: { setTransactionReaction: emoji } })),
    })

    // At the booking's bubble in the conversation, in the contact window over the list.
    it('is shown in the row of that booking', async () => {
      mountRow(RECEIVED)

      await reactToTransaction(elsewhere(HEART), { ...RECEIVED }, HEART)
      await flushPromises()

      expect(chip().find('.transaction-reaction-emoji').text()).toBe(HEART)
    })

    it('is taken away there when it was taken back', async () => {
      mountRow({ ...RECEIVED, reaction: HEART })

      await reactToTransaction(elsewhere(null), { ...RECEIVED, reaction: HEART }, HEART)
      await flushPromises()

      expect(chip().exists()).toBe(false)
    })

    it('is not shown in the row of another booking', async () => {
      mountRow(RECEIVED)

      await reactToTransaction(elsewhere(HEART), { ...RECEIVED, id: 99 }, HEART)
      await flushPromises()

      expect(chip().exists()).toBe(false)
    })

    it('is listened for by a row once, and no longer when the row is gone', () => {
      mountRow(RECEIVED)
      expect(listening).toEqual({ begun: 1, stopped: 0 })

      wrapper.unmount()
      wrapper = null

      expect(listening).toEqual({ begun: 1, stopped: 1 })
    })
  })

  /**
   * ⛔ A reaction set in the opened row must move nothing of the list: it stands in the line
   * that is there already and counts as less than that line is high. jsdom lays nothing out, so
   * the numbers are read where they are written; the built wallet is measured for the rest.
   */
  describe('the stylesheet', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'GddTransaction.vue'),
      'utf8',
    )
    const rule = (selector) => {
      const found = new RegExp(`\\n${selector.replace(/[.]/g, '\\.')} \\{([^}]*)\\}`).exec(source)
      expect(found, `no ${selector} rule`).not.toBeNull()
      return found[1]
    }
    const number = (css, property) => Number(new RegExp(`${property}: (-?[\\d.]+)`).exec(css)[1])

    it('counts the reaction as no higher than the line of the date', () => {
      const css = rule('.transaction-reaction')
      const [, top, bottom] = /margin: (-[\d.]+)em 0 (-[\d.]+)em/.exec(css).map(Number)
      const counted = number(css, 'height') + top + bottom
      // The line: `small` (0.875em) at the body's line height of 1.5; the reaction's own em is
      // 0.875 of the row's as well.
      expect(number(css, 'font-size')).toBe(0.875)
      expect(counted).toBeLessThanOrEqual(1.5)
      expect(css).toContain('display: inline-flex')
    })

    it('draws one’s own with the rim inside, in the gold of the menus’ signs', () => {
      const css = rule('.transaction-reaction.is-mine')

      expect(css).toContain('box-shadow: inset 0 0 0 1.5px var(--menu-icon')
    })

    it('holds the choice to the width of the forty-eight, on the menus’ own ground', () => {
      const css = rule('.transaction-react-choice')

      expect(css).toContain('width: min(18.825rem, 100%)')
      expect(css).toContain('background: var(--menu-surface')
    })
  })
})
