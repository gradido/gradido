// AI-GENERATED — not an architecture reference

import { flushPromises, mount } from '@vue/test-utils'
import { ref, unref } from 'vue'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShowFriends from './ShowFriends.vue'
import OwnCodeView from '@/components/QrCode/OwnCodeView'
import { logout } from '@/graphql/mutations'
import { presenceCode as presenceCodeQuery } from '@/graphql/presenceCode.graphql'
import en from '@/locales/en.json'
import { renderQrCodeCanvas } from '@/utils/qrCode'

/**
 * The real `OwnCodeView` and the real English texts, on purpose. The first door is right
 * when the LINK is right, and only a test that follows it to the generator can say that. The
 * shared sentence is right when the page's placeholder and the text's placeholder are the
 * same word -- a message written for this test would agree with the page by construction.
 */
vi.mock('@/utils/qrCode', () => ({ renderQrCodeCanvas: vi.fn() }))

const config = vi.hoisted(() => ({
  COMMUNITY_URL: 'https://ki-playground.gradido.net',
  MATCHING_ACTIVE: true,
}))
vi.mock('@/config', () => ({ default: config }))

const toast = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => toast }))

/**
 * The table code query (E-017), as the page sees it: `useQuery`'s refs. `server` is set before
 * each mount. Unless a test says otherwise the server has no code for the member (the answer
 * is null, as for a member without a user name) -- the page shows the card of before, so the
 * tests from before the table code keep describing the card they always did.
 */
const presenceQuery = vi.hoisted(() => ({ server: null, calls: [] }))
// The one mutation the page sends: the sign-out for a guest without a phone (ZE-013). The
// document is kept, so a test can say which mutation it was.
const signOut = vi.hoisted(() => ({ documents: [], mutate: vi.fn() }))
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (...args) => {
    presenceQuery.calls.push(args)
    return presenceQuery.server
  },
  useMutation: (document) => {
    signOut.documents.push(document)
    return { mutate: signOut.mutate }
  },
}))

const ADDRESS = 'https://ki-playground.gradido.net/u/alice'
const CODE = '1790000600.first-code_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const NEXT_CODE = '1790000900.next-code_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
const NOW = new Date('2026-09-22T10:00:00.000Z')
const TEN_MINUTES = 10 * 60 * 1000

// An answer as the server gives it: the code, the name it is sealed for, the time it has left.
const answerWith = ({
  code,
  alias = 'alice',
  remainingMs = TEN_MINUTES,
  unconfirmedGuests = [],
  ...rest
}) => ({
  presenceCode: { code, alias, remainingMs, unconfirmedGuests, ...rest },
})

// Guests who have not confirmed yet, as the server lists them (E-020): oldest first.
const guestsOf = (count) =>
  Array.from({ length: count }, (_, i) => ({
    firstName: `First${i + 1}`,
    lastName: `Last${i + 1}`,
    alias: `guest${i + 1}`,
    createdAt: new Date(Date.UTC(2026, 8, i + 1, 12)).toISOString(),
  }))
const SHORT_DATE = { day: 'numeric', month: 'numeric', year: 'numeric' }
const shortDate = (iso) => new Intl.DateTimeFormat('en', SHORT_DATE).format(new Date(iso))

/**
 * What the server answers: a code, `none` (null -- no code for this member), an `error`, or,
 * with none of them, nothing yet (the first answer is on its way). Like Apollo's own `refetch`,
 * the stand-in does not only return the next answer, it writes it into `result` and clears
 * `error` -- or, when it fails, sets `error` and leaves the previous answer standing, which is
 * what the page must not show then.
 */
const serverSays = ({ none = false, error = null, next = null, ...answer } = {}) => {
  const server = {
    result: ref(none ? { presenceCode: null } : answer.code ? answerWith(answer) : undefined),
    error: ref(error),
    loading: ref(false),
    refetch: vi.fn(() => {
      server.error.value = null
      if (next?.error) {
        server.error.value = next.error
        return Promise.reject(next.error)
      }
      server.result.value = answerWith(next)
      return Promise.resolve({ data: server.result.value })
    }),
  }
  presenceQuery.server = server
  return server
}

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
  datetimeFormats: { en: { short: SHORT_DATE } },
})

const router = createRouter({
  history: createWebHistory(),
  routes: ['/overview', '/send', '/matching/karte'].map((path) => ({
    path,
    component: { template: '<div />' },
  })),
})

const share = vi.fn()
const writeText = vi.fn()
// The store's own sign-out, as the header dispatches it.
const storeLogout = vi.fn()

const mountPage = (state = { username: 'alice', gradidoID: 'uuid-1' }) =>
  mount(ShowFriends, {
    global: {
      plugins: [
        i18n,
        router,
        createStore({ state: () => state, actions: { logout: storeLogout } }),
      ],
      stubs: {
        IMdiCoffeeOutline: true,
        IMdiEmailOutline: true,
        IMdiChevronUp: true,
        IMdiChevronDown: true,
        IMdiArrowLeft: true,
        IBiShare: true,
        IBiCopy: true,
      },
    },
  })

const openAway = async (wrapper) => {
  await wrapper.find('[data-test="show-friends-away-head"]').trigger('click')
}

