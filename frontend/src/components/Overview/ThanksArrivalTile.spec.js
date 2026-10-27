// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { walletStore } from '@test/walletStore'
import { useWalletStore } from '@/store/useWalletStore'
import ThanksArrivalTile from './ThanksArrivalTile.vue'
import AppAvatar from '@/components/AppAvatar.vue'
import ThankYouGreetingPhoto from '@/components/ThankYouGreeting/ThankYouGreetingPhoto.vue'
import {
  fetchMemberAvatars,
  forgetAllMemberAvatars,
  rememberMemberAvatars,
} from '@/composables/useMemberAvatars'
import { useThanksNudges } from '@/composables/useThanksNudges'
import { reactToTransaction } from '@/composables/useTransactionReactions'
import { LIST_AVATAR_SIZE } from '@/constants'
import { setTransactionReaction } from '@/graphql/transactions.graphql'
import de from '@/locales/de.json'
import en from '@/locales/en.json'

/**
 * The tile "Dein Dank ist da." (W3). Which thank-yous it shows is decided by the overview and
 * handed in (useThanksArrivals, utils/thanksNudge); this file is about what the tile does with
 * them -- the blocks, the one tap, the line after it, and the two quiet ways.
 *
 * The reaction runs through the REAL `reactToTransaction`, only the server is stood in for: that
 * the tile reacts as the booking row does is the point.
 */

/** The server's side of a reaction, set by each case. */
const server = vi.hoisted(() => ({ mutate: null }))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    client: { mutate: (asked) => server.mutate(asked), query: () => Promise.resolve({}) },
  }),
}))

// ⛔ A PARTIAL mock: only the round trip is replaced. The picture store itself stays real, because
// the face is drawn out of it.
vi.mock('@/composables/useMemberAvatars', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchMemberAvatars: vi.fn(),
}))

const beat = vi.hoisted(() => ({ asked: 0 }))
vi.mock('@/composables/useChatUpdates', () => ({
  pollChatNow: () => {
    beat.asked += 1
    return Promise.resolve()
  },
}))

const toasts = vi.hoisted(() => ({ error: [] }))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: () => {},
    toastError: (message) => toasts.error.push(message),
  }),
}))

/** The wallet's own number format, in the two languages the cases read. */
const ungroupedDecimal = {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
}
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en, de },
  numberFormats: { en: { ungroupedDecimal }, de: { ungroupedDecimal } },
})

const router = createRouter({
  history: createWebHistory(),
  routes: ['/overview', '/send', '/contacts'].map((path) => ({
    path,
    component: { template: '<div />' },
  })),
})

const NBSP = String.fromCharCode(160)
const HEART = '❤️'
const MINUTE = 60 * 1000
/** When the picture of the first giver last changed: the key the face is stored under. */
const PICTURE_DATE = new Date('2026-10-20T10:00:00.000Z')

/** A thank-you received, as the booking list carries it. The lower the id, the newer. */
const thanks = (id, extra = {}) => ({
  id,
  typeId: 'RECEIVE',
  amount: '12.5',
  balance: '112.5',
  previousBalance: '100',
  balanceDate: new Date(Date.now() - id * MINUTE).toISOString(),
  memo: `Danke für alles, ${id}`,
  linkedUser: {
    alias: `giver${id}`,
    gradidoID: `giver-${id}`,
    communityUuid: 'home-uuid',
    communityName: 'Home',
    avatarColorIndex: id,
    avatarUpdatedAt: null,
  },
  decay: null,
  linkId: null,
  viaThankYouCard: false,
  thankYouCardLabel: null,
  greeting: null,
  picture: null,
  reaction: null,
  canReact: true,
  ...extra,
})

/** A server that answers at once: the emoji it was sent, as the real one does. */
const serverAnswering = () => {
  server.mutate = vi.fn(async ({ variables }) => ({
    data: { setTransactionReaction: variables.emoji },
  }))
}
/** A server that answers when the case says so. */
const serverWaiting = () => {
  const answers = []
  server.mutate = vi.fn(() => new Promise((resolve, reject) => answers.push({ resolve, reject })))
  return answers
}
const serverRefusing = () => {
  server.mutate = vi.fn(async () => {
    throw new Error('TRANSACTION_REACTION_NOT_SET: NOT_STORED')
  })
}

