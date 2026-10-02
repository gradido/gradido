// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createRouter, createMemoryHistory } from 'vue-router'
import { BCol, BDropdown, BDropdownItem, BRow } from 'bootstrap-vue-next'
import i18n from '@/i18n'
import CommunitySwitch from '@/components/CommunitySwitch.vue'
import RedeemThanks from './RedeemThanks.vue'
import RedeemThanksPaper from './RedeemThanksPaper.vue'

/**
 * The view a member's redeem link opens as, in every state such a link can have.
 *
 * With the wallet's own vue-i18n and language files, and with a real router: where each button
 * and link leads is the point of most of these tests, and `useAuthLinks` builds the ways from
 * the route the page stands on. A stand-in for it would answer the same for every route.
 *
 * The switch of communities in the field is the real one as well: what it is handed and what
 * it hands back are names of its own, and a stand-in would agree to any.
 *
 * The answers of the server are stand-ins, keyed by the document that asks.
 */
const apollo = vi.hoisted(() => ({ communities: [], asked: 0, createRedeemJwt: null }))
const toasts = vi.hoisted(() => ({ toastError: null }))

vi.mock('@vue/apollo-composable', async () => {
  const { reachableCommunities } = await import('@/graphql/communities.graphql')
  const { createRedeemJwtMutation } = await import('@/graphql/mutations')
  return {
    useQuery: (document) => {
      if (document !== reachableCommunities) throw new Error('a query this test does not know')
      apollo.asked += 1
      return {
        // The list comes after the switch is set up, as an answer does.
        onResult: (run) => {
          Promise.resolve().then(() => run({ data: { reachableCommunities: apollo.communities } }))
        },
      }
    },
    useMutation: (document) => {
      if (document !== createRedeemJwtMutation)
        throw new Error('a mutation this test does not know')
      return { mutate: (...args) => apollo.createRedeemJwt(...args) }
    },
  }
})

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: (...args) => toasts.toastError(...args) }),
}))

vi.mock('@/config', () => ({
  default: {
    COMMUNITY_NAME: 'KI Playground',
    COMMUNITY_URL: 'https://ki-playground.gradido.net',
  },
}))

const CODE = 'c0ffee1234567890abcdef12'
const GRADIDO_ID = '76378cbb-5a5c-4e4b-9a3b-1f2d3c4b5a69'

const HOME = {
  __typename: 'Community',
  foreign: false,
  name: 'KI Playground',
  description: '',
  url: 'https://ki-playground.gradido.net/api',
  uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
}
const WIEN = {
  __typename: 'Community',
  foreign: true,
  name: 'Gradido Wien',
  description: '',
  url: 'https://wien.example/api',
  uuid: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
}

const link = (overrides = {}) => ({
  __typename: 'TransactionLink',
  id: 7,
  amount: '20',
  memo: 'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
  createdAt: '2026-06-28T09:30:00.000Z',
  validUntil: '2026-07-12T09:30:00.000Z',
  redeemedAt: null,
  deletedAt: null,
  senderUser: { gradidoID: GRADIDO_ID, alias: 'Oma-Emma', publisherId: null },
  communities: [HOME, WIEN],
  ...overrides,
})

const page = { template: '<div />' }
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { name: 'Redeem', path: '/redeem/:code', component: page },
    { name: 'Login', path: '/login/:code?', component: page },
    { name: 'Register', path: '/register/:code?', component: page },
    { path: '/transactions', component: page },
    { path: '/overview', component: page },
  ],
})

