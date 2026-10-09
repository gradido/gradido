// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { reactive, ref } from 'vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import de from '@/locales/de.json'
import MatchingMap from './MatchingMap.vue'
import GeoSearchField from '@/components/Matching/GeoSearchField.vue'
import { listMatchingEntries, userLocationQuery } from '@/graphql/queries'
import { GMS_REJECTED, GMS_UNAVAILABLE, toProfile } from '@/composables/useMatches'
import { created } from '@test/maplibreMock'

// jsdom has no WebGL. MapLibre asks the canvas for a WebGL 2 context and for nothing else, and
// its stand-in builds a map wherever it gets one - so every canvas in this file hands one out,
// and a test that takes it away (K-013) has it put back after it.
const webgl2 = (kind) => (kind === 'webgl2' ? {} : null)
HTMLCanvasElement.prototype.getContext = webgl2

// Never the real MapLibre in jsdom: it needs WebGL 2 and would die deep in drawing. The stand-in
// keeps what MapLibre does where the engine can see it (test/maplibreMock.js).
vi.mock('maplibre-gl', () => import('@test/maplibreMock'))
vi.mock('@/utils/mapEngine/maplibreWorkerUrl', () => ({ default: 'worker.js' }))

// The engine, loaded the way the page loads it - unless a test holds it back until it opens
// `gate`, hands over an `engine` of its own, or says it does not arrive at all, as a file does
// not when the connection drops or a deploy has renamed it.
const engineLoad = { fails: false, gate: null, engine: null }
vi.mock('@/utils/mapEngine', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    loadMapEngine: async () => {
      if (engineLoad.gate) await engineLoad.gate
      if (engineLoad.fails) throw new Error('Failed to fetch dynamically imported module')
      return engineLoad.engine ?? actual.loadMapEngine()
    },
  }
})

const replace = vi.fn()
const push = vi.fn()
// The address the page stands under. Without a person in it, as the menu leads here; the tests of
// "somebody the page was asked to show" name one, and one of them changes it under the page --
// so it is made reactive, anew for every test.
const route = vi.hoisted(() => ({ current: { query: {} } }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push, replace }),
  useRoute: () => route.current,
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