let store
let wrapper

const mountTile = (list) => {
  wrapper = mount(ThanksArrivalTile, {
    props: { thanks: list },
    attachTo: document.body,
    global: {
      plugins: [i18n, router, store],
      stubs: {
        AppAvatar: true,
        ThankYouGreetingPhoto: true,
        IIonLayersSharp: true,
        IMdiEmoticonHappyOutline: true,
        IMdiPlus: true,
      },
    },
  })
  return wrapper
}

const items = () => wrapper.findAll('[data-test="thanks-arrival-item"]')
const itemIds = () => items().map((item) => Number(item.attributes('data-transaction-id')))
const itemOf = (id) => wrapper.find(`[data-transaction-id="${id}"]`)
const quickOf = (id, emoji) =>
  itemOf(id)
    .findAll('[data-test="chat-reaction-quick"]')
    .find((button) => button.text() === emoji)
const press = async (id, emoji = HEART) => {
  await quickOf(id, emoji).trigger('click')
  await flushPromises()
}
const lineOf = (id) => itemOf(id).find('[data-test="thanks-arrival-pass-on"]')
const choiceOf = (id) => itemOf(id).find('[data-test="thanks-arrival-react"]')

/** What the booking row asks before it shows "Dank weitergeben?" -- the same store, the same key. */
const rowAsks = (id) => {
  let answered
  mount(
    {
      template: '<div />',
      setup() {
        answered = useThanksNudges().isSeen('pass-on', id)
        return {}
      },
    },
    { global: { plugins: [store] } },
  ).unmount()
  return answered
}

