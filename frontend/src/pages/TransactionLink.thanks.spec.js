// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createStore } from 'vuex'
import {
  BButton,
  BCol,
  BDropdown,
  BDropdownItem,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BRow,
} from 'bootstrap-vue-next'
import i18n from '@/i18n'
import CONFIG from '@/config'
import { loadAllRules } from '@/validation-rules'
import TransactionLink from './TransactionLink.vue'
import RedeemThanks from '@/components/LinkInformations/RedeemThanks.vue'
import RedeemThanksAccount from '@/components/LinkInformations/RedeemThanksAccount.vue'
import RedeemThanksPaper from '@/components/LinkInformations/RedeemThanksPaper.vue'

/**
 * The redeem page and the three kinds of link that share its route: a member's redeem link is
 * received as a thank-you (RedeemThanks), a contribution link (`CL-...`) and a link that came
 * over from another community keep the page they had.
 *
 * The view is the real one here, with the wallet's own vue-i18n, a real router and a store
 * that signs a member in. Since an account can be opened on the page (ZE-017 F5) the page
 * runs a chain -- open the account, sign in, book -- and the form the chain starts from is the
 * real one too: what the page sends is what was typed.
 *
 * The answers of the server are stand-ins, keyed by the document that asks: the page holds
 * several mutations, and a stand-in that answered all alike could not tell which one the page
 * sent.
 */
const apollo = vi.hoisted(() => ({
  answer: null,
  communities: [],
  redeem: null,
  disburse: null,
  createRedeemJwt: null,
  createUser: null,
  login: null,
  updateUserInfos: null,
  refetch: null,
}))
const toasts = vi.hoisted(() => ({ toastError: null, toastSuccess: null }))
const cache = vi.hoisted(() => ({ clear: null }))