// The name from the map's own tile file, measured in its own spec (utils/placeName); here
// only which point the page asks about and what the list then says. Nothing is fetched.
const placeNameAt = vi.fn(async () => null)
vi.mock('@/utils/placeName', () => ({
  placeNameAt: (...args) => placeNameAt(...args),
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
  route.current = reactive({ query: {} })
  handlers.clear()
  created.length = 0
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
  engineLoad.fails = false
  engineLoad.gate = null
  engineLoad.engine = null
  HTMLCanvasElement.prototype.getContext = webgl2
})

describe('MatchingMap', () => {
  // The first import of the engine transforms its whole module tree, which takes longer than
  // any number of flushed promises; after that the page's own import finds it loaded.
  beforeAll(async () => {
    await import('@/utils/mapEngine/maplibre')
  })

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

  // Over the list in the dark wallet the way back to the map stood white (Bernd, 29.09.2026).
  // jsdom applies no scoped styles, so the rules are read in the source and held against the
  // dark map's, whose face the switch takes there: the same ground, rim and letters, with the
  // dark map's variables resolved.
  it('gives the switch over the dark list the face it has over the dark map', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    // Comments first: they name the values, and a guard that reads its own explanation proves
    // nothing.
    const source = readFileSync(join(here, 'MatchingMap.vue'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    )
    const ruleOf = (selector) =>
      source.match(new RegExp(`\\n${selector.replace(/[.()]/g, '\\$&')} \\{([^}]*)\\}`))?.[1]
    const value = (body, property) => body?.match(new RegExp(`(?:^|\\s)${property}: ([^;]+);`))?.[1]
    const darkMap = source.match(/\n\.map-shell\.look-dunkel \{([\s\S]*?)\n\}/)?.[1] ?? ''
    const resolve = (text) => text?.replace(/var\((--[\w-]+)\)/g, (_, name) => value(darkMap, name))

    const mapSwitch = ruleOf('.map-shell.look-dunkel:not(.is-list) .look-switch')
    const mapWord = ruleOf('.map-shell.look-dunkel:not(.is-list) .look-btn:not(.is-on)')
    const listSwitch = ruleOf('.dark-mode .map-shell.is-list .look-switch')
    const listWord = ruleOf('.dark-mode .map-shell.is-list .look-btn:not(.is-on)')

    expect(listSwitch, 'no rule for the switch over the dark list').toBeDefined()
    expect(listWord, 'no rule for its word').toBeDefined()
    expect(value(listSwitch, 'background')).toBe(resolve(value(mapSwitch, 'background')))
    expect(value(listSwitch, 'box-shadow')).toBe(resolve(value(mapSwitch, 'box-shadow')))
    expect(value(listWord, 'color')).toBe(resolve(value(mapWord, 'color')))
    // And that there is something to compare: two missing values would be equal too.
    expect(value(listSwitch, 'background')).toBe('rgb(22 24 29 / 92%)')
    expect(value(listSwitch, 'box-shadow')).toBe('0 0 0 2px rgb(255 255 255 / 35%)')
    expect(value(listWord, 'color')).toBe('#e8eaed')
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

    // ⛔ And the piece of that row that must NOT break: "Radius", the number and "km" are one
    // quantity. As three items of the row, "km" stood alone under the number on a narrow
    // phone, and "Радиус" alone in front of it up to 390px.
    it('holds "Radius", the number and "km" together, and nothing else', async () => {
      const page = await settle(mountMap())
      const group = page.find('.radius-group')
      expect(group.exists(), 'no .radius-group in the row').toBe(true)

      const parts = [...group.element.children]
      expect(parts).toHaveLength(3)
      expect(parts[0].textContent.trim()).toBe(de.matching.map.radius)
      expect(parts[1].classList.contains('radius-field')).toBe(true)
      expect(parts[2].textContent.trim()).toBe(de.matching.map.km)
      // The count is the part that may move underneath: it stands beside the group, not in it.
      expect(group.element.parentElement.classList.contains('radius-row')).toBe(true)
    })

    it('keeps that piece from breaking inside itself', () => {
      const here = dirname(fileURLToPath(import.meta.url))
      // Comments first: the one above the rule names `nowrap`.
      const source = readFileSync(join(here, 'MatchingMap.vue'), 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      )
      const rule = source.match(/\n\.radius-group \{([^}]*)\}/)

      expect(rule, 'no .radius-group rule in the page').not.toBeNull()
      expect(rule[1]).toMatch(/display: inline-flex;/)
      expect(rule[1]).toMatch(/white-space: nowrap;/)
    })

    // jsdom applies no scoped styles, so the three rules the search field leans on are read
    // in the source. Without the first the lens would stand under the canvas for the quarter
    // second before initMap, and on a page that never builds a map it would stay there for
    // good; without the other two the field would follow the wallet's theme and turn up dark
    // among the white zoom buttons, or white on the dark map.
    it('keeps the search field out of sight until the map takes it, and paints it map chrome', () => {
      const here = dirname(fileURLToPath(import.meta.url))
      // Comments first: they name all three, and a guard that reads its own explanation
      // proves nothing.
      const source = readFileSync(join(here, 'MatchingMap.vue'), 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      )

      // `gk-placed`: the engine sets it on what it takes.
      expect(source).toMatch(/\n\.gk-search:not\(\.gk-placed\) \{[^}]*display: none;/)

      const chrome = source.match(/\n\.gk-search \{([^}]*)\}/)
      expect(chrome, 'no .gk-search rule in the page').not.toBeNull()
      expect(chrome[1]).toMatch(/--surface: #fff;/)
      expect(chrome[1]).toMatch(/--border: rgb\(0 0 0 \/ 20%\);/)

      // And on the dark map the same two tokens carry the chrome of its own controls.
      const dark = source.match(/\n {2}\.gk-search \{([^}]*)\}/)
      expect(dark, 'no .gk-search rule in the dark block').not.toBeNull()
      expect(dark[1]).toMatch(/--surface: var\(--dark-chrome\);/)
      expect(dark[1]).toMatch(/--border: var\(--dark-rim\);/)
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
      // too -- the map itself is not built in this test, the 250 ms timer never runs
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

    // The first word the window offers says how far apart the two live (Chat E-068): measured
    // from the member's home and only within their standing reach -- whatever the map is
    // searching, and wherever.
    it("hands the window the member's home and their standing reach, also in the wide search", async () => {
      window.localStorage.setItem(`${KEY}radius`, JSON.stringify(30))
      window.localStorage.setItem(`${KEY}radiusFern`, JSON.stringify(700))
      window.localStorage.setItem(`${KEY}reach`, JSON.stringify('fern'))
      // The search stands somewhere else than home.
      window.localStorage.setItem(`${KEY}center`, JSON.stringify({ lat: 52.5, lng: 13.4 }))
      const page = mountMap()
      // Before the server has said where home is, there is none to measure from.
      expect(shown(page).props('ownPosition')).toBeNull()

      fire(userLocationQuery, { userLocation: location })
      await flushPromises()

      expect(shown(page).props('ownPosition')).toEqual({ lat: 48.2, lng: 11.6 })
      expect(shown(page).props('ownReachKm')).toBe(30)
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

  // F-10, Bernd at his iPhone: the small discs could hardly be hit. The map is built here on
  // purpose, unlike everywhere above - the 250 ms timer is run by hand and the view is seeded,
  // so the zoom and with it every pixel between two people are known.
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
    // The point `px` screen pixels east of the middle of the map that was built, by the map's own
    // projection. jsdom lays the container out at no size, so the middle is container point (0, 0).
    const east = (px) => {
      const { lat, lng } = created.at(-1).unproject({ x: px, y: 0 })
      return { lat, lng }
    }
    const px = (element, property) => element.style[property]

    // The people are asked for once the map is there: where they stand is counted from its middle.
    const buildMap = async (look, people = () => []) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      window.localStorage.setItem(`${KEY}look`, JSON.stringify(look))
      window.localStorage.setItem(`${KEY}view`, JSON.stringify(VIEW))
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()
      vi.advanceTimersByTime(250)
      vi.useRealTimers()
      // The engine is fetched after the quarter second, and its first style loads a moment after
      // the map is built - only then are the rings on it.
      await flushPromises()
      await flushPromises()
      matches.value = people()
      await flushPromises()
      return page
    }
    const tap = (element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const zoomNow = () => JSON.parse(window.localStorage.getItem(`${KEY}view`)).zoom
    const profileOpen = (page) => page.findComponent({ name: 'MatchProfile' }).props('modelValue')

    afterEach(() => {
      vi.useRealTimers()
    })

    it('keeps a step-1 disc at 20 px on the light map and gives it 44 px to tap', async () => {
      const page = await buildMap('hell', () => [person('anna', east(0))])

      const box = page.find('.gk-clickable').element
      expect(px(page.find('.gk-disc').element, 'width')).toBe('20px')
      expect(px(page.find('.gk-hit').element, 'width')).toBe('44px')
      // The box is as big as the tap area, and still centred on the person: its top left corner
      // stands half the area left of and above the person's place.
      expect([px(box, 'width'), px(box, 'height')]).toEqual(['44px', '44px'])
      expect(box.style.transform).toContain('translate(-22px, -22px)')
    })

    it('gives the same person 44 px to tap inside the glow on the dark map', async () => {
      const page = await buildMap('dunkel', () => [person('anna', east(0))])

      expect(px(page.find('.gk-hit').element, 'width')).toBe('44px')
      expect(px(page.find('.gk-clickable').element, 'width')).toBe('48px')
    })

    // 40 px apart, two tap areas of 44 px overlap: a finger there could mean either, so the
    // map steps in rather than opening whichever area happened to lie on top.
    it('zooms in when two tap areas overlap instead of opening one of them', async () => {
      const page = await buildMap('hell', () => [person('anna', east(0)), person('ben', east(40))])

      tap(page.findAll('.gk-hit')[0].element)
      await page.vm.$nextTick()

      expect(profileOpen(page)).toBe(false)
      expect(zoomNow()).toBe(VIEW.zoom + 2)
    })

    // The control for the one above: with room between them the same tap opens the person,
    // so the zoom there is the overlap speaking, not every tap zooming. 70 px is beyond the
    // largest tap area there is - 60 px since the fifth step - so beyond the crowd radius.
    it('opens the person when no other tap area reaches theirs', async () => {
      const page = await buildMap('hell', () => [person('anna', east(0)), person('ben', east(70))])

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
        const dark = await buildMap('dunkel', () => [broad('clara')])
        expect(px(dark.find('.gk-clickable').element, 'width')).toBe('130px')
        expect(px(dark.find('.gk-hit').element, 'width')).toBe('60px')
        dark.unmount()
        wrapper = null

        const light = await buildMap('hell', () => [broad('clara')])
        expect(px(light.find('.gk-disc').element, 'width')).toBe('60px')
        expect(px(light.find('.gk-clickable').element, 'width')).toBe('60px')
      })

      // The control: the same person without breadth is a step-4 match, sized as one.
      it('stays on the fourth size while breadth is off', async () => {
        const dark = await buildMap('dunkel', () => [broad('clara')])
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
          .find('.maplibregl-canvas')
          .element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: 0 }))
      // The ring counts from the middle of the map, so it is placed once the map is there.
      const buildMapWithRing = async () => {
        const page = await buildMap('hell')
        presence.value = [ring()]
        await flushPromises()
        return page
      }

      // 15 px out is far beside the ring's own 6 px, and well inside the 22 px of a 44 px area.
      it('opens from anywhere in a 44 px tap area around it', async () => {
        const page = await buildMapWithRing()

        tapCanvas(page, 15)
        await page.vm.$nextTick()

        expect(profileOpen(page)).toBe(true)
        expect(profile).toHaveBeenCalledWith('r-1', 'c-1')
      })

      it('does not open from beyond that area', async () => {
        const page = await buildMapWithRing()

        tapCanvas(page, 30)
        await page.vm.$nextTick()

        expect(profileOpen(page)).toBe(false)
      })

      // Found by the injection round on 12.09.2026. The reactive half of the reach
      // switch (the count, the list) went with it, but the rings are drawn
      // imperatively and nothing watches `reach` - so without drawPresence() in
      // setReach they stayed on the map, and tappable, until the answer came.
      // "opens from anywhere in a 44 px tap area" is this one's control: same ring, same
      // 15 px, and it opens.
      it('goes from the canvas the moment the reach changes, not when the answer comes', async () => {
        const page = await buildMapWithRing()

        await page.findAll('.reach-btn')[1].trigger('click')
        await page.vm.$nextTick()
        tapCanvas(page, 15)
        await page.vm.$nextTick()

        // `load` is a spy, so presence still holds Paul: only the redraw can have
        // taken him off the map.
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

  // K-002: the list names where it searches - and the member's home goes to no place search for
  // that. Before, the first visit sent the exact home position to Nominatim, at zoom 16.
  describe('naming the centre in the list', () => {
    const HOME = { lat: 48.2, lng: 11.6 }
    // About 17 km from home: well clear of "home within 100 m".
    const ELSEWHERE = { lat: 48.3, lng: 11.8 }
    const PRAG = { lat: 50.0874654, lng: 14.4212535, label: 'Prag' }
    const listLabel = (page) => page.findComponent({ name: 'MatchList' }).props('centerLabel')
    const recenter = (page, next) =>
      page.findComponent({ name: 'MatchList' }).vm.$emit('recenter', next)
    // Nothing on this page may fetch anything to name a centre: the names come from the tile
    // file, which placeNameAt reads, and placeNameAt is replaced in this file.
    let fetchMock

    // The map itself, for the two controls that live on it - the crosshair and the home button.
    // The 250 ms timer is run by hand, and the view is seeded where the map opens; the engine is
    // fetched after it.
    const openMap = async (view) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      window.localStorage.setItem(`${KEY}view`, JSON.stringify({ ...view, zoom: 12 }))
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()
      vi.advanceTimersByTime(250)
      vi.useRealTimers()
      await flushPromises()
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
      placeNameAt.mockReset()
      placeNameAt.mockImplementation(async () => null)
      makeGeoProvider.mockClear()
      fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    })

    it('calls the centre of a first visit the home and asks nobody', async () => {
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await flushPromises()

      expect(JSON.parse(window.localStorage.getItem(`${KEY}center`))).toEqual(HOME)
      expect(listLabel(page)).toBe(de.matching.map.centreHome)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(placeNameAt).not.toHaveBeenCalled()
    })

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

    it('calls the home the home again when the home button brings the search back, and asks nobody', async () => {
      const page = await openMap(ELSEWHERE)
      recenter(page, PRAG)
      await flushPromises()
      expect(listLabel(page)).toBe('Prag')

      tapHomeButton(page)
      await flushPromises()

      expect(JSON.parse(window.localStorage.getItem(`${KEY}center`))).toEqual(HOME)
      expect(listLabel(page)).toBe(de.matching.map.centreHome)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(placeNameAt).not.toHaveBeenCalled()
    })

    it('names a point set with the crosshair from the tiles of the map, and asks nobody else', async () => {
      placeNameAt.mockImplementation(async () => ({ place: 'Freising', context: 'München' }))
      const page = await openMap(ELSEWHERE)

      await page.find('.map-crosshair').trigger('click')
      await flushPromises()

      // The middle comes from the map that was built.
      expect(created).toHaveLength(1)
      expect(placeNameAt).toHaveBeenCalledTimes(1)
      const [, lat, lng, locale] = placeNameAt.mock.calls[0]
      expect(lat).toBeCloseTo(ELSEWHERE.lat, 6)
      expect(lng).toBeCloseTo(ELSEWHERE.lng, 6)
      expect(locale).toBe('de')
      expect(fetchMock).not.toHaveBeenCalled()
      expect(listLabel(page)).toBe('Freising, München')
    })

    it('calls a point set with the crosshair "the chosen point" where the tiles name nothing', async () => {
      const page = await openMap(ELSEWHERE)

      await page.find('.map-crosshair').trigger('click')
      await flushPromises()

      expect(placeNameAt).toHaveBeenCalledTimes(1)
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
      placeNameAt.mockImplementationOnce(
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
      answerLookup({ place: 'Freising', context: 'München' })
      await flushPromises()

      expect(listLabel(page)).toBe('Prag')
    })

    // The tiles can take a while on a slow link. Meanwhile the list must not go on naming the
    // place the search has left, and that name must not be stored with the new centre.
    it('calls a point "the chosen point" while its name is still out, and stores no old name with it', async () => {
      let answerLookup
      placeNameAt.mockImplementation(
        () =>
          new Promise((resolve) => {
            answerLookup = resolve
          }),
      )
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await flushPromises()
      recenter(page, PRAG)
      await flushPromises()
      expect(listLabel(page)).toBe('Prag')

      recenter(page, ELSEWHERE)
      await flushPromises()

      expect(listLabel(page)).toBe(de.matching.map.centrePoint)
      expect(JSON.parse(window.localStorage.getItem(`${KEY}centerLabel`))).toBe('')
      answerLookup({ place: 'Freising', context: 'München' })
      await flushPromises()
      expect(listLabel(page)).toBe('Freising, München')
    })

    it('hands the search field a provider made with the GMS address', async () => {
      const page = await openMap(ELSEWHERE)

      expect(makeGeoProvider).toHaveBeenCalledTimes(1)
      const made = makeGeoProvider.mock.calls[0][0]
      expect(Object.keys(made).sort()).toEqual(['gmsBase', 'language', 'viewpoint'])
      expect(made.gmsBase).toBe(gmsBase)
      // Read at the moment of a search: where the map looks, in the wallet's language.
      expect(made.viewpoint().lat).toBeCloseTo(ELSEWHERE.lat, 6)
      expect(made.viewpoint().lng).toBeCloseTo(ELSEWHERE.lng, 6)
      expect(made.language()).toBe('de')
      expect(page.findComponent(GeoSearchField).props('provider')).toBe(madeProvider)
    })

    // No reverse lookup and no second search: the field hands over the place it was given,
    // name and all. The old control also jumped to zoom 18, which put a whole town's circle
    // off the screen - now the view frames the circle, as every other recentring does.
    it('moves the search to a place picked in the map field, with its name, and asks nobody', async () => {
      const page = await openMap(ELSEWHERE)

      await page.findComponent(GeoSearchField).vm.$emit('pick', PRAG)
      await flushPromises()

      expect(JSON.parse(window.localStorage.getItem(`${KEY}center`))).toEqual({
        lat: PRAG.lat,
        lng: PRAG.lng,
      })
      expect(listLabel(page)).toBe('Prag')
      expect(fetchMock).not.toHaveBeenCalled()
      expect(placeNameAt).not.toHaveBeenCalled()
    })
  })

  // The map on MapLibre's stand-in: what it builds and draws, and what the page does where it
  // cannot build one (K-013).
  describe('on the MapLibre engine', () => {
    // About 17 km from home, so nothing snaps the view onto the search centre.
    const VIEW = { lat: 48.3, lng: 11.8, zoom: 12 }
    const anna = {
      uuid: 'anna',
      name: 'Anna',
      position: { lat: 48.31, lng: 11.81 },
      community: { name: 'Muenchen' },
      aboutMe: '',
      channels: {
        gesuch: [{ uuid: 'anna-entry', strength: 0.73, matchedEntryUuid: 'mine' }],
      },
      scores: { gesuch: [{ strength: 0.73, entry: 'mine', subject: 'x' }] },
      precision: 'genau',
    }
    /** The MapLibre map behind the page's handle. */
    const library = () => created.at(-1)
    const cornerOf = (page, corner) =>
      page.findAll(`${corner} > *`).map((box) => box.classes().join(' '))

    // Mounted and located, the quarter second run by hand; the map is not built yet.
    const mountLocated = async (look) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      window.localStorage.setItem(`${KEY}look`, JSON.stringify(look))
      window.localStorage.setItem(`${KEY}view`, JSON.stringify(VIEW))
      const page = mountMap()
      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()
      vi.advanceTimersByTime(250)
      vi.useRealTimers()
      return page
    }
    // The engine is fetched after the quarter second, and its first style loads a moment after
    // the map is built - only then are the circle and the rings on it.
    const settle = async () => {
      await flushPromises()
      await flushPromises()
    }
    const openMapLibre = async ({ look = 'normal', people = [] } = {}) => {
      const page = await mountLocated(look)
      await settle()
      matches.value = people
      await flushPromises()
      return page
    }

    afterEach(() => {
      vi.useRealTimers()
    })

    // The search field is in the template from the first tick, so finding the component says
    // nothing - finding it in the map's corner, between the zoom buttons and the way home, does:
    // initMap hangs it there, which is what puts it in the corner and what the rules hiding the
    // map's controls under the list and the cluster reach.
    it('builds the map with MapLibre, where the member left it, in its look and language', async () => {
      const page = await openMapLibre({ look: 'dunkel' })

      expect(created).toHaveLength(1)
      expect(page.find('.map-canvas').classes()).toContain('maplibregl-map')
      // The stored view counts Leaflet's zoom; MapLibre's tiles are twice as wide.
      expect(library().getZoom()).toBe(VIEW.zoom - 1)
      expect(library().getCenter().lat).toBeCloseTo(VIEW.lat, 6)
      expect(library().getCenter().lng).toBeCloseTo(VIEW.lng, 6)
      // Built in the member's look, with the places named in the wallet's language - nothing
      // else would notice them missing.
      expect(library().options.style.sprite).toMatch(/\/black$/)
      expect(JSON.stringify(library().options.style.layers)).toContain('name:de')
      // The whole corner came up, in the order it always had.
      expect(cornerOf(page, '.maplibregl-ctrl-top-left')).toEqual([
        expect.stringContaining('maplibregl-ctrl-group'),
        expect.stringContaining('gk-search'),
        expect.stringContaining('gk-home'),
      ])
      expect(page.find('.map-note').exists()).toBe(false)
    })

    it('stands the house, the search centre and a match on the map as markers', async () => {
      const page = await openMapLibre({ look: 'hell', people: [anna] })

      expect(page.findAll('.maplibregl-marker')).toHaveLength(3)
      expect(page.find('.maplibregl-marker .gk-own').exists()).toBe(true)
      expect(page.find('.maplibregl-marker .gk-centre').exists()).toBe(true)
      expect(page.find('.maplibregl-marker.gk-clickable .gk-hit').exists()).toBe(true)
    })

    // The house and the search centre open nothing, and a match is in the list: a keyboard halts
    // on none of them, and a screen reader is told of no button without a name. (A marker that IS
    // one carries both -- the ring of somebody shown, under "with the keyboard" below.)
    it('makes no tab stop and no button of the house, the search centre or a match', async () => {
      const page = await openMapLibre({ look: 'hell', people: [anna] })

      const marks = page.findAll('.maplibregl-marker')
      expect(marks).toHaveLength(3)
      for (const mark of marks) {
        expect(mark.attributes('tabindex')).toBeUndefined()
        expect(mark.attributes('role')).toBeUndefined()
      }
    })

    // Drawn anew where the search moves, the centre is the same quiet disc.
    it('keeps the search centre no tab stop where the search moves', async () => {
      const page = await openMapLibre({ look: 'hell', people: [anna] })
      const first = page.find('.gk-centre').element.closest('.maplibregl-marker')

      library().jumpTo({ center: [13.4, 52.5], zoom: 11 })
      await page.find('.map-crosshair').trigger('click')
      await flushPromises()

      const centre = page.find('.gk-centre').element.closest('.maplibregl-marker')
      expect(centre).not.toBe(first)
      expect(centre.hasAttribute('tabindex')).toBe(false)
      expect(centre.hasAttribute('role')).toBe(false)
    })

    it('veils the world outside the search circle, in the look of the map', async () => {
      await openMapLibre({ look: 'normal' })

      expect(library().getSource('gk-circle')).toBeDefined()
      expect(library().getLayer('gk-circle-edge')).toBeDefined()
      expect(library().getLayer('gk-circle-veil').paint['fill-color']).toBe('#000000')
    })

    // MapLibre draws a style of its own for each look, and the veil changes with it.
    it('changes the style of the map with the look', async () => {
      const page = await openMapLibre({ look: 'normal' })
      expect(library().style.sprite).toMatch(/\/light$/)

      // The first of the three looks is the dark one.
      await page.findAll('.look-group .look-btn')[0].trigger('click')
      await flushPromises()

      expect(library().style.sprite).toMatch(/\/black$/)
      expect(library().getLayer('gk-circle-veil').paint['fill-color']).toBe('#ffffff')
    })

    // The engine takes a moment to arrive, and the member may have left the page by then.
    it('builds nothing once the page is left while the engine is on its way', async () => {
      let arrive
      engineLoad.gate = new Promise((resolve) => {
        arrive = resolve
      })
      engineLoad.engine = { createMap: vi.fn(() => ({ success: false, error: new Error('gone') })) }
      const page = await mountLocated('normal')

      page.unmount()
      wrapper = null
      arrive()
      await settle()

      expect(engineLoad.engine.createMap).not.toHaveBeenCalled()
    })

    // K-013: MapLibre needs WebGL 2. A device without it gets no map, and a line under the map
    // says why - the list shows the same matches.
    it('draws no map where the device has no WebGL 2, and says so under it', async () => {
      HTMLCanvasElement.prototype.getContext = () => null

      const page = await openMapLibre()

      expect(created).toHaveLength(0)
      expect(page.find('.map-canvas').classes()).not.toContain('maplibregl-map')
      expect(page.find('.maplibregl-ctrl-top-left').exists()).toBe(false)
      // Not hung anywhere, the search field stays out of sight (the rule read in the source).
      expect(page.find('.gk-search').classes()).not.toContain('gk-placed')
      const note = page.find('.map-shell + .map-note')
      expect(note.exists()).toBe(true)
      expect(note.text()).toBe(de.matching.map.noWebgl)
    })

    // Not the device: the file did not come. The line about WebGL 2 would be untrue.
    it('draws no map when the engine does not arrive, and blames nothing', async () => {
      engineLoad.fails = true

      const page = await openMapLibre()

      expect(created).toHaveLength(0)
      expect(page.find('.map-canvas').classes()).not.toContain('maplibregl-map')
      expect(page.find('.map-note').exists()).toBe(false)
    })

    // jsdom lays nothing out and applies no scoped styles, so the rules MapLibre needs are read in
    // the source - comments first, they name the rules. Measured in a browser on 16.09.2026, on a
    // static copy of the map wearing the built stylesheets: without these rules the house stood on
    // the list cover and over the crosshair, the centre disc over the zoom buttons, the crosshair
    // over the search field's list of places, and a tap on the glow beside a match went to the
    // match; with them none of that happened.
    const sourceRules = () =>
      readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'MatchingMap.vue'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '')
    const ruleOf = (source, selectors) =>
      source.match(
        new RegExp(`\\n${selectors.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`),
      )?.[1]

    it("keeps MapLibre's markers and controls in their layers", () => {
      const source = sourceRules()

      expect(ruleOf(source, '.map-shell :deep(.maplibregl-canvas-container)')).toMatch(
        /isolation: isolate;/,
      )
      expect(ruleOf(source, '.map-shell :deep(.maplibregl-ctrl-top-left)')).toMatch(
        /z-index: 1000;/,
      )
      expect(ruleOf(source, '.maplibregl-marker.gk-marker.gk-clickable')).toMatch(
        /pointer-events: none;/,
      )
      for (const mode of ['is-list', 'is-cluster']) {
        expect(
          ruleOf(source, `.map-shell.${mode} :deep(.maplibregl-control-container)`),
          `the map's controls stay over the ${mode} cover`,
        ).toMatch(/display: none;/)
      }
    })

    // In that copy the corner measured zoom 34 x 64, the lens and the way home 34 x 34, at 10 px
    // from the edge and from each other - the measure the old map's corner had. Without these
    // rules the way home was an 18 px square - too small for a finger - and the zoom buttons 29 px
    // wide.
    it("gives MapLibre's corner its touch measure, on the light map and on the dark one", () => {
      const source = sourceRules()

      const group = ruleOf(source, '.map-shell :deep(.maplibregl-ctrl-group)')
      expect(group).toMatch(/border: 2px solid rgb\(0 0 0 \/ 20%\);/)
      expect(group).toMatch(/box-shadow: none;/)
      const buttons = ruleOf(
        source,
        '.map-shell :deep(.maplibregl-ctrl-group button),\n.map-shell :deep(.maplibregl-ctrl-group a)',
      )
      expect(buttons).toMatch(/width: 30px;/)
      expect(buttons).toMatch(/height: 30px;/)

      const darkGroup = ruleOf(source, '  :deep(.maplibregl-ctrl-group)')
      expect(darkGroup).toMatch(/border-color: var\(--dark-rim\);/)
      expect(darkGroup).toMatch(/background-color: var\(--dark-chrome\);/)
      expect(ruleOf(source, '  :deep(.maplibregl-ctrl-group .maplibregl-ctrl-icon)')).toMatch(
        /filter: invert\(1\) brightness\(1\.14\);/,
      )
      expect(ruleOf(source, '  :deep(.maplibregl-ctrl-attrib)')).toMatch(
        /background-color: rgb\(22 24 29 \/ 80%\);/,
      )
    })
  })
})

/**
 * Bernd, 09.10.2026: a contact one has in the chat can be found on the find map as well. The
 * contact window's pin leads to `/matching/karte?with=<gradidoID>&community=<uuid>`; the page asks
 * the GMS where the person stands, brings them into view and marks them with a gold ring and
 * their name. The search stays where it was.
 */
describe('MatchingMap, asked to show somebody', () => {
  beforeAll(async () => {
    await import('@/utils/mapEngine/maplibre')
  })

  const TOBIAS = {
    with: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
    community: 'cccccccc-0000-4000-8000-cccccccccccc',
  }
  const IRA = {
    with: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb',
    community: 'dddddddd-3333-4333-8333-dddddddddddd',
  }
  const HOME = { lat: 48.2, lng: 11.6 }
  const HAMBURG = { lat: 53.55, lng: 9.99 }
  const BERLIN = { lat: 52.52, lng: 13.4 }
  // Where the map stood last time: away from home and away from Hamburg.
  const VIEW = { lat: 50.1, lng: 8.7, zoom: 9 }

  /** One person as the profile route hands them over (useMatches.toProfile). */
  const published = (who = TOBIAS, over = {}) => ({
    uuid: who.with,
    name: who === IRA ? 'Ira-Erste' : 'Tobias',
    community: { uuid: who.community, name: 'KI Playground' },
    aboutMe: null,
    position: who === IRA ? BERLIN : HAMBURG,
    precision: 'ungefaehr',
    channels: {},
    ...over,
  })
  const notHeld = () =>
    Object.assign(new Error('community-user/profile: HTTP 404'), { status: 404 })

  /** An answer that is still on its way. */
  const held = () => {
    let settle
    let refuse
    const promise = new Promise((resolve, reject) => {
      settle = resolve
      refuse = reject
    })
    return { promise, resolve: settle, reject: refuse }
  }

  const remember = (name, value) => window.localStorage.setItem(KEY + name, JSON.stringify(value))
  const remembered = (name) => JSON.parse(window.localStorage.getItem(KEY + name))

  /** The page under an address, with its map built and the member's home known. */
  const arrive = async (
    query = TOBIAS,
    { gmsAllowed = true, store = makeStore(gmsAllowed) } = {},
  ) => {
    route.current.query = query ?? {}
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const page = mountMap({ gmsAllowed, store })
    fire(userLocationQuery, { userLocation: location })
    await page.vm.$nextTick()
    vi.advanceTimersByTime(250)
    vi.useRealTimers()
    // The engine is fetched after the quarter second; the answer about the person comes in the
    // same breaths.
    await flushPromises()
    await flushPromises()
    return page
  }

  const theMap = () => created.at(-1)
  const centre = () => {
    const { lat, lng } = theMap().getCenter()
    return { lat: +lat.toFixed(4), lng: +lng.toFixed(4) }
  }
  const marker = (page) => page.find('.gk-shown')
  const tap = (element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  const window_ = (page) => page.findComponent({ name: 'MatchProfile' })

  beforeEach(() => {
    profile.mockImplementation(async (uuid) =>
      uuid === IRA.with ? published(IRA) : published(TOBIAS),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks the GMS about exactly the pair in the address, once', async () => {
    await arrive()

    expect(profile).toHaveBeenCalledTimes(1)
    expect(profile).toHaveBeenCalledWith(TOBIAS.with, TOBIAS.community)
  })

  it('marks the person with a ring and their name, on their point', async () => {
    const page = await arrive()

    expect(marker(page).exists()).toBe(true)
    expect(marker(page).find('.gk-shown-ring').exists()).toBe(true)
    expect(marker(page).find('.gk-shown-name').text()).toBe('Tobias')
    // The ring's box is centred on the person: its top left corner stands half the ring left of
    // and above their place, which is the middle of the view.
    const box = marker(page).element
    expect([box.style.width, box.style.height]).toEqual(['56px', '56px'])
    expect(box.style.transform).toContain('translate(-28px, -28px)')
    // A finger's measure to tap, as on every marker.
    expect(marker(page).find('.gk-hit').element.style.width).toBe('44px')
  })

  it('brings them into the middle of the view, at the zoom of a town', async () => {
    // The control gives the zoom a remembered view of 12 opens at, in the engine's own counting.
    remember('view', { ...VIEW, zoom: 12 })
    await arrive(null)
    const zoomOfTwelve = theMap().getZoom()
    expect(centre()).toEqual({ lat: VIEW.lat, lng: VIEW.lng })
    wrapper.unmount()
    wrapper = null

    remember('view', VIEW)
    await arrive()
    expect(centre()).toEqual(HAMBURG)
    expect(theMap().getZoom()).toBe(zoomOfTwelve)
  })

  // Looking is not searching: the circle stays around the place the member searches from.
  it('leaves the search where it was', async () => {
    await arrive()

    expect(load).toHaveBeenCalled()
    for (const [search] of load.mock.calls) expect(search.center).toEqual(HOME)
    expect(remembered('center')).toEqual(HOME)
  })

  // Where the map stands during such a visit is the person's. The next visit opens where the
  // member last looked for themselves.
  it('does not remember the view of such a visit', async () => {
    remember('view', VIEW)
    await arrive()
    theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat] })

    expect(remembered('view')).toEqual(VIEW)
  })

  // The control for the one above: without somebody to show, the same move is remembered.
  it('remembers the view of an ordinary visit', async () => {
    remember('view', VIEW)
    await arrive(null)
    theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat] })

    expect(remembered('view').lat).toBeCloseTo(BERLIN.lat, 4)
    expect(remembered('view').lng).toBeCloseTo(BERLIN.lng, 4)
  })

  // Found by the second reader (09.10.2026): the search moved during such a visit was remembered,
  // the view of it was not -- and the next visit opened on the old place, with the circle and
  // everybody in it somewhere else. Framing a search is the member's own doing: from there on the
  // view is remembered again.
  it('remembers the view again once the member moves the search', async () => {
    remember('view', VIEW)
    const page = await arrive()
    expect(remembered('view')).toEqual(VIEW)

    // The way home: the search goes back to the member's own place, and the map frames it.
    page.find('.gk-home a').element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(remembered('center')).toEqual(HOME)
    expect(remembered('view').lat).toBeCloseTo(HOME.lat, 4)
    expect(remembered('view').lng).toBeCloseTo(HOME.lng, 4)
    // And what the member looks at after that is remembered as on any visit. (With a zoom: the
    // stand-in frames a circle in a view of no size at the widest zoom there is, where Berlin
    // lies within the few pixels the map eases back onto the search centre.)
    theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat], zoom: 11 })
    expect(remembered('view').lat).toBeCloseTo(BERLIN.lat, 4)
    expect(remembered('view').lng).toBeCloseTo(BERLIN.lng, 4)
  })

  // The map is brought onto the person ONCE. A location answer that comes again -- or late, after
  // the member has looked elsewhere -- restores the view, and must not pull it back to them.
  it('does not pull the map back to the person once the member has looked elsewhere', async () => {
    const page = await arrive()
    expect(centre()).toEqual(HAMBURG)

    theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat] })
    fire(userLocationQuery, { userLocation: location })
    await page.vm.$nextTick()

    expect(centre()).toEqual(BERLIN)
  })

  // The same pair under another address is no new question: the page is asked to show somebody
  // by the pair, and a navigation that keeps both keeps the mark and the view.
  it('asks once for a pair, however often the address is written anew', async () => {
    const page = await arrive()
    theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat] })

    route.current.query = { ...TOBIAS, theme: 'dark' }
    await flushPromises()

    expect(profile).toHaveBeenCalledTimes(1)
    expect(page.findAll('.gk-shown')).toHaveLength(1)
    expect(centre()).toEqual(BERLIN)
  })

  // ⛔ The engine takes a marker's inside as HTML, and the name comes back from a foreign system.
  it('sets a name that is markup as text, not as markup', async () => {
    const evil = '<img src=x onerror="alert(1)"><b>Tobias</b>'
    profile.mockResolvedValue(published(TOBIAS, { name: evil }))
    const page = await arrive()

    expect(marker(page).find('img').exists()).toBe(false)
    expect(marker(page).find('b').exists()).toBe(false)
    expect(marker(page).find('.gk-shown-name').element.children).toHaveLength(0)
    expect(marker(page).find('.gk-shown-name').element.textContent).toBe(evil)
  })

  it('draws no empty name tag for somebody the GMS names without a name', async () => {
    profile.mockResolvedValue(published(TOBIAS, { name: undefined }))
    const page = await arrive()

    expect(marker(page).find('.gk-shown-ring').exists()).toBe(true)
    expect(marker(page).find('.gk-shown-name').exists()).toBe(false)
  })

  // The ring stands around the person's own mark where the search draws them -- a glow, a disc,
  // a grey ring. Where it does not (they may live anywhere), the ring carries a point of its own,
  // so it never stands around nothing. The shell says which it is; the stylesheet hides the point.
  describe('the point in the ring', () => {
    const asMatch = (who = TOBIAS, community = who.community) => ({
      uuid: who.with,
      name: 'Tobias',
      position: HAMBURG,
      community: { uuid: community, name: 'KI Playground' },
      aboutMe: '',
      precision: 'ungefaehr',
      channels: { gesuch: [{ uuid: 'his-entry', strength: 0.8, matchedEntryUuid: 'mine' }] },
      scores: { gesuch: [{ strength: 0.8, entry: 'mine', subject: 'cello' }] },
    })
    const asRing = (who = TOBIAS) => ({
      id: 7,
      uuid: who.with,
      name: 'Tobias',
      community: { uuid: who.community, name: 'KI Playground' },
      hasEntries: true,
      position: HAMBURG,
      precision: 'ungefaehr',
    })
    const drawn = (page) => page.find('.map-shell').classes().includes('shown-is-drawn')

    it('is part of the mark', async () => {
      const page = await arrive()

      expect(marker(page).find('.gk-shown-point').exists()).toBe(true)
    })

    it('stands where the search does not draw the person', async () => {
      const page = await arrive()
      expect(drawn(page)).toBe(false)

      // Somebody else in the results changes nothing.
      matches.value = [asMatch(IRA)]
      await flushPromises()
      expect(drawn(page)).toBe(false)
    })

    it('steps back where the search draws them as a match', async () => {
      const page = await arrive()
      matches.value = [asMatch()]
      await flushPromises()

      expect(drawn(page)).toBe(true)
    })

    it('steps back where the search draws them as a grey ring', async () => {
      const page = await arrive()
      presence.value = [asRing()]
      await flushPromises()

      expect(drawn(page)).toBe(true)
    })

    // What the member unticked is not drawn: then the ring would stand around nothing again.
    it('stands again where the member has switched their kind of mark off', async () => {
      remember('filters', { gesuch: false, andereMit: false })
      const page = await arrive()
      matches.value = [asMatch()]
      presence.value = [asRing()]
      await flushPromises()

      expect(drawn(page)).toBe(false)
    })

    it('does not take somebody with the same id in another community for them', async () => {
      const page = await arrive()
      matches.value = [asMatch(TOBIAS, IRA.community)]
      await flushPromises()

      expect(drawn(page)).toBe(false)
    })

    it('says nothing on an ordinary visit', async () => {
      const page = await arrive(null)
      matches.value = [asMatch()]
      await flushPromises()

      expect(drawn(page)).toBe(false)
    })
  })

  // The markers of the search are no tab stops: everybody they stand for is in the list, where a
  // keyboard and a screen reader meet them. Somebody shown from outside the search is in no list,
  // so their mark is the one place to open them from -- a button with a name, which answers Enter
  // and the space bar.
  describe('with the keyboard', () => {
    const key = (element, name) => {
      const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true })
      element.dispatchEvent(event)
      return event
    }

    it('is a tab stop, heard as a button that opens their profile', async () => {
      const page = await arrive()
      const mark = marker(page).element

      expect(mark.getAttribute('tabindex')).toBe('0')
      expect(mark.getAttribute('role')).toBe('button')
      expect(mark.getAttribute('aria-label')).toBe('Profil von Tobias')
    })

    it.each([
      ['Enter', 'Enter'],
      ['the space bar', ' '],
    ])('opens their profile on %s', async (_, name) => {
      const page = await arrive()

      const event = key(marker(page).element, name)
      await flushPromises()

      expect(window_(page).props('modelValue')).toBe(true)
      expect(window_(page).props('match').name).toBe('Tobias')
      // The space bar would scroll the page otherwise.
      expect(event.defaultPrevented).toBe(true)
    })

    it('opens nothing on another key', async () => {
      const page = await arrive()

      const event = key(marker(page).element, 'a')
      await flushPromises()

      expect(window_(page).props('modelValue')).toBe(false)
      expect(event.defaultPrevented).toBe(false)
    })

    // The control: a match of the search stays what it was -- no tab stop.
    it('leaves the markers of the search as they were', async () => {
      const page = await arrive()
      matches.value = [
        {
          uuid: 'u-9',
          name: 'Anna',
          position: BERLIN,
          community: { uuid: 'c-9', name: 'Berlin' },
          aboutMe: '',
          precision: 'genau',
          channels: { gesuch: [{ uuid: 'e-9', strength: 0.8, matchedEntryUuid: 'mine' }] },
          scores: { gesuch: [{ strength: 0.8, entry: 'mine', subject: 'cello' }] },
        },
      ]
      await flushPromises()
      const match = page.findAll('.gk-clickable').find((m) => !m.classes('gk-shown'))

      expect(match.exists()).toBe(true)
      expect(match.element.hasAttribute('tabindex')).toBe(false)
    })
  })

  describe('a tap on them', () => {
    it('opens their profile from the ring, in the one window, and asks for the rest', async () => {
      const page = await arrive()
      expect(window_(page).props('modelValue')).toBe(false)

      tap(marker(page).find('.gk-hit').element)
      await flushPromises()

      expect(window_(page).props('modelValue')).toBe(true)
      expect(window_(page).props('match')).toMatchObject({
        uuid: TOBIAS.with,
        name: 'Tobias',
        community: { uuid: TOBIAS.community, name: 'KI Playground' },
        position: HAMBURG,
      })
      // Once to find them, once for the window: the window's own question, as for any ring.
      expect(profile).toHaveBeenCalledTimes(2)
      expect(profile).toHaveBeenLastCalledWith(TOBIAS.with, TOBIAS.community)
    })

    it('opens it from the name as well', async () => {
      const page = await arrive()

      tap(marker(page).find('.gk-shown-name').element)
      await flushPromises()

      expect(window_(page).props('modelValue')).toBe(true)
    })

    // Where the search found them too, the window opens on what the search knows: the entries
    // of theirs that answer mine, with their strength -- as a tap on their glow would.
    it('opens the match where the search found the same person, however the pair is spelled', async () => {
      const page = await arrive()
      matches.value = [
        {
          uuid: TOBIAS.with.toUpperCase(),
          name: 'Tobias',
          position: HAMBURG,
          community: { uuid: TOBIAS.community.toUpperCase(), name: 'KI Playground' },
          aboutMe: '',
          precision: 'ungefaehr',
          channels: {
            gesuch: [
              { uuid: 'his-entry', strength: 0.8, matchedEntryUuid: 'mine', summary: 'Cello' },
            ],
          },
          scores: { gesuch: [{ strength: 0.8, entry: 'mine', subject: 'cello' }] },
        },
      ]
      await flushPromises()

      tap(marker(page).find('.gk-hit').element)
      await flushPromises()

      expect(window_(page).props('match').channels.gesuch?.[0]).toMatchObject({
        uuid: 'his-entry',
        strength: 0.8,
      })
    })

    // The control: the same uuid in ANOTHER community is another person (a uuid names a person
    // only within one community), so the window opens on the one the map was asked to show.
    it('does not take somebody with the same id from another community for them', async () => {
      const page = await arrive()
      matches.value = [
        {
          uuid: TOBIAS.with,
          name: 'Namesake',
          position: HAMBURG,
          community: { uuid: IRA.community, name: 'Elsewhere' },
          aboutMe: '',
          precision: 'genau',
          channels: { gesuch: [{ uuid: 'other-entry', strength: 0.8, matchedEntryUuid: 'mine' }] },
          scores: { gesuch: [{ strength: 0.8, entry: 'mine', subject: 'cello' }] },
        },
      ]
      await flushPromises()

      tap(marker(page).find('.gk-hit').element)
      await flushPromises()

      expect(window_(page).props('match').name).toBe('Tobias')
      expect(window_(page).props('match').channels.gesuch).toBeUndefined()
    })
  })

  describe('the crosshair', () => {
    const crosshair = (page) => page.find('.map-crosshair').element

    // Resting on the person, the middle of the map is their ring: a tap there opens them and
    // must not move the search to Hamburg instead.
    it('steps back over the person it shows', async () => {
      const page = await arrive()
      await page.vm.$nextTick()

      expect(crosshair(page).style.opacity).toBe('0')
      expect(crosshair(page).style.pointerEvents).toBe('none')
    })

    // The control: an ordinary visit to the same spot keeps its crosshair -- that is how a
    // search is set there.
    it('stands on the same spot where nobody is shown', async () => {
      remember('view', { ...HAMBURG, zoom: 12 })
      const page = await arrive(null)
      await page.vm.$nextTick()

      expect(centre()).toEqual(HAMBURG)
      expect(crosshair(page).style.opacity).toBe('1')
      expect(crosshair(page).style.pointerEvents).toBe('auto')
    })

    it('comes back once the map has moved off them', async () => {
      const page = await arrive()
      theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat] })
      await page.vm.$nextTick()

      expect(crosshair(page).style.opacity).toBe('1')
    })
  })

  describe('the way back', () => {
    it('leads into the conversation with them, by the pair the page was asked with', async () => {
      const page = await arrive()

      await page.find('.map-back').trigger('click')

      expect(push).toHaveBeenCalledTimes(1)
      expect(push).toHaveBeenCalledWith({
        path: '/contacts',
        query: { with: TOBIAS.with, community: TOBIAS.community },
      })
    })

    // Also where they turned out not to be on the map: the member came from that conversation.
    it('leads there as well when they are not on the map', async () => {
      profile.mockRejectedValue(notHeld())
      const page = await arrive()

      await page.find('.map-back').trigger('click')

      expect(push).toHaveBeenCalledWith({
        path: '/contacts',
        query: { with: TOBIAS.with, community: TOBIAS.community },
      })
    })
  })

  describe('a member who keeps the list', () => {
    it('sees the map for this visit, and keeps the list as their choice', async () => {
      remember('mode', 'liste')
      const page = await arrive()

      expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(false)
      expect(page.find('.map-shell').classes()).not.toContain('is-list')
      expect(remembered('mode')).toBe('liste')
    })

    // The control: without somebody to show, the same member opens on their list.
    it('opens on the list on an ordinary visit', async () => {
      remember('mode', 'liste')
      const page = await arrive(null)

      expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(true)
    })

    // Found by the second reader: the looks are on screen during such a visit, and choosing one
    // wrote "karte" over the kept list. A colour is not a choice of the map for good.
    it('keeps the list as their choice when they pick a look there', async () => {
      remember('mode', 'liste')
      const page = await arrive()

      await page.findAll('.look-group .look-btn')[2].trigger('click')

      expect(remembered('look')).toBe('hell')
      expect(remembered('mode')).toBe('liste')
      expect(page.find('.map-shell').classes()).not.toContain('is-list')
    })

    // The switch itself is their word, there as anywhere.
    it('takes "Liste" as their word during the visit', async () => {
      remember('mode', 'liste')
      const page = await arrive()

      await page.findAll('.look-switch > .look-btn').at(-1).trigger('click')

      expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(true)
      expect(remembered('mode')).toBe('liste')
    })

    // Found by the second reader: where no map can be drawn there is nobody to show on one, and
    // the visit left an empty frame in place of the list such a member keeps.
    it('gets the list back where this device cannot draw the map', async () => {
      HTMLCanvasElement.prototype.getContext = () => null
      remember('mode', 'liste')
      const page = await arrive()

      expect(created).toHaveLength(0)
      expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(true)
      expect(page.find('.map-shell').classes()).toContain('is-list')
      expect(remembered('mode')).toBe('liste')
    })

    it('gets the list back where the engine does not arrive', async () => {
      engineLoad.fails = true
      remember('mode', 'liste')
      const page = await arrive()

      expect(created).toHaveLength(0)
      expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(true)
    })

    // coderabbit, PR #4115: the page stays while its address changes. Where the address names
    // nobody any more the visit is over, and the map stood in place of the list for it only.
    it('gets the list back when the address names nobody any more', async () => {
      remember('mode', 'liste')
      const page = await arrive()
      expect(page.find('.map-shell').classes()).not.toContain('is-list')

      route.current.query = {}
      await flushPromises()

      expect(marker(page).exists()).toBe(false)
      expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(true)
      expect(page.find('.map-shell').classes()).toContain('is-list')
      expect(remembered('mode')).toBe('liste')
    })

    // The visit goes on where the address comes to name somebody else: still the map.
    it('keeps the map where the address comes to name somebody else', async () => {
      remember('mode', 'liste')
      const page = await arrive()

      route.current.query = IRA
      await flushPromises()

      expect(marker(page).find('.gk-shown-name').text()).toBe('Ira-Erste')
      expect(page.find('.map-shell').classes()).not.toContain('is-list')
      expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(false)
      expect(remembered('mode')).toBe('liste')
    })

    // What they chose during the visit is their word, also after it: a look is no choice of the
    // map (the list is back), and "Liste" pressed there needs nothing given back.
    it('gets the list back after picking a look during the visit', async () => {
      remember('mode', 'liste')
      const page = await arrive()
      await page.findAll('.look-group .look-btn')[2].trigger('click')

      route.current.query = {}
      await flushPromises()

      expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(true)
      expect(remembered('mode')).toBe('liste')
      expect(remembered('look')).toBe('hell')
    })
  })

  // The control to the list coming back: a member who keeps the map stays on it when the address
  // names nobody any more -- nothing was put in place of anything for them.
  it('leaves a member who keeps the map on it when the address names nobody any more', async () => {
    const page = await arrive()
    expect(page.find('.map-shell').classes()).not.toContain('is-list')

    route.current.query = {}
    await flushPromises()

    expect(marker(page).exists()).toBe(false)
    expect(page.find('.map-shell').classes()).not.toContain('is-list')
    expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(false)
  })

  // The other half of "no map": a member who keeps the map is told why it stays empty, as on any
  // visit -- and is not moved to a list they did not choose.
  it('leaves a member who keeps the map on it where this device cannot draw it', async () => {
    HTMLCanvasElement.prototype.getContext = () => null
    const page = await arrive()

    expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(false)
    expect(page.find('.map-note').exists()).toBe(true)
    expect(profile).toHaveBeenCalledTimes(1)
  })

  // Found by the second reader: such an address is what is left when one account signs out on
  // this page and the contact it showed signs in on the same browser. The house is one's own mark.
  describe('an address that names the member themselves', () => {
    const asTobias = () =>
      createStore({
        state: {
          gradidoID: TOBIAS.with.toUpperCase(),
          gmsAllowed: true,
          userLocation: { latitude: 48.2, longitude: 11.6 },
        },
        mutations: {
          userLocation: (state, value) => {
            state.userLocation = value
          },
        },
      })

    it('asks the GMS nothing, marks nobody and says nothing', async () => {
      const page = await arrive(TOBIAS, { store: asTobias() })

      expect(profile).not.toHaveBeenCalled()
      expect(marker(page).exists()).toBe(false)
      expect(toastError).not.toHaveBeenCalled()
    })

    it('is an ordinary visit: the way back leads to the entries', async () => {
      const page = await arrive(TOBIAS, { store: asTobias() })

      await page.find('.map-back').trigger('click')

      expect(push).toHaveBeenCalledWith('/matching/entries')
    })
  })

  describe('a profile window remembered from another visit', () => {
    const anna = () => ({
      uuid: 'u-1',
      name: 'Anna',
      position: HOME,
      community: { uuid: 'c-1', name: 'Muenchen' },
      aboutMe: '',
      channels: [],
      scores: {},
      precision: 'genau',
    })

    // The member asked for the map with the person marked; a window swinging open over it is
    // not that.
    it('does not open of its own accord', async () => {
      remember('profile', 'u-1')
      const page = await arrive()
      matches.value = [anna()]
      await flushPromises()

      expect(window_(page).props('modelValue')).toBe(false)
      expect(marker(page).exists()).toBe(true)
    })

    // The control: the same note on an ordinary visit opens the window, as it always did.
    it('opens on an ordinary visit', async () => {
      remember('profile', 'u-1')
      const page = await arrive(null)
      matches.value = [anna()]
      await flushPromises()

      expect(window_(page).props('modelValue')).toBe(true)
    })
  })

  describe('somebody who is not on the map', () => {
    it('says so once, marks nobody and opens the map where it stood', async () => {
      remember('view', VIEW)
      profile.mockRejectedValue(notHeld())
      const page = await arrive()

      expect(toastError).toHaveBeenCalledTimes(1)
      expect(toastError).toHaveBeenCalledWith('Dieser Kontakt steht gerade nicht auf der Karte.')
      expect(marker(page).exists()).toBe(false)
      expect(centre()).toEqual({ lat: VIEW.lat, lng: VIEW.lng })
    })

    it('says the profile could not be loaded where the GMS did not answer', async () => {
      profile.mockRejectedValue(Object.assign(new Error('HTTP 503'), { status: 503 }))
      const page = await arrive()

      expect(toastError).toHaveBeenCalledTimes(1)
      expect(toastError).toHaveBeenCalledWith('Das Profil konnte gerade nicht geladen werden.')
      expect(marker(page).exists()).toBe(false)
    })

    // The GMS is a foreign system: a point off the globe is finite, and MapLibre throws on it.
    it.each([
      ['a latitude off the globe', { lat: 91, lng: 9.99 }],
      ['no numbers', { lat: undefined, lng: undefined }],
    ])('treats somebody held with %s as not on the map', async (_, position) => {
      profile.mockResolvedValue(published(TOBIAS, { position }))
      const page = await arrive()

      expect(toastError).toHaveBeenCalledWith('Dieser Kontakt steht gerade nicht auf der Karte.')
      expect(marker(page).exists()).toBe(false)
    })

    // What the real route makes of the GMS's answer (toProfile): somebody it names with no
    // location at all. Read as an error it would say "could not be loaded" while the GMS
    // answered -- and the control: the same answer with a place is marked.
    it.each([
      ['no location at all', {}],
      ['a location of null', { location: null }],
    ])('treats somebody the GMS answers with %s as not on the map', async (_, answer) => {
      const answered = {
        uuid: TOBIAS.with,
        alias: 'Tobias',
        community: { uuid: TOBIAS.community, name: 'KI Playground' },
        entries: [],
        ...answer,
      }
      profile.mockImplementation(async () => toProfile(answered))
      const page = await arrive()

      expect(toastError).toHaveBeenCalledTimes(1)
      expect(toastError).toHaveBeenCalledWith('Dieser Kontakt steht gerade nicht auf der Karte.')
      expect(marker(page).exists()).toBe(false)
      page.unmount()

      toastError.mockClear()
      profile.mockImplementation(async () =>
        toProfile({ ...answered, location: [HAMBURG.lng, HAMBURG.lat] }),
      )
      const again = await arrive()
      expect(toastError).not.toHaveBeenCalled()
      expect(marker(again).find('.gk-shown-name').text()).toBe('Tobias')
    })
  })

  describe('an address that names nobody', () => {
    it.each([
      ['no pair', {}],
      ['half a pair', { with: TOBIAS.with }],
      ['the other half', { community: TOBIAS.community }],
      ['something that is no uuid', { with: 'tobias', community: TOBIAS.community }],
      ['a community that is no uuid', { with: TOBIAS.with, community: 'home' }],
      ['a pair given twice', { with: [TOBIAS.with, IRA.with], community: TOBIAS.community }],
    ])('asks the GMS nothing and says nothing for %s', async (_, query) => {
      remember('view', VIEW)
      const page = await arrive(query)

      expect(profile).not.toHaveBeenCalled()
      expect(toastError).not.toHaveBeenCalled()
      expect(marker(page).exists()).toBe(false)
      expect(centre()).toEqual({ lat: VIEW.lat, lng: VIEW.lng })

      await page.find('.map-back').trigger('click')
      expect(push).toHaveBeenCalledWith('/matching/entries')
    })
  })

  describe('answers that take their time', () => {
    it('marks the person when the answer comes after the map is there', async () => {
      const answer = held()
      profile.mockReturnValue(answer.promise)
      remember('view', VIEW)
      const page = await arrive()
      expect(marker(page).exists()).toBe(false)
      expect(centre()).toEqual({ lat: VIEW.lat, lng: VIEW.lng })

      answer.resolve(published())
      await flushPromises()

      expect(marker(page).find('.gk-shown-name').text()).toBe('Tobias')
      expect(centre()).toEqual(HAMBURG)
    })

    // The engine is loaded, not imported: the answer about the person can be there first.
    it('marks the person when the map comes after the answer', async () => {
      let open
      engineLoad.gate = new Promise((resolve) => {
        open = resolve
      })
      remember('view', VIEW)
      const page = await arrive()
      expect(profile).toHaveBeenCalledTimes(1)
      expect(created).toHaveLength(0)

      open()
      await flushPromises()
      await flushPromises()

      expect(created).toHaveLength(1)
      expect(marker(page).find('.gk-shown-name').text()).toBe('Tobias')
      expect(centre()).toEqual(HAMBURG)
    })

    it('says nothing about somebody once the page is gone', async () => {
      const answer = held()
      profile.mockReturnValue(answer.promise)
      await arrive()
      wrapper.unmount()
      wrapper = null

      answer.reject(notHeld())
      await flushPromises()

      expect(toastError).not.toHaveBeenCalled()
    })
  })

  describe('an address that comes to name somebody else', () => {
    it('lets the first one go and shows the other', async () => {
      const page = await arrive()
      expect(page.findAll('.gk-shown')).toHaveLength(1)

      route.current.query = IRA
      await flushPromises()

      expect(profile).toHaveBeenLastCalledWith(IRA.with, IRA.community)
      expect(page.findAll('.gk-shown')).toHaveLength(1)
      expect(marker(page).find('.gk-shown-name').text()).toBe('Ira-Erste')
      expect(centre()).toEqual(BERLIN)
    })

    it('does not show the first one when their answer comes after the second', async () => {
      const aboutTobias = held()
      profile.mockReturnValueOnce(aboutTobias.promise)
      const page = await arrive()

      route.current.query = IRA
      await flushPromises()
      aboutTobias.resolve(published())
      await flushPromises()

      expect(page.findAll('.gk-shown')).toHaveLength(1)
      expect(marker(page).find('.gk-shown-name').text()).toBe('Ira-Erste')
      expect(centre()).toEqual(BERLIN)
    })

    it('takes the mark away when it names nobody any more', async () => {
      const page = await arrive()

      route.current.query = {}
      await flushPromises()

      expect(marker(page).exists()).toBe(false)
    })
  })

  // The door (`mayFind`) turns such a member away before the page is built; this is the belt
  // behind it, as for the map itself.
  it('asks the GMS nothing for a member who is not findable', async () => {
    await arrive(TOBIAS, { gmsAllowed: false })

    expect(profile).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith('/matching/position')
  })

  // jsdom applies no stylesheet, so what the ring and the name are drawn with is read in the
  // source: the ring lets taps through to the core, the name takes them, and the name's face
  // follows the look -- light letters on the dark map, dark ones on the two light maps.
  describe('the rules it is drawn with', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    // Comments first: they name the values, and a guard that reads its own explanation proves
    // nothing.
    const source = readFileSync(join(here, 'MatchingMap.vue'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    )
    const ruleOf = (selector) =>
      source.match(new RegExp(`\\n${selector.replace(/[.()]/g, '\\$&')} \\{([^}]*)\\}`))?.[1]

    it('lets taps through the ring and its point, and takes them on the name', () => {
      expect(ruleOf('.gk-shown-ring')).toMatch(/pointer-events: none;/)
      expect(ruleOf('.gk-shown-point')).toMatch(/pointer-events: none;/)
      expect(ruleOf('.gk-shown-name')).toMatch(/pointer-events: auto;/)
    })

    it("takes the point away where the search draws the person's own mark", () => {
      expect(ruleOf('.map-shell.shown-is-drawn .gk-shown-point')).toMatch(/display: none;/)
      // And the point is there to be taken away: drawn in the ring's gold, in its middle.
      expect(ruleOf('.gk-shown-point')).toMatch(/background: #c69130;/)
      expect(ruleOf('.gk-shown-ring')).toMatch(/border: 3px solid #c69130;/)
    })

    // Where the search draws the person, a tap in the ring reaches THEIR mark -- with the crowd
    // question where somebody shares the spot. A core of its own on top would cover a housemate.
    it("takes no tap of its own in the ring where the search draws the person's mark", () => {
      expect(ruleOf('.map-shell.shown-is-drawn .gk-shown .gk-hit')).toMatch(/pointer-events: none;/)
      // And the control: elsewhere the core takes the tap, as on every marker.
      expect(ruleOf('.gk-hit')).toMatch(/pointer-events: auto;/)
    })

    it('shows on the ring that the keyboard has reached it', () => {
      const focused = ruleOf('.gk-shown:focus-visible .gk-shown-ring')
      expect(focused, 'no focus rule for the ring').toBeDefined()
      expect(focused).toMatch(/outline: 3px solid #fff;/)
      expect(focused).toMatch(/outline-offset: 2px;/)
    })

    it('keeps the name on one line, however long it is', () => {
      const name = ruleOf('.gk-shown-name')
      expect(name).toMatch(/white-space: nowrap;/)
      expect(name).toMatch(/text-overflow: ellipsis;/)
      expect(name).toMatch(/overflow: hidden;/)
      expect(name).toMatch(/max-width: 14rem;/)
    })

    it('gives the name the face of the look it stands on', () => {
      expect(ruleOf('.gk-shown-name')).toMatch(/color: #e8eaed;/)
      const light = ruleOf(
        '.map-shell.look-hell .gk-shown-name,\n.map-shell.look-normal .gk-shown-name',
      )
      expect(light, 'no rule for the name on the light maps').toBeDefined()
      expect(light).toMatch(/color: #1f2328;/)
    })

    it('holds the ring still for somebody who asked for less movement', () => {
      const still = source.match(
        /@media \(prefers-reduced-motion: reduce\) \{\s*\.gk-shown-ring \{([^}]*)\}/,
      )
      expect(still, 'no reduced-motion rule for the ring').not.toBeNull()
      expect(still[1]).toMatch(/animation: none;/)
    })
  })
})