beforeEach(async () => {
  window.localStorage.clear()
  forgetAllMemberAvatars()
  vi.mocked(fetchMemberAvatars).mockClear()
  beat.asked = 0
  toasts.error = []
  i18n.global.locale.value = 'en'
  store = walletStore({ gradidoID: 'member-1', communityUuid: 'home-uuid' })
  serverAnswering()
  await router.push('/overview')
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('ThanksArrivalTile', () => {
  describe('what it shows', () => {
    // ZE-007: no number, no counter -- and where there is nothing to say, nothing at all.
    it('shows nothing at all without a thank-you', () => {
      mountTile([])

      expect(wrapper.find('[data-test="thanks-arrival-tile"]').exists()).toBe(false)
      expect(wrapper.text()).toBe('')
    })

    it('wears the frame of the tile family: the menu’s word on its label, the sentence over it', () => {
      mountTile([thanks(1)])

      expect(wrapper.find('[data-test="thanks-arrival-tile-label"]').text()).toBe('Transactions')
      expect(wrapper.find('[data-test="thanks-arrival-heading"]').text()).toBe(
        'Your thank-you is here.',
      )
    })

    it('says the same sentence over three thank-yous as over one', () => {
      mountTile([thanks(1), thanks(2), thanks(3)])

      expect(wrapper.find('[data-test="thanks-arrival-heading"]').text()).toBe(
        'Your thank-you is here.',
      )
      expect(wrapper.findAll('[data-test="thanks-arrival-heading"]')).toHaveLength(1)
    })

    // The newest first is the overview's to decide (arrivalItems); the tile keeps that order.
    it('shows three thank-yous as three blocks, in the order handed in -- the newest first', () => {
      mountTile([thanks(1), thanks(2), thanks(3)])

      expect(itemIds()).toEqual([1, 2, 3])
      expect(items()[0].find('[data-test="thanks-arrival-from"]').text()).toContain('giver1')
      expect(items()[2].find('[data-test="thanks-arrival-from"]').text()).toContain('giver3')
    })

    it('names who thanks and with how much, the amount with its unit, never apart', () => {
      mountTile([thanks(1)])

      expect(itemOf(1).find('[data-test="thanks-arrival-from"]').text()).toBe(
        `giver1 thanks you with 12.5${NBSP}Gradido.`,
      )
    })

    it('writes the amount with the decimal mark of the member’s language', () => {
      i18n.global.locale.value = 'de'
      mountTile([thanks(1)])

      expect(itemOf(1).find('[data-test="thanks-arrival-from"]').text()).toBe(
        `giver1 dankt Dir mit 12,5${NBSP}Gradido.`,
      )
    })

    it('names a giver without a user name by their Gradido ID, as the wallet does everywhere', () => {
      mountTile([thanks(1, { linkedUser: { ...thanks(1).linkedUser, alias: null } })])

      expect(itemOf(1).find('[data-test="thanks-arrival-from"]').text()).toContain('giver-1')
    })

    it('draws the giver’s face as the booking row does', () => {
      mountTile([thanks(1)])

      const face = itemOf(1).findComponent(AppAvatar)
      expect(face.props('size')).toBe(LIST_AVATAR_SIZE)
      expect(face.props('initials')).toBeTruthy()
      expect(face.attributes('color')).toBe('#fff')
    })

    it('draws the picture this device holds of the giver, and lets it open large', () => {
      rememberMemberAvatars([
        {
          communityUuid: 'home-uuid',
          gradidoID: 'giver-1',
          avatar: 'giver-picture',
          avatarUpdatedAt: PICTURE_DATE,
        },
      ])
      mountTile([
        thanks(1, {
          linkedUser: { ...thanks(1).linkedUser, avatarUpdatedAt: PICTURE_DATE.toISOString() },
        }),
      ])

      const face = itemOf(1).findComponent(AppAvatar)
      expect(face.props('src')).toBeTruthy()
      expect(face.props('zoomable')).toBe(true)
    })

    // ⛔ Not optional: the tile has no list behind it that asks for faces.
    it('asks for the givers’ faces', () => {
      mountTile([thanks(1), thanks(2)])

      expect(fetchMemberAvatars).toHaveBeenCalledTimes(1)
      const [, users] = vi.mocked(fetchMemberAvatars).mock.calls[0]
      expect(users.map((user) => user.gradidoID)).toEqual(['giver-1', 'giver-2'])
    })

    it('shows the photo of a thank-you greeting, asked for by the link', () => {
      mountTile([
        thanks(1, { linkId: 42, greeting: { motif: null, line: 'Danke', hasPicture: true } }),
      ])

      const photo = itemOf(1).findComponent(ThankYouGreetingPhoto)
      expect(photo.exists()).toBe(true)
      expect(photo.props('linkId')).toBe(42)
      expect(photo.props('transactionId')).toBeNull()
    })

    it('shows the photo sent with a transfer, asked for by the booking', () => {
      mountTile([thanks(1, { picture: { motif: null, hasPicture: true } })])

      const photo = itemOf(1).findComponent(ThankYouGreetingPhoto)
      expect(photo.props('transactionId')).toBe(1)
      expect(photo.props('linkId')).toBeNull()
    })

    it('shows the motif of a greeting as its picture', () => {
      mountTile([
        thanks(1, { linkId: 42, greeting: { motif: 'bouquet', line: 'Danke', hasPicture: false } }),
      ])

      const image = itemOf(1).find('[data-test="thanks-arrival-picture"] img')
      expect(image.attributes('src')).toBe('/img/thank-you-greeting/bouquet.svg')
      expect(image.attributes('alt')).toBeTruthy()
    })

    it('leaves no empty room where there is no picture', () => {
      mountTile([thanks(1), thanks(2, { picture: { motif: 'heart-leaves', hasPicture: false } })])

      expect(itemOf(1).find('[data-test="thanks-arrival-picture"]').exists()).toBe(false)
      expect(itemOf(2).find('[data-test="thanks-arrival-picture"]').exists()).toBe(true)
    })

    it('writes the message with its addresses as links', () => {
      mountTile([thanks(1, { memo: 'Danke! Mehr unter https://gradido.net/faq' })])

      const memo = itemOf(1).find('[data-test="thanks-arrival-memo"]')
      expect(memo.text()).toContain('Danke!')
      expect(memo.find('a').attributes('href')).toBe('https://gradido.net/faq')
    })

    it('has no line for a message where there is none', () => {
      mountTile([thanks(1, { memo: '' })])

      expect(itemOf(1).find('[data-test="thanks-arrival-memo"]').exists()).toBe(false)
    })

    /**
     * The message on one line with an ellipsis, as the closed booking row has it -- and the guard
     * that keeps a long one from pushing the page apart. jsdom lays nothing out, so the rule is
     * read from the source, comments taken out first (they name the same words).
     */
    it('clamps the message to one line, without letting its length widen the page', () => {
      const here = dirname(fileURLToPath(import.meta.url))
      const source = readFileSync(resolve(here, 'ThanksArrivalTile.vue'), 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      )
      const rule = source.match(/\.thanks-arrival-memo\s*\{([^}]*)\}/)?.[1] ?? ''
      expect(rule).toMatch(/white-space:\s*nowrap/)
      expect(rule).toMatch(/text-overflow:\s*ellipsis/)
      expect(rule).toMatch(/overflow:\s*hidden/)
      expect(rule).toMatch(/contain:\s*inline-size/)
    })
  })

  describe('the one tap', () => {
    it('offers the choice of an emoji only where the member may react', () => {
      mountTile([thanks(1), thanks(2, { canReact: false })])

      expect(choiceOf(1).exists()).toBe(true)
      expect(choiceOf(1).text()).toContain('React')
      expect(choiceOf(2).exists()).toBe(false)
    })

    it('sends the emoji that was pressed, as the booking row does', async () => {
      mountTile([thanks(1)])

      await press(1, HEART)

      expect(server.mutate).toHaveBeenCalledTimes(1)
      const [asked] = server.mutate.mock.calls[0]
      expect(asked.mutation).toBe(setTransactionReaction)
      expect(asked.variables).toEqual({ transactionId: 1, emoji: HEART })
    })

    it('puts "Pass the thanks on?" in the choice’s place once the server has answered', async () => {
      mountTile([thanks(1)])

      await press(1)

      expect(choiceOf(1).exists()).toBe(false)
      expect(lineOf(1).text()).toContain('Pass the thanks on?')
      expect(lineOf(1).text()).toContain('Thank someone')
      expect(lineOf(1).text()).toContain('Not now')
    })

    it('waits for the server’s answer before it shows the line', async () => {
      const answers = serverWaiting()
      mountTile([thanks(1)])

      await quickOf(1, HEART).trigger('click')
      await flushPromises()
      expect(choiceOf(1).exists()).toBe(true)
      expect(lineOf(1).exists()).toBe(false)

      answers[0].resolve({ data: { setTransactionReaction: HEART } })
      await flushPromises()
      expect(lineOf(1).exists()).toBe(true)
    })

    // The server counts the transfer as seen with the reaction (E-086): the mark at the giver's
    // name goes at once, as when a row is opened.
    it('asks the beat at once once the reaction stands', async () => {
      mountTile([thanks(1)])

      await press(1)

      expect(beat.asked).toBe(1)
    })

    it('says so where the server refuses, and leaves the choice as it was', async () => {
      serverRefusing()
      mountTile([thanks(1)])

      await press(1)

      expect(toasts.error).toEqual(['The reaction could not be saved.'])
      expect(choiceOf(1).exists()).toBe(true)
      expect(lineOf(1).exists()).toBe(false)
      expect(beat.asked).toBe(0)
    })

    // The server's word is what stands: where it answers that no reaction stands, there is none
    // to follow up on, and the choice stays.
    it('shows no line where the server answers that no reaction stands', async () => {
      server.mutate = vi.fn(async () => ({ data: { setTransactionReaction: null } }))
      mountTile([thanks(1)])

      await press(1)

      expect(lineOf(1).exists()).toBe(false)
      expect(choiceOf(1).exists()).toBe(true)
      expect(beat.asked).toBe(0)
    })

    it('touches only the thank-you that was answered', async () => {
      mountTile([thanks(1), thanks(2)])

      await press(2)

      expect(choiceOf(1).exists()).toBe(true)
      expect(lineOf(2).exists()).toBe(true)
    })

    it('keeps "Reply" after the tap, and leaves "Later" to the line’s "Not now"', async () => {
      mountTile([thanks(1)])
      expect(itemOf(1).find('[data-test="thanks-arrival-later"]').exists()).toBe(true)

      await press(1)

      expect(itemOf(1).find('[data-test="thanks-arrival-answer"]').exists()).toBe(true)
      expect(itemOf(1).find('[data-test="thanks-arrival-later"]').exists()).toBe(false)
    })

    // "Dank weitergeben?" is asked once a thank-you: answered in the booking row already, it is
    // not asked again here -- the thank-you is answered, and leaves.
    it('asks nothing a second time where the line was answered in the booking row', async () => {
      window.localStorage.setItem('thanks-nudge:member-1:pass-on:1', '1')
      mountTile([thanks(1), thanks(2)])

      await press(1)

      expect(itemIds()).toEqual([2])
    })

    it('takes a thank-you out that was answered somewhere else meanwhile', async () => {
      mountTile([thanks(1), thanks(2)])

      // In a conversation opened over the overview: the same rule, said to every place.
      await reactToTransaction({ mutate: server.mutate }, thanks(2), HEART)
      await flushPromises()

      expect(itemIds()).toEqual([1])
    })
  })

  describe('the line after it', () => {
    it('"Thank someone" opens the send form with nobody named', async () => {
      mountTile([thanks(1)])
      await press(1)

      await lineOf(1).find('[data-test="thanks-nudge-yes"]').trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.fullPath).toBe('/send?art=send')
    })

    it('"Thank someone" leaves the booking row quiet about it: the same key on this device', async () => {
      mountTile([thanks(1)])
      await press(1)

      await lineOf(1).find('[data-test="thanks-nudge-yes"]').trigger('click')
      await flushPromises()

      expect(rowAsks(1)).toBe(true)
    })

    it('"Not now" leaves the booking row quiet about it, and the thank-you leaves the tile', async () => {
      mountTile([thanks(1), thanks(2)])
      await press(1)

      await lineOf(1).find('[data-test="thanks-nudge-no"]').trigger('click')
      await flushPromises()

      expect(rowAsks(1)).toBe(true)
      expect(itemIds()).toEqual([2])
      expect(router.currentRoute.value.fullPath).toBe('/overview')
    })
  })

  describe('the two quiet ways', () => {
    it('"Reply" opens the conversation with the giver, by the address of a mail’s reply button', async () => {
      mountTile([thanks(1)])

      await itemOf(1).find('[data-test="thanks-arrival-answer"]').trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/contacts')
      expect(router.currentRoute.value.query).toEqual({ with: 'giver-1', community: 'home-uuid' })
    })

    it('"Reply" names the person alone where no community came with them', async () => {
      mountTile([thanks(1, { linkedUser: { ...thanks(1).linkedUser, communityUuid: null } })])

      await itemOf(1).find('[data-test="thanks-arrival-answer"]').trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.query).toEqual({ with: 'giver-1' })
    })

    it('"Later" puts the thank-you aside on this device and takes it out of the tile', async () => {
      mountTile([thanks(1), thanks(2)])

      await itemOf(1).find('[data-test="thanks-arrival-later"]').trigger('click')
      await flushPromises()

      expect(window.localStorage.getItem('thanks-nudge:member-1:arrival:1')).toBe('1')
      expect(itemIds()).toEqual([2])
    })

    // The booking row keeps both its choice and its line: "Later" is the tile's alone.
    it('"Later" leaves the booking row as it is', async () => {
      mountTile([thanks(1)])

      await itemOf(1).find('[data-test="thanks-arrival-later"]').trigger('click')
      await flushPromises()

      expect(rowAsks(1)).toBe(false)
      expect(server.mutate).not.toHaveBeenCalled()
    })

    it('goes altogether when the last thank-you has left', async () => {
      mountTile([thanks(1)])

      await itemOf(1).find('[data-test="thanks-arrival-later"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-test="thanks-arrival-tile"]').exists()).toBe(false)
    })
  })

  describe('the keyboard', () => {
    it('goes on to "Thank someone" after the tap', async () => {
      mountTile([thanks(1)])
      quickOf(1, HEART).element.focus()

      await press(1)

      expect(document.activeElement?.getAttribute('data-test')).toBe('thanks-nudge-yes')
    })

    it('goes on to the next thank-you when one leaves', async () => {
      mountTile([thanks(1), thanks(2)])
      const later = itemOf(1).find('[data-test="thanks-arrival-later"]')
      later.element.focus()

      await later.trigger('click')
      await flushPromises()

      expect(itemOf(2).element.contains(document.activeElement)).toBe(true)
    })
  })

  // Signing out empties the store while the overview still stands.
  it('shows nothing once the member it was painted for has gone', async () => {
    mountTile([thanks(1)])

    useWalletStore(store).setGradidoID(null)
    await flushPromises()

    expect(wrapper.find('[data-test="thanks-arrival-tile"]').exists()).toBe(false)
  })
})