vi.mock('@/plugins/apolloCache', () => ({
  clearApolloCache: (...args) => cache.clear(...args),
}))

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue')
  const { queryTransactionLink } = await import('@/graphql/queries')
  const { reachableCommunities } = await import('@/graphql/communities.graphql')
  const {
    redeemTransactionLink,
    disburseTransactionLink,
    createRedeemJwtMutation,
    createUser,
    login,
    updateUserInfos,
  } = await import('@/graphql/mutations')
  return {
    useQuery: (document) => {
      if (document === reachableCommunities) {
        return {
          onResult: (run) => {
            Promise.resolve().then(() =>
              run({ data: { reachableCommunities: apollo.communities } }),
            )
          },
        }
      }
      if (document !== queryTransactionLink) throw new Error('a query this test does not know')
      return {
        result: ref(apollo.answer ? { queryTransactionLink: apollo.answer } : null),
        onResult: (run) => run(),
        onError: () => {},
        refetch: (...args) => apollo.refetch(...args),
      }
    },
    useMutation: (document) => {
      if (document === redeemTransactionLink) return { mutate: (...args) => apollo.redeem(...args) }
      if (document === disburseTransactionLink) {
        return { mutate: (...args) => apollo.disburse(...args) }
      }
      if (document === createRedeemJwtMutation) {
        return { mutate: (...args) => apollo.createRedeemJwt(...args) }
      }
      if (document === createUser) return { mutate: (...args) => apollo.createUser(...args) }
      if (document === login) return { mutate: (...args) => apollo.login(...args) }
      if (document === updateUserInfos) {
        return { mutate: (...args) => apollo.updateUserInfos(...args) }
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
    // The server the wallet talks to: the photo of a greeting is fetched from it.
    GRAPHQL_URI: 'https://ki-playground.gradido.net/graphql',
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

const greetingLink = (overrides = {}) =>
  memberLink({
    memo: 'Einfach so — weil es Dich gibt.\nLiebe Sarah, mit Eurem iPad hat alles angefangen.',
    greeting: {
      __typename: 'ThankYouGreeting',
      motif: 'morning-light',
      line: 'Einfach so — weil es Dich gibt.',
      recipientName: 'Sarah',
    },
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

// What the form is sent with, and the member the server signs in for it.
const PASSWORD = 'Aa12345_'
const TYPED = {
  firstName: 'Sarah',
  lastName: 'Bernard',
  email: 'sarah@provence.fr',
  password: PASSWORD,
}
const NEW_MEMBER = {
  __typename: 'User',
  gradidoID: ME,
  firstName: 'Sarah',
  lastName: 'Bernard',
  alias: null,
  language: 'de',
}

// The server answered, and refused -- as Apollo hands such an answer on.
const refused = (message) => Object.assign(new Error(message), { graphQLErrors: [{ message }] })
// No answer at all: the request did not get through.
const offline = () =>
  Object.assign(new Error('Failed to fetch'), {
    graphQLErrors: [],
    networkError: new TypeError('Failed to fetch'),
  })

const OLD_BLOCKS = [
  'RedeemLoggedOut',
  'RedeemSelectCommunity',
  'RedeemSelfCreator',
  'RedeemValid',
  'RedeemedTextBox',
]

const signedOut = { token: null, tokenTime: null, gradidoID: null, firstName: null, alias: null }

/**
 * A store that signs a member in as the wallet's does, as far as the page reads it: the token
 * and who it is. The rest of the session is what the registration form sends along.
 */
const newStore = (session) =>
  createStore({
    state: {
      language: 'de',
      publisherId: 2896,
      project: null,
      preLoginLanguage: null,
      email: null,
      ...session,
    },
    mutations: {
      email: (state, email) => {
        state.email = email
      },
      member: (state, member) => Object.assign(state, member),
    },
    actions: {
      login: ({ commit }, user) =>
        commit('member', {
          token: 'token-of-the-new-session',
          tokenTime: Math.floor(Date.now() / 1000) + 600,
          gradidoID: user.gradidoID,
          firstName: user.firstName,
          alias: user.alias,
          language: user.language,
        }),
    },
  })
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
      { path: '/contacts', component: elsewhere('contacts') },
    ],
  })
  await router.push(`/redeem/${code}`)
  await router.isReady()
  const store = newStore(session)
  const wrapper = mount(shell, {
    global: {
      plugins: [i18n, router, store],
      // The switch of communities and the fields of the form name their Bootstrap parts
      // without importing them.
      components: {
        BButton,
        BCol,
        BDropdown,
        BDropdownItem,
        BFormGroup,
        BFormInput,
        BFormInvalidFeedback,
        BRow,
      },
      stubs: {
        AuthTriads: true,
        IBiEye: true,
        IBiEyeSlash: true,
        ...Object.fromEntries(OLD_BLOCKS.map((name) => [name, true])),
      },
    },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await flushPromises()
  return { wrapper, router, store }
}
const mounted = []

const thanks = (wrapper) => wrapper.findComponent(RedeemThanks)
const oldBlocks = (wrapper) => OLD_BLOCKS.filter((name) => wrapper.findComponent({ name }).exists())
const accept = (wrapper) => wrapper.find('[data-test="redeem-thanks-accept"]')
const title = (wrapper) => wrapper.find('[data-test="redeem-thanks-title"]')
const text = (wrapper) => wrapper.find('[data-test="redeem-thanks-text"]')
const form = (wrapper) => wrapper.findComponent(RedeemThanksAccount)
const formButton = (wrapper) => wrapper.find('[data-test="redeem-thanks-open-account"]')

/** A promise the test settles when it wants to: the booking while it is on its way. */
const underway = () => {
  let settle
  const answer = new Promise((resolve, reject) => {
    settle = { resolve, reject }
  })
  return { answer, ...settle }
}

/** A greeting that carries a photo of the sender's own in the place of a motif (ZE-019). */
const photoLink = (overrides = {}) =>
  greetingLink({
    greeting: {
      __typename: 'ThankYouGreeting',
      motif: null,
      line: 'Einfach so — weil es Dich gibt.',
      recipientName: 'Sarah',
      hasPicture: true,
    },
    ...overrides,
  })
/** Where the server serves the photo of the open link, and what the page makes of the answer. */
const PHOTO_URL = `https://ki-playground.gradido.net/api/thank-you-greeting-picture/${CODE}`
const PHOTO_ADDRESS = 'blob:photo-of-the-link'
/** The server serves the photo -- or, with `ok: false`, its one empty answer. */
const servesPhoto = ({ ok = true } = {}) => {
  const fetched = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    blob: () => Promise.resolve(new Blob(ok ? ['JPEG'] : [], { type: ok ? 'image/jpeg' : '' })),
  })
  vi.stubGlobal('fetch', fetched)
  return fetched
}

describe('TransactionLink: a member’s redeem link is received as a thank-you', () => {
  // The fields of the form an account is opened with check themselves by the wallet's rules.
  beforeAll(() => {
    loadAllRules(i18n.global)
  })

  beforeEach(() => {
    i18n.global.locale.value = 'de'
    CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE = false
    apollo.communities = [HOME, ELSEWHERE]
    apollo.redeem = vi.fn().mockResolvedValue({ data: { redeemTransactionLink: true } })
    apollo.disburse = vi.fn().mockResolvedValue({ data: { disburseTransactionLink: true } })
    apollo.createRedeemJwt = vi.fn().mockResolvedValue({ data: { createRedeemJwt: 'signed.jwt' } })
    apollo.createUser = vi.fn().mockResolvedValue({ data: { createUser: { id: 1 } } })
    apollo.login = vi.fn().mockResolvedValue({ data: { login: NEW_MEMBER } })
    apollo.updateUserInfos = vi.fn().mockResolvedValue({ data: { updateUserInfos: true } })
    apollo.refetch = vi.fn().mockResolvedValue({ data: { queryTransactionLink: memberLink() } })
    cache.clear = vi.fn().mockResolvedValue()
    toasts.toastError = vi.fn()
    toasts.toastSuccess = vi.fn()
    // jsdom makes no addresses of blobs.
    URL.createObjectURL = vi.fn(() => PHOTO_ADDRESS)
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.unstubAllGlobals()
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

  // F16: a member reads where the thank-you is now on the page itself, as somebody new does.
  // The message and the jump to the overview that slice 1 had are gone for a member's link.
  describe('a member accepts', () => {
    it('books the link and says "Dein Dank ist da." on the page', async () => {
      const { wrapper, router } = await open(memberLink(), { session: signedInAs(ME) })

      await accept(wrapper).trigger('click')
      await flushPromises()

      expect(apollo.redeem).toHaveBeenCalledTimes(1)
      expect(apollo.redeem).toHaveBeenCalledWith({ code: CODE })
      expect(apollo.disburse).not.toHaveBeenCalled()
      expect(thanks(wrapper).props('stage')).toBe('arrived')
      expect(title(wrapper).text()).toBe('Dein Dank ist da.')
      expect(text(wrapper).text()).toBe('Du hast jetzt 20 Gradido von Oma-Emma auf Deinem Konto.')
      expect(toasts.toastSuccess).not.toHaveBeenCalled()
      expect(toasts.toastError).not.toHaveBeenCalled()
      expect(router.currentRoute.value.path).toBe(`/redeem/${CODE}`)
      expect(accept(wrapper).exists()).toBe(false)
    })

    it('offers the answer and the way to the account from there', async () => {
      const { wrapper, router } = await open(memberLink(), { session: signedInAs(ME) })
      await accept(wrapper).trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-test="redeem-thanks-answer"]').attributes('href')).toBe(
        `/contacts?with=${SENDER}`,
      )

      await wrapper.find('[data-test="redeem-thanks-to-account"]').trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/overview')
      expect(wrapper.find('[data-test="page-overview"]').exists()).toBe(true)
    })

    it('shows the greeting in short where the link carried one', async () => {
      const { wrapper } = await open(greetingLink(), { session: signedInAs(ME) })
      await accept(wrapper).trigger('click')
      await flushPromises()

      const paper = wrapper.findComponent(RedeemThanksPaper)
      expect(paper.props('short')).toBe(true)
      expect(paper.text()).toBe('FÜR SARAHEinfach so — weil es Dich gibt.')
    })

    // The members signed in to nothing new: none of the chain's other steps runs for them.
    it('opens no account and signs nobody in', async () => {
      const { wrapper } = await open(memberLink(), { session: signedInAs(ME) })
      await accept(wrapper).trigger('click')
      await flushPromises()

      expect(apollo.createUser).not.toHaveBeenCalled()
      expect(apollo.login).not.toHaveBeenCalled()
      expect(cache.clear).not.toHaveBeenCalled()
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
      expect(title(wrapper).text()).toBe('Dein Dank ist da.')
      expect(router.currentRoute.value.path).toBe(`/redeem/${CODE}`)
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

      expect(apollo.redeem).toHaveBeenCalledTimes(1)
      expect(title(wrapper).text()).toBe('Dein Dank ist da.')
    })

    // The page leaves for the overview where a booking failed. Where the wallet does not get
    // away -- a navigation that is turned back -- the button must not stay locked for good.
    it('opens the button again where the booking failed and the wallet stayed on the page', async () => {
      apollo.redeem = vi.fn().mockRejectedValue(new Error('Transaction link already redeemed'))
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
      expect(thanks(wrapper).exists()).toBe(false)
      expect(router.currentRoute.value.path).toBe('/overview')
    })
  })

  // "I already have an account" is a link, and it leads where the old page's button led. The
  // other way, for somebody without one, stays on the page (below).
  describe('a guest goes on', () => {
    it('stays on the page with "accept": the form opens, and nothing is asked yet', async () => {
      const { wrapper, router } = await open(memberLink())

      await accept(wrapper).trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.name).toBe('Redeem')
      expect(router.currentRoute.value.params.code).toBe(CODE)
      expect(form(wrapper).exists()).toBe(true)
      expect(apollo.createUser).not.toHaveBeenCalled()
      expect(apollo.login).not.toHaveBeenCalled()
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

  // ZE-020, F13: where redeeming across communities is switched on, the choice of community
  // stands behind "I already have an account" -- and goes the way the old page went.
  describe('a guest whose account is in another community', () => {
    it('is taken there with a token for the code of the address', async () => {
      const place = { href: `https://ki-playground.gradido.net/redeem/${CODE}` }
      vi.stubGlobal('location', place)
      CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE = true
      const { wrapper } = await open(memberLink({ communities: [HOME, ELSEWHERE] }))

      await wrapper.find('[data-test="redeem-thanks-have-account"]').trigger('click')
      await flushPromises()
      await wrapper
        .findAll('.dropdown-item')
        .find((entry) => entry.text() === 'Gradido Wien')
        .trigger('click')
      await flushPromises()
      await wrapper.find('[data-test="redeem-thanks-forward"]').trigger('click')
      await flushPromises()

      expect(apollo.createRedeemJwt).toHaveBeenCalledTimes(1)
      expect(apollo.createRedeemJwt).toHaveBeenCalledWith(
        expect.objectContaining({
          code: CODE,
          gradidoId: SENDER,
          senderCommunityUuid: HOME.uuid,
          recipientCommunityUuid: ELSEWHERE.uuid,
        }),
      )
      expect(place.href).toBe('https://wien.example/redeem/signed.jwt')
    })
  })

  // ZE-017 F5: whoever accepts a thank-you and has no account opens it right here. One tap,
  // three steps -- open the account, sign in as the login page does, book the thank-you.
  describe('a guest opens an account and accepts', () => {
    const fillIn = async (wrapper, typed = {}) => {
      const fields = { ...TYPED, ...typed }
      await wrapper.find('#registerFirstname').setValue(fields.firstName)
      await wrapper.find('#registerLastname').setValue(fields.lastName)
      await wrapper.find('#email-input-field').setValue(fields.email)
      await wrapper.find('#newPassword-input-field').setValue(fields.password)
      await wrapper.find('#newPasswordRepeat-input-field').setValue(fields.password)
      await wrapper.find('#registerCheckbox').setValue(true)
      await flushPromises()
    }
    const send = async (wrapper) => {
      await wrapper.find('form').trigger('submit')
      await flushPromises()
    }
    /** The page with the form open and filled in, ready to be sent. */
    const ready = async (answer = memberLink(), typed = {}) => {
      const page = await open(answer)
      await accept(page.wrapper).trigger('click')
      await flushPromises()
      await fillIn(page.wrapper, typed)
      return page
    }
    /** The order the page asked the server in. */
    const order = () => {
      const asked = []
      for (const step of ['createUser', 'login', 'redeem', 'refetch']) {
        const answer = apollo[step]
        apollo[step] = vi.fn((...args) => {
          asked.push(step)
          return answer(...args)
        })
      }
      return asked
    }

    describe('where everything goes through', () => {
      it('opens the account, signs in and books: three steps, in that order, each once', async () => {
        const asked = order()
        const { wrapper } = await ready()

        await send(wrapper)

        expect(asked).toEqual(['createUser', 'login', 'redeem'])
      })

      /**
       * A greeting with a photo: the page fetched it once for the sheet. The strip over the form
       * and "Dein Dank ist da." show that same picture -- ⛔ the address is not asked again, it
       * serves the photo no more once the thank-you is accepted.
       */
      it('keeps the photo of a greeting from the sheet to "Dein Dank ist da.", asked for once', async () => {
        const photo = servesPhoto()
        const { wrapper } = await ready(photoLink())
        expect(wrapper.find('[data-test="redeem-thanks-strip-photo"]').attributes('src')).toBe(
          PHOTO_ADDRESS,
        )

        await send(wrapper)

        expect(thanks(wrapper).props('stage')).toBe('arrived')
        expect(wrapper.find('[data-test="redeem-thanks-paper-photo"]').attributes('src')).toBe(
          PHOTO_ADDRESS,
        )
        expect(photo).toHaveBeenCalledTimes(1)
      })

      // What the registration form sends -- language and publisher among it -- and with it the
      // code of the link and the password.
      it('opens the account with what the registration form sends, the code and the password', async () => {
        const { wrapper } = await ready()

        await send(wrapper)

        expect(apollo.createUser).toHaveBeenCalledWith({
          email: 'sarah@provence.fr',
          firstName: 'Sarah',
          lastName: 'Bernard',
          language: 'de',
          publisherId: 2896,
          redeemCode: CODE,
          project: null,
          password: PASSWORD,
        })
      })

      it('signs in with the address and the password of the form', async () => {
        const { wrapper, store } = await ready()

        await send(wrapper)

        expect(apollo.login).toHaveBeenCalledWith({
          email: 'sarah@provence.fr',
          password: PASSWORD,
          publisherId: 2896,
          project: null,
        })
        expect(store.state.token).toBe('token-of-the-new-session')
        expect(store.state.gradidoID).toBe(ME)
        expect(store.state.email).toBe('sarah@provence.fr')
      })

      // As on the login page: what the previous member's queries answered is still lying in
      // the cache, and it goes before the new member stands in the store.
      it('empties the cache before the member stands in the store', async () => {
        const { wrapper, store } = await ready()
        let tokenWhenCleared = 'not asked'
        cache.clear = vi.fn(async () => {
          tokenWhenCleared = store.state.token
        })

        await send(wrapper)

        expect(cache.clear).toHaveBeenCalledTimes(1)
        expect(tokenWhenCleared).toBeNull()
      })

      it('books the link of the address', async () => {
        const { wrapper } = await ready()

        await send(wrapper)

        expect(apollo.redeem).toHaveBeenCalledWith({ code: CODE })
        expect(apollo.disburse).not.toHaveBeenCalled()
      })

      it('says "Dein Dank ist da." on the page, with the amount and who it is from', async () => {
        const { wrapper, router } = await ready()

        await send(wrapper)

        expect(thanks(wrapper).props('stage')).toBe('arrived')
        expect(title(wrapper).text()).toBe('Dein Dank ist da.')
        expect(text(wrapper).text()).toBe('Du hast jetzt 20 Gradido von Oma-Emma auf Deinem Konto.')
        expect(form(wrapper).exists()).toBe(false)
        expect(router.currentRoute.value.path).toBe(`/redeem/${CODE}`)
        expect(toasts.toastSuccess).not.toHaveBeenCalled()
        expect(toasts.toastError).not.toHaveBeenCalled()
      })

      it('shows the greeting in short, and leads on to the answer and to the account', async () => {
        const { wrapper } = await ready(greetingLink())

        await send(wrapper)

        expect(wrapper.findComponent(RedeemThanksPaper).props('short')).toBe(true)
        expect(wrapper.find('[data-test="redeem-thanks-answer"]').attributes('href')).toBe(
          `/contacts?with=${SENDER}`,
        )
        expect(wrapper.find('[data-test="redeem-thanks-to-account"]').attributes('href')).toBe(
          '/overview',
        )
      })

      // The greeting says whom it is for; the account is opened under the name the guest types.
      it('sends the first name the guest typed, not the one the greeting is for', async () => {
        const page = await open(greetingLink())
        await accept(page.wrapper).trigger('click')
        await flushPromises()

        expect(page.wrapper.find('#registerFirstname').element.value).toBe('')

        await page.wrapper.find('#registerFirstname').setValue('Sarah-Marie')
        await page.wrapper.find('#registerLastname').setValue('Bernard')
        await page.wrapper.find('#email-input-field').setValue('sarah@provence.fr')
        await page.wrapper.find('#newPassword-input-field').setValue(PASSWORD)
        await page.wrapper.find('#newPasswordRepeat-input-field').setValue(PASSWORD)
        await page.wrapper.find('#registerCheckbox').setValue(true)
        await flushPromises()
        await send(page.wrapper)

        expect(apollo.createUser).toHaveBeenCalledWith(
          expect.objectContaining({ firstName: 'Sarah-Marie', lastName: 'Bernard' }),
        )
      })

      // An address that is taken, with the password that belongs to it: the server answers
      // `createUser` as always, the sign-in goes through, and the thank-you is booked.
      it('just signs in and books for an address that had an account, with its password', async () => {
        const { wrapper } = await ready()

        await send(wrapper)

        expect(title(wrapper).text()).toBe('Dein Dank ist da.')
      })
    })

    describe('while the chain runs', () => {
      it('keeps the button locked from the first step to the last', async () => {
        const creating = underway()
        const signingIn = underway()
        const booking = underway()
        apollo.createUser = vi.fn(() => creating.answer)
        apollo.login = vi.fn(() => signingIn.answer)
        apollo.redeem = vi.fn(() => booking.answer)
        const { wrapper } = await ready()

        expect(formButton(wrapper).element.disabled).toBe(false)

        await send(wrapper)
        expect(formButton(wrapper).element.disabled).toBe(true)
        expect(apollo.login).not.toHaveBeenCalled()

        creating.resolve({ data: { createUser: { id: 1 } } })
        await flushPromises()
        expect(formButton(wrapper).element.disabled).toBe(true)
        expect(apollo.login).toHaveBeenCalledTimes(1)
        expect(apollo.redeem).not.toHaveBeenCalled()

        signingIn.resolve({ data: { login: NEW_MEMBER } })
        await flushPromises()
        expect(formButton(wrapper).element.disabled).toBe(true)
        expect(apollo.redeem).toHaveBeenCalledTimes(1)

        booking.resolve({ data: { redeemTransactionLink: true } })
        await flushPromises()
        expect(title(wrapper).text()).toBe('Dein Dank ist da.')
      })

      // Two taps in one go, before the locked button is drawn, and the Enter key on top.
      it('asks once for a double tap', async () => {
        const creating = underway()
        apollo.createUser = vi.fn(() => creating.answer)
        const { wrapper } = await ready()

        const sent = wrapper.find('form')
        sent.trigger('submit')
        sent.trigger('submit')
        sent.trigger('submit')
        await flushPromises()

        expect(apollo.createUser).toHaveBeenCalledTimes(1)

        creating.resolve({ data: { createUser: { id: 1 } } })
        await flushPromises()

        expect(apollo.createUser).toHaveBeenCalledTimes(1)
        expect(apollo.login).toHaveBeenCalledTimes(1)
        expect(apollo.redeem).toHaveBeenCalledTimes(1)
      })
    })

    // ⛔ One view for every reason, and it names none (E-017). The sign-in fails where the
    // address was taken, and where the server opened the account the way through the mail
    // (the link did not vouch): the page does not ask which.
    describe('where the sign-in is refused', () => {
      const REFUSALS = [
        'No user with this credentials',
        'The Users email is not validate yet',
        'The User has not set a password yet',
        'This user was permanently deleted. Contact support for questions',
        'Something nobody thought of',
      ]

      it.each(REFUSALS)('says "Fast geschafft", for "%s"', async (message) => {
        apollo.login = vi.fn().mockRejectedValue(refused(message))
        const { wrapper } = await ready()

        await send(wrapper)

        expect(thanks(wrapper).props('stage')).toBe('almost')
        expect(title(wrapper).text()).toBe('Fast geschafft')
        expect(form(wrapper).exists()).toBe(false)
      })

      it('shows the same view for every refusal, to the letter', async () => {
        const views = []
        for (const message of REFUSALS) {
          apollo.login = vi.fn().mockRejectedValue(refused(message))
          const { wrapper } = await ready()
          await send(wrapper)
          views.push(thanks(wrapper).html())
        }

        expect(new Set(views).size).toBe(1)
        expect(views[0]).toContain('Schau in Dein Postfach')
      })

      it('says nothing else: no message, and nothing of what the server answered', async () => {
        apollo.login = vi.fn().mockRejectedValue(refused('No user with this credentials'))
        const { wrapper } = await ready()

        await send(wrapper)

        expect(toasts.toastError).not.toHaveBeenCalled()
        expect(toasts.toastSuccess).not.toHaveBeenCalled()
        expect(wrapper.text()).not.toContain('No user')
        expect(wrapper.text()).not.toContain('sarah@provence.fr')
      })

      it('books nothing and signs nobody in', async () => {
        apollo.login = vi.fn().mockRejectedValue(refused('No user with this credentials'))
        const { wrapper, store } = await ready()

        await send(wrapper)

        expect(apollo.redeem).not.toHaveBeenCalled()
        expect(cache.clear).not.toHaveBeenCalled()
        expect(store.state.token).toBeNull()
        expect(store.state.gradidoID).toBeNull()
      })

      it('leads to the sign-in with the code, and back to the link from there', async () => {
        apollo.login = vi.fn().mockRejectedValue(refused('No user with this credentials'))
        const { wrapper, router } = await ready()
        await send(wrapper)

        await wrapper.find('[data-test="redeem-thanks-almost-sign-in"]').trigger('click')
        await flushPromises()

        expect(router.currentRoute.value.name).toBe('Login')
        expect(router.currentRoute.value.params.code).toBe(CODE)
      })

      // Before the neutral view the page asks the link again: one that is no longer open has
      // something else to say.
      it('asks the link again before it says so, once', async () => {
        const asked = order()
        apollo.login = vi.fn(() => {
          asked.push('login')
          return Promise.reject(refused('No user with this credentials'))
        })
        const { wrapper } = await ready()

        await send(wrapper)

        expect(asked).toEqual(['createUser', 'login', 'refetch'])
        expect(apollo.refetch).toHaveBeenCalledTimes(1)
      })

      it.each([
        ['accepted', { redeemedAt: '2026-07-01T10:08:43.000Z' }, 'Dieser Dank ist angenommen.'],
        [
          'run out',
          { validUntil: '2026-07-12T09:30:00.000Z' },
          'Dieser Dank hat 14 Tage gewartet.',
        ],
        ['deleted', { deletedAt: '2026-07-03T14:30:00.000Z' }, 'Diesen Dank gibt es nicht mehr.'],
      ])(
        'shows what became of a link that is %s by then, not the neutral view',
        async (_, fields, heading) => {
          apollo.login = vi.fn().mockRejectedValue(refused('No user with this credentials'))
          apollo.refetch = vi.fn().mockResolvedValue({
            data: {
              queryTransactionLink: memberLink({
                createdAt: '2026-06-28T09:30:00.000Z',
                ...fields,
              }),
            },
          })
          const { wrapper } = await ready()

          await send(wrapper)

          expect(thanks(wrapper).props('stage')).toBeNull()
          expect(title(wrapper).text()).toBe(heading)
          expect(form(wrapper).exists()).toBe(false)
        },
      )
    })

    // Signed in, but the link was accepted or ran out in the meantime: the member is in, and
    // the page shows the state of the link.
    describe('where the sign-in goes through and the booking is refused', () => {
      it('says why, stays signed in and shows what became of the link', async () => {
        apollo.redeem = vi.fn().mockRejectedValue(refused('Transaction link already redeemed'))
        apollo.refetch = vi.fn().mockResolvedValue({
          data: { queryTransactionLink: memberLink({ redeemedAt: '2026-07-01T10:08:43.000Z' }) },
        })
        const { wrapper, router, store } = await ready()

        await send(wrapper)

        expect(toasts.toastError).toHaveBeenCalledTimes(1)
        expect(toasts.toastError).toHaveBeenCalledWith('Transaction link already redeemed')
        expect(store.state.token).toBe('token-of-the-new-session')
        expect(thanks(wrapper).props('stage')).toBeNull()
        expect(title(wrapper).text()).toBe('Dieser Dank ist angenommen.')
        expect(router.currentRoute.value.path).toBe(`/redeem/${CODE}`)
        expect(apollo.refetch).toHaveBeenCalledTimes(1)
      })

      // A link that is open after all: the new member reads the sheet with the member's
      // button, and one tap books.
      it('offers a link that is still open to the member they now are', async () => {
        apollo.redeem = vi
          .fn()
          .mockRejectedValueOnce(refused('Something nobody thought of'))
          .mockResolvedValue({ data: { redeemTransactionLink: true } })
        const { wrapper } = await ready()

        await send(wrapper)

        expect(thanks(wrapper).props('state')).toBe('VALID')
        expect(form(wrapper).exists()).toBe(false)
        expect(accept(wrapper).element.disabled).toBe(false)

        await accept(wrapper).trigger('click')
        await flushPromises()

        expect(apollo.createUser).toHaveBeenCalledTimes(1)
        expect(apollo.login).toHaveBeenCalledTimes(1)
        expect(apollo.redeem).toHaveBeenCalledTimes(2)
        expect(title(wrapper).text()).toBe('Dein Dank ist da.')
      })
    })

    // The network is no obstacle: the chain stops, the usual message appears, the button is
    // free again, and the next tap goes on with the step that is open. A step that succeeded
    // does not run again -- a second `createUser` would write the new member the mail
    // "somebody tried to register with your address".
    describe('where the network fails', () => {
      it.each([
        ['opening the account', 'createUser', { createUser: 2, login: 1, redeem: 1 }],
        ['signing in', 'login', { createUser: 1, login: 2, redeem: 1 }],
        ['booking', 'redeem', { createUser: 1, login: 1, redeem: 2 }],
      ])('stops at %s, and the next tap goes on from there', async (_, step, asked) => {
        const answer = apollo[step]
        apollo[step] = vi
          .fn()
          .mockRejectedValueOnce(offline())
          .mockImplementation((...args) => answer(...args))
        const { wrapper } = await ready()

        await send(wrapper)

        expect(toasts.toastError).toHaveBeenCalledTimes(1)
        expect(toasts.toastError).toHaveBeenCalledWith('Unbekannter Fehler: Failed to fetch')
        expect(thanks(wrapper).props('stage')).toBeNull()
        expect(form(wrapper).exists()).toBe(true)
        expect(formButton(wrapper).element.disabled).toBe(false)
        // What was typed stands.
        expect(wrapper.find('#email-input-field').element.value).toBe('sarah@provence.fr')
        expect(wrapper.find('#newPassword-input-field').element.value).toBe(PASSWORD)

        await send(wrapper)

        expect(apollo.createUser).toHaveBeenCalledTimes(asked.createUser)
        expect(apollo.login).toHaveBeenCalledTimes(asked.login)
        expect(apollo.redeem).toHaveBeenCalledTimes(asked.redeem)
        expect(title(wrapper).text()).toBe('Dein Dank ist da.')
        expect(toasts.toastError).toHaveBeenCalledTimes(1)
      })

      it('shows no neutral view and asks the link nothing', async () => {
        apollo.login = vi.fn().mockRejectedValue(offline())
        const { wrapper } = await ready()

        await send(wrapper)

        expect(wrapper.find('[data-test="redeem-thanks-almost"]').exists()).toBe(false)
        expect(apollo.refetch).not.toHaveBeenCalled()
      })

      // The network failing while the page asks the link again is the network failing: the
      // usual message, and the next tap asks again.
      it('says so where the link cannot be asked again', async () => {
        apollo.login = vi.fn().mockRejectedValue(refused('No user with this credentials'))
        apollo.refetch = vi.fn().mockRejectedValue(offline())
        const { wrapper } = await ready()

        await send(wrapper)

        expect(toasts.toastError).toHaveBeenCalledTimes(1)
        expect(thanks(wrapper).props('stage')).toBeNull()
        expect(formButton(wrapper).element.disabled).toBe(false)
      })

      // Another address typed after the first account was opened is another account.
      it('opens an account for another address typed after a first one was opened', async () => {
        apollo.login = vi
          .fn()
          .mockRejectedValueOnce(offline())
          .mockResolvedValue({ data: { login: NEW_MEMBER } })
        const { wrapper } = await ready()
        await send(wrapper)

        await wrapper.find('#email-input-field').setValue('sarah.bernard@provence.fr')
        await flushPromises()
        await send(wrapper)

        expect(apollo.createUser).toHaveBeenCalledTimes(2)
        expect(apollo.createUser.mock.calls.map(([sent]) => sent.email)).toEqual([
          'sarah@provence.fr',
          'sarah.bernard@provence.fr',
        ])
        expect(apollo.login).toHaveBeenLastCalledWith(
          expect.objectContaining({ email: 'sarah.bernard@provence.fr' }),
        )
      })
    })

    // The server refuses the account itself -- a name it does not take, say: the usual
    // message, and the form stays for another try.
    it('says what the server said where the account is refused, and keeps the form', async () => {
      apollo.createUser = vi.fn().mockRejectedValue(refused('Username is not valid'))
      const { wrapper } = await ready()

      await send(wrapper)

      expect(toasts.toastError).toHaveBeenCalledWith('Unbekannter Fehler: Username is not valid')
      expect(apollo.login).not.toHaveBeenCalled()
      expect(form(wrapper).exists()).toBe(true)
      expect(formButton(wrapper).element.disabled).toBe(false)
    })

    // ⛔ The password stands in the form alone: not in the address, not in the store (which
    // is mirrored to localStorage), not in a message.
    describe('the password', () => {
      const SECRET = 'Zx9!kLm2-geheim'
      const everywhere = ({ router, store }) =>
        [
          JSON.stringify(store.state),
          router.currentRoute.value.fullPath,
          JSON.stringify(router.currentRoute.value.query),
          JSON.stringify(window.history.state),
          JSON.stringify(toasts.toastError.mock.calls),
          JSON.stringify(toasts.toastSuccess.mock.calls),
          JSON.stringify({ ...window.localStorage }),
          JSON.stringify({ ...window.sessionStorage }),
        ].join('\n')

      it('goes into the two requests and is kept nowhere, where everything goes through', async () => {
        const page = await ready(memberLink(), { password: SECRET })

        await send(page.wrapper)

        expect(apollo.createUser.mock.calls[0][0].password).toBe(SECRET)
        expect(apollo.login.mock.calls[0][0].password).toBe(SECRET)
        expect(apollo.redeem.mock.calls[0][0]).toEqual({ code: CODE })
        expect(everywhere(page)).not.toContain(SECRET)
        // The page shows "Dein Dank ist da.", and the form with its fields is gone.
        expect(page.wrapper.html()).not.toContain(SECRET)
        expect(page.wrapper.find('input').exists()).toBe(false)
      })

      it('is kept nowhere where the sign-in is refused', async () => {
        apollo.login = vi.fn().mockRejectedValue(refused('No user with this credentials'))
        const page = await ready(memberLink(), { password: SECRET })

        await send(page.wrapper)

        expect(everywhere(page)).not.toContain(SECRET)
        expect(page.wrapper.html()).not.toContain(SECRET)
        expect(page.wrapper.find('input').exists()).toBe(false)
      })

      it('is in no message where the network fails', async () => {
        apollo.createUser = vi.fn().mockRejectedValue(offline())
        const page = await ready(memberLink(), { password: SECRET })

        await send(page.wrapper)

        expect(toasts.toastError).toHaveBeenCalledTimes(1)
        expect(everywhere(page)).not.toContain(SECRET)
      })
    })

    // The two other kinds of link have no form and no chain.
    it.each([
      ['a contribution link', () => contributionLink(), 'CL-abc123'],
      ['a link from another community', () => linkFromElsewhere(), 'jwt.from.elsewhere'],
    ])('is not offered for %s', async (_, answer, code) => {
      const { wrapper } = await open(answer(), { code })

      expect(form(wrapper).exists()).toBe(false)
      expect(accept(wrapper).exists()).toBe(false)
      expect(apollo.createUser).not.toHaveBeenCalled()
    })
  })

  /**
   * The photo of a greeting that carries one (ZE-019): the page asks the address of the OPEN
   * link for it, once, and holds it. Nothing is asked where there is no sheet to show it on.
   */
  describe('a greeting with a photo of the sender’s own', () => {
    const photoOnSheet = (wrapper) => wrapper.find('[data-test="redeem-thanks-paper-photo"]')

    it.each([
      ['a guest', signedOut],
      ['a member', signedInAs(ME)],
      ['the sender', signedInAs(SENDER)],
    ])(
      'asks the address of the link for it and shows it on the sheet, for %s',
      async (who, session) => {
        const photo = servesPhoto()

        const { wrapper } = await open(photoLink(), { session })

        expect(photo).toHaveBeenCalledTimes(1)
        // Without cookies and past every cache: the code in the address is all it takes.
        expect(photo).toHaveBeenCalledWith(PHOTO_URL, { cache: 'no-store', credentials: 'omit' })
        expect(thanks(wrapper).props('picture')).toBe(PHOTO_ADDRESS)
        expect(photoOnSheet(wrapper).attributes('src')).toBe(PHOTO_ADDRESS)
        expect(photoOnSheet(wrapper).attributes('alt')).toBe('Foto von Oma-Emma')
      },
    )

    it('asks where redeeming across communities is switched on as well', async () => {
      CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE = true
      const photo = servesPhoto()

      const { wrapper } = await open(photoLink())

      expect(thanks(wrapper).props('state')).toBe('REDEEM_SELECT_COMMUNITY')
      expect(photo).toHaveBeenCalledTimes(1)
      expect(photoOnSheet(wrapper).attributes('src')).toBe(PHOTO_ADDRESS)
    })

    // The room of the photo stands, in the colour of the card; nothing else on the sheet moves.
    it('shows the sheet with the room of the photo where the server serves none', async () => {
      servesPhoto({ ok: false })

      const { wrapper } = await open(photoLink())

      expect(thanks(wrapper).props('picture')).toBeNull()
      expect(photoOnSheet(wrapper).exists()).toBe(false)
      expect(wrapper.find('[data-test="redeem-thanks-paper-photo-room"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="redeem-thanks-paper-line"]').text()).toBe(
        'Einfach so — weil es Dich gibt.',
      )
      expect(toasts.toastError).not.toHaveBeenCalled()
    })

    it('shows the sheet all the same where the line fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

      const { wrapper } = await open(photoLink())

      expect(wrapper.find('[data-test="redeem-thanks-paper-photo-room"]').exists()).toBe(true)
      expect(accept(wrapper).exists()).toBe(true)
      expect(toasts.toastError).not.toHaveBeenCalled()
    })

    it.each([
      ['a greeting with a motif', () => greetingLink()],
      ['a plain link', () => memberLink()],
      ['a contribution link', () => contributionLink()],
      ['a link from another community', () => linkFromElsewhere()],
    ])('asks nothing for %s', async (kind, answer) => {
      const photo = servesPhoto()

      await open(answer())

      expect(photo).not.toHaveBeenCalled()
    })

    // No sheet, no photo: the server would serve none for a link that is not open either.
    it.each([
      ['accepted', { redeemedAt: '2099-07-01T09:30:00.000Z' }],
      ['run out', { validUntil: '2020-07-12T09:30:00.000Z' }],
      ['deleted', { deletedAt: '2099-07-01T09:30:00.000Z' }],
    ])('asks nothing for a link that is %s', async (state, dates) => {
      const photo = servesPhoto()

      const { wrapper } = await open(photoLink(dates), { session: signedInAs(SENDER) })

      expect(photo).not.toHaveBeenCalled()
      expect(wrapper.find('img').exists()).toBe(false)
    })

    /**
     * ⛔ "Dein Dank ist da.": the photo stays as the page holds it, and the address is not asked
     * again -- the large rendition is deleted with the booking.
     */
    it('keeps the photo when a member accepts, and does not ask for it again', async () => {
      const photo = servesPhoto()
      const { wrapper } = await open(photoLink(), { session: signedInAs(ME) })

      photo.mockResolvedValue({ ok: false, status: 404, blob: () => Promise.resolve(new Blob([])) })
      await accept(wrapper).trigger('click')
      await flushPromises()

      expect(thanks(wrapper).props('stage')).toBe('arrived')
      expect(wrapper.findComponent(RedeemThanksPaper).props('short')).toBe(true)
      expect(photoOnSheet(wrapper).attributes('src')).toBe(PHOTO_ADDRESS)
      expect(photo).toHaveBeenCalledTimes(1)
    })

    it('gives the address of the picture back to the browser when the page is left', async () => {
      servesPhoto()
      const { wrapper, router } = await open(photoLink(), { session: signedInAs(ME) })
      expect(photoOnSheet(wrapper).exists()).toBe(true)

      await router.push('/overview')
      await flushPromises()

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(PHOTO_ADDRESS)
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