describe('ShowFriends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    presenceQuery.calls = []
    signOut.documents = []
    serverSays({ none: true })
    config.MATCHING_ACTIVE = true
    renderQrCodeCanvas.mockImplementation((link) =>
      Promise.resolve({ toDataURL: () => `drawn:${link}` }),
    )
    share.mockResolvedValue(undefined)
    writeText.mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'share', { value: share, configurable: true })
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
  })

  afterEach(() => {
    delete window.navigator.share
  })

  it('asks for one person, under the sentence about what joining gives', () => {
    const wrapper = mountPage()

    expect(wrapper.find('[data-test="show-friends-lead"]').text()).toBe(en.showFriends.page.lead)
    expect(wrapper.find('[data-test="show-friends-question"]').text()).toBe(
      en.showFriends.page.question,
    )
  })

  describe('the first door', () => {
    it('is open on arrival, and the second is not', () => {
      const wrapper = mountPage()

      expect(wrapper.find('[data-test="show-friends-here"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="show-friends-away"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-here-head"]').attributes('aria-expanded')).toBe(
        'true',
      )
    })

    /**
     * ⛔ The same card as the card page, not a second code: the view is the one the card page
     * uses, and it is handed the member's own address -- followed here all the way to the
     * generator, with the scheme a phone camera needs to offer the link at all.
     */
    it("draws the member's own address, through the view the card page uses", async () => {
      const wrapper = mountPage()
      await flushPromises()

      const view = wrapper.findComponent(OwnCodeView)
      expect(view.props('link')).toBe(ADDRESS)
      expect(renderQrCodeCanvas).toHaveBeenCalledWith(ADDRESS)
      expect(wrapper.find('[data-test="own-code-picture"]').attributes('src')).toBe(
        `drawn:${ADDRESS}`,
      )
    })

    // The page has its own heading; a second one with a back arrow inside the door would
    // lead out of it.
    it('shows the code without the view heading of its own', async () => {
      const wrapper = mountPage()
      await flushPromises()

      expect(wrapper.find('[data-test="own-code-head"]').exists()).toBe(false)
    })

    it('shows the address under the code, without the scheme', () => {
      const wrapper = mountPage()

      expect(wrapper.find('[data-test="show-friends-address"]').text()).toContain(
        'ki-playground.gradido.net/u/alice',
      )
    })

    /**
     * Before the login answer has landed there is neither name nor id. An address built then
     * would read `host/u/` -- a code leading to nobody -- so there is none.
     */
    it('draws nothing while the member is not known yet', async () => {
      const wrapper = mountPage({ username: '', gradidoID: null })
      await flushPromises()

      expect(renderQrCodeCanvas).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="show-friends-address"]').exists()).toBe(false)
    })

    it('lists three steps, the first one leading to the map', () => {
      const wrapper = mountPage()

      const steps = wrapper.findAll('[data-test="show-friends-steps"] li')
      expect(steps).toHaveLength(3)
      expect(wrapper.find('[data-test="show-friends-map"]').attributes('href')).toBe(
        '/matching/karte',
      )
      expect(steps[0].text()).toBe(
        en.showFriends.here.step1.replace('{map}', en.showFriends.here.map),
      )
    })

    /**
     * A community without matching has no map. A step that sends somebody there would be a
     * sentence nobody can follow, so it is not shown -- and the code, which every community
     * has, stays the first thing to do.
     */
    it('leaves the map step out where there is no map', () => {
      config.MATCHING_ACTIVE = false
      const wrapper = mountPage()

      const steps = wrapper.findAll('[data-test="show-friends-steps"] li')
      expect(steps).toHaveLength(2)
      expect(wrapper.find('[data-test="show-friends-map"]').exists()).toBe(false)
      expect(steps[0].text()).toBe(en.showFriends.here.step2)
    })
  })

  /**
   * E-017: on this page the card carries a signed stamp in its link, and whoever registers with
   * it within ten minutes may choose a password. A new one for each guest, by the button.
   */
  describe('the table code', () => {
    const LINK = `${ADDRESS}?presence=${CODE}`
    const [oneMinute, minutes] = en.showFriends.here.validFor.split(' | ')

    // Date and the ticker only: flushPromises needs the real setTimeout.
    const fakeClock = () => {
      vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
      vi.setSystemTime(NOW)
    }
    const mountWithCode = async (answer = {}) => {
      fakeClock()
      const server = serverSays({ code: CODE, ...answer })
      const wrapper = mountPage()
      await flushPromises()
      return { wrapper, server }
    }
    const line = (wrapper) => wrapper.find('[data-test="show-friends-valid-for"]').text()

    // The guests' line and what it unfolds (ZE-014).
    const [oneGuest, someGuests] = en.showFriends.here.unconfirmedGuests.split(' | ')
    const guestToggle = (wrapper) => wrapper.find('[data-test="show-friends-unconfirmed-toggle"]')
    const guestRows = (wrapper) => wrapper.findAll('[data-test="show-friends-unconfirmed-guest"]')
    const guestHint = (wrapper) => wrapper.find('[data-test="show-friends-unconfirmed-hint"]')
    const tapGuests = (wrapper) => guestToggle(wrapper).trigger('click')

    afterEach(() => {
      vi.useRealTimers()
    })

    // Asked afresh on every visit: the query takes no argument, so a cached answer could be
    // another member's code, or one long run out.
    it('asks the server for a fresh code when the page opens', () => {
      mountPage()

      expect(presenceQuery.calls).toHaveLength(1)
      const [document, , options] = presenceQuery.calls[0]
      expect(document).toBe(presenceCodeQuery)
      expect(options).toEqual(expect.objectContaining({ fetchPolicy: 'network-only' }))
      // ⛔ Unwrapped, never compared as it stands: `enabled` is a ref, so the page follows a
      // member who confirms mid-session. A failing comparison against the ref itself makes
      // vitest print a Vue computed, and it walks the effect back into the whole component
      // tree until the run dies of memory - a red test that reads like a broken machine.
      expect(unref(options.enabled)).toBe(true)
    })

    it('draws the card with the code in its link', async () => {
      const { wrapper } = await mountWithCode()

      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(LINK)
      expect(renderQrCodeCanvas).toHaveBeenCalledWith(LINK)
      expect(wrapper.find('[data-test="own-code-picture"]').attributes('src')).toBe(`drawn:${LINK}`)
    })

    // What a guest types or copies is the address; the code belongs on this screen only.
    it('keeps the plain address under the code', async () => {
      const { wrapper } = await mountWithCode()

      const address = wrapper.find('[data-test="show-friends-address"]').text()
      expect(address).toContain('ki-playground.gradido.net/u/alice')
      expect(address).not.toContain('presence')
    })

    it('says how long the code is good for, and what it gives', async () => {
      const { wrapper } = await mountWithCode()

      expect(line(wrapper)).toBe(minutes.replace('{n}', '10'))
      expect(wrapper.find('[data-test="show-friends-code-hint"]').text()).toBe(
        en.showFriends.here.codeHint,
      )
      expect(wrapper.find('[data-test="show-friends-new-code"]').text()).toBe(
        en.showFriends.here.newCode,
      )
    })

    // A code that has run out leaves the screen (Bernd, 22.09.2026): nobody should scan what can
    // no longer open an account. The line says why, and the button stays.
    it('counts down to the last minute, then takes the code off the screen', async () => {
      const { wrapper } = await mountWithCode()

      vi.advanceTimersByTime((9 * 60 + 1) * 1000)
      await flushPromises()
      expect(line(wrapper)).toBe(oneMinute)
      expect(wrapper.find('[data-test="own-code-picture"]').attributes('src')).toBe(`drawn:${LINK}`)

      vi.advanceTimersByTime(59 * 1000)
      await flushPromises()
      expect(line(wrapper)).toBe(en.showFriends.here.expired)
      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe('')
      expect(wrapper.find('[data-test="own-code-picture"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-new-code"]').exists()).toBe(true)
    })

    // Half a second after the last tick: the arrival and the count have to read the same clock,
    // or the line would start at eleven minutes.
    it('shows a new code on the button, and counts from ten again', async () => {
      const { wrapper, server } = await mountWithCode({ next: { code: NEXT_CODE } })
      vi.advanceTimersByTime(10 * 60 * 1000 + 500)
      await flushPromises()
      expect(line(wrapper)).toBe(en.showFriends.here.expired)
      expect(wrapper.find('[data-test="own-code-picture"]').exists()).toBe(false)

      await wrapper.find('[data-test="show-friends-new-code"]').trigger('click')
      await flushPromises()

      expect(server.refetch).toHaveBeenCalledTimes(1)
      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(
        `${ADDRESS}?presence=${NEXT_CODE}`,
      )
      expect(wrapper.find('[data-test="own-code-picture"]').attributes('src')).toBe(
        `drawn:${ADDRESS}?presence=${NEXT_CODE}`,
      )
      expect(line(wrapper)).toBe(minutes.replace('{n}', '10'))
    })

    it('does not take a second tap while a new code is on its way', async () => {
      const { wrapper, server } = await mountWithCode()

      server.loading.value = true
      await flushPromises()

      expect(
        wrapper.find('[data-test="show-friends-new-code"]').attributes('disabled'),
      ).toBeDefined()
    })

    /**
     * The server has no code for this member (no user name): the card of before, which is still
     * a way in -- no message, and no button, since asking again would bring no other answer.
     */
    it('falls back to the card of before, without a word, where the server has none', async () => {
      const wrapper = mountPage()
      await flushPromises()

      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(ADDRESS)
      expect(wrapper.find('[data-test="show-friends-presence"]').exists()).toBe(false)
      expect(toast.toastError).not.toHaveBeenCalled()
    })

    /**
     * A failed fetch is not the member's lasting state -- one dropped request at a café is
     * enough. The card falls back rather than keep the old code, and the button stays: without
     * it the table code would be gone until the page is opened again, and nobody would notice.
     */
    it('falls back when a new code cannot be fetched, and keeps the button for a new try', async () => {
      const { wrapper, server } = await mountWithCode({
        next: { error: new Error('Network error') },
      })

      await wrapper.find('[data-test="show-friends-new-code"]').trigger('click')
      await flushPromises()

      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(ADDRESS)
      expect(wrapper.find('[data-test="show-friends-valid-for"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-code-hint"]').exists()).toBe(false)
      expect(toast.toastError).not.toHaveBeenCalled()

      server.refetch.mockImplementation(() => {
        server.error.value = null
        server.result.value = answerWith({ code: NEXT_CODE })
        return Promise.resolve({ data: server.result.value })
      })
      await wrapper.find('[data-test="show-friends-new-code"]').trigger('click')
      await flushPromises()

      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(
        `${ADDRESS}?presence=${NEXT_CODE}`,
      )
      expect(line(wrapper)).toBe(minutes.replace('{n}', '10'))
    })

    /**
     * Apollo's `refetch` clears the error at once and keeps the last answer until the next one
     * is in -- so after a failure the old code shows again while the new one is on its way. It
     * keeps the time it had left; counting it from ten again would promise minutes it does not
     * have.
     */
    it('does not count an old code from ten again while a new one is on its way', async () => {
      const { wrapper, server } = await mountWithCode({
        next: { error: new Error('Network error') },
      })
      vi.advanceTimersByTime(4 * 60 * 1000)
      await flushPromises()
      expect(line(wrapper)).toBe(minutes.replace('{n}', '6'))
      await wrapper.find('[data-test="show-friends-new-code"]').trigger('click')
      await flushPromises()
      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(ADDRESS)

      server.refetch.mockImplementation(() => {
        server.error.value = null
        server.loading.value = true
        return new Promise(() => {})
      })
      await wrapper.find('[data-test="show-friends-new-code"]').trigger('click')
      await flushPromises()

      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(LINK)
      expect(line(wrapper)).toBe(minutes.replace('{n}', '6'))
    })

    /**
     * E-018: only a confirmed member vouches. The server refuses an unconfirmed one at once, so
     * the page does not ask: the card without a stamp, at once, and the sentence saying why.
     */
    it('asks nothing for an unconfirmed member, and shows the card with the reason', async () => {
      // A query that is not enabled never answers: the card has to be there without one.
      serverSays()
      const wrapper = mountPage({ username: 'alice', gradidoID: 'uuid-1', emailChecked: false })
      await flushPromises()

      const [, , options] = presenceQuery.calls[0]
      expect(unref(options.enabled)).toBe(false)
      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(ADDRESS)
      expect(wrapper.find('[data-test="show-friends-confirm-first"]').text()).toBe(
        en.showFriends.here.confirmFirst,
      )
      expect(wrapper.find('[data-test="show-friends-presence"]').exists()).toBe(false)
    })

    // A query that is not enabled never answers, so waiting is no sign of a lost answer here:
    // the member is told why there is no code, not to try again.
    it('does not tell an unconfirmed member that the code did not arrive, however long they wait', async () => {
      fakeClock()
      serverSays()
      const wrapper = mountPage({ username: 'alice', gradidoID: 'uuid-1', emailChecked: false })
      await flushPromises()

      vi.advanceTimersByTime(6000)
      await flushPromises()

      expect(wrapper.find('[data-test="show-friends-confirm-first"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="show-friends-no-answer"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-new-code"]').exists()).toBe(false)
    })

    /**
     * The store's copy is renewed on every pass through `/authenticate`, and a guest who
     * registered at the table confirms their address in the same session. Read once at setup,
     * the page would keep telling them to confirm first - step 8 of the flow this feature is
     * for, on the very page that opens it.
     */
    it('follows the store when the address is confirmed while the page stands open', async () => {
      serverSays()
      const state = { username: 'alice', gradidoID: 'uuid-1', emailChecked: false }
      const wrapper = mountPage(state)
      await flushPromises()
      expect(wrapper.find('[data-test="show-friends-confirm-first"]').exists()).toBe(true)

      wrapper.vm.$store.state.emailChecked = true
      await flushPromises()

      expect(wrapper.find('[data-test="show-friends-confirm-first"]').exists()).toBe(false)
      expect(unref(presenceQuery.calls[0][2].enabled)).toBe(true)
    })

    it('says nothing about confirming to a confirmed member', async () => {
      const { wrapper } = await mountWithCode()

      expect(wrapper.find('[data-test="show-friends-confirm-first"]').exists()).toBe(false)
    })

    /**
     * E-020: under the code the member's own guests who have not confirmed yet, by name and
     * since when -- whom to remind, and the line support needs. On a tap (ZE-014).
     */
    it('lists the guests who have not confirmed yet under the code, oldest first', async () => {
      const guests = guestsOf(2)
      const { wrapper } = await mountWithCode({ unconfirmedGuests: guests })

      await tapGuests(wrapper)

      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(LINK)
      expect(guestToggle(wrapper).text()).toBe(someGuests.replace('{n}', '2'))
      expect(guestRows(wrapper).map((row) => row.text())).toEqual(
        guests.map((guest) =>
          en.showFriends.here.unconfirmedGuest
            .replace('{firstName}', guest.firstName)
            .replace('{lastName}', guest.lastName)
            .replace('{alias}', guest.alias)
            .replace('{date}', shortDate(guest.createdAt)),
        ),
      )
      expect(guestHint(wrapper).text()).toBe(en.showFriends.here.unconfirmedHint)
    })

    // An old account may have no name and no user name (a new one is given a user name when it
    // registers): its line must not read "null", and the code stays where it is.
    it('writes no "null" for a guest without a name, and keeps the code', async () => {
      const [{ createdAt }] = guestsOf(1)
      const { wrapper } = await mountWithCode({
        unconfirmedGuests: [{ firstName: null, lastName: null, alias: null, createdAt }],
      })

      await tapGuests(wrapper)

      const guest = wrapper.find('[data-test="show-friends-unconfirmed-guest"]').text()
      expect(guest).toContain(shortDate(createdAt))
      expect(guest).not.toContain('null')
      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(LINK)
    })

    it('says it of one guest in the singular', async () => {
      const { wrapper } = await mountWithCode({ unconfirmedGuests: guestsOf(1) })

      expect(guestToggle(wrapper).text()).toBe(oneGuest)
    })

    /**
     * ZE-014: the code is held out to a stranger, so the guests are folded to their number on
     * arrival -- their names are not in the page at all, not merely hidden.
     */
    it('folds the guests to their number on arrival, with no name in the page', async () => {
      const { wrapper } = await mountWithCode({ unconfirmedGuests: guestsOf(2) })

      expect(guestToggle(wrapper).text()).toBe(someGuests.replace('{n}', '2'))
      expect(guestToggle(wrapper).attributes('type')).toBe('button')
      expect(guestToggle(wrapper).attributes('aria-expanded')).toBe('false')
      expect(guestRows(wrapper)).toHaveLength(0)
      expect(guestHint(wrapper).exists()).toBe(false)
      for (const part of ['First1', 'Last1', 'guest2', en.showFriends.here.unconfirmedHint]) {
        expect(wrapper.html()).not.toContain(part)
      }
    })

    it('unfolds the names and the hint on a tap, and folds them away on the next', async () => {
      const { wrapper } = await mountWithCode({ unconfirmedGuests: guestsOf(2) })
      // The chevron shows the way the line goes on a tap, as on the doors.
      const chevron = (way) => guestToggle(wrapper).find(`i-mdi-chevron-${way}-stub`).exists()
      expect(chevron('down')).toBe(true)

      await tapGuests(wrapper)

      expect(chevron('up')).toBe(true)
      expect(guestToggle(wrapper).attributes('aria-expanded')).toBe('true')
      // What the button says it controls is where the names and the hint are.
      const unfolded = wrapper.find(`#${guestToggle(wrapper).attributes('aria-controls')}`)
      expect(unfolded.findAll('[data-test="show-friends-unconfirmed-guest"]')).toHaveLength(2)
      expect(unfolded.find('[data-test="show-friends-unconfirmed-hint"]').text()).toBe(
        en.showFriends.here.unconfirmedHint,
      )

      await tapGuests(wrapper)

      expect(chevron('down')).toBe(true)
      expect(guestToggle(wrapper).attributes('aria-expanded')).toBe('false')
      expect(guestRows(wrapper)).toHaveLength(0)
      expect(guestHint(wrapper).exists()).toBe(false)
      expect(wrapper.html()).not.toContain('First1')
    })

    // At the limit the sentence with the number stays, and the names are folded under it too.
    it('folds the guests at the limit as well, under the sentence that says why', async () => {
      fakeClock()
      const server = serverSays({ code: null, none: false })
      server.result.value = answerWith({
        code: null,
        remainingMs: 0,
        unconfirmedGuests: guestsOf(5),
      })
      const wrapper = mountPage()
      await flushPromises()

      expect(wrapper.find('[data-test="show-friends-limit-reached"]').text()).toBe(
        en.showFriends.here.limitReached.replace('{n}', '5'),
      )
      expect(guestToggle(wrapper).text()).toBe(someGuests.replace('{n}', '5'))
      expect(guestToggle(wrapper).attributes('aria-expanded')).toBe('false')
      expect(guestRows(wrapper)).toHaveLength(0)
      expect(guestHint(wrapper).exists()).toBe(false)
      expect(wrapper.html()).not.toContain('First1')

      await tapGuests(wrapper)

      expect(guestToggle(wrapper).attributes('aria-expanded')).toBe('true')
      expect(guestRows(wrapper)).toHaveLength(5)
      expect(guestHint(wrapper).exists()).toBe(true)

      await tapGuests(wrapper)

      expect(guestRows(wrapper)).toHaveLength(0)
      expect(wrapper.find('[data-test="show-friends-limit-reached"]').exists()).toBe(true)
    })

    it('lists nothing where every guest has confirmed', async () => {
      const { wrapper } = await mountWithCode()

      expect(wrapper.find('[data-test="show-friends-unconfirmed"]').exists()).toBe(false)
    })

    /**
     * E-019: at the limit the server mints no code. The card without a stamp, the reason with the
     * number, the guests by name on a tap -- and the button, which asks again: once one of them
     * has confirmed, the next answer carries a code and one name less. The list the member
     * unfolded stays unfolded (ZE-014): a new code does not reload the page.
     */
    it('shows the card, the reason and the guests at the limit, and a code again after a confirmation', async () => {
      fakeClock()
      const server = serverSays({
        code: null,
        none: false,
        next: { code: NEXT_CODE, unconfirmedGuests: guestsOf(4) },
      })
      server.result.value = answerWith({
        code: null,
        remainingMs: 0,
        unconfirmedGuests: guestsOf(5),
      })
      const wrapper = mountPage()
      await flushPromises()

      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(ADDRESS)
      expect(wrapper.find('[data-test="show-friends-valid-for"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-code-hint"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-limit-reached"]').text()).toBe(
        en.showFriends.here.limitReached.replace('{n}', '5'),
      )
      await tapGuests(wrapper)
      expect(guestRows(wrapper)).toHaveLength(5)

      await wrapper.find('[data-test="show-friends-new-code"]').trigger('click')
      await flushPromises()

      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(
        `${ADDRESS}?presence=${NEXT_CODE}`,
      )
      expect(line(wrapper)).toBe(minutes.replace('{n}', '10'))
      expect(wrapper.find('[data-test="show-friends-limit-reached"]').exists()).toBe(false)
      expect(guestToggle(wrapper).attributes('aria-expanded')).toBe('true')
      expect(guestRows(wrapper)).toHaveLength(4)
    })

    it('offers the new try after a failed first fetch as well', async () => {
      fakeClock()
      serverSays({ error: new Error('Network error') })
      const wrapper = mountPage()
      await flushPromises()

      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(ADDRESS)
      expect(wrapper.find('[data-test="show-friends-new-code"]').exists()).toBe(true)
    })

    /**
     * The count runs from the moment the code arrived, over what the server had left -- not
     * against the device's clock. A laptop running eleven minutes fast would otherwise take
     * every fresh code for an expired one, and the first door would show no code at all.
     */
    it('counts from the arrival, whatever the device clock says', async () => {
      const { wrapper } = await mountWithCode({
        // What that server's clock made of it, as the device reads it: a minute ago.
        expiresAt: new Date(NOW.getTime() - 60 * 1000).toISOString(),
      })

      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(LINK)
      expect(line(wrapper)).toBe(minutes.replace('{n}', '10'))

      vi.advanceTimersByTime(TEN_MINUTES - 1000)
      await flushPromises()
      expect(line(wrapper)).toBe(oneMinute)
      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(LINK)

      vi.advanceTimersByTime(1000)
      await flushPromises()
      expect(line(wrapper)).toBe(en.showFriends.here.expired)
      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe('')
    })

    it('counts what the server had left, not ten minutes regardless', async () => {
      const { wrapper } = await mountWithCode({ remainingMs: 4 * 60 * 1000 + 500 })

      expect(line(wrapper)).toBe(minutes.replace('{n}', '5'))
      // The ticker reads the clock once a second: the first tick past the end is at 4:01.
      vi.advanceTimersByTime(4 * 60 * 1000)
      await flushPromises()
      expect(line(wrapper)).toBe(oneMinute)
      vi.advanceTimersByTime(1000)
      await flushPromises()
      expect(line(wrapper)).toBe(en.showFriends.here.expired)
    })

    /**
     * The code is sealed for the name the server knows. The store's copy can be older -- renamed
     * on another device -- and a link with that name would open nothing: every guest would read
     * "expired", and every new code the same.
     */
    it('builds the link from the name the code is sealed for', async () => {
      const { wrapper } = await mountWithCode({ alias: 'alice-new' })

      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(
        `https://ki-playground.gradido.net/u/alice-new?presence=${CODE}`,
      )
      expect(wrapper.find('[data-test="show-friends-address"]').text()).toContain(
        'ki-playground.gradido.net/u/alice',
      )
    })

    /**
     * A connection that neither answers nor fails -- Wi-Fi without internet -- would leave the
     * first door without any code. After a few seconds the card of before steps in, with a word
     * and the button for a new try; a code that still arrives takes its place.
     */
    it('falls back to the address when the first answer takes too long, and a late code takes over', async () => {
      fakeClock()
      const server = serverSays()
      const wrapper = mountPage()
      await flushPromises()

      vi.advanceTimersByTime(4000)
      await flushPromises()
      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe('')
      expect(renderQrCodeCanvas).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1000)
      await flushPromises()
      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(ADDRESS)
      // ⛔ The way back, which the card's own docstring promises and this test used to deny:
      // without the button the member has no way to a code at all short of leaving the page.
      expect(wrapper.find('[data-test="show-friends-new-code"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="show-friends-no-answer"]').text()).toBe(
        en.showFriends.here.noAnswer,
      )

      server.result.value = answerWith({ code: CODE })
      await flushPromises()
      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(LINK)
      expect(line(wrapper)).toBe(minutes.replace('{n}', '10'))
      expect(wrapper.find('[data-test="show-friends-no-answer"]').exists()).toBe(false)
    })

    /**
     * The server answering `null` is an answer -- it has no code for this member (no user
     * name). That one keeps the card without a word: no button, no line.
     */
    it('says nothing where the server answered that it has no code, however long one waits', async () => {
      fakeClock()
      serverSays({ none: true })
      const wrapper = mountPage()
      await flushPromises()

      vi.advanceTimersByTime(6000)
      await flushPromises()
      expect(wrapper.findComponent(OwnCodeView).props('link')).toBe(ADDRESS)
      expect(wrapper.find('[data-test="show-friends-presence"]').exists()).toBe(false)
    })

    /**
     * A refetch that hangs never clears `loading` -- @vue/apollo-composable only does that on a
     * delivered result or error. The button must not stay pressed-out for the rest of the visit.
     */
    it('gives the button back when a new code is asked for and nothing comes', async () => {
      const { wrapper, server } = await mountWithCode()
      server.refetch.mockImplementation(() => {
        server.loading.value = true
        return new Promise(() => {})
      })

      await wrapper.find('[data-test="show-friends-new-code"]').trigger('click')
      await flushPromises()
      expect(
        wrapper.find('[data-test="show-friends-new-code"]').attributes('disabled'),
      ).toBeDefined()

      vi.advanceTimersByTime(6000)
      await flushPromises()
      expect(
        wrapper.find('[data-test="show-friends-new-code"]').attributes('disabled'),
      ).toBeUndefined()
    })

    // ⛔ What goes out through the second door is read later and elsewhere: the address, never
    // the code shown at the table (E-017).
    it('shares the address without the code, also while a code is shown', async () => {
      const { wrapper } = await mountWithCode()
      await openAway(wrapper)

      expect(wrapper.find('[data-test="show-friends-share-text"]').text()).toBe(
        en.showFriends.away.shareText.replace('{url}', ADDRESS),
      )
    })

    it('has the address to share before the first answer about the code is in', async () => {
      serverSays()
      const wrapper = mountPage()
      await openAway(wrapper)

      expect(wrapper.find('[data-test="show-friends-share-text"]').text()).toBe(
        en.showFriends.away.shareText.replace('{url}', ADDRESS),
      )
    })

    // Until the first answer is in there is no picture, so the one under the guest's camera
    // does not change a moment later.
    it('draws nothing while the first answer is on its way', async () => {
      serverSays()
      const wrapper = mountPage()
      await flushPromises()

      expect(renderQrCodeCanvas).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="show-friends-presence"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-address"]').exists()).toBe(true)
    })

    /**
     * ZE-013: a guest without a phone of their own. Under a code that is still good the member
     * hands over this device: one tap signs them out and opens the form with a fresh code.
     */
    describe('for a guest without a phone', () => {
      // A fresh code for another name than the store's: the form must carry the name the code
      // is sealed for, and that is the one in the answer.
      const FRESH = { code: NEXT_CODE, alias: 'alicia' }
      const FORM = { path: '/register', query: { referrer: 'alicia', presence: NEXT_CODE } }
      let registerForm
      let push

      beforeEach(() => {
        signOut.mutate.mockReset().mockResolvedValue({ data: { logout: true } })
        // A form that still has to be loaded, as the wallet's lazy route does -- added afresh for
        // every test, since loading it puts the component into the route for good.
        registerForm = vi.fn(() => Promise.resolve({ template: '<div />' }))
        router.addRoute({ name: 'Register', path: '/register', component: () => registerForm() })
        push = vi.spyOn(router, 'push').mockResolvedValue(undefined)
      })

      afterEach(() => {
        push.mockRestore()
      })

      const noPhone = (wrapper) => wrapper.find('[data-test="show-friends-no-phone"]')
      const hint = (wrapper) => wrapper.find('[data-test="show-friends-no-phone-hint"]')
      const tapNoPhone = async (wrapper) => {
        await noPhone(wrapper).trigger('click')
        await flushPromises()
      }
      const nobodySignedOut = () => {
        expect(signOut.mutate).not.toHaveBeenCalled()
        expect(storeLogout).not.toHaveBeenCalled()
        expect(push).not.toHaveBeenCalled()
      }

      it('is offered under a code that is still good, with the sentence saying what it does', async () => {
        const { wrapper } = await mountWithCode()

        expect(noPhone(wrapper).text()).toBe(en.showFriends.here.noPhone)
        expect(noPhone(wrapper).attributes('type')).toBe('button')
        expect(hint(wrapper).text()).toBe(en.showFriends.here.noPhoneHint)
      })

      it('is not offered at the limit, where the server mints no code', async () => {
        fakeClock()
        const server = serverSays({ code: null, none: false })
        server.result.value = answerWith({
          code: null,
          remainingMs: 0,
          unconfirmedGuests: guestsOf(5),
        })
        const wrapper = mountPage()
        await flushPromises()

        expect(wrapper.find('[data-test="show-friends-limit-reached"]').exists()).toBe(true)
        expect(noPhone(wrapper).exists()).toBe(false)
        expect(hint(wrapper).exists()).toBe(false)
      })

      it('is not offered once the code has run out', async () => {
        const { wrapper } = await mountWithCode()
        expect(noPhone(wrapper).exists()).toBe(true)

        vi.advanceTimersByTime(TEN_MINUTES)
        await flushPromises()

        expect(line(wrapper)).toBe(en.showFriends.here.expired)
        expect(noPhone(wrapper).exists()).toBe(false)
        expect(hint(wrapper).exists()).toBe(false)
      })

      it('is not offered to a member who has not confirmed, however long the page stands', async () => {
        fakeClock()
        serverSays()
        const wrapper = mountPage({ username: 'alice', gradidoID: 'uuid-1', emailChecked: false })
        await flushPromises()
        vi.advanceTimersByTime(6000)
        await flushPromises()

        expect(wrapper.find('[data-test="show-friends-confirm-first"]').exists()).toBe(true)
        expect(noPhone(wrapper).exists()).toBe(false)
      })

      /**
       * In this order, each step waiting for the one before: the fresh code, the form, the
       * sign-out on the server, the sign-out here, the form on the screen. The form is loaded
       * BEFORE anybody is signed out -- see `noPhone` for the header's timer that forces it.
       */
      it('signs the member out and opens the form with a fresh code for the guest', async () => {
        const { wrapper, server } = await mountWithCode({ next: FRESH })

        await tapNoPhone(wrapper)

        expect(signOut.documents).toEqual([logout])
        expect(server.refetch).toHaveBeenCalledTimes(1)
        expect(registerForm).toHaveBeenCalledTimes(1)
        expect(signOut.mutate).toHaveBeenCalledTimes(1)
        expect(storeLogout).toHaveBeenCalledTimes(1)
        expect(push).toHaveBeenCalledTimes(1)
        expect(push).toHaveBeenCalledWith(FORM)
        const order = [server.refetch, registerForm, signOut.mutate, storeLogout, push].map(
          (step) => step.mock.invocationCallOrder[0],
        )
        expect(order).toEqual([...order].sort((a, b) => a - b))
      })

      it('signs the member out here all the same when the server does not answer', async () => {
        signOut.mutate.mockRejectedValue(new Error('Network error'))
        const { wrapper } = await mountWithCode({ next: FRESH })

        await tapNoPhone(wrapper)

        expect(storeLogout).toHaveBeenCalledTimes(1)
        expect(push).toHaveBeenCalledWith(FORM)
      })

      // The limit filled up since the page drew its code: the fresh answer has none to hand on.
      it('does nothing when the fresh answer has no code, and says why', async () => {
        const { wrapper } = await mountWithCode({
          next: { code: null, remainingMs: 0, unconfirmedGuests: guestsOf(5) },
        })

        await tapNoPhone(wrapper)

        expect(registerForm).not.toHaveBeenCalled()
        nobodySignedOut()
        expect(wrapper.find('[data-test="show-friends-limit-reached"]').exists()).toBe(true)
      })

      it('does nothing when no fresh code comes', async () => {
        const { wrapper } = await mountWithCode({ next: { error: new Error('Network error') } })

        await tapNoPhone(wrapper)

        expect(registerForm).not.toHaveBeenCalled()
        nobodySignedOut()
      })

      // No connection for the form: signed out, the member would be left on a page that cannot
      // open it. So nobody is signed out, and the member can tap again.
      it('signs nobody out when the form cannot be loaded', async () => {
        registerForm.mockRejectedValue(new Error('Failed to fetch dynamically imported module'))
        const { wrapper } = await mountWithCode({ next: FRESH })

        await tapNoPhone(wrapper)

        nobodySignedOut()
      })
    })
  })

  describe('the doors', () => {
    it('opens the second door and closes the first', async () => {
      const wrapper = mountPage()

      await openAway(wrapper)

      expect(wrapper.find('[data-test="show-friends-away"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="show-friends-here"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-away-head"]').attributes('aria-expanded')).toBe(
        'true',
      )
      expect(wrapper.find('[data-test="show-friends-here-head"]').attributes('aria-expanded')).toBe(
        'false',
      )
    })

    it('closes an open door when its head is touched again', async () => {
      const wrapper = mountPage()

      await wrapper.find('[data-test="show-friends-here-head"]').trigger('click')

      expect(wrapper.find('[data-test="show-friends-here"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-away"]').exists()).toBe(false)
    })
  })

  describe('the second door', () => {
    /**
     * Until the thank-you greeting has a form of its own, the thank-you is a link: the send
     * form, opened on its link tab. The form reads the tab from `?art=`.
     */
    it('leads to the send form, opened on the link tab', async () => {
      const wrapper = mountPage()
      await openAway(wrapper)

      const thanks = wrapper.find('[data-test="show-friends-thanks"]')
      expect(thanks.attributes('href')).toBe('/send?art=link')
      expect(thanks.text()).toBe(en.send_per_link)
    })

    it('shows the sentence exactly as it goes out, with the address in it', async () => {
      const wrapper = mountPage()
      await openAway(wrapper)

      const shown = wrapper.find('[data-test="show-friends-share-text"]').text()
      expect(shown).toBe(en.showFriends.away.shareText.replace('{url}', ADDRESS))
    })

    /**
     * ⛔ The text alone, with the address inside it: Chrome on Android joins text and url with
     * a space, so a `url` as well would put the address into the message twice.
     */
    it("hands the sentence to the device's share sheet, and copies nothing", async () => {
      const wrapper = mountPage()
      await openAway(wrapper)

      await wrapper.find('[data-test="show-friends-share"]').trigger('click')
      await flushPromises()

      expect(share).toHaveBeenCalledTimes(1)
      const [data] = share.mock.calls[0]
      expect(Object.keys(data)).toEqual(['text'])
      expect(data.text).toBe(wrapper.find('[data-test="show-friends-share-text"]').text())
      expect(data.text.split(ADDRESS)).toHaveLength(2)
      expect(writeText).not.toHaveBeenCalled()
    })

    it('copies the same sentence where the device has no share sheet', async () => {
      delete window.navigator.share
      const wrapper = mountPage()
      await openAway(wrapper)

      await wrapper.find('[data-test="show-friends-share"]').trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledWith(
        en.showFriends.away.shareText.replace('{url}', ADDRESS),
      )
      expect(toast.toastSuccess).toHaveBeenCalledWith(en.showFriends.away.copied)
      expect(toast.toastError).not.toHaveBeenCalled()
    })

    // Closing the sheet is a change of mind: no copy, no message.
    it('stays silent when the member closes the sheet', async () => {
      share.mockRejectedValue(new DOMException('Share canceled', 'AbortError'))
      const wrapper = mountPage()
      await openAway(wrapper)

      await wrapper.find('[data-test="show-friends-share"]').trigger('click')
      await flushPromises()

      expect(writeText).not.toHaveBeenCalled()
      expect(toast.toastSuccess).not.toHaveBeenCalled()
      expect(toast.toastError).not.toHaveBeenCalled()
    })

    /**
     * Some browsers built into other apps have no clipboard at all, and there the call throws
     * before there is a promise. "Copied" is said only once it is copied.
     */
    it('says so when it cannot copy either', async () => {
      delete window.navigator.share
      writeText.mockRejectedValue(new Error('no clipboard'))
      const wrapper = mountPage()
      await openAway(wrapper)

      await wrapper.find('[data-test="show-friends-share"]').trigger('click')
      await flushPromises()

      expect(toast.toastSuccess).not.toHaveBeenCalled()
      expect(toast.toastError).toHaveBeenCalledWith(en['gradidoid-not-copied'])
    })

    it('offers no address to share while the member is not known yet', async () => {
      const wrapper = mountPage({ username: '', gradidoID: null })
      await openAway(wrapper)

      expect(wrapper.find('[data-test="show-friends-share"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-thanks"]').exists()).toBe(true)
    })
  })

  /**
   * ⛔ Wiring with nothing else to notice its absence: without this line the tile on the
   * overview would stay large for ever, which is exactly what W5 rejects.
   */
  it('remembers that this member has been here, on this device', () => {
    window.localStorage.clear()

    mountPage()

    expect(window.localStorage.getItem('show-friends-seen:uuid-1')).toBe('1')
  })

  it('remembers nothing while nobody is named', () => {
    window.localStorage.clear()

    mountPage({ username: '', gradidoID: null })

    expect(window.localStorage.length).toBe(0)
  })

  // Two sentences, the first in bold -- and a space between them, which the template
  // formatter decides and the source does not show.
  it('ends with the two sentences, set apart by a space', () => {
    const wrapper = mountPage()

    expect(wrapper.find('[data-test="show-friends-footer"]').text()).toBe(
      `${en.showFriends.page.footerLead} ${en.showFriends.page.footer}`,
    )
  })
})
