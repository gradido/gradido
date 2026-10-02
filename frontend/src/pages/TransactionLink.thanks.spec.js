// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createStore } from 'vuex'
import i18n from '@/i18n'
import CONFIG from '@/config'
import TransactionLink from './TransactionLink.vue'
import RedeemThanks from '@/components/LinkInformations/RedeemThanks.vue'

/**
 * The redeem page and the three kinds of link that share its route: a member's redeem link is
 * received as a thank-you (RedeemThanks), a contribution link (`CL-...`) and a link that came
 * over from another community keep the page they had.
 *
 * The view is the real one here, with the wallet's own vue-i18n and a real router. The page
 * leaves for the overview by itself once a thank-you is booked, and a router that only records
 * a `push` would not take the page away.
 *
 * The answers of the server are stand-ins, keyed by the document that asks: the page holds two
 * mutations, and a stand-in that answered both alike could not tell which one the page sent.
 */
const apollo = vi.hoisted(() => ({ answer: null, redeem: null, disburse: null }))
const toasts = vi.hoisted(() => ({ toastError: null, toastSuccess: null }))

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue')
  const { queryTransactionLink } = await import('@/graphql/queries')
  const { redeemTransactionLink, disburseTransactionLink } = await import('@/graphql/mutations')
  return {
    useQuery: (document) => {
      if (document !== queryTransactionLink) throw new Error('a query this test does not know')
      return {
        result: ref(apollo.answer ? { queryTransactionLink: apollo.answer } : null),
        onResult: (run) => run(),
        onError: () => {},
      }
    },
    useMutation: (document) => {
      if (document === redeemTransactionLink) return { mutate: (...args) => apollo.redeem(...args) }
      if (document === disburseTransactionLink) {
        return { mutate: (...args) => apollo.disburse(...args) }
      }
      throw new Error('a mutation this test does not know')
    },
  }
})

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: (...args) => toasts.toastError(...args),
    toastSuccess: (...args) => toasts.toastSuccess(...args),
  }),
}))

vi.mock('@/config', () => ({
  default: {
    CROSS_TX_REDEEM_LINK_ACTIVE: false,
    COMMUNITY_NAME: 'KI Playground',
    COMMUNITY_URL: 'https://ki-playground.gradido.net',
  },
}))

const CODE = 'c0ffee1234567890abcdef12'
const SENDER = '76378cbb-5a5c-4e4b-9a3b-1f2d3c4b5a69'
const ME = '0b2f6e11-2c3d-4e5f-8a9b-0c1d2e3f4a5b'
const HOME = {
  __typename: 'Community',
  foreign: false,
  name: 'KI Playground',
  description: '',
  url: 'https://ki-playground.gradido.net/api',
  uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
}
const ELSEWHERE = {
  __typename: 'Community',
  foreign: true,
  name: 'Gradido Wien',
  description: '',
  url: 'https://wien.example/api',
  uuid: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
}

const memberLink = (overrides = {}) => ({
  __typename: 'TransactionLink',
  id: 7,
  amount: '20',
  memo: 'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
  createdAt: '2099-06-28T09:30:00.000Z',
  validUntil: '2099-07-12T09:30:00.000Z',
  redeemedAt: null,
  deletedAt: null,
  senderUser: { __typename: 'User', gradidoID: SENDER, alias: 'Oma-Emma', publisherId: null },
  communities: [HOME],
  ...overrides,
})

const contributionLink = (overrides = {}) => ({
  __typename: 'ContributionLink',
  id: 3,
  validTo: null,
  validFrom: '2026-01-01T00:00:00.000Z',
  amount: '100',
  name: 'Startguthaben',
  memo: 'Willkommen bei Gradido',
  cycle: 'ONCE',
  createdAt: '2026-01-01T00:00:00.000Z',
  code: 'abc123',
  link: 'https://ki-playground.gradido.net/redeem/CL-abc123',
  deletedAt: null,
  maxAmountPerMonth: null,
  ...overrides,
})

const linkFromElsewhere = (overrides = {}) => ({
  __typename: 'RedeemJwtLink',
  amount: '20',
  memo: 'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
  code: 'jwt.from.elsewhere',
  validUntil: '2099-07-12T09:30:00.000Z',
  senderCommunity: ELSEWHERE,
  senderUser: { __typename: 'User', gradidoID: SENDER, alias: 'Oma-Emma' },
  recipientCommunity: HOME,
  recipientUser: null,
  ...overrides,
})

const OLD_BLOCKS = [
  'RedeemLoggedOut',
  'RedeemSelectCommunity',
  'RedeemSelfCreator',
  'RedeemValid',
  'RedeemedTextBox',
]