const view = async (state, { linkData = link(), accepting = false, query = {} } = {}) => {
  await router.push({ name: 'Redeem', params: { code: CODE }, query })
  await router.isReady()
  const wrapper = mount(RedeemThanks, {
    props: { linkData, state, accepting, redeemCode: CODE },
    // The switch names its Bootstrap parts without importing them; the app resolves them.
    global: { plugins: [i18n, router], components: { BCol, BDropdown, BDropdownItem, BRow } },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  return wrapper
}
const mounted = []

const title = (wrapper) => wrapper.find('[data-test="redeem-thanks-title"]')
const accept = (wrapper) => wrapper.find('[data-test="redeem-thanks-accept"]')
const haveAccount = (wrapper) => wrapper.find('[data-test="redeem-thanks-have-account"]')
const field = (wrapper) => wrapper.find('[data-test="redeem-thanks-account"]')
const signIn = (wrapper) => wrapper.find('[data-test="redeem-thanks-sign-in"]')
const forward = (wrapper) => wrapper.find('[data-test="redeem-thanks-forward"]')
const how = (wrapper) => wrapper.find('[data-test="redeem-thanks-how"]')
const toAccount = (wrapper) => wrapper.find('[data-test="redeem-thanks-to-account"]')
const ownLinks = (wrapper) => wrapper.find('[data-test="redeem-thanks-own-links"]')

const GUEST_STATES = ['LOGGED_OUT', 'REDEEM_SELECT_COMMUNITY']
const CLOSED_STATES = ['TEXT_REDEEMED', 'TEXT_EXPIRED', 'TEXT_DELETED']
const ALL_STATES = [...GUEST_STATES, 'VALID', 'SELF_CREATOR', ...CLOSED_STATES]

/** A promise the test settles when it wants to: the token while it is on its way. */
const underway = () => {
  let settle
  const answer = new Promise((resolve, reject) => {
    settle = { resolve, reject }
  })
  return { answer, ...settle }
}

describe('RedeemThanks', () => {
  let place

  beforeEach(() => {
    i18n.global.locale.value = 'de'
    apollo.communities = [HOME, WIEN]
    apollo.asked = 0
    apollo.createRedeemJwt = vi.fn().mockResolvedValue({ data: { createRedeemJwt: 'signed.jwt' } })
    toasts.toastError = vi.fn()
    place = { href: `https://ki-playground.gradido.net/redeem/${CODE}` }
    vi.stubGlobal('location', place)
  })

  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.unstubAllGlobals()
  })

  describe.each(GUEST_STATES)('a guest, link open (%s)', (state) => {
    it('says whom the thank-you is for and shows it on its sheet', async () => {
      const linkData = link()
      const wrapper = await view(state, { linkData })

      expect(title(wrapper).element.tagName).toBe('H2')
      expect(title(wrapper).text()).toBe('Ein Dank für Dich')
      expect(wrapper.findComponent(RedeemThanksPaper).props('linkData')).toEqual(linkData)
    })

    // Until an account can be opened on this page (slice 4), accepting without one leads to
    // the registration, and the code of the address goes along -- as the old page did it.
    it('leads "accept" to the registration, with the code of the address', async () => {
      const wrapper = await view(state)

      expect(accept(wrapper).text()).toBe('Dank annehmen')
      expect(accept(wrapper).attributes('href')).toBe(`/register/${CODE}`)
      expect(accept(wrapper).classes()).toContain('btn-gradido')
    })

    it('takes what else the address carries along to the registration', async () => {
      const wrapper = await view(state, { query: { project: 'probe' } })

      expect(accept(wrapper).attributes('href')).toBe(`/register/${CODE}?project=probe`)
    })

    // ZE-017, F4: the button stands for itself. What follows it is the way in for somebody
    // who has an account -- no line of small print in between.
    it('puts no small print under the button', async () => {
      const wrapper = await view(state)
      const actions = wrapper.find('.redeem-thanks-actions')

      expect(actions.element.children).toHaveLength(1)
      expect(actions.element.firstElementChild).toBe(accept(wrapper).element)
      expect(actions.element.nextElementSibling.contains(haveAccount(wrapper).element)).toBe(true)
    })

    it('invites to thank others the same way, and says where to read how', async () => {
      const wrapper = await view(state)

      expect(wrapper.find('[data-test="redeem-thanks-invite"]').text()).toBe(
        'Möchtest auch Du auf diese schöne Weise anderen Menschen Danke sagen?',
      )
      expect(how(wrapper).text()).toBe('So funktioniert’s')
      expect(how(wrapper).attributes('href')).toBe('https://gradido.net/de')
      expect(how(wrapper).attributes('target')).toBe('_blank')
      expect(how(wrapper).attributes('rel')).toContain('noopener')
    })

    // As "Learn more ..." in the layout: the page of the language the visitor reads in.
    it('follows the language of the page with that link', async () => {
      i18n.global.locale.value = 'en'
      const wrapper = await view(state)

      expect(how(wrapper).attributes('href')).toBe('https://gradido.net/en')
      expect(how(wrapper).text()).toBe('How it works')
    })

    it('offers neither the way to the account nor to the own links', async () => {
      const wrapper = await view(state)

      expect(toAccount(wrapper).exists()).toBe(false)
      expect(ownLinks(wrapper).exists()).toBe(false)
    })
  })

  // ZE-020, F13. Where a link can only be redeemed here, the line is a link to the sign-in.
  describe('a guest who has an account, where links are redeemed here only (LOGGED_OUT)', () => {
    it('is led straight to the sign-in, with the code of the address', async () => {
      const wrapper = await view('LOGGED_OUT')

      expect(haveAccount(wrapper).text()).toBe('Ich habe schon ein Konto')
      expect(haveAccount(wrapper).element.tagName).toBe('A')
      expect(haveAccount(wrapper).attributes('href')).toBe(`/login/${CODE}`)
    })

    it('is asked nothing about communities', async () => {
      const wrapper = await view('LOGGED_OUT')

      expect(haveAccount(wrapper).attributes('aria-expanded')).toBeUndefined()
      expect(field(wrapper).exists()).toBe(false)
      expect(wrapper.findComponent(CommunitySwitch).exists()).toBe(false)
      expect(apollo.asked).toBe(0)
    })
  })

  // Where a link can be redeemed in another community too, the choice of community that
  // stood on the page for everybody stands behind this line.
  describe('a guest who has an account, where links cross communities (REDEEM_SELECT_COMMUNITY)', () => {
    const openField = async () => {
      const wrapper = await view('REDEEM_SELECT_COMMUNITY')
      await haveAccount(wrapper).trigger('click')
      await flushPromises()
      return wrapper
    }
    const choose = async (wrapper, community) => {
      const item = wrapper
        .findAll('.dropdown-item')
        .find((entry) => entry.text() === community.name)
      await item.trigger('click')
      await flushPromises()
    }

    it('finds the line closed, and nothing is asked before it is opened', async () => {
      const wrapper = await view('REDEEM_SELECT_COMMUNITY')

      expect(haveAccount(wrapper).text()).toBe('Ich habe schon ein Konto')
      expect(haveAccount(wrapper).element.tagName).toBe('BUTTON')
      expect(haveAccount(wrapper).attributes('type')).toBe('button')
      expect(haveAccount(wrapper).attributes('aria-expanded')).toBe('false')
      expect(field(wrapper).exists()).toBe(false)
      expect(apollo.asked).toBe(0)
    })

    it('opens the field under the line, and closes it again', async () => {
      const wrapper = await openField()

      expect(haveAccount(wrapper).attributes('aria-expanded')).toBe('true')
      expect(field(wrapper).exists()).toBe(true)
      // The line names the field it opens, and the field follows it: the next stop of the
      // keyboard after the line is inside the field.
      expect(haveAccount(wrapper).attributes('aria-controls')).toBe(field(wrapper).attributes('id'))
      expect(haveAccount(wrapper).element.nextElementSibling).toBe(field(wrapper).element)

      await haveAccount(wrapper).trigger('click')

      expect(haveAccount(wrapper).attributes('aria-expanded')).toBe('false')
      expect(field(wrapper).exists()).toBe(false)
    })

    it('asks where the account is, with this community chosen', async () => {
      const wrapper = await openField()

      expect(wrapper.find('[data-test="redeem-thanks-where-account"]').text()).toBe(
        'Wo ist Dein Konto?',
      )
      expect(wrapper.findComponent(CommunitySwitch).props('modelValue')).toEqual({
        uuid: HOME.uuid,
        name: 'KI Playground',
        url: 'https://ki-playground.gradido.net/api',
        foreign: false,
      })
      expect(field(wrapper).find('.dropdown-toggle').text()).toBe('KI Playground')
    })

    it('leads to the sign-in with the code, for an account in this community', async () => {
      const wrapper = await openField()

      expect(signIn(wrapper).text()).toBe('Anmelden')
      expect(signIn(wrapper).attributes('href')).toBe(`/login/${CODE}`)
      expect(forward(wrapper).exists()).toBe(false)
    })

    it('says that another community can be chosen, and what happens then', async () => {
      const wrapper = await openField()

      expect(wrapper.find('[data-test="redeem-thanks-other-community"]').text()).toBe(
        'Ist Dein Konto in einer anderen Gemeinschaft, wähle sie aus. Du wirst dorthin weitergeleitet.',
      )
    })

    it('can be walked with the keyboard: the switch, then the button', async () => {
      const wrapper = await openField()
      const stops = field(wrapper)
        .findAll('button, a[href]')
        .filter((stop) => stop.attributes('tabindex') !== '-1' && !stop.element.disabled)

      expect(stops[0].classes()).toContain('dropdown-toggle')
      expect(stops.at(-1).element).toBe(signIn(wrapper).element)
    })

    it('offers the way to another community once it is chosen', async () => {
      const wrapper = await openField()

      await choose(wrapper, WIEN)

      expect(field(wrapper).find('.dropdown-toggle').text()).toBe('Gradido Wien')
      expect(forward(wrapper).text()).toBe('Jetzt weiterleiten')
      expect(forward(wrapper).element.tagName).toBe('BUTTON')
      expect(signIn(wrapper).exists()).toBe(false)
    })

    it('offers the sign-in again when this community is chosen back', async () => {
      const wrapper = await openField()

      await choose(wrapper, WIEN)
      await choose(wrapper, HOME)

      expect(signIn(wrapper).attributes('href')).toBe(`/login/${CODE}`)
      expect(forward(wrapper).exists()).toBe(false)
    })

    // The same way the old page went: a token for the link and the community chosen, then
    // the redeem page over there.
    it('goes there the way the old page did', async () => {
      const wrapper = await openField()
      await choose(wrapper, WIEN)

      await forward(wrapper).trigger('click')
      await flushPromises()

      expect(apollo.createRedeemJwt).toHaveBeenCalledTimes(1)
      expect(apollo.createRedeemJwt).toHaveBeenCalledWith({
        gradidoId: GRADIDO_ID,
        senderCommunityUuid: HOME.uuid,
        senderCommunityName: 'KI Playground',
        recipientCommunityUuid: WIEN.uuid,
        code: CODE,
        amount: '20',
        memo: 'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
        alias: 'Oma-Emma',
        validUntil: '2026-07-12T09:30:00.000Z',
      })
      expect(place.href).toBe('https://wien.example/redeem/signed.jwt')
      expect(toasts.toastError).not.toHaveBeenCalled()
    })

    it('keeps the button locked while the token is on its way, and asks once', async () => {
      const token = underway()
      apollo.createRedeemJwt = vi.fn(() => token.answer)
      const wrapper = await openField()
      await choose(wrapper, WIEN)

      await forward(wrapper).trigger('click')

      expect(forward(wrapper).element.disabled).toBe(true)

      forward(wrapper).element.click()
      forward(wrapper).element.click()
      token.resolve({ data: { createRedeemJwt: 'signed.jwt' } })
      await flushPromises()

      expect(apollo.createRedeemJwt).toHaveBeenCalledTimes(1)
      expect(place.href).toBe('https://wien.example/redeem/signed.jwt')
      // The browser is leaving: nothing to tap again.
      expect(forward(wrapper).element.disabled).toBe(true)
    })

    // Two taps in one go, before the locked button is drawn: the view itself asks once.
    it('asks once for a double tap', async () => {
      const token = underway()
      apollo.createRedeemJwt = vi.fn(() => token.answer)
      const wrapper = await openField()
      await choose(wrapper, WIEN)

      const button = forward(wrapper).element
      button.click()
      button.click()
      await flushPromises()

      expect(apollo.createRedeemJwt).toHaveBeenCalledTimes(1)
    })

    it('says why where no token came, and lets the visitor try again', async () => {
      apollo.createRedeemJwt = vi.fn().mockRejectedValue(new Error('Transaction link expired'))
      const wrapper = await openField()
      await choose(wrapper, WIEN)

      await forward(wrapper).trigger('click')
      await flushPromises()

      expect(toasts.toastError).toHaveBeenCalledWith('Transaction link expired')
      expect(place.href).toBe(`https://ki-playground.gradido.net/redeem/${CODE}`)
      expect(forward(wrapper).element.disabled).toBe(false)
    })

    // With one community the switch shows its name and offers nothing to pick: the sentence
    // about choosing another one would promise a choice that is not there.
    it('does not speak of choosing where this community is the only one', async () => {
      apollo.communities = [HOME]
      const wrapper = await openField()

      expect(field(wrapper).text()).toContain('KI Playground')
      expect(field(wrapper).find('.dropdown-toggle').exists()).toBe(false)
      expect(wrapper.find('[data-test="redeem-thanks-other-community"]').exists()).toBe(false)
      expect(signIn(wrapper).attributes('href')).toBe(`/login/${CODE}`)
    })

    it('leaves "accept" where it was: the registration, with the code', async () => {
      const wrapper = await openField()

      expect(accept(wrapper).attributes('href')).toBe(`/register/${CODE}`)
    })
  })

  describe('a member, link open (VALID)', () => {
    it('shows the same title and sheet as a guest sees', async () => {
      const linkData = link()
      const wrapper = await view('VALID', { linkData })

      expect(title(wrapper).text()).toBe('Ein Dank für Dich')
      expect(wrapper.findComponent(RedeemThanksPaper).props('linkData')).toEqual(linkData)
    })

    // The page books, as before; the view only says that the member wants it.
    it('asks the page to accept, with one tap', async () => {
      const wrapper = await view('VALID')

      expect(accept(wrapper).text()).toBe('Dank annehmen')
      expect(accept(wrapper).element.tagName).toBe('BUTTON')
      expect(accept(wrapper).attributes('href')).toBeUndefined()

      await accept(wrapper).trigger('click')

      expect(wrapper.emitted('accept')).toHaveLength(1)
    })

    it('locks the button while the booking is on its way', async () => {
      const wrapper = await view('VALID', { accepting: true })

      expect(accept(wrapper).element.disabled).toBe(true)

      await accept(wrapper).trigger('click')

      expect(wrapper.emitted('accept')).toBeUndefined()
    })

    it('opens the button again once the page says the booking is over', async () => {
      const wrapper = await view('VALID', { accepting: true })

      await wrapper.setProps({ accepting: false })

      expect(accept(wrapper).element.disabled).toBe(false)
    })

    // What a guest needs and a member does not: no second way in, no invitation.
    it('has neither "I already have an account" nor the invitation', async () => {
      const wrapper = await view('VALID')

      expect(haveAccount(wrapper).exists()).toBe(false)
      expect(wrapper.find('[data-test="redeem-thanks-invite"]').exists()).toBe(false)
      expect(how(wrapper).exists()).toBe(false)
      expect(wrapper.findAll('a')).toHaveLength(0)
    })
  })

  describe('the sender opens their own link (SELF_CREATOR)', () => {
    it('says so, and shows the sheet as the other person will see it', async () => {
      const linkData = link()
      const wrapper = await view('SELF_CREATOR', { linkData })

      expect(title(wrapper).text()).toBe('Das ist Dein eigener Dank')
      expect(wrapper.findComponent(RedeemThanksPaper).props('linkData')).toEqual(linkData)
      expect(wrapper.find('[data-test="redeem-thanks-own-text"]').text()).toBe(
        'So sieht ihn der Mensch, dem Du ihn schickst. Annehmen kann ihn nur jemand anderes.',
      )
    })

    it('leads to the own links', async () => {
      const wrapper = await view('SELF_CREATOR')

      expect(ownLinks(wrapper).text()).toBe('Zu Deinen Links')
      expect(ownLinks(wrapper).attributes('href')).toBe('/transactions')
    })

    it('offers nothing to accept', async () => {
      const wrapper = await view('SELF_CREATOR')

      expect(accept(wrapper).exists()).toBe(false)
      expect(haveAccount(wrapper).exists()).toBe(false)
      expect(wrapper.findAll('button')).toHaveLength(0)
    })
  })

  describe('already accepted (TEXT_REDEEMED)', () => {
    const accepted = link({ redeemedAt: '2026-07-12T10:08:43.000Z' })

    it('says so, with the day it was accepted', async () => {
      const wrapper = await view('TEXT_REDEEMED', { linkData: accepted })
      const date = i18n.global.d(new Date('2026-07-12T10:08:43.000Z'), 'long')

      expect(date).toContain('12. Juli 2026')
      expect(title(wrapper).text()).toBe('Dieser Dank ist angenommen.')
      expect(wrapper.find('[data-test="redeem-thanks-text"]').text()).toBe(
        `Am ${date}. Er liegt jetzt bei dem Menschen, für den er gedacht war.`,
      )
    })

    it('leads to the account with an outlined button, not a golden one', async () => {
      const wrapper = await view('TEXT_REDEEMED', { linkData: accepted })

      expect(toAccount(wrapper).text()).toBe('Zum Konto')
      expect(toAccount(wrapper).attributes('href')).toBe('/overview')
      expect(toAccount(wrapper).classes()).toContain('btn')
      expect(
        toAccount(wrapper)
          .classes()
          .filter((name) => /^btn-(?!md$)/.test(name)),
      ).toEqual([])
    })
  })

  describe('run out (TEXT_EXPIRED)', () => {
    it('says how long the thank-you waited and that it went back to the sender', async () => {
      const wrapper = await view('TEXT_EXPIRED')

      expect(title(wrapper).text()).toBe('Dieser Dank hat 14 Tage gewartet.')
      expect(wrapper.find('[data-test="redeem-thanks-text"]').text()).toBe(
        'Er ist zu Oma-Emma zurückgekehrt — nichts ist verloren.',
      )
    })

    // The days come from the link, not from a number the wallet holds: a server that keeps
    // its links open for thirty days is read right as well.
    it('takes the days from the link itself', async () => {
      const wrapper = await view('TEXT_EXPIRED', {
        linkData: link({
          createdAt: '2026-06-01T09:30:00.000Z',
          validUntil: '2026-07-01T09:30:00.000Z',
        }),
      })

      expect(title(wrapper).text()).toBe('Dieser Dank hat 30 Tage gewartet.')
    })

    // The server adds the days on its own clock. Across the change to or from summer time the
    // two dates are an hour more or less than whole days apart.
    it.each([
      ['an hour short', '2026-03-20T09:30:00.000Z', '2026-04-03T08:30:00.000Z'],
      ['an hour over', '2026-10-20T08:30:00.000Z', '2026-11-03T09:30:00.000Z'],
    ])('counts whole days where the clocks changed in between (%s)', async (_, from, until) => {
      const wrapper = await view('TEXT_EXPIRED', {
        linkData: link({ createdAt: from, validUntil: until }),
      })

      expect(title(wrapper).text()).toBe('Dieser Dank hat 14 Tage gewartet.')
    })

    // Russian has three forms for a number of days. The view hands the number on a second
    // time, as the form to choose, and the wallet's rule for Russian picks among them.
    it.each([
      [21, 'Эта благодарность ждала 21 день.'],
      [3, 'Эта благодарность ждала 3 дня.'],
      [14, 'Эта благодарность ждала 14 дней.'],
    ])('says %i days in the form Russian has for that number', async (days, sentence) => {
      i18n.global.locale.value = 'ru'
      const createdAt = Date.parse('2026-06-01T09:30:00.000Z')
      const wrapper = await view('TEXT_EXPIRED', {
        linkData: link({
          createdAt: new Date(createdAt).toISOString(),
          validUntil: new Date(createdAt + days * 24 * 60 * 60 * 1000).toISOString(),
        }),
      })

      expect(title(wrapper).text()).toBe(sentence)
    })

    it('offers no way to accept and no button', async () => {
      const wrapper = await view('TEXT_EXPIRED')

      expect(wrapper.findAll('a, button')).toHaveLength(0)
    })
  })

  describe('deleted (TEXT_DELETED)', () => {
    const deleted = link({ deletedAt: '2026-07-03T14:30:00.000Z' })

    it('says that it is gone, who deleted the link and when', async () => {
      const wrapper = await view('TEXT_DELETED', { linkData: deleted })
      const date = i18n.global.d(new Date('2026-07-03T14:30:00.000Z'), 'long')

      expect(date).toContain('3. Juli 2026')
      expect(title(wrapper).text()).toBe('Diesen Dank gibt es nicht mehr.')
      expect(wrapper.find('[data-test="redeem-thanks-text"]').text()).toBe(
        `Oma-Emma hat den Link am ${date} gelöscht.`,
      )
    })

    it('offers no way to accept and no button', async () => {
      const wrapper = await view('TEXT_DELETED', { linkData: deleted })

      expect(wrapper.findAll('a, button')).toHaveLength(0)
    })
  })

  describe.each(CLOSED_STATES)('a link opened later (%s)', (state) => {
    const later = link({
      redeemedAt: '2026-07-12T10:08:43.000Z',
      deletedAt: '2026-07-03T14:30:00.000Z',
    })

    it('shows a drawn sign that is not read out, and no sheet', async () => {
      const wrapper = await view(state, { linkData: later })
      const sign = wrapper.find('svg.redeem-thanks-sign')

      expect(sign.exists()).toBe(true)
      expect(sign.attributes('aria-hidden')).toBe('true')
      expect(wrapper.findAll('svg')).toHaveLength(1)
      expect(wrapper.findComponent(RedeemThanksPaper).exists()).toBe(false)
    })

    it('has its title as the heading of the page', async () => {
      const wrapper = await view(state, { linkData: later })

      expect(title(wrapper).element.tagName).toBe('H2')
      expect(wrapper.findAll('h1, h2, h3')).toHaveLength(1)
    })
  })

  // NU-021, as on the sheet: the sender under the user name, and without one under the
  // Gradido ID -- never under a real name.
  describe('the sender in the sentences', () => {
    const nameless = { gradidoID: GRADIDO_ID, alias: null, firstName: 'Wilhelmine' }

    it('is named as the wallet names a member, where the link ran out', async () => {
      const wrapper = await view('TEXT_EXPIRED', { linkData: link({ senderUser: nameless }) })

      expect(wrapper.find('[data-test="redeem-thanks-text"]').text()).toBe(
        `Er ist zu ${GRADIDO_ID} zurückgekehrt — nichts ist verloren.`,
      )
      expect(wrapper.text()).not.toContain('Wilhelmine')
    })

    it('is named as the wallet names a member, where the link was deleted', async () => {
      const wrapper = await view('TEXT_DELETED', {
        linkData: link({ senderUser: nameless, deletedAt: '2026-07-03T14:30:00.000Z' }),
      })

      expect(wrapper.find('[data-test="redeem-thanks-text"]').text()).toContain(
        `${GRADIDO_ID} hat den Link am `,
      )
      expect(wrapper.text()).not.toContain('Wilhelmine')
    })
  })

  // Signs are drawn, not typed: no pictograph in any text of any state, in either language
  // the texts are written in first.
  describe.each(['de', 'en'])('the texts (%s)', (language) => {
    it.each(ALL_STATES)('carry no emoji (%s)', async (state) => {
      i18n.global.locale.value = language
      const wrapper = await view(state, {
        linkData: link({
          redeemedAt: '2026-07-12T10:08:43.000Z',
          deletedAt: '2026-07-03T14:30:00.000Z',
        }),
      })

      expect(wrapper.text()).not.toMatch(/\p{Extended_Pictographic}/u)
      // And every sentence found its text: a missing key would stand there as its own name.
      expect(wrapper.text()).not.toContain('redeem-thanks.')
    })
  })

  // jsdom lays nothing out and reads no stylesheet, so what a test can hold is the source; the
  // measure in the built wallet, in both themes, is part of the delivery.
  //
  // A colour the view takes from Bootstrap follows the theme only where the wallet's bridge
  // switches that variable. The colour of a heading is not among them -- the dark sheet
  // repaints the heading elements instead -- and a line that is no heading and takes that
  // colour stood on the dark card at 1.2 : 1.
  // A link that carries a thank-you greeting: the open sheet shows it, and the heading above
  // it says what has come. The later states stay without a sheet and without a picture.
  describe('a link with a thank-you greeting', () => {
    const LINE = 'Einfach so — weil es Dich gibt.'
    const greeted = (overrides = {}) =>
      link({
        memo: `${LINE}\nLiebe Sarah, mit Eurem iPad hat alles angefangen.`,
        greeting: { motif: 'morning-light', line: LINE, recipientName: 'Sarah' },
        ...overrides,
      })

    it.each(['LOGGED_OUT', 'REDEEM_SELECT_COMMUNITY', 'VALID'])(
      'is headed "Ein Dank-Gruß für Dich" for whoever may accept it (%s)',
      async (state) => {
        const wrapper = await view(state, { linkData: greeted() })

        expect(title(wrapper).text()).toBe('Ein Dank-Gruß für Dich')
        expect(wrapper.find('[data-test="redeem-thanks-accept"]').text()).toBe('Dank annehmen')
      },
    )

    it('keeps the heading of a plain link where there is no greeting', async () => {
      for (const linkData of [link(), link({ greeting: null })]) {
        expect(title(await view('LOGGED_OUT', { linkData })).text()).toBe('Ein Dank für Dich')
      }
    })

    it('keeps "Das ist Dein eigener Dank" for the sender', async () => {
      const wrapper = await view('SELF_CREATOR', { linkData: greeted() })

      expect(title(wrapper).text()).toBe('Das ist Dein eigener Dank')
    })

    // The sheet reads the greeting from the link it is handed; the view hands the link on whole.
    it('shows the greeting on the sheet: picture, whom it is for, the line, the words', async () => {
      const wrapper = await view('LOGGED_OUT', { linkData: greeted() })
      const paper = wrapper.findComponent(RedeemThanksPaper)

      expect(paper.props('linkData').greeting).toEqual({
        motif: 'morning-light',
        line: LINE,
        recipientName: 'Sarah',
      })
      expect(paper.find('[data-test="redeem-thanks-paper-motif"]').attributes('src')).toBe(
        '/img/thank-you-greeting/morning-light.svg',
      )
      expect(paper.find('[data-test="redeem-thanks-paper-for"]').text()).toBe('FÜR SARAH')
      expect(paper.find('[data-test="redeem-thanks-paper-line"]').text()).toBe(LINE)
      expect(paper.find('[data-test="redeem-thanks-paper-message"]').text()).toBe(
        'Liebe Sarah, mit Eurem iPad hat alles angefangen.',
      )
    })

    it.each([
      ['TEXT_REDEEMED', { redeemedAt: '2026-07-01T09:30:00.000Z' }, 'Dieser Dank ist angenommen.'],
      ['TEXT_EXPIRED', {}, 'Dieser Dank hat 14 Tage gewartet.'],
      [
        'TEXT_DELETED',
        { deletedAt: '2026-07-01T09:30:00.000Z' },
        'Diesen Dank gibt es nicht mehr.',
      ],
    ])('stays without sheet and picture once it is closed (%s)', async (state, dates, heading) => {
      const wrapper = await view(state, { linkData: greeted(dates) })

      expect(title(wrapper).text()).toBe(heading)
      expect(wrapper.findComponent(RedeemThanksPaper).exists()).toBe(false)
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('Sarah')
    })
  })

  describe('the colours in the dark theme', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const sfc = readFileSync(join(here, 'RedeemThanks.vue'), 'utf8')
    // Without the comments: the file explains there what it must not do.
    const css = sfc
      .slice(sfc.indexOf('>', sfc.indexOf('<style')) + 1, sfc.indexOf('</style>'))
      .replace(/\/\*[\s\S]*?\*\//g, '')

    const switchedIn = (scss) =>
      new Set(
        [...scss.replace(/\/\/.*$/gm, '').matchAll(/(--bs-[\w-]+)\s*:/g)].map(([, name]) => name),
      )
    const switched = switchedIn(
      readFileSync(join(here, '../../assets/scss/_color-mode-bridge.scss'), 'utf8'),
    )

    // The rules that read a variable of Bootstrap's which the bridge leaves alone, and have
    // no rule for the dark theme beside them.
    const leftLight = (styles) => {
      const rules = [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
        selector: selector.trim(),
        body,
      }))
      return rules
        .filter(({ body }) =>
          [...body.matchAll(/var\((--bs-[\w-]+)/g)].some(([, name]) => !switched.has(name)),
        )
        .filter(
          ({ selector }) =>
            !rules.some(
              (rule) =>
                rule.selector === `.dark-mode ${selector}` && /(^|[\s;])color:/.test(rule.body),
            ),
        )
        .map(({ selector }) => selector)
    }

    it('reads from the bridge what is switched, and not what a comment there names', () => {
      expect([...switchedIn('// --bs-a: is left alone\n  --bs-b: var(--text);')]).toEqual([
        '--bs-b',
      ])
      expect(switched.has('--bs-body-color')).toBe(true)
      expect(switched.has('--bs-link-color-rgb')).toBe(true)
    })

    it('would find a line left in its light colour', () => {
      expect(leftLight('.a { color: var(--bs-heading-color); }')).toEqual(['.a'])
      expect(
        leftLight('.a { color: var(--bs-heading-color); } .dark-mode .a { color: var(--text); }'),
      ).toEqual([])
      expect(leftLight('.a { color: var(--bs-body-color); }')).toEqual([])
    })

    it('leaves no line in its light colour', () => {
      expect(leftLight(css)).toEqual([])
    })
  })
})
