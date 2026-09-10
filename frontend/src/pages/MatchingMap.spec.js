// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import L from 'leaflet'
import de from '@/locales/de.json'
import MatchingMap from './MatchingMap.vue'
import { listMatchingEntries, userLocationQuery } from '@/graphql/queries'
import { GMS_REJECTED, GMS_UNAVAILABLE } from '@/composables/useMatches'

// jsdom has no SVG geometry, and Leaflet decides once, when it is imported, whether it
// may draw SVG at all - by looking for createSVGRect. Without it Leaflet finds no
// renderer and the map dies at its first circle, before a single marker is drawn. This
// is only that feature test: the SVG Leaflet then writes is plain DOM, which jsdom has.
vi.hoisted(() => {
  window.SVGSVGElement.prototype.createSVGRect = () => ({})
})

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

// Since 10.09.2026 every map setting hangs under the member, not under the browser -- so
// a test that seeds one has to seed it where THIS member would look.
const MEMBER = 'a-member'
const KEY = `pref.gms.map.${MEMBER}.`

const makeStore = (gmsAllowed) =>
  createStore({
    state: { gradidoID: MEMBER, gmsAllowed, userLocation: { latitude: 48.2, longitude: 11.6 } },
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

const mountMap = ({ gmsAllowed = true, store = makeStore(gmsAllowed) } = {}) => {
  wrapper = mount(MatchingMap, {
    global: {
      plugins: [store, i18n],
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

  // ⛔ 10.09.2026, found by Bernd at the device: every map setting hung under one flat
  // prefix with no member in it, so it belonged to the BROWSER. He switched the keep-offer
  // off once and it stayed off for every account after; a second account carried the street
  // name of the one before it. The sign-out action already clears seven such things, each
  // with the same sentence -- the map page was simply not on that list.
  describe('whose settings the map opens with', () => {
    const flach = (name, value) => window.localStorage.setItem(`pref.gms.map.${name}`, value)
    const fremd = (name, value) =>
      window.localStorage.setItem(`pref.gms.map.somebody-else.${name}`, value)
    const listenAnsicht = (page) => page.findComponent({ name: 'MatchList' }).exists()

    // The control: this member's own key IS read, so the silence below means the page
    // ignored the others rather than that it reads nothing at all.
    it('opens with what THIS member set', async () => {
      window.localStorage.setItem(`${KEY}mode`, JSON.stringify('liste'))
      const page = mountMap()
      await page.vm.$nextTick()

      expect(listenAnsicht(page)).toBe(true)
    })

    it('does not open with what the device was left in', async () => {
      flach('mode', JSON.stringify('liste'))
      const page = mountMap()
      await page.vm.$nextTick()

      expect(listenAnsicht(page)).toBe(false)
    })

    it('does not open with what another member set', async () => {
      fremd('mode', JSON.stringify('liste'))
      const page = mountMap()
      await page.vm.$nextTick()

      expect(listenAnsicht(page)).toBe(false)
    })

    // ⛔ And the case with no member at all: the store has not filled yet, or filled
    // without the id. There is no honest key then -- the flat one is the fault, and a
    // made-up one (`null` glued to the setting name) would litter the browser with keys
    // nobody can attribute or clean up. So: read nothing, write nothing, open on defaults.
    it('writes nothing at all when the store cannot say who is signed in', async () => {
      const namenlos = createStore({
        state: { gmsAllowed: true, userLocation: { latitude: 48.2, longitude: 11.6 } },
        mutations: { userLocation: () => {} },
      })
      const page = mountMap({ store: namenlos })

      fire(userLocationQuery, { userLocation: location })
      await flushPromises()

      expect(Object.keys(window.localStorage)).toEqual([])
      // ...and the map is built all the same, on its defaults.
      expect(load).toHaveBeenCalled()
    })

    // The other half of the same rule, and the one my own comment got wrong: `null` glued
    // to a setting name gives `nullmode`, an ordinary key on an origin the wallet SHARES
    // with the admin. It cannot be written from here -- but "nothing on this origin ever
    // writes it" is a claim about every program on it, and not one this page can make.
    it('reads nothing either when the store cannot say who is signed in', async () => {
      window.localStorage.setItem('nullmode', JSON.stringify('liste'))
      const namenlos = createStore({
        state: { gmsAllowed: true, userLocation: { latitude: 48.2, longitude: 11.6 } },
        mutations: { userLocation: () => {} },
      })
      const page = mountMap({ store: namenlos })
      await page.vm.$nextTick()

      expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(false)
    })

    // The sweep of the old flat keys moved to sign-out (store.js, beside the seven other
    // things that must not outlive one member), because an account without a position
    // never reaches this page and its device was therefore never cleared. What matters
    // here is only that the page ignores them, which the two cases above measure.
    it("leaves the old flat keys where they are -- clearing them is the sign-out's job", async () => {
      flach('queryOfferNever', 'true')

      mountMap()
      await flushPromises()

      expect(window.localStorage.getItem('pref.gms.map.queryOfferNever')).toBe('true')
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
    const centreStored = () => window.localStorage.getItem(`${KEY}center`)

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
      // too -- Leaflet itself is not built in this test, the 250 ms timer never runs
      // here, so it cannot be asked directly.
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
      window.localStorage.setItem(`${KEY}mode`, JSON.stringify('liste'))
    })

    it('remembers a centre that is two numbers', async () => {
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()

      recenter(page, { lat: 49.28, lng: 9.69 })
      await page.vm.$nextTick()

      expect(JSON.parse(window.localStorage.getItem(`${KEY}center`))).toEqual({
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
      const before = window.localStorage.getItem(`${KEY}center`)
      const asked = load.mock.calls.length

      recenter(page, { lat: undefined, lng: undefined })
      await page.vm.$nextTick()

      expect(window.localStorage.getItem(`${KEY}center`)).toBe(before)
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
      window.localStorage.setItem(`${KEY}profile`, JSON.stringify('u-1'))
      const page = mountMap()

      matches.value = [person('u-1')]
      await page.vm.$nextTick()

      expect(profileOpen(page)).toBe(true)
    })

    // Restoring belongs to arriving. Left on every result set, a saved uuid that
    // happens to turn up in a later search would swing the window open unbidden -
    // which syncProfile's own note says must never happen.
    it('does not open it again on a later search', async () => {
      window.localStorage.setItem(`${KEY}profile`, JSON.stringify('u-1'))
      const page = mountMap()

      matches.value = [person('u-2')]
      await page.vm.$nextTick()
      expect(profileOpen(page)).toBe(false)

      matches.value = [person('u-1')]
      await page.vm.$nextTick()

      expect(profileOpen(page)).toBe(false)
    })
  })

  // F-10, Bernd at his iPhone: the small discs could hardly be hit. Leaflet is built here
  // on purpose, unlike everywhere above - the 250 ms timer is run by hand and the view is
  // seeded, so the zoom and with it every pixel between two people are known.
  describe('the tap area of a coloured marker', () => {
    const VIEW = { lat: 48.2, lng: 11.6, zoom: 12 }
    // 0.46 is the dimmest brightness the GMS sends: step 1, the smallest disc there is.
    const person = (uuid, position) => ({
      uuid,
      name: uuid,
      position,
      community: { name: 'Muenchen' },
      aboutMe: '',
      channels: {
        gesuch: [
          { uuid: `${uuid}-entry`, strength: 0.46, matchedEntryUuid: 'mine', matchedSubject: 'x' },
        ],
      },
      scores: { gesuch: [{ strength: 0.46, entry: 'mine', subject: 'x' }] },
      precision: 'genau',
    })
    // The point `px` screen pixels east of the seeded view's middle.
    const east = (px) => {
      const centre = L.CRS.EPSG3857.latLngToPoint(L.latLng(VIEW.lat, VIEW.lng), VIEW.zoom)
      const { lat, lng } = L.CRS.EPSG3857.pointToLatLng(centre.add([px, 0]), VIEW.zoom)
      return { lat, lng }
    }
    const px = (element, property) => element.style[property]

    const buildMap = async (look, people) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      window.localStorage.setItem(`${KEY}look`, JSON.stringify(look))
      window.localStorage.setItem(`${KEY}view`, JSON.stringify(VIEW))
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()
      vi.advanceTimersByTime(250)
      matches.value = people
      await page.vm.$nextTick()
      return page
    }
    const tap = (element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const zoomNow = () => JSON.parse(window.localStorage.getItem(`${KEY}view`)).zoom
    const profileOpen = (page) => page.findComponent({ name: 'MatchProfile' }).props('modelValue')

    afterEach(() => {
      vi.useRealTimers()
    })

    it('keeps a step-1 disc at 20 px on the light map and gives it 44 px to tap', async () => {
      const page = await buildMap('hell', [person('anna', east(0))])

      const box = page.find('.gk-clickable').element
      expect(px(page.find('.gk-disc').element, 'width')).toBe('20px')
      expect(px(page.find('.gk-hit').element, 'width')).toBe('44px')
      // The box is as big as the tap area, and still centred on the person.
      expect([px(box, 'width'), px(box, 'height'), px(box, 'marginLeft')]).toEqual([
        '44px',
        '44px',
        '-22px',
      ])
    })

    it('gives the same person 44 px to tap inside the glow on the dark map', async () => {
      const page = await buildMap('dunkel', [person('anna', east(0))])

      expect(px(page.find('.gk-hit').element, 'width')).toBe('44px')
      expect(px(page.find('.gk-clickable').element, 'width')).toBe('48px')
    })

    // 40 px apart, two tap areas of 44 px overlap: a finger there could mean either, so the
    // map steps in rather than opening whichever area happened to lie on top.
    it('zooms in when two tap areas overlap instead of opening one of them', async () => {
      const page = await buildMap('hell', [person('anna', east(0)), person('ben', east(40))])

      tap(page.findAll('.gk-hit')[0].element)
      await page.vm.$nextTick()

      expect(profileOpen(page)).toBe(false)
      expect(zoomNow()).toBe(VIEW.zoom + 2)
    })

    // The control for the one above: with room between them the same tap opens the person,
    // so the zoom there is the overlap speaking, not every tap zooming. 70 px is beyond the
    // largest tap area there is - 60 px since the fifth step - so beyond the crowd radius.
    it('opens the person when no other tap area reaches theirs', async () => {
      const page = await buildMap('hell', [person('anna', east(0)), person('ben', east(70))])

      tap(page.findAll('.gk-hit')[0].element)
      await page.vm.$nextTick()

      expect(profileOpen(page)).toBe(true)
      expect(zoomNow()).toBe(VIEW.zoom)
    })

    // GMS-184: a step-4 match that answers a second thing of mine reaches the fifth step
    // once "Wer mehrfach passt" is on - and the fifth step has a size of its own.
    describe('on the fifth step', () => {
      const broad = (uuid) => ({
        ...person(uuid, east(0)),
        scores: {
          gesuch: [
            { strength: 0.865, entry: 'my-bike', subject: 'fahrrad' },
            { strength: 0.595, entry: 'my-flat', subject: 'wohnung' },
          ],
        },
      })

      it('draws the fifth size on the dark map and on the light one', async () => {
        window.localStorage.setItem(`${KEY}breite`, JSON.stringify(true))
        const dark = await buildMap('dunkel', [broad('clara')])
        expect(px(dark.find('.gk-clickable').element, 'width')).toBe('130px')
        expect(px(dark.find('.gk-hit').element, 'width')).toBe('60px')
        dark.unmount()
        wrapper = null

        const light = await buildMap('hell', [broad('clara')])
        expect(px(light.find('.gk-disc').element, 'width')).toBe('60px')
        expect(px(light.find('.gk-clickable').element, 'width')).toBe('60px')
      })

      // The control: the same person without breadth is a step-4 match, sized as one.
      it('stays on the fourth size while breadth is off', async () => {
        const dark = await buildMap('dunkel', [broad('clara')])
        expect(px(dark.find('.gk-clickable').element, 'width')).toBe('104px')
      })
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
    const PREF = KEY
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
