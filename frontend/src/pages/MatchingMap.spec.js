// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import de from '@/locales/de.json'
import MatchingMap from './MatchingMap.vue'
import { listMatchingEntries, userLocationQuery } from '@/graphql/queries'
import { GMS_REJECTED, GMS_UNAVAILABLE } from '@/composables/useMatches'

const replace = vi.fn()
const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push, replace }),
}))

// Keyed by the query document: a mock answering every query the same could not
// show which of the two this page is reacting to, and the order of those two is
// the whole point of one of the tests below.
const handlers = new Map()
const fire = (document, data) => handlers.get(document)?.result?.({ data })

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (document) => {
    const handler = { result: null, error: null }
    handlers.set(document, handler)
    return {
      refetch: vi.fn(),
      onResult: (callback) => {
        handler.result = callback
      },
      onError: (callback) => {
        handler.error = callback
      },
    }
  },
  useMutation: () => ({ mutate: vi.fn().mockResolvedValue({}) }),
}))

const load = vi.fn()
// The offers under the search field. Held out like `load`, so a test can see that
// the page hands the field the real one - a mock without it would let the binding
// be deleted with every test still green.
const suggest = vi.fn(async () => [])
// Held out here so a test can hand the page a result set directly - load() is a
// spy and never fills anything in by itself.
const matches = ref([])
const presence = ref([])
const searchError = ref(null)
vi.mock('@/composables/useMatches', async () => {
  const actual = await vi.importActual('@/composables/useMatches')
  return {
    ...actual,
    useMatches: () => ({ matches, presence, error: searchError, load, suggest }),
  }
})

vi.mock('@/composables/useEntryDraft', () => ({
  useEntryDraft: () => ({ put: vi.fn(), take: () => null }),
}))

// One spy for the whole file, so a test can see what the page told the member.
const toastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError, toastSuccess: vi.fn() }),
}))

vi.mock('leaflet-geosearch', () => ({
  OpenStreetMapProvider: class {
    async search() {
      return []
    }
  },
  GeoSearchControl: class {
    addTo() {
      return this
    }
  },
}))

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } })

const makeStore = (gmsAllowed) =>
  createStore({
    state: { gradidoID: 'a-member', gmsAllowed, userLocation: { latitude: 48.2, longitude: 11.6 } },
    mutations: {
      userLocation: (state, value) => {
        state.userLocation = value
      },
    },
  })

const location = {
  userLocation: { latitude: 48.2, longitude: 11.6 },
  communityLocation: { latitude: 48.1, longitude: 11.5 },
}

const entry = (uuid) => ({
  uuid,
  matchingType: 'MATCHING_TYPE_GESUCH',
  summary: 'Klavierlehrer',
  details: null,
  active: true,
  remote: false,
  createdAt: '2026-08-01T10:00:00.000Z',
})

let wrapper = null

const mountMap = ({ gmsAllowed = true } = {}) => {
  wrapper = mount(MatchingMap, {
    global: {
      plugins: [makeStore(gmsAllowed), i18n],
      stubs: { MatchQuery: true, MatchProfile: true, MatchList: true },
    },
  })
  return wrapper
}

