// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ref } from 'vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import L from 'leaflet'
import de from '@/locales/de.json'
import MatchingMap from './MatchingMap.vue'
import { listMatchingEntries, userLocationQuery } from '@/graphql/queries'
import { GMS_REJECTED, GMS_UNAVAILABLE } from '@/composables/useMatches'
import { NOMINATIM_REVERSE_URL } from '@/utils/reverseGeocode'

// jsdom has no SVG geometry, and Leaflet decides once, when it is imported, whether it
// may draw SVG at all - by looking for createSVGRect. Without it Leaflet finds no
// renderer and the map dies at its first circle, before a single marker is drawn. This
// is only that feature test: the SVG Leaflet then writes is plain DOM, which jsdom has.
//
// The grey rings are drawn on a canvas, which jsdom does not paint either. Leaflet only
// needs a 2D context that takes every call; its own hit test - how near a tap has to be
// to a ring - is plain arithmetic and runs as it does in a browser.
vi.hoisted(() => {
  window.SVGSVGElement.prototype.createSVGRect = () => ({})
  window.HTMLCanvasElement.prototype.getContext = () =>
    new Proxy({}, { get: (target, name) => (name in target ? target[name] : () => {}) })
})

// A pending canvas redraw that arrives after its renderer is gone. Leaflet cancels the
// frame when the renderer is removed; in jsdom the frame runs anyway, and `_clear` then
// reads `save` off a context that `_destroyContainer` has deleted. Measured on
// 12.09.2026: ANY click that redraws while grey rings are on the canvas raises it,
// `applyRadius` included - it is the environment, not the page. Guarded exactly as
// Leaflet guards it and no wider: a redraw WITH a context still runs, so a test that
// expects something drawn can still fail. Below the imports, not in vi.hoisted, because
// that block runs before `L` exists.
const redrawCanvas = L.Canvas.prototype._redraw
L.Canvas.prototype._redraw = function guardedRedraw() {
  if (this._ctx) redrawCanvas.call(this)
}

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
// The profile route. Held out like `load`, so a test can see what the window asks for
// and hand it an answer - or none.
const profile = vi.fn()
vi.mock('@/composables/useMatches', async () => {
  const actual = await vi.importActual('@/composables/useMatches')
  return {
    ...actual,
    useMatches: () => ({ matches, presence, error: searchError, load, suggest, profile }),
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

// The search control is leaflet-geosearch's own and searches nothing here. What the page
// decides is the provider it hands the control, so the options each control was built with
// are kept.
const controls = []
vi.mock('leaflet-geosearch', () => ({
  GeoSearchControl: class {
    constructor(options) {
      controls.push(options)
    }

    addTo() {
      return this
    }
  },
}))

// The admin switch for the place search (K-008), in whatever position a test puts it. The
// old one by default, as on a server nobody has switched.
const switchPosition = { geoProvider: 'NOMINATIM' }
const mapSwitches = vi.fn(async () => ({ mapEngine: 'LEAFLET', ...switchPosition }))
vi.mock('@/composables/useMapSwitches', async () => {
  const actual = await vi.importActual('@/composables/useMapSwitches')
  return { ...actual, useMapSwitches: () => ({ mapSwitches }) }
})

const gmsBase = vi.fn(async () => 'https://ki-playground-gms.gradido.net/gms/')
vi.mock('@/composables/useGmsBase', () => ({
  useGmsBase: () => ({ gmsBase }),
}))

// The provider is measured in its own spec (utils/geoSearchProvider); here only what the
// page makes it with and hands on.
const madeProvider = { search: vi.fn(async () => []) }
const makeGeoProvider = vi.fn(() => madeProvider)
vi.mock('@/utils/geoSearchProvider', () => ({
  makeGeoProvider: (options) => makeGeoProvider(options),
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
  // By default the profile route answers with a person who published nothing more.
  profile.mockReset()
  profile.mockImplementation(async (uuid) => ({ uuid, aboutMe: null, channels: {} }))
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

  // Bernd, 11.09.2026: the way back left the map for the search line, on the map and in
  // the list alike, so the map's own controls can take the corner.
  it('puts the way back at the start of the search line, off the map, and leads to the entries', async () => {
    const onMap = mountMap()
    await flushPromises()
    expect(onMap.find('.query-row > .map-back + .query-field').exists()).toBe(true)
    expect(onMap.find('.map-shell .map-back').exists()).toBe(false)

    await onMap.find('.map-back').trigger('click')
    expect(push).toHaveBeenCalledWith('/matching/entries')
    onMap.unmount()

    window.localStorage.setItem(`${KEY}mode`, JSON.stringify('liste'))
    const inList = mountMap()
    await flushPromises()
    expect(inList.find('.query-row > .map-back').exists()).toBe(true)
    expect(inList.find('.map-shell .map-back').exists()).toBe(false)
  })

  // jsdom lays nothing out, so how wide a chosen sentence claims to be cannot be measured
  // here; the rule that keeps it from widening the page is read in the source instead.
  // Measured in a browser on 11.09.2026: without it, a long entry chosen, the page dropped
  // under the menu between 1070 and 1025px (Bernd's screenshots).
  it('keeps a long question from widening the page', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const source = readFileSync(join(here, 'MatchingMap.vue'), 'utf8')
    const rule = source.match(/\n\.query-field \{([^}]*)\}/)

    expect(rule, 'no .query-field rule in the page').not.toBeNull()
    expect(rule[1]).toMatch(/contain: inline-size;/)
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
  // How far the question travels. Two reaches, and each owns its own radius: the
  // switch is useless if getting back means re-setting the circle by hand.
  describe('the reach', () => {
    const seed = (name, value) =>
      window.localStorage.setItem(`${KEY}${name}`, JSON.stringify(value))
    const reachButtons = (page) => page.findAll('.reach-btn')
    const settle = async (page) => {
      fire(userLocationQuery, { userLocation: location })
      await flushPromises()
      return page
    }
    const lastSearch = () => load.mock.calls.at(-1)[0]

    it("opens in the reach it was left in, with that reach's own circle", async () => {
      seed('reach', 'fern')
      seed('radiusFern', 700)
      // The regional circle is stored too, and must NOT be the one used.
      seed('radius', 30)

      const page = await settle(mountMap())

      expect(lastSearch()).toMatchObject({ radius: 700, remoteOnly: true })
      const [regional, wide] = reachButtons(page)
      expect(wide.attributes('aria-pressed')).toBe('true')
      expect(regional.attributes('aria-pressed')).toBe('false')
    })

    it('searches the wide reach on its own radius when the switch is used', async () => {
      const page = await settle(mountMap())
      // The control: it starts regional, on the regional default.
      expect(lastSearch()).toMatchObject({ radius: 25, remoteOnly: false })

      await reachButtons(page)[1].trigger('click')
      await flushPromises()

      expect(lastSearch()).toMatchObject({ radius: 500, remoteOnly: true })
      expect(JSON.parse(window.localStorage.getItem(`${KEY}reach`))).toBe('fern')
    })

    it('brings the regional circle back, untouched, on the way back', async () => {
      seed('radius', 30)
      const page = await settle(mountMap())

      await reachButtons(page)[1].trigger('click')
      await flushPromises()
      expect(lastSearch()).toMatchObject({ radius: 500, remoteOnly: true })

      await reachButtons(page)[0].trigger('click')
      await flushPromises()

      // The number the member had before the detour, not the default and not 500.
      expect(lastSearch()).toMatchObject({ radius: 30, remoteOnly: false })
    })

    it('sets the circle of the reach that is standing, and leaves the other one alone', async () => {
      seed('radius', 30)
      const page = await settle(mountMap())
      await reachButtons(page)[1].trigger('click')
      await flushPromises()

      // The dialog's field is bootstrap-vue-next's, which this spec does not resolve -
      // so the draft is set where the field would set it, and the key that submits is
      // the real one on the real element.
      page.vm.radiusDraft = 800
      await page.find('#map-radius-input').trigger('keyup.enter')
      await flushPromises()

      expect(JSON.parse(window.localStorage.getItem(`${KEY}radiusFern`))).toBe(800)
      // The regional key is the one every member already has a number in. Writing the
      // wide circle into it would move a setting nobody touched.
      expect(JSON.parse(window.localStorage.getItem(`${KEY}radius`))).toBe(30)
      expect(lastSearch()).toMatchObject({ radius: 800, remoteOnly: true })
    })

    // Found by coderabbit on 12.09.2026, and it is the gap between the click and the
    // answer: `load` clears presence, but only after a token fetch and a round trip.
    // Until then the rings of the 25 km circle would sit inside the 500 km one - and
    // the two boxes that would hide them have just left the controls.
    it('drops the rings the moment the reach changes, not when the answer comes', async () => {
      seed('mode', 'liste')
      const page = await settle(mountMap())
      presence.value = [
        {
          id: 2,
          uuid: 'r-1',
          name: 'Paul',
          community: { uuid: 'c-1', name: 'Muenchen' },
          hasEntries: false,
          position: { lat: 48.2, lng: 11.6 },
          precision: 'ungefaehr',
        },
      ]
      await page.vm.$nextTick()
      // The control: regional, and the ring is counted and listed.
      expect(page.text()).toContain(de.matching.map.found.replace('{n}', '1'))
      expect(page.findComponent({ name: 'MatchList' }).props('silent')).toHaveLength(1)

      await reachButtons(page)[1].trigger('click')
      await page.vm.$nextTick()

      // `presence` still holds Paul - the search has not answered, and load is a spy
      // that never answers at all. The page must not be showing him all the same.
      expect(presence.value).toHaveLength(1)
      expect(page.findComponent({ name: 'MatchList' }).props('silent')).toEqual([])
      expect(page.text()).toContain(de.matching.map.found.replace('{n}', '0'))
    })

    // Today the number has to be deleted by hand before a new one can be typed.
    it('opens the radius dialog with the number selected, so a keystroke replaces it', async () => {
      const page = await settle(mountMap())
      // The binding first, before it is replaced below: without `ref` on the field
      // there would be nothing to select, and handing one in would hide that.
      expect(page.vm.radiusInput?.id).toBe('map-radius-input')

      const select = vi.fn()
      // BFormInput hands out { blur, element, focus } (measured in the installed
      // package); this spec does not resolve it, so what it would expose is handed in.
      page.vm.radiusInput = { element: { select } }

      // The wiring itself: the dialog's own `shown`, dispatched on the element the
      // unresolved BModal leaves behind. `shown` fires on every opening and after the
      // transition - the first moment the field can take focus.
      page.element.querySelector('bmodal').dispatchEvent(new CustomEvent('shown'))
      await page.vm.$nextTick()

      expect(select).toHaveBeenCalled()
    })

    // The dialog looks the same in both reaches; only this line says which circle is
    // being set - and a number typed into the wrong one is noticed much later.
    it('says which of the two circles the dialog is setting, and where the other stays', async () => {
      seed('radius', 30)
      seed('radiusFern', 700)
      const page = await settle(mountMap())

      // Regional standing: the line names the regional search and the WIDE number as
      // the one that stays - so the two halves cannot be swapped without this failing.
      expect(page.text()).toContain(de.matching.map.radiusHintRegional.replace('{km}', '700'))

      await reachButtons(page)[1].trigger('click')
      await flushPromises()

      expect(page.text()).toContain(de.matching.map.radiusHintFern.replace('{km}', '30'))
    })

    // Wiring, not behaviour, and wiring is what nothing tests by itself: the list's
    // own spec is handed these props, so deleting them HERE left every test green.
    it('tells the list which reach it is showing, and on what circle', async () => {
      // The list covers the map rather than replacing it, so the reach switch is still
      // there to be pressed while it is showing.
      seed('mode', 'liste')
      const page = await settle(mountMap())
      const list = () => page.findComponent({ name: 'MatchList' })
      expect(list().props('reach')).toBe('regional')
      expect(list().props('radiusKm')).toBe(25)

      await reachButtons(page)[1].trigger('click')
      await flushPromises()

      expect(list().props('reach')).toBe('fern')
      expect(list().props('radiusKm')).toBe(500)
    })

    // The switch sits inside .controls-heading, which is bold, and `font: inherit` on
    // a button pulls that weight down with everything else - so without a weight of
    // its own the resting button comes out bold too and the is-on rule changes
    // nothing. vitest applies no scoped component CSS, so the rules are read in the
    // source; all three of them, because the finding is the RELATION between them.
    it('leaves the standing reach as the only bold one', () => {
      const here = dirname(fileURLToPath(import.meta.url))
      const source = readFileSync(join(here, 'MatchingMap.vue'), 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      )
      const ruleOf = (name) => source.match(new RegExp(`\\n\\${name} \\{([^}]*)\\}`))?.[1]

      // Why the reset is needed at all - if this ever stops being bold, the reset may go.
      expect(ruleOf('.controls-heading'), 'no .controls-heading rule').toMatch(/font-weight: 700;/)
      // What the standing button is supposed to be.
      expect(ruleOf('.reach-btn.is-on'), 'no .reach-btn.is-on rule').toMatch(/font-weight: 700;/)

      // ...and the reset itself. Anything at 700 here makes the line above dead.
      const resting = ruleOf('.reach-btn')
      expect(resting, 'no .reach-btn rule').toBeDefined()
      const weight = resting.match(/font-weight: (\d+);/)
      expect(weight, '.reach-btn sets no weight of its own').not.toBeNull()
      expect(Number(weight[1])).toBeLessThan(700)
    })

    // jsdom lays nothing out, so the wrap cannot be measured here; the rule that
    // allows it is read in the source instead. Before the switch stood in front of
    // it the row was `nowrap`, which on a 375 px phone would now run off the card.
    it('lets the radius row break rather than run off a phone', () => {
      const here = dirname(fileURLToPath(import.meta.url))
      // Comments first: one of them names flex-wrap, and a guard that reads its own
      // explanation proves nothing.
      const source = readFileSync(join(here, 'MatchingMap.vue'), 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      )
      const rule = source.match(/\n\.radius-row \{([^}]*)\}/)

      expect(rule, 'no .radius-row rule in the page').not.toBeNull()
      expect(rule[1]).toMatch(/flex-wrap: wrap;/)
      expect(rule[1]).not.toMatch(/white-space: nowrap;/)
    })

    // The two grey buckets are the presence rings, and the wide search draws none.
    it('puts the two grey boxes away in the wide reach, and keeps the three channels', async () => {
      const page = await settle(mountMap())
      // The amplifier is a .map-check as well; the five that answer to the reach are
      // the ones carrying a colour swatch.
      const boxes = () => page.findAll('.map-check .swatch').length
      expect(boxes()).toBe(5)

      await reachButtons(page)[1].trigger('click')
      await flushPromises()

      expect(boxes()).toBe(3)
      // And the sentence that says why they went.
      expect(page.text()).toContain(de.matching.map.reach.fernHint)

      await reachButtons(page)[0].trigger('click')
      await flushPromises()
      expect(boxes()).toBe(5)
    })
  })

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
    // circle, crosshair, the name the list gives the centre -- would run on `undefined`.
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
    // Both queries go out together on a cold load and either can win. The GMS reads my
    // entries through the token, so the first search is tagged either way; a change
    // in the list is what asks again, and on a cold load the list arriving counts.
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

    // Since a ring opens the window too, the window can be left open on a ring - off to
    // "Gradido senden" and back - and a search can bring rings and no match at all.
    it('opens a saved ring again, with no match in the results', async () => {
      window.localStorage.setItem(`${KEY}profile`, JSON.stringify('r-1'))
      const page = mountMap()

      presence.value = [
        {
          id: 2,
          uuid: 'r-1',
          name: 'Paul',
          community: { uuid: 'c-1', name: 'Muenchen' },
          hasEntries: false,
          position: { lat: 48.2, lng: 11.6 },
          precision: 'ungefaehr',
        },
      ]
      await page.vm.$nextTick()

      expect(profileOpen(page)).toBe(true)
      expect(profile).toHaveBeenCalledWith('r-1', 'c-1')
    })
  })

  // GMS-111, Bernd 10.09.2026: a match, a grey ring and a silent line of the list open the
  // same window. It opens at once with what the map knows and fills in the rest.
  describe('the one window for a match and a ring', () => {
    const match = {
      uuid: 'u-1',
      name: 'Anna',
      position: { lat: 48.2, lng: 11.6 },
      community: { uuid: 'c-1', name: 'Muenchen' },
      aboutMe: 'Ich repariere.',
      precision: 'genau',
      channels: {
        angebot: [
          { uuid: 'e-bike', summary: 'Fahrradreparatur', strength: 0.73, matchedEntryUuid: 'mine' },
        ],
      },
      scores: { angebot: [{ strength: 0.73, entry: 'mine', subject: 'fahrrad' }] },
    }
    const ring = {
      id: 2,
      uuid: 'r-1',
      name: 'Paul',
      community: { uuid: 'c-1', name: 'Muenchen' },
      hasEntries: true,
      position: { lat: 48.21, lng: 11.61 },
      precision: 'ungefaehr',
    }
    // Everything Anna published: the matched offer and one more, newest first.
    const annasProfile = {
      uuid: 'u-1',
      aboutMe: 'Ich repariere.',
      channels: {
        angebot: [
          { uuid: 'e-new', summary: 'Lastenrad leihen', details: null, remote: false },
          { uuid: 'e-bike', summary: 'Fahrradreparatur', details: null, remote: false },
        ],
      },
    }
    const shown = (page) => page.findComponent({ name: 'MatchProfile' })
    const inList = () => window.localStorage.setItem(`${KEY}mode`, JSON.stringify('liste'))
    const open = (page, person) =>
      page.findComponent({ name: 'MatchList' }).vm.$emit('open', person)

    it('opens a match at once and lays everything else they published in', async () => {
      inList()
      profile.mockResolvedValueOnce(annasProfile)
      const page = mountMap()

      open(page, match)
      await page.vm.$nextTick()
      // At once, with what the map knows...
      expect(shown(page).props('modelValue')).toBe(true)
      expect(shown(page).props('match').channels.angebot).toHaveLength(1)

      await flushPromises()
      // ...and then the whole person, the matched offer keeping its strength.
      expect(profile).toHaveBeenCalledWith('u-1', 'c-1')
      const offers = shown(page).props('match').channels.angebot
      expect(offers.map((entry) => [entry.summary, entry.strength])).toEqual([
        ['Lastenrad leihen', undefined],
        ['Fahrradreparatur', 0.73],
      ])
    })

    it('opens a silent person with their name and community, then fills in', async () => {
      inList()
      profile.mockResolvedValueOnce({ uuid: 'r-1', aboutMe: 'Ich imkere.', channels: {} })
      const page = mountMap()

      open(page, ring)
      await page.vm.$nextTick()
      expect(shown(page).props('match').name).toBe('Paul')
      expect(shown(page).props('match').community.name).toBe('Muenchen')

      await flushPromises()
      expect(shown(page).props('match').aboutMe).toBe('Ich imkere.')
    })

    it('keeps what it shows and says so when the profile does not come', async () => {
      inList()
      profile.mockRejectedValueOnce(new Error('community-user/profile: HTTP 503'))
      const page = mountMap()

      open(page, match)
      await page.vm.$nextTick()
      const opened = shown(page).props('match')
      await flushPromises()

      expect(toastError).toHaveBeenCalledWith(de.matching.profile.unavailable)
      expect(shown(page).props('modelValue')).toBe(true)
      expect(shown(page).props('match')).toEqual(opened)
      expect(opened.channels.angebot.map((entry) => entry.summary)).toEqual(['Fahrradreparatur'])
    })

    // Bauauftrag D, 10.09.2026: the matches route sends one record per pair, so an offer that
    // answers two of my entries came into the window twice until the profile arrived.
    it('shows an entry of theirs once, though it answers two of mine', async () => {
      inList()
      profile.mockImplementationOnce(() => new Promise(() => {}))
      const page = mountMap()

      const bike = match.channels.angebot[0]
      open(page, {
        ...match,
        channels: {
          angebot: [
            { ...bike, strength: 0.46, matchedEntryUuid: 'mine-a' },
            { ...bike, strength: 0.73, matchedEntryUuid: 'mine-b' },
          ],
        },
      })
      await page.vm.$nextTick()

      const offers = shown(page).props('match').channels.angebot
      expect(offers.map((entry) => [entry.uuid, entry.strength, entry.mine])).toEqual([
        ['e-bike', 0.73, ['mine-b', 'mine-a']],
      ])
    })

    // The line "passt zu" names my own entry. My entries and the window arrive on their
    // own schedules, so the window reads them as they come, not once at opening.
    it('names the entry of mine a match answers, also when my entries come after it opened', async () => {
      inList()
      const page = mountMap()

      open(page, match)
      await flushPromises()
      expect(shown(page).props('match').channels.angebot[0].matches).toEqual([])

      fire(listMatchingEntries, {
        listMatchingEntries: [
          {
            uuid: 'mine',
            matchingType: 'need',
            summary: 'einen Fahrradmechaniker',
            details: null,
            active: true,
            remote: false,
            createdAt: '2026-09-01T10:00:00.000Z',
          },
        ],
      })
      await page.vm.$nextTick()

      expect(shown(page).props('match').channels.angebot[0].matches).toEqual([
        { uuid: 'mine', matchingType: 'need', summary: 'einen Fahrradmechaniker' },
      ])
    })

    // Two taps in quick succession: the answer for the first may come after the second.
    it('does not let a late answer land in the window of the next person', async () => {
      inList()
      let answerAnna
      profile
        .mockImplementationOnce(() => new Promise((resolve) => (answerAnna = resolve)))
        .mockResolvedValueOnce({ uuid: 'r-1', aboutMe: 'Ich imkere.', channels: {} })
      const page = mountMap()

      open(page, match)
      open(page, ring)
      await flushPromises()
      answerAnna(annasProfile)
      await flushPromises()

      expect(shown(page).props('match').name).toBe('Paul')
      expect(shown(page).props('match').aboutMe).toBe('Ich imkere.')
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

    // Bernd, 10.09.2026: the grey rings open the profile too, with the same tap area as
    // the markers. The ring stands in the middle of the view, which jsdom lays out at no
    // size - container point (0, 0) - so the distance of a tap to it is its clientX.
    describe('a grey ring', () => {
      const ring = () => ({
        id: 2,
        uuid: 'r-1',
        name: 'Paul',
        community: { uuid: 'c-1', name: 'Muenchen' },
        hasEntries: true,
        position: east(0),
        precision: 'ungefaehr',
      })
      const tapCanvas = (page, x) =>
        page
          .find('.leaflet-overlay-pane canvas')
          .element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: 0 }))

      // 15 px out is far beside the ring's own 6 px, and well inside the 22 px of a 44 px area.
      it('opens from anywhere in a 44 px tap area around it', async () => {
        presence.value = [ring()]
        const page = await buildMap('hell', [])

        tapCanvas(page, 15)
        await page.vm.$nextTick()

        expect(profileOpen(page)).toBe(true)
        expect(profile).toHaveBeenCalledWith('r-1', 'c-1')
      })

      it('does not open from beyond that area', async () => {
        presence.value = [ring()]
        const page = await buildMap('hell', [])

        tapCanvas(page, 30)
        await page.vm.$nextTick()

        expect(profileOpen(page)).toBe(false)
      })

      // Found by the injection round on 12.09.2026. The reactive half of the reach
      // switch (the count, the list) went with it, but the rings are drawn
      // imperatively and nothing watches `reach` - so without drawPresence() in
      // setReach they stayed on the canvas, and tappable, until the answer came.
      // The test above is this one's control: same ring, same 15 px, and it opens.
      it('goes from the canvas the moment the reach changes, not when the answer comes', async () => {
        presence.value = [ring()]
        const page = await buildMap('hell', [])

        await page.findAll('.reach-btn')[1].trigger('click')
        await page.vm.$nextTick()
        tapCanvas(page, 15)
        await page.vm.$nextTick()

        // `load` is a spy, so presence still holds Paul: only the redraw can have
        // taken him off the canvas.
        expect(presence.value).toHaveLength(1)
        expect(profileOpen(page)).toBe(false)
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

  // K-002: the list names where it searches - and the member's home goes to no place search
  // for that, in either position of the admin switch. Before, the first visit sent the exact
  // home position to Nominatim, at zoom 16.
  describe('naming the centre in the list', () => {
    const HOME = { lat: 48.2, lng: 11.6 }
    // About 17 km from home: well clear of "home within 100 m".
    const ELSEWHERE = { lat: 48.3, lng: 11.8 }
    const PRAG = { lat: 50.0874654, lng: 14.4212535, label: 'Prag' }
    const NOMINATIM_ANSWER = { address: { road: 'Marktplatz', town: 'Freising' } }
    const listLabel = (page) => page.findComponent({ name: 'MatchList' }).props('centerLabel')
    const recenter = (page, next) =>
      page.findComponent({ name: 'MatchList' }).vm.$emit('recenter', next)
    let fetchMock

    // Leaflet itself, for the two controls that live on the map - the crosshair and the home
    // button. The 250 ms timer is run by hand, and the view is seeded where the map opens.
    const openMap = async (view) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      window.localStorage.setItem(`${KEY}view`, JSON.stringify({ ...view, zoom: 12 }))
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()
      vi.advanceTimersByTime(250)
      vi.useRealTimers()
      await flushPromises()
      return page
    }
    const tapHomeButton = (page) =>
      page
        .find('.gk-home a')
        .element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    beforeEach(() => {
      // The list is what shows the name.
      window.localStorage.setItem(`${KEY}mode`, JSON.stringify('liste'))
      switchPosition.geoProvider = 'NOMINATIM'
      mapSwitches.mockClear()
      makeGeoProvider.mockClear()
      controls.length = 0
      fetchMock = vi.fn(async () => ({ ok: true, json: async () => NOMINATIM_ANSWER }))
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    })

    it.each(['NOMINATIM', 'GMS'])(
      'calls the centre of a first visit the home and asks nobody (switch on %s)',
      async (position) => {
        switchPosition.geoProvider = position
        const page = mountMap()
        fire(userLocationQuery, { userLocation: location })
        await flushPromises()

        expect(JSON.parse(window.localStorage.getItem(`${KEY}center`))).toEqual(HOME)
        expect(listLabel(page)).toBe(de.matching.map.centreHome)
        expect(fetchMock).not.toHaveBeenCalled()
      },
    )

    // Until K-002 the first visit and the home button stored the reverse lookup of the home,
    // and that name is still on the devices of everybody who used the map before.
    it('calls the home the home, also where the old lookup stored a street name for it', async () => {
      window.localStorage.setItem(`${KEY}center`, JSON.stringify(HOME))
      window.localStorage.setItem(`${KEY}centerLabel`, JSON.stringify('Pfarrweg, Künzelsau'))
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await flushPromises()

      expect(listLabel(page)).toBe(de.matching.map.centreHome)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    // The travel lens moves where the distances are measured from, not where the search is -
    // and the list's address search asks near the search.
    it('hands the list where the search is apart from where it measures from', async () => {
      window.localStorage.setItem(`${KEY}center`, JSON.stringify(ELSEWHERE))
      window.localStorage.setItem(`${KEY}lens`, JSON.stringify('wohnort'))
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await flushPromises()

      const list = page.findComponent({ name: 'MatchList' })
      expect(list.props('center')).toEqual(HOME)
      expect(list.props('searchCenter')).toEqual(ELSEWHERE)
    })

    it.each(['NOMINATIM', 'GMS'])(
      'calls the home the home again when the home button brings the search back, and asks nobody (switch on %s)',
      async (position) => {
        switchPosition.geoProvider = position
        const page = await openMap(ELSEWHERE)
        recenter(page, PRAG)
        await flushPromises()
        expect(listLabel(page)).toBe('Prag')

        tapHomeButton(page)
        await flushPromises()

        expect(JSON.parse(window.localStorage.getItem(`${KEY}center`))).toEqual(HOME)
        expect(listLabel(page)).toBe(de.matching.map.centreHome)
        expect(fetchMock).not.toHaveBeenCalled()
      },
    )

    it('names a point set with the crosshair by the old reverse lookup in the old position', async () => {
      const page = await openMap(ELSEWHERE)

      await page.find('.map-crosshair').trigger('click')
      await flushPromises()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0][0].startsWith(`${NOMINATIM_REVERSE_URL}?`)).toBe(true)
      expect(listLabel(page)).toBe('Marktplatz, Freising')
    })

    // Until the name comes from the map's own tiles (B3).
    it('calls a point set with the crosshair "the chosen point" in the new position, and asks nobody', async () => {
      switchPosition.geoProvider = 'GMS'
      const page = await openMap(ELSEWHERE)

      await page.find('.map-crosshair').trigger('click')
      await flushPromises()

      expect(fetchMock).not.toHaveBeenCalled()
      expect(listLabel(page)).toBe(de.matching.map.centrePoint)
    })

    it('names a place picked from a search by its own name, and asks nobody', async () => {
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await flushPromises()

      recenter(page, PRAG)
      await flushPromises()

      expect(listLabel(page)).toBe('Prag')
      expect(fetchMock).not.toHaveBeenCalled()
    })

    // Two centres in quick succession: a lookup still out for the first must not rename the
    // second, also when the second one needs no lookup at all.
    it('lets a lookup still out rename nothing once the search has moved on', async () => {
      let answerLookup
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            answerLookup = resolve
          }),
      )
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await flushPromises()

      recenter(page, ELSEWHERE)
      await flushPromises()
      recenter(page, PRAG)
      await flushPromises()
      answerLookup({ ok: true, json: async () => NOMINATIM_ANSWER })
      await flushPromises()

      expect(listLabel(page)).toBe('Prag')
    })

    it('hands the search control a provider made with the admin switch and the GMS address', async () => {
      await openMap(ELSEWHERE)

      expect(makeGeoProvider).toHaveBeenCalledTimes(1)
      const made = makeGeoProvider.mock.calls[0][0]
      expect(made.mapSwitches).toBe(mapSwitches)
      expect(made.gmsBase).toBe(gmsBase)
      // Read at the moment of a search: where the map looks, in the wallet's language.
      expect(made.viewpoint().lat).toBeCloseTo(ELSEWHERE.lat, 6)
      expect(made.viewpoint().lng).toBeCloseTo(ELSEWHERE.lng, 6)
      expect(made.language()).toBe('de')
      expect(controls.at(-1).provider).toBe(madeProvider)
    })
  })
})