const signedOut = { token: null, tokenTime: null, gradidoID: null, firstName: null, alias: null }
const signedInAs = (gradidoID) => ({
  token: 'token',
  tokenTime: Math.floor(Date.now() / 1000) + 600,
  gradidoID,
  firstName: 'Sarah',
  alias: 'Sarah-S',
})

const shell = { template: '<router-view />' }
const elsewhere = (name) => ({ template: `<div data-test="page-${name}" />` })

/** The page, reached the way it is reached: under its route, inside a router-view. */
const open = async (answer, { session = signedOut, code = CODE } = {}) => {
  apollo.answer = answer
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { name: 'Redeem', path: '/redeem/:code', component: TransactionLink },
      { name: 'Login', path: '/login/:code?', component: elsewhere('login') },
      { name: 'Register', path: '/register/:code?', component: elsewhere('register') },
      { path: '/overview', component: elsewhere('overview') },
      { path: '/transactions', component: elsewhere('transactions') },
    ],
  })
  await router.push(`/redeem/${code}`)
  await router.isReady()
  const wrapper = mount(shell, {
    global: {
      plugins: [i18n, router, createStore({ state: { ...session } })],
      stubs: {
        AuthTriads: true,
        ...Object.fromEntries(OLD_BLOCKS.map((name) => [name, true])),
      },
    },
  })
  await flushPromises()
  return { wrapper, router }
}

const thanks = (wrapper) => wrapper.findComponent(RedeemThanks)
const oldBlocks = (wrapper) => OLD_BLOCKS.filter((name) => wrapper.findComponent({ name }).exists())
const accept = (wrapper) => wrapper.find('[data-test="redeem-thanks-accept"]')

/** A promise the test settles when it wants to: the booking while it is on its way. */
const underway = () => {
  let settle
  const answer = new Promise((resolve, reject) => {
    settle = { resolve, reject }
  })
  return { answer, ...settle }
}