beforeEach(() => {
  handlers.clear()
  replace.mockClear()
  push.mockClear()
  load.mockClear()
  toastError.mockClear()
  matches.value = []
  presence.value = []
  searchError.value = null
  window.localStorage.clear()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('MatchingMap', () => {
  it('hands the search field the offers, so a half-typed word can be finished', async () => {
    const wrapper = mountMap()
    await flushPromises()

    // The field knows nothing about the GMS; the page is what connects the two. A
    // stub answers to any prop name, so this asserts the value, not the name.
    expect(wrapper.findComponent({ name: 'MatchQuery' }).props('suggest')).toBe(suggest)
  })

  describe('when findability is off', () => {
    // The location query is switched off with it, so the redirect that lives in
    // that query's result — the one for "no pin yet" — can never speak. Without an
    // answer here the address, a bookmark or the back button would open a map
    // centred on nothing.
    it('sends the member to the position tab instead of building a map', async () => {
      const page = mountMap({ gmsAllowed: false })
      await page.vm.$nextTick()

      expect(replace).toHaveBeenCalledWith('/matching/position')
    })
  })

  // ⛔ 09.09.2026: an account that had never set a position was answered `{}` here, which
  // is truthy, so the redirect below stayed silent. The page then read `.latitude` off it,
  // put its own marker at (undefined, undefined), stored `{}` as the search centre and
  // asked the GMS about it -- which refused, correctly, and the wallet reported the GMS
  // as unreachable.
  //
  // The router guard turns such a member away before this page is built at all. These
  // measure the belt: the answer that arrives AFTER the guard let somebody through,
  // because the store said yes and the server says no.
  describe('when the position is not two numbers', () => {
    const centreStored = () => window.localStorage.getItem('pref.gms.map.center')

    // The control for the three below: with a real position everything runs, so their
    // silence means the page turned away, not that this spec cannot see anything.
    it('builds the search when the position is real', async () => {
      const page = mountMap()

      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()

      expect(replace).not.toHaveBeenCalled()
      expect(load).toHaveBeenCalledTimes(1)
      expect(JSON.parse(centreStored())).toEqual({ lat: 48.2, lng: 11.6 })
    })

    it.each([
      ['an empty object -- the answer that happened', {}],
      ['nothing at all', null],
      ['half a pair', { latitude: 48.2 }],
      ['coordinates that came as text', { latitude: '48.2', longitude: '11.6' }],
    ])('sends the member to the position tab for %s', async (_name, userLocation) => {
      const page = mountMap()

      fire(userLocationQuery, { userLocation: { ...location, userLocation } })
      await page.vm.$nextTick()

      expect(replace).toHaveBeenCalledWith('/matching/position')
      // No search, and no centre. Both statements sit AFTER the redirect in the same
      // straight run as the marker being drawn, so their absence is the marker's absence
      // too -- Leaflet itself is never built in this environment, there is no sized
      // container and the 250 ms timer never runs, so it cannot be asked directly.
      expect(load).not.toHaveBeenCalled()
      expect(centreStored()).toBeNull()
    })

    // The guard in front of this page reads the store. Correcting only the navigation
    // would let it admit the member again on the next attempt, and the bounce would
    // repeat, silently, every time.
    it('corrects the store the guard reads, not only the navigation', async () => {
      const page = mountMap()

      fire(userLocationQuery, { userLocation: { ...location, userLocation: {} } })
      await page.vm.$nextTick()

      expect(page.vm.$store.state.userLocation).toBeNull()
    })
  })

  // JSON drops `undefined`, so a centre of `{lat: undefined, lng: undefined}` lands in
  // the store as `{}` and reads back like a place somebody chose. That is the fingerprint
  // this fault left on Bernd's device.
  describe('remembering the search centre', () => {
    const recenter = (page, next) =>
      page.findComponent({ name: 'MatchList' }).vm.$emit('recenter', next)

    beforeEach(() => {
      window.localStorage.setItem('pref.gms.map.mode', JSON.stringify('liste'))
    })

    it('remembers a centre that is two numbers', async () => {
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()

      recenter(page, { lat: 49.28, lng: 9.69 })
      await page.vm.$nextTick()

      expect(JSON.parse(window.localStorage.getItem('pref.gms.map.center'))).toEqual({
        lat: 49.28,
        lng: 9.69,
      })
    })

    // Refused where the centre is born: guarding only the write would leave the live
    // centre poisoned while storage kept the old one, and everything drawn from it --
    // circle, crosshair, the reverse-geocoded label -- would run on `undefined`.
    it('turns a centre that is not two numbers away entirely', async () => {
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()
      const before = window.localStorage.getItem('pref.gms.map.center')
      const asked = load.mock.calls.length

      recenter(page, { lat: undefined, lng: undefined })
      await page.vm.$nextTick()

      expect(window.localStorage.getItem('pref.gms.map.center')).toBe(before)
      // Not stored, and not searched for either: the whole move is refused, so the live
      // centre still is the one the stored value names.
      expect(load).toHaveBeenCalledTimes(asked)
      expect(page.findComponent({ name: 'MatchList' }).props('center')).toEqual({
        lat: 48.2,
        lng: 11.6,
      })
    })
  })

  // A 4xx is the GMS answering and refusing; anything else is the GMS not being usable.
  // Two facts, two sentences -- saying "not reachable" for a refusal is what sent a whole
  // morning looking at a healthy server.
  describe('what the member is told when a search does not come back', () => {
    it('says the search was refused when the GMS refused it', async () => {
      const page = mountMap()

      searchError.value = Object.assign(new Error('matches: HTTP 400'), { code: GMS_REJECTED })
      await page.vm.$nextTick()

      expect(toastError).toHaveBeenCalledWith(de.matching.map.searchRejected)
    })

    it('says the search is not reachable when it could not be reached', async () => {
      const page = mountMap()

      searchError.value = Object.assign(new Error('matches: HTTP 503'), { code: GMS_UNAVAILABLE })
      await page.vm.$nextTick()

      expect(toastError).toHaveBeenCalledWith(de.matching.map.searchFailed)
    })
  })

  describe('when my entries arrive after the location', () => {
    // Both queries go out together on a cold load and either can win. When the
    // location wins, the first search carries none of my uuids, so nothing comes
    // back able to say which of my entries it answers.
    it('asks again, this time carrying the uuids', async () => {
      const page = mountMap()

      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()

      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].mineUuids).toEqual([])

      fire(listMatchingEntries, { listMatchingEntries: [entry('a'), entry('b')] })
      await page.vm.$nextTick()

      expect(load).toHaveBeenCalledTimes(2)
      expect(load.mock.calls[1][0].mineUuids).toEqual(['a', 'b'])
    })

    it('does not ask twice when the list arrives unchanged', async () => {
      const page = mountMap()
      const list = [entry('a')]

      fire(userLocationQuery, { userLocation: location })
      fire(listMatchingEntries, { listMatchingEntries: list })
      await page.vm.$nextTick()
      const asked = load.mock.calls.length

      // cache-and-network answers a second time with the very same list.
      fire(listMatchingEntries, { listMatchingEntries: list })
      await page.vm.$nextTick()

      expect(load).toHaveBeenCalledTimes(asked)
    })
  })

  describe('restoring what was open last time', () => {
    const person = (uuid) => ({
      uuid,
      name: 'Anna',
      position: { lat: 48.2, lng: 11.6 },
      community: { name: 'Muenchen' },
      aboutMe: '',
      channels: [],
      scores: {},
      precision: 'genau',
    })
    const profileOpen = (page) => page.findComponent({ name: 'MatchProfile' }).props('modelValue')

    it('opens the saved profile when it is in the first results', async () => {
      window.localStorage.setItem('pref.gms.map.profile', JSON.stringify('u-1'))
      const page = mountMap()

      matches.value = [person('u-1')]
      await page.vm.$nextTick()

      expect(profileOpen(page)).toBe(true)
    })

    // Restoring belongs to arriving. Left on every result set, a saved uuid that
    // happens to turn up in a later search would swing the window open unbidden -
    // which syncProfile's own note says must never happen.
    it('does not open it again on a later search', async () => {
      window.localStorage.setItem('pref.gms.map.profile', JSON.stringify('u-1'))
      const page = mountMap()

      matches.value = [person('u-2')]
      await page.vm.$nextTick()
      expect(profileOpen(page)).toBe(false)

      matches.value = [person('u-1')]
      await page.vm.$nextTick()

      expect(profileOpen(page)).toBe(false)
    })
  })

  describe('when my entries arrive before the location', () => {
    it('does not search before there is a place to search around', async () => {
      const page = mountMap()

      fire(listMatchingEntries, { listMatchingEntries: [entry('a')] })
      await page.vm.$nextTick()

      expect(load).not.toHaveBeenCalled()

      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()

      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].mineUuids).toEqual(['a'])
    })
  })

  describe('when a search does not come through', () => {
    const failed = (code) => Object.assign(new Error(code), { code })

    it('tells the member the search is out of reach, in their words', async () => {
      const page = mountMap()
      await page.vm.$nextTick()
      searchError.value = failed('GMS_UNAVAILABLE')
      await page.vm.$nextTick()
      expect(toastError).toHaveBeenCalledWith('Die Suche ist gerade nicht erreichbar.')
    })

    it('stays quiet when a search simply comes back', async () => {
      const page = mountMap()
      await page.vm.$nextTick()
      searchError.value = null
      await page.vm.$nextTick()
      expect(toastError).not.toHaveBeenCalled()
    })
  })

  describe('the offer to keep a typed search', () => {
    const PREF = 'pref.gms.map.'
    /** A typed search is what the band hangs on; the page reads it back like any choice. */
    const typedSearch = () =>
      window.localStorage.setItem(
        PREF + 'query',
        JSON.stringify({ kind: 'typed', text: 'Ernährungsberatung', matchingType: 'gesuch' }),
      )

    it('offers to keep what was typed', async () => {
      typedSearch()
      const wrapper = mountMap()
      await flushPromises()

      expect(wrapper.find('.keep-offer').exists()).toBe(true)
      expect(wrapper.find('.keep-offer').text()).toContain('Ernährungsberatung')
    })

    it('forgets a plain no once the next search is typed', async () => {
      typedSearch()
      const wrapper = mountMap()
      await flushPromises()

      await wrapper.find('.keep-no').trigger('click')

      expect(wrapper.find('.keep-offer').exists()).toBe(false)
      // Nothing permanent was said, so nothing permanent is stored - the offer is
      // about ONE search, and the next one gets asked again.
      expect(window.localStorage.getItem(PREF + 'queryOfferNever')).toBeNull()
    })

    it('never asks again once the box is ticked and the offer answered', async () => {
      typedSearch()
      const wrapper = mountMap()
      await flushPromises()

      await wrapper.find('.keep-never input').setValue(true)
      // Ticking alone is not an answer: the box says what the next one means.
      expect(wrapper.find('.keep-offer').exists()).toBe(true)

      await wrapper.find('.keep-no').trigger('click')

      expect(wrapper.find('.keep-offer').exists()).toBe(false)
      expect(window.localStorage.getItem(PREF + 'queryOfferNever')).toBe('true')
    })

    it('does not carry a tick over into the next search', async () => {
      typedSearch()
      const wrapper = mountMap()
      await flushPromises()
      await wrapper.find('.keep-never input').setValue(true)

      // Typing something else arms the offer again - and the box belongs to the
      // offer that was on screen, not to the member for ever. Left ticked, the next
      // plain "no, thanks" would silently mean "never again".
      await wrapper
        .findComponent({ name: 'MatchQuery' })
        .vm.$emit('update:selection', { kind: 'typed', text: 'Fahrrad', matchingType: 'gesuch' })
      await flushPromises()

      expect(wrapper.find('.keep-offer').exists()).toBe(true)
      expect(wrapper.find('.keep-never input').element.checked).toBe(false)
    })

    it('stays away on a later visit once it was told to', async () => {
      typedSearch()
      window.localStorage.setItem(PREF + 'queryOfferNever', 'true')
      const wrapper = mountMap()
      await flushPromises()

      // The one thing the stored answer has to survive: a fresh page.
      expect(wrapper.find('.keep-offer').exists()).toBe(false)
    })
  })
})