describe('TransactionLink: a member’s redeem link is received as a thank-you', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'de'
    CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE = false
    apollo.redeem = vi.fn().mockResolvedValue({ data: { redeemTransactionLink: true } })
    apollo.disburse = vi.fn().mockResolvedValue({ data: { disburseTransactionLink: true } })
    toasts.toastError = vi.fn()
    toasts.toastSuccess = vi.fn()
  })

  describe('which page a link gets', () => {
    it('gives a member’s link the new view, and none of the old blocks', async () => {
      const { wrapper } = await open(memberLink())

      expect(thanks(wrapper).exists()).toBe(true)
      expect(oldBlocks(wrapper)).toEqual([])
    })

    it('keeps the triads above it, first on the page', async () => {
      const { wrapper } = await open(memberLink())
      const page = wrapper.find('.show-transaction-link-informations')

      expect(page.element.firstElementChild.tagName).toBe('AUTH-TRIADS-STUB')
      expect(page.element.lastElementChild.contains(thanks(wrapper).element)).toBe(true)
    })

    it('gives a contribution link the page it had', async () => {
      const { wrapper } = await open(contributionLink(), { code: 'CL-abc123' })

      expect(thanks(wrapper).exists()).toBe(false)
      expect(oldBlocks(wrapper)).toEqual(['RedeemLoggedOut'])
    })

    it('gives a link from another community the page it had', async () => {
      const { wrapper } = await open(linkFromElsewhere(), { code: 'jwt.from.elsewhere' })

      expect(thanks(wrapper).exists()).toBe(false)
      expect(oldBlocks(wrapper)).toEqual(['RedeemLoggedOut'])
    })

    // Where redeeming across communities is switched on, the two other kinds still open with
    // the choice of community -- only the member's link has moved it.
    it('keeps the choice of community on the page of the two other kinds', async () => {
      CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE = true

      const contribution = await open(contributionLink(), { code: 'CL-abc123' })
      expect(thanks(contribution.wrapper).exists()).toBe(false)
      expect(oldBlocks(contribution.wrapper)).toEqual(['RedeemSelectCommunity'])

      const border = await open(linkFromElsewhere(), { code: 'jwt.from.elsewhere' })
      expect(thanks(border.wrapper).exists()).toBe(false)
      expect(oldBlocks(border.wrapper)).toEqual(['RedeemSelectCommunity'])
    })

    it('shows nothing of either before the link is there', async () => {
      const { wrapper } = await open(null)

      expect(thanks(wrapper).exists()).toBe(false)
      expect(oldBlocks(wrapper)).toEqual([])
    })
  })

  describe('the state the view is given', () => {
    it('is the guest’s for somebody who is not signed in', async () => {
      const { wrapper } = await open(memberLink())

      expect(thanks(wrapper).props('state')).toBe('LOGGED_OUT')
      expect(thanks(wrapper).props('linkData')).toMatchObject({ amount: '20', id: 7 })
    })

    it('is the guest’s where redeeming across communities is switched on, too', async () => {
      CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE = true
      const { wrapper } = await open(memberLink())

      expect(thanks(wrapper).props('state')).toBe('REDEEM_SELECT_COMMUNITY')
    })

    it('is the member’s for somebody signed in', async () => {
      const { wrapper } = await open(memberLink(), { session: signedInAs(ME) })

      expect(thanks(wrapper).props('state')).toBe('VALID')
    })

    it('is the sender’s for the member who made the link', async () => {
      const { wrapper } = await open(memberLink(), { session: signedInAs(SENDER) })

      expect(thanks(wrapper).props('state')).toBe('SELF_CREATOR')
    })

    it.each([
      ['accepted', { redeemedAt: '2026-07-01T10:08:43.000Z' }, 'TEXT_REDEEMED'],
      ['run out', { validUntil: '2026-07-12T09:30:00.000Z' }, 'TEXT_EXPIRED'],
      ['deleted', { deletedAt: '2026-07-03T14:30:00.000Z' }, 'TEXT_DELETED'],
    ])('is "%s" for a link opened later, signed in or not', async (_, fields, state) => {
      const guest = await open(memberLink(fields))
      expect(thanks(guest.wrapper).props('state')).toBe(state)

      const member = await open(memberLink(fields), { session: signedInAs(ME) })
      expect(thanks(member.wrapper).props('state')).toBe(state)
    })

    // The page asked "run out?" before "taken?", and a thank-you accepted on its second day
    // read "run out" from its fifteenth. Harmless with the old words; the new ones say that a
    // run-out thank-you went back to its sender, which this one did not.
    it('is "accepted", not "run out", for a thank-you taken and past its last day', async () => {
      const { wrapper } = await open(
        memberLink({
          createdAt: '2026-06-28T09:30:00.000Z',
          validUntil: '2026-07-12T09:30:00.000Z',
          redeemedAt: '2026-06-29T10:08:43.000Z',
        }),
      )

      expect(thanks(wrapper).props('state')).toBe('TEXT_REDEEMED')
      expect(wrapper.text()).toContain('Dieser Dank ist angenommen.')
      expect(wrapper.text()).not.toContain('zurückgekehrt')
    })
  })

  describe('a member accepts', () => {
    it('books the link, says so in the new words and goes to the overview', async () => {
      const { wrapper, router } = await open(memberLink(), { session: signedInAs(ME) })

      await accept(wrapper).trigger('click')
      await flushPromises()

      expect(apollo.redeem).toHaveBeenCalledTimes(1)
      expect(apollo.redeem).toHaveBeenCalledWith({ code: CODE })
      expect(apollo.disburse).not.toHaveBeenCalled()
      expect(toasts.toastSuccess).toHaveBeenCalledTimes(1)
      expect(toasts.toastSuccess).toHaveBeenCalledWith(
        'Dank angenommen. 20 GDD stehen jetzt auf Deinem Konto.',
      )
      expect(toasts.toastError).not.toHaveBeenCalled()
      expect(router.currentRoute.value.path).toBe('/overview')
      // The page is gone with the navigation, not only told to go.
      expect(wrapper.find('[data-test="page-overview"]').exists()).toBe(true)
      expect(thanks(wrapper).exists()).toBe(false)
    })

    it('keeps the button locked while the booking is on its way', async () => {
      const booking = underway()
      apollo.redeem = vi.fn(() => booking.answer)
      const { wrapper, router } = await open(memberLink(), { session: signedInAs(ME) })

      expect(accept(wrapper).element.disabled).toBe(false)

      await accept(wrapper).trigger('click')

      expect(accept(wrapper).element.disabled).toBe(true)
      expect(router.currentRoute.value.path).toBe(`/redeem/${CODE}`)

      await accept(wrapper).trigger('click')
      expect(apollo.redeem).toHaveBeenCalledTimes(1)

      booking.resolve({ data: { redeemTransactionLink: true } })
      await flushPromises()

      expect(apollo.redeem).toHaveBeenCalledTimes(1)
      expect(toasts.toastSuccess).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.path).toBe('/overview')
    })

    // Two taps in one go, before the page has drawn the locked button: the page itself asks
    // once. Before, a double tap on "redeem" sent the request twice.
    it('sends one request for a double tap', async () => {
      const booking = underway()
      apollo.redeem = vi.fn(() => booking.answer)
      const { wrapper } = await open(memberLink(), { session: signedInAs(ME) })

      const button = accept(wrapper).element
      button.click()
      button.click()
      await flushPromises()

      expect(apollo.redeem).toHaveBeenCalledTimes(1)

      booking.resolve({ data: { redeemTransactionLink: true } })
      await flushPromises()

      expect(toasts.toastSuccess).toHaveBeenCalledTimes(1)
    })

    // The page leaves for the overview after a booking, so the lock never has to open. Where
    // the wallet does not get away -- a navigation that is turned back -- the button must not
    // stay locked for good.
    it('opens the button again where the wallet stayed on the page', async () => {
      const { wrapper, router } = await open(memberLink(), { session: signedInAs(ME) })
      router.beforeEach((to) => to.path !== '/overview')

      await accept(wrapper).trigger('click')
      await flushPromises()

      expect(apollo.redeem).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.path).toBe(`/redeem/${CODE}`)
      expect(accept(wrapper).element.disabled).toBe(false)
    })

    it('says what went wrong where the booking fails, and goes to the overview as before', async () => {
      apollo.redeem = vi.fn().mockRejectedValue(new Error('Transaction link already redeemed'))
      const { wrapper, router } = await open(memberLink(), { session: signedInAs(ME) })

      await accept(wrapper).trigger('click')
      await flushPromises()

      expect(toasts.toastError).toHaveBeenCalledWith('Transaction link already redeemed')
      expect(toasts.toastSuccess).not.toHaveBeenCalled()
      expect(router.currentRoute.value.path).toBe('/overview')
    })
  })

  // "Accept" for a guest and "I already have an account" are links, and they lead where the
  // old page's two buttons led: the way itself has not changed.
  describe('a guest goes on', () => {
    it('reaches the registration with the code', async () => {
      const { wrapper, router } = await open(memberLink())

      await accept(wrapper).trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.name).toBe('Register')
      expect(router.currentRoute.value.params.code).toBe(CODE)
      expect(apollo.redeem).not.toHaveBeenCalled()
    })

    it('reaches the sign-in with the code', async () => {
      const { wrapper, router } = await open(memberLink())

      await wrapper.find('[data-test="redeem-thanks-have-account"]').trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.name).toBe('Login')
      expect(router.currentRoute.value.params.code).toBe(CODE)
    })
  })

  describe('the two other kinds of link keep their words', () => {
    // A signed-in member who opens a contribution link is credited at once, as before.
    it('says "redeemed" for a contribution link', async () => {
      const { router } = await open(contributionLink(), {
        code: 'CL-abc123',
        session: signedInAs(ME),
      })
      await flushPromises()

      expect(apollo.redeem).toHaveBeenCalledWith({ code: 'CL-abc123' })
      expect(toasts.toastSuccess).toHaveBeenCalledTimes(1)
      expect(toasts.toastSuccess).toHaveBeenCalledWith(
        'Erfolgreich eingelöst! Deinem Konto wurden 100 GDD gutgeschrieben.',
      )
      expect(router.currentRoute.value.path).toBe('/overview')
    })

    it('books a link from another community from its old block, with its old words', async () => {
      const { wrapper, router } = await open(linkFromElsewhere(), {
        code: 'jwt.from.elsewhere',
        session: signedInAs(ME),
      })

      expect(thanks(wrapper).exists()).toBe(false)
      expect(oldBlocks(wrapper)).toEqual(['RedeemValid'])

      wrapper.findComponent({ name: 'RedeemValid' }).vm.$emit('mutation-link', '20')
      await flushPromises()

      expect(apollo.disburse).toHaveBeenCalledTimes(1)
      expect(apollo.disburse).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'jwt.from.elsewhere', recipientGradidoId: ME }),
      )
      expect(apollo.redeem).not.toHaveBeenCalled()
      expect(toasts.toastSuccess).toHaveBeenCalledTimes(1)
      expect(toasts.toastSuccess.mock.calls[0][0]).toContain('20 GDD')
      expect(toasts.toastSuccess.mock.calls[0][0]).not.toContain('Dank angenommen')
      expect(router.currentRoute.value.path).toBe('/overview')
    })

    it('shows a link from another community that ran out in the old box', async () => {
      const { wrapper } = await open(
        linkFromElsewhere({ validUntil: '2026-07-12T09:30:00.000Z' }),
        { code: 'jwt.from.elsewhere' },
      )

      expect(thanks(wrapper).exists()).toBe(false)
      expect(oldBlocks(wrapper)).toEqual(['RedeemedTextBox'])
      expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).props('text')).toContain(
        'Der Link ist nicht mehr gültig.',
      )
    })
  })
})
