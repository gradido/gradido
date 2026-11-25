// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineComponent, h, reactive, ref } from 'vue'
import { walletStore } from '@test/walletStore'
import { useWalletStore } from '@/store/useWalletStore'
import { createI18n } from 'vue-i18n'
import de from '@/locales/de.json'
import { MatchingMap } from './MatchingMap'
import { GeoSearchField } from '@/components/Matching/GeoSearchField'
import {
  authenticateGmsUserSearch,
  listMatchingEntries,
  userLocationQuery,
} from '@/graphql/queries'
import {
  GMS_REJECTED,
  GMS_UNAVAILABLE,
  SENTENCE_QUESTIONS_MAX,
  toProfile,
} from '@/composables/useMatches'
import { created } from '@test/maplibreMock'
import { scoresOf } from '@/components/Matching/displayCore'

// The page's rules, as the .vue once held them in one block: the module (the scoped block) and
// the global sheet of the markers, in one text. Comments first where a test says so: they name
// the values, and a guard that reads its own explanation proves nothing.
const here = dirname(fileURLToPath(import.meta.url))
const pageStyles = ({ comments = true } = {}) => {
  const text = ['MatchingMap.module.scss', 'MatchingMap.css']
    .map((file) => readFileSync(join(here, file), 'utf8'))
    .join('\n')
  return comments ? text : text.replace(/\/\*[\s\S]*?\*\//g, '')
}

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
const listQuestion = vi.hoisted(() => vi.fn())
// The tick under the search field writes through the one mutation the page has
// (setMatchingEntryExactSentence), and then into the cached list for "Meine Einträge".
const writeExact = vi.hoisted(() => vi.fn())
const updateCachedQuery = vi.hoisted(() => vi.fn())

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (document) => {
    const handler = { result: null, error: null, refetch: vi.fn() }
    handlers.set(document, handler)
    return {
      refetch: handler.refetch,
      onResult: (callback) => {
        handler.result = callback
      },
      onError: (callback) => {
        handler.error = callback
      },
    }
  },
  useMutation: () => ({ mutate: writeExact }),
  // The page's own question for the list while an entry waits for its words (askForWords).
  useApolloClient: () => ({
    client: { query: listQuestion, cache: { updateQuery: updateCachedQuery } },
  }),
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
// The sentence questions of the search on screen (`{ [entry]: total }`) and whether an answer was
// taken down for new ones. Held out as well; what the real `load` writes into them is held in
// useMatches.spec.js -- a test here sets them as an answer would.
const sentenceTotals = ref({})
const askingAnew = ref(false)
// Whether the search asked last is on its way. A window left open last time waits for it.
const searchLoading = ref(false)
const searchError = ref(null)
// The profile route. Held out like `load`, so a test can see what the window asks for
// and hand it an answer - or none.
const profile = vi.fn()
// Where a test asks for it (`realSearch.on`), the page gets the real search, with the GMS answered by
// a stand-in for `fetch`: what the map shows between two answers is only seen that way.
const realSearch = vi.hoisted(() => ({ on: false }))
vi.mock('@/composables/useMatches', async () => {
  const actual = await vi.importActual('@/composables/useMatches')
  return {
    ...actual,
    useMatches: () =>
      realSearch.on
        ? actual.useMatches()
        : {
            matches,
            presence,
            sentenceTotals,
            askingAnew,
            loading: searchLoading,
            error: searchError,
            load,
            suggest,
            profile,
          },
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
  walletStore({
    gradidoID: MEMBER,
    gmsAllowed,
    userLocation: { latitude: 48.2, longitude: 11.6 },
  })

// A store whose member is not known, and which takes no position either.
const nameless = () => {
  const pinia = walletStore({ gmsAllowed: true, userLocation: { latitude: 48.2, longitude: 11.6 } })
  useWalletStore(pinia).setUserLocation = vi.fn()
  return pinia
}

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

// The radius dialog is bootstrap-vue-next's, which teleports and renders nothing while closed.
// The page's field and hint stay in the page here, as they did while the .vue left the dialog
// unresolved; the dialog's own `shown` and `ok` reach the stub's element as native listeners.
const BModalStub = { name: 'BModal', template: '<div class="modal-stub"><slot /></div>' }

// The search field as a stand-in that still shows what the page sets under its bar (the tick of a
// chosen entry). Its own rules -- the menu over it, nothing while a sentence is typed -- are held in
// MatchQuery.spec.js.
const MatchQueryStub = defineComponent({
  name: 'MatchQuery',
  props: { entries: Array, selection: Object, suggest: Function },
  emits: ['update:selection'],
  setup(_, { slots }) {
    return () => h('div', { class: 'match-query-stub' }, slots.below?.())
  },
})

const mountMap = ({ gmsAllowed = true, store = makeStore(gmsAllowed) } = {}) => {
  wrapper = mount(MatchingMap, {
    global: {
      plugins: [store, i18n],
      stubs: {
        MatchQuery: MatchQueryStub,
        MatchProfile: true,
        MatchList: true,
        BModal: BModalStub,
      },
    },
  })
  return wrapper
}

beforeEach(() => {
  route.current = reactive({ query: {} })
  handlers.clear()
  listQuestion.mockReset()
  listQuestion.mockResolvedValue({ data: { listMatchingEntries: [] } })
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
  sentenceTotals.value = {}
  askingAnew.value = false
  searchLoading.value = false
  searchError.value = null
  writeExact.mockReset()
  updateCachedQuery.mockReset()
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
    const rule = pageStyles().match(/\n\.query-field \{([^}]*)\}/)

    expect(rule, 'no .query-field rule in the page').not.toBeNull()
    expect(rule[1]).toMatch(/contain: inline-size;/)
  })

  // Over the list in the dark wallet the way back to the map stood white (Bernd, 29.09.2026).
  // jsdom applies no scoped styles, so the rules are read in the source and held against the
  // dark map's, whose face the switch takes there: the same ground, rim and letters, with the
  // dark map's variables resolved.
  it('gives the switch over the dark list the face it has over the dark map', () => {
    const source = pageStyles({ comments: false })
    const ruleOf = (selector) =>
      source.match(new RegExp(`\\n${selector.replace(/[.()]/g, '\\$&')} \\{([^}]*)\\}`))?.[1]
    const value = (body, property) => body?.match(new RegExp(`(?:^|\\s)${property}: ([^;]+);`))?.[1]
    const darkMap = source.match(/\n\.map-shell\.look-dunkel \{([\s\S]*?)\n\}/)?.[1] ?? ''
    const resolve = (text) => text?.replace(/var\((--[\w-]+)\)/g, (_, name) => value(darkMap, name))

    const mapSwitch = ruleOf('.map-shell.look-dunkel:not(.is-list) .look-switch')
    const mapWord = ruleOf('.map-shell.look-dunkel:not(.is-list) .look-btn:not(.is-on)')
    const listSwitch = ruleOf(':global(.dark-mode) .map-shell.is-list .look-switch')
    const listWord = ruleOf(':global(.dark-mode) .map-shell.is-list .look-btn:not(.is-on)')

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
      const namenlos = nameless()
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
      const namenlos = nameless()
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
      expect(page.text()).toContain('1 Mensch gefunden')
      expect(page.findComponent({ name: 'MatchList' }).props('silent')).toHaveLength(1)

      await reachButtons(page)[1].trigger('click')
      await page.vm.$nextTick()

      // `presence` still holds Paul - the search has not answered, and load is a spy
      // that never answers at all. The page must not be showing him all the same.
      expect(presence.value).toHaveLength(1)
      expect(page.findComponent({ name: 'MatchList' }).props('silent')).toEqual([])
      expect(page.text()).toContain('0 Menschen gefunden')
    })

    // The line counts like the row of the tick: grouped, and in the singular for one (side finding
    // of the language reader, 15.11.2026).
    it('groups the thousands in the line of the people found', async () => {
      const page = await settle(mountMap())
      presence.value = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        uuid: `r-${i}`,
        name: `Ring ${i}`,
        community: { uuid: 'c-1', name: 'Muenchen' },
        hasEntries: false,
        position: { lat: 48.2 + i / 10000, lng: 11.6 },
        precision: 'ungefaehr',
      }))
      await page.vm.$nextTick()

      expect(page.text()).toContain('1.000 Menschen gefunden')
    })

    // Today the number has to be deleted by hand before a new one can be typed.
    it('opens the radius dialog with the number selected, so a keystroke replaces it', async () => {
      const page = await settle(mountMap())
      // The binding first, before it is replaced below: without `ref` on the field
      // there would be nothing to select, and handing one in would hide that.
      expect(page.vm.radiusInput?.element?.id).toBe('map-radius-input')

      const select = vi.fn()
      // BFormInput hands out { blur, element, focus }; what it would expose is handed in, so
      // the call is the page's and not jsdom's.
      page.vm.radiusInput = { element: { select } }

      // The wiring itself: the dialog's own `shown`, dispatched on the stub's element. `shown`
      // fires on every opening and after the transition - the first moment the field can take
      // focus.
      page.element.querySelector('.modal-stub').dispatchEvent(new CustomEvent('shown'))
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
      const source = pageStyles({ comments: false })
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
      const rule = pageStyles({ comments: false }).match(/\n\.radius-row \{([^}]*)\}/)

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
      const rule = pageStyles({ comments: false }).match(/\n\.radius-group \{([^}]*)\}/)

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
      const source = pageStyles({ comments: false })

      // `gk-placed`: the engine sets it on what it takes.
      expect(source).toMatch(/\n\.gk-search:not\(:global\(\.gk-placed\)\) \{[^}]*display: none;/)

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
      const store = makeStore(true)
      const page = mountMap({ store })

      fire(userLocationQuery, { userLocation: { ...location, userLocation: {} } })
      await page.vm.$nextTick()

      expect(useWalletStore(store).userLocation).toBeNull()
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

  /**
   * An entry of mine without its words yet: the GMS finds nothing with it, so the search on
   * arrival comes back empty. The page asks for the list again, less often as time goes on,
   * and searches again as soon as an entry has its words (Bernd, 14.10.2026: an empty map
   * right after the event link and "home", stars only after leaving and coming back).
   */
  describe('while an entry of mine waits for its words', () => {
    const unkeyed = (uuid) => ({ ...entry(uuid), keyed: false })
    const keyed = (uuid) => ({ ...entry(uuid), keyed: true })
    const answer = (...list) => ({ data: { listMatchingEntries: list } })
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

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    const arrive = async (list, options) => {
      const page = mountMap(options)
      fire(userLocationQuery, { userLocation: location })
      fire(listMatchingEntries, { listMatchingEntries: list })
      await page.vm.$nextTick()
      return page
    }
    // One pause of the page, and the answer the question got.
    const pause = async (ms) => {
      vi.advanceTimersByTime(ms)
      await flushPromises()
    }

    it('asks for the list again after two seconds, and not before', async () => {
      await arrive([unkeyed('a')])

      await pause(1999)
      expect(listQuestion).not.toHaveBeenCalled()
      await pause(1)
      expect(listQuestion).toHaveBeenCalledTimes(1)
    })

    // A question the member did not cause must not move the idle logout on
    // (plugins/apolloProvider.js) -- and it asks the server, not the cache.
    it('asks without renewing the session, and past the cache', async () => {
      await arrive([unkeyed('a')])
      await pause(2000)

      expect(listQuestion).toHaveBeenCalledWith({
        query: listMatchingEntries,
        fetchPolicy: 'network-only',
        context: { renewSession: false },
      })
    })

    it('searches again once the entry has its words, and asks no more', async () => {
      await arrive([unkeyed('a')])
      const searched = load.mock.calls.length
      listQuestion.mockResolvedValueOnce(answer(keyed('a')))
      await pause(2000)

      expect(load).toHaveBeenCalledTimes(searched + 1)
      expect(load.mock.calls.at(-1)[0].mineUuids).toEqual(['a'])
      await pause(600000)
      expect(listQuestion).toHaveBeenCalledTimes(1)
    })

    /**
     * `keyed` says the words were worked out here; they reach the GMS a moment later, with the
     * keying run's publish. One more search three seconds on catches a publish that was slower
     * than the first search (coderabbit, #4150) -- on its own clock, not out of the list's count.
     */
    it('searches once more three seconds after the words, and no more', async () => {
      await arrive([unkeyed('a')])
      const searched = load.mock.calls.length
      listQuestion.mockResolvedValueOnce(answer(keyed('a')))
      await pause(2000)
      expect(load).toHaveBeenCalledTimes(searched + 1)

      await pause(2999)
      expect(load).toHaveBeenCalledTimes(searched + 1)
      await pause(1)
      expect(load).toHaveBeenCalledTimes(searched + 2)
      await pause(600000)
      expect(load).toHaveBeenCalledTimes(searched + 2)
    })

    it('searches once more after the last question of all, too', async () => {
      await arrive([unkeyed('a')])
      const searched = load.mock.calls.length
      listQuestion.mockResolvedValue(answer(unkeyed('a')))
      for (let i = 0; i < 10; i++) await pause(30000)
      listQuestion.mockResolvedValue(answer(keyed('a')))
      await pause(30000)
      expect(listQuestion).toHaveBeenCalledTimes(11)
      expect(load).toHaveBeenCalledTimes(searched + 1)

      await pause(3000)
      expect(load).toHaveBeenCalledTimes(searched + 2)
    })

    it('does not search once more once the page is gone', async () => {
      const page = await arrive([unkeyed('a')])
      const searched = load.mock.calls.length
      listQuestion.mockResolvedValueOnce(answer(keyed('a')))
      await pause(2000)
      page.unmount()
      wrapper = null

      await pause(600000)
      expect(load).toHaveBeenCalledTimes(searched + 1)
    })

    it('does not search again for an answer in which the entry still has none', async () => {
      await arrive([unkeyed('a')])
      const searched = load.mock.calls.length
      listQuestion.mockResolvedValue(answer(unkeyed('a')))
      await pause(2000)

      expect(load).toHaveBeenCalledTimes(searched)
      await pause(3000)
      expect(listQuestion).toHaveBeenCalledTimes(2)
    })

    it('searches again when one of two gets its words, and goes on asking for the other', async () => {
      await arrive([unkeyed('a'), unkeyed('b')])
      const searched = load.mock.calls.length
      listQuestion.mockResolvedValue(answer(keyed('a'), unkeyed('b')))
      await pause(2000)

      expect(load).toHaveBeenCalledTimes(searched + 1)
      await pause(3000)
      expect(listQuestion).toHaveBeenCalledTimes(2)
      // the one more search after the words, and no other
      expect(load).toHaveBeenCalledTimes(searched + 2)
    })

    it('searches once more when the last one gets its words, then stops asking', async () => {
      await arrive([keyed('a'), unkeyed('b')])
      const searched = load.mock.calls.length
      listQuestion.mockResolvedValue(answer(keyed('a'), keyed('b')))
      await pause(2000)

      expect(load).toHaveBeenCalledTimes(searched + 1)
      await pause(600000)
      expect(listQuestion).toHaveBeenCalledTimes(1)
      expect(load).toHaveBeenCalledTimes(searched + 2)
    })

    // The answer is written to the cache too, and comes back through the page's own list:
    // one search for it, not two.
    it('searches once where the answer also comes back through the list', async () => {
      const page = await arrive([unkeyed('a')])
      const searched = load.mock.calls.length
      listQuestion.mockImplementationOnce(async () => {
        fire(listMatchingEntries, { listMatchingEntries: [keyed('a')] })
        return answer(keyed('a'))
      })
      await pause(2000)
      await page.vm.$nextTick()

      expect(load).toHaveBeenCalledTimes(searched + 1)
    })

    /**
     * A list that comes in while the question is on its way -- the arrival's network answer --
     * is not written over by the answer to the question (coderabbit, #4150): that answer was
     * read before it. The page goes on asking from the list it took.
     */
    it('lets an answer go where a list came in while it was on its way', async () => {
      const page = await arrive([unkeyed('a')])
      let give
      listQuestion.mockReturnValueOnce(new Promise((resolve) => (give = resolve)))
      vi.advanceTimersByTime(2000)
      fire(listMatchingEntries, { listMatchingEntries: [unkeyed('a'), unkeyed('b')] })
      await page.vm.$nextTick()

      give(answer(keyed('a')))
      await flushPromises()

      expect(load.mock.calls.at(-1)[0].mineUuids).toEqual(['a', 'b'])
      listQuestion.mockResolvedValue(answer(unkeyed('a'), unkeyed('b')))
      await pause(3000)
      expect(listQuestion).toHaveBeenCalledTimes(2)
    })

    it('asks eleven times at most, a little over two minutes in all', async () => {
      await arrive([unkeyed('a')])
      listQuestion.mockResolvedValue(answer(unkeyed('a')))
      for (let i = 0; i < 20; i++) await pause(30000)

      expect(listQuestion).toHaveBeenCalledTimes(11)
    })

    it('asks again after the next pause when a question fails', async () => {
      await arrive([unkeyed('a')])
      listQuestion.mockRejectedValueOnce(new Error('no list'))
      await pause(2000)
      await pause(3000)

      expect(listQuestion).toHaveBeenCalledTimes(2)
    })

    // An answer without the list is no answer: taken, it would empty the page's own entries.
    it('asks again after the next pause when an answer holds no list', async () => {
      await arrive([unkeyed('a')])
      const searched = load.mock.calls.length
      listQuestion.mockResolvedValue(answer(unkeyed('a')))
      listQuestion.mockResolvedValueOnce({ data: {} })
      await pause(2000)
      await pause(3000)

      expect(listQuestion).toHaveBeenCalledTimes(2)
      expect(load).toHaveBeenCalledTimes(searched)
    })

    // cache-and-network answers twice on arrival: one chain of questions, not two.
    it('asks once for two answers that come together', async () => {
      const page = await arrive([unkeyed('a')])
      fire(listMatchingEntries, { listMatchingEntries: [unkeyed('a')] })
      await page.vm.$nextTick()

      await pause(2000)
      expect(listQuestion).toHaveBeenCalledTimes(1)
    })

    it('does not ask where every entry has its words', async () => {
      await arrive([keyed('a')])
      await pause(600000)
      expect(listQuestion).not.toHaveBeenCalled()
    })

    // The words are worked out for members who take part; for anybody else none would come.
    it('does not ask for a member who is not findable', async () => {
      await arrive([unkeyed('a')], { gmsAllowed: false })
      await pause(600000)
      expect(listQuestion).not.toHaveBeenCalled()
    })

    // A paused entry is in nobody's search, and gets no words while it is.
    it('does not ask for a paused entry', async () => {
      await arrive([{ ...unkeyed('a'), active: false }])
      await pause(600000)
      expect(listQuestion).not.toHaveBeenCalled()
    })

    it('asks no more once the page is gone', async () => {
      const page = await arrive([unkeyed('a')])
      page.unmount()
      wrapper = null
      await pause(600000)
      expect(listQuestion).not.toHaveBeenCalled()
    })

    it('does nothing with an answer that comes after the page is gone', async () => {
      const page = await arrive([unkeyed('a')])
      let give
      listQuestion.mockReturnValueOnce(new Promise((resolve) => (give = resolve)))
      vi.advanceTimersByTime(2000)
      const searched = load.mock.calls.length
      page.unmount()
      wrapper = null
      give(answer(keyed('a')))
      await flushPromises()

      expect(load).toHaveBeenCalledTimes(searched)
      await pause(600000)
      expect(listQuestion).toHaveBeenCalledTimes(1)
    })

    /**
     * The search after the words is a later one, not the arrival's: a window left open last
     * time (off to the send form and back) is not brought back by it. Minutes into a visit it
     * would pop up over whatever the member is doing.
     */
    it('does not reopen a window remembered from last time with the search after the words', async () => {
      window.localStorage.setItem(`${KEY}profile`, JSON.stringify('u-1'))
      const page = await arrive([unkeyed('a')])
      listQuestion.mockResolvedValueOnce(answer(keyed('a')))
      await pause(2000)

      matches.value = [person('u-1')]
      await page.vm.$nextTick()

      expect(page.findComponent({ name: 'MatchProfile' }).props('modelValue')).toBe(false)
    })

    // The control: the arrival's own results still bring it back.
    it('still reopens it with the results of the arrival', async () => {
      window.localStorage.setItem(`${KEY}profile`, JSON.stringify('u-1'))
      const page = await arrive([unkeyed('a')])

      matches.value = [person('u-1')]
      await page.vm.$nextTick()

      expect(page.findComponent({ name: 'MatchProfile' }).props('modelValue')).toBe(true)
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
      fire(listMatchingEntries, { listMatchingEntries: [] })

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
      fire(listMatchingEntries, { listMatchingEntries: [] })

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

    it('keeps a step-1 disc at 12 px on the light map and gives it 44 px to tap', async () => {
      const page = await buildMap('hell', () => [person('anna', east(0))])

      const box = page.find('.gk-clickable').element
      expect(px(page.find('.gk-disc').element, 'width')).toBe('12px')
      expect(px(page.find('.gk-hit').element, 'width')).toBe('44px')
      // The box is as big as the tap area, and still centred on the person: its top left corner
      // stands half the area left of and above the person's place.
      expect([px(box, 'width'), px(box, 'height')]).toEqual(['44px', '44px'])
      expect(box.style.transform).toContain('translate(-22px, -22px)')
    })

    it('gives the same person 44 px to tap inside the glow on the dark map', async () => {
      const page = await buildMap('dunkel', () => [person('anna', east(0))])

      expect(px(page.find('.gk-hit').element, 'width')).toBe('44px')
      expect(px(page.find('.gk-clickable').element, 'width')).toBe('40px')
    })

    // Bernd, 24.11.2026: smaller, equally bright. The blur shrinks with the glow (3 px on the
    // 104-px glow of old), so a smaller glow is the old one drawn smaller and keeps its bright
    // middle; a fixed 3 px dimmed it.
    it('scales the blur of a glow with its size', async () => {
      const page = await buildMap('dunkel', () => [person('anna', east(0))])

      expect(px(page.find('.gk-glow').element, 'filter')).toBe('blur(1.15px)')
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
    // largest tap area there is - 44 px since the discs were made smaller - so beyond the
    // crowd radius.
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
        expect(px(dark.find('.gk-clickable').element, 'width')).toBe('64px')
        expect(px(dark.find('.gk-hit').element, 'width')).toBe('44px')
        expect(px(dark.find('.gk-glow').element, 'filter')).toBe('blur(1.85px)')
        dark.unmount()
        wrapper = null

        const light = await buildMap('hell', () => [broad('clara')])
        expect(px(light.find('.gk-disc').element, 'width')).toBe('34px')
        expect(px(light.find('.gk-clickable').element, 'width')).toBe('44px')
      })

      // The control: the same person without breadth is a step-4 match, sized as one.
      it('stays on the fourth size while breadth is off', async () => {
        const dark = await buildMap('dunkel', () => [broad('clara')])
        expect(px(dark.find('.gk-clickable').element, 'width')).toBe('58px')
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
    const sourceRules = () => pageStyles({ comments: false })
    const ruleOf = (source, selectors) =>
      source.match(
        new RegExp(`\\n${selectors.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`),
      )?.[1]

    it("keeps MapLibre's markers and controls in their layers", () => {
      const source = sourceRules()

      expect(ruleOf(source, '.map-shell :global(.maplibregl-canvas-container)')).toMatch(
        /isolation: isolate;/,
      )
      expect(ruleOf(source, '.map-shell :global(.maplibregl-ctrl-top-left)')).toMatch(
        /z-index: 1000;/,
      )
      expect(ruleOf(source, '.maplibregl-marker.gk-marker.gk-clickable')).toMatch(
        /pointer-events: none;/,
      )
      for (const mode of ['is-list', 'is-cluster']) {
        expect(
          ruleOf(source, `.map-shell.${mode} :global(.maplibregl-control-container)`),
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

      const group = ruleOf(source, '.map-shell :global(.maplibregl-ctrl.maplibregl-ctrl-group)')
      expect(group).toMatch(/border: 2px solid rgb\(0 0 0 \/ 20%\);/)
      expect(group).toMatch(/box-shadow: none;/)
      const buttons = ruleOf(
        source,
        '.map-shell :global(.maplibregl-ctrl-group button),\n.map-shell :global(.maplibregl-ctrl-group a)',
      )
      expect(buttons).toMatch(/width: 30px;/)
      expect(buttons).toMatch(/height: 30px;/)

      const darkGroup = ruleOf(source, '  :global(.maplibregl-ctrl-group)')
      expect(darkGroup).toMatch(/border-color: var\(--dark-rim\);/)
      expect(darkGroup).toMatch(/background-color: var\(--dark-chrome\);/)
      expect(ruleOf(source, '  :global(.maplibregl-ctrl-group .maplibregl-ctrl-icon)')).toMatch(
        /filter: invert\(1\) brightness\(1\.14\);/,
      )
      expect(ruleOf(source, '  :global(.maplibregl-ctrl-attrib)')).toMatch(
        /background-color: rgb\(22 24 29 \/ 80%\);/,
      )
    })
  })
})

/**
 * Bernd, 09.10.2026: a contact one has in the chat can be found on the find map as well. The
 * contact window's pin leads to `/matching/karte?with=<gradidoID>&community=<uuid>`; the page asks
 * the GMS where the person stands, marks them with a gold ring and their name, and for the visit
 * puts the search on them: the map frames that circle, and the list names them first.
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

  /** The same people as the SEARCH hands them over: a match, and a grey ring. */
  const found = (who, over = {}) => ({
    uuid: who.with,
    name: who === IRA ? 'Ira-Erste' : 'Tobias',
    position: who === IRA ? BERLIN : HAMBURG,
    community: { uuid: who.community, name: 'KI Playground' },
    aboutMe: '',
    precision: 'genau',
    channels: { gesuch: [{ uuid: 'e-1', strength: 0.8, matchedEntryUuid: 'mine' }] },
    scores: { gesuch: [{ strength: 0.8, entry: 'mine', subject: 'cello' }] },
    ...over,
  })
  const ring = (who) => ({
    id: 7,
    uuid: who.with,
    name: who === IRA ? 'Ira-Erste' : 'Tobias',
    community: { uuid: who.community, name: 'KI Playground' },
    hasEntries: false,
    position: who === IRA ? BERLIN : HAMBURG,
    precision: 'ungefaehr',
  })

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

  // Bernd, 09.10.2026: the search point is set exactly on the contact, and the radius stays as
  // the member has it. So the map shows who lives around them -- and the list, the one
  // representation a blind member has, reads the same.
  describe('the search of the visit', () => {
    const listLine = (page) => page.findComponent({ name: 'MatchList' }).props('centerLabel')
    // What the tile file names at Tobias' point, where a test lets it name something.
    const ST_PAULI = { place: 'St. Pauli', context: 'Hamburg' }

    afterEach(() => {
      placeNameAt.mockReset()
      placeNameAt.mockImplementation(async () => null)
    })

    it('stands on the person, with the radius the member has, and is asked once', async () => {
      remember('radius', 40)
      await arrive()

      expect(load).toHaveBeenCalledTimes(1)
      const [search] = load.mock.calls[0]
      expect(search.center).toEqual(HAMBURG)
      expect(search.radius).toBe(40)
    })

    // The first search of the page waits for the answer about the person: asked at once it would
    // search the member's own circle a moment before, and a list would read out two places.
    it('waits for the answer about the person, and asks nothing before it', async () => {
      const answer = held()
      profile.mockReturnValue(answer.promise)
      await arrive()
      expect(load).not.toHaveBeenCalled()

      answer.resolve(published())
      await flushPromises()

      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual(HAMBURG)
    })

    // The control: an ordinary visit searches at once, around the member's own place.
    it('is asked at once on an ordinary visit, around the place the member searches from', async () => {
      await arrive(null)

      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual(HOME)
    })

    // Found in the built wallet (09.10.2026): for a member who has been here before, the search
    // their own entries ask for when they arrive ran at once, around the centre written down --
    // and the page searched there first and around the person after.
    it("waits as well where the member's entries arrive before the answer about the person", async () => {
      remember('center', HOME)
      const answer = held()
      profile.mockReturnValue(answer.promise)
      await arrive()

      fire(listMatchingEntries, { listMatchingEntries: [entry('a')] })
      await flushPromises()
      expect(load).not.toHaveBeenCalled()

      answer.resolve(published())
      await flushPromises()
      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual(HAMBURG)
    })

    // The page's own fallback is no choice of the member's either (second reader): a remembered
    // question that points at an entry which is gone is put back to "all", and the search that
    // goes with it waits like the page's other ones.
    it('waits as well where a remembered question points at an entry that is gone', async () => {
      remember('center', HOME)
      remember('query', { kind: 'entry', uuid: 'gone' })
      const answer = held()
      profile.mockReturnValue(answer.promise)
      await arrive()

      fire(listMatchingEntries, { listMatchingEntries: [entry('a')] })
      await flushPromises()
      expect(remembered('query')).toEqual({ kind: 'all' })
      expect(load).not.toHaveBeenCalled()

      answer.resolve(published())
      await flushPromises()
      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual(HAMBURG)
    })

    // The control: on an ordinary visit those entries ask their search at once.
    it('asks at once for the entries of the member on an ordinary visit', async () => {
      await arrive(null)
      load.mockClear()

      fire(listMatchingEntries, { listMatchingEntries: [entry('a')] })
      await flushPromises()

      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual(HOME)
    })

    // ⛔ What can be pressed while the answer is on its way: the search itself. A place the
    // member picks then is searched at once, and the answer does not take the search from under
    // their hand -- the person is marked and listed, and the search stays where they put it.
    it('leaves the search where the member put it while the answer was on its way', async () => {
      const prag = { lat: 50.0874654, lng: 14.4212535, label: 'Prag' }
      const answer = held()
      profile.mockReturnValue(answer.promise)
      remember('mode', 'liste')
      const page = await arrive()

      await page.findComponent({ name: 'MatchList' }).vm.$emit('recenter', prag)
      await flushPromises()
      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual({ lat: prag.lat, lng: prag.lng })

      answer.resolve(published())
      await flushPromises()

      const list = page.findComponent({ name: 'MatchList' })
      expect(list.props('contact').person.name).toBe('Tobias')
      expect(list.props('centerLabel')).toBe('Prag')
      expect(list.props('searchCenter')).toEqual({ lat: prag.lat, lng: prag.lng })
      // Asked once: the member's search was the one that waited, too.
      expect(load).toHaveBeenCalledTimes(1)
      expect(remembered('center')).toEqual({ lat: prag.lat, lng: prag.lng })
    })

    it('frames the circle around them, in place of the view the map was left at', async () => {
      remember('view', VIEW)
      await arrive()

      expect(centre()).toEqual(HAMBURG)
      // Framed, not merely centred: a box is fitted around their point (the circle's), and the
      // remembered view is not gone to at all.
      const fitted = theMap().camera.filter((move) => move.how === 'fitBounds')
      expect(fitted).toHaveLength(1)
      // (The middle of a box on the Mercator sheet lies a hair north of its middle in degrees.)
      expect(fitted[0].center[0]).toBeCloseTo(HAMBURG.lng, 2)
      expect(fitted[0].center[1]).toBeCloseTo(HAMBURG.lat, 2)
      expect(theMap().camera.some((move) => move.zoom === VIEW.zoom - 1)).toBe(false)
    })

    // The order home -> map -> person: the map is there, with the member's own circle, when the
    // answer comes -- and the circle and its disc move onto the person then.
    it('moves the circle and its disc onto them where the map was there first', async () => {
      const answer = held()
      profile.mockReturnValue(answer.promise)
      remember('center', HOME)
      const page = await arrive()
      const discAt = () => page.find('.gk-centre').element.closest('.maplibregl-marker')
      // The circle as the engine holds it: a shape in a source, around the member's own centre.
      const circle = () => JSON.stringify(theMap().getSource('gk-circle').data)
      const circleBefore = circle()

      answer.resolve(published())
      await flushPromises()

      expect(discAt().style.transform).toBe(
        marker(page).element.style.transform.replace('-28px, -28px', '-20px, -20px'),
      )
      expect(circle()).not.toBe(circleBefore)
    })

    // A place name still being looked up for the centre before must not come to name this one.
    it('is not named by a lookup that was out for the centre before', async () => {
      const before = held()
      placeNameAt.mockImplementationOnce(() => before.promise)
      remember('mode', 'karte')
      const page = await arrive(null)
      // Away from home first: a point set on the house needs no name and looks none up.
      theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat], zoom: 11 })
      await page.find('.map-crosshair').trigger('click')
      await flushPromises()
      expect(placeNameAt).toHaveBeenCalledTimes(1)

      placeNameAt.mockImplementation(async () => ST_PAULI)
      route.current.query = TOBIAS
      await flushPromises()
      before.resolve({ place: 'Freising', context: 'München' })
      await flushPromises()
      await page.find('.look-switch > .look-btn:last-child').trigger('click')

      expect(listLine(page)).toBe('St. Pauli, Hamburg')
    })

    // Closing an overlay writes it away. One remembered for the way back from the send form is
    // not this visit's to forget (second reader).
    it('leaves an overlay remembered from another visit written down', async () => {
      remember('cluster', ['u-1', 'u-2'])
      await arrive()

      expect(remembered('cluster')).toEqual(['u-1', 'u-2'])
    })

    it('stands the disc of the search centre under their ring', async () => {
      const page = await arrive()

      // Both stand on the one point: the ring's box half a ring left of and above it, the disc's
      // half a disc.
      const disc = page.find('.gk-centre').element.closest('.maplibregl-marker')
      expect(disc.style.transform).toBe(
        marker(page).element.style.transform.replace('-28px, -28px', '-20px, -20px'),
      )
    })

    // ⛔ Nothing of it is written down: the next ordinary visit searches where the member last
    // searched for themselves. A blind member has no way home in the list but typing an address.
    it('writes neither the centre nor its name down', async () => {
      placeNameAt.mockImplementation(async () => ST_PAULI)
      remember('center', HOME)
      remember('centerLabel', 'Mein Dorf')
      remember('mode', 'liste')
      const page = await arrive()
      await page.vm.$nextTick()

      // The place is named, so the lookup has answered -- and nothing of it is kept.
      expect(listLine(page)).toBe('St. Pauli, Hamburg')
      expect(remembered('center')).toEqual(HOME)
      expect(remembered('centerLabel')).toBe('Mein Dorf')
    })

    it('leaves the next ordinary visit where the member searched last', async () => {
      const elsewhere = { lat: 50.5, lng: 8.5 }
      remember('center', elsewhere)
      await arrive()
      wrapper.unmount()
      wrapper = null
      load.mockClear()

      await arrive(null)

      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual(elsewhere)
    })

    // The very first visit of all can be such a visit: the member's home is still written down
    // as the place they search from, and the live search stands on the person.
    it("writes the home down as the member's own centre on a first visit, and searches the person", async () => {
      await arrive()

      expect(remembered('center')).toEqual(HOME)
      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual(HAMBURG)
    })

    // Bernd, 10.10.2026: the line says WHERE, as it does for any point of the map -- "Umkreis um
    // Kassel". A blind member asks the list where their contact is, and a line that answers
    // "around Tobias" does not say. The first build named the centre after the person and looked
    // no place up: a rule from the days when the lookup asked a service outside.
    it('names the centre by the place the person is found in, read from the tiles', async () => {
      placeNameAt.mockClear()
      placeNameAt.mockImplementation(async () => ST_PAULI)
      remember('mode', 'liste')
      const page = await arrive()

      expect(listLine(page)).toBe('St. Pauli, Hamburg')
      expect(placeNameAt).toHaveBeenCalledTimes(1)
      const [, lat, lng, locale] = placeNameAt.mock.calls[0]
      expect({ lat, lng, locale }).toEqual({ ...HAMBURG, locale: 'de' })
    })

    // The place is read a moment after the search moved. Until then the line names nothing: not
    // the place the search has left, not the person, and not "the chosen point" -- nobody chose
    // it, and the line is announced, so a sentence taken back would be read out twice.
    it('names nothing until the place is read', async () => {
      const lookup = held()
      placeNameAt.mockImplementation(() => lookup.promise)
      remember('center', { lat: 50.5, lng: 8.5 })
      remember('centerLabel', 'Mein Dorf')
      remember('mode', 'liste')
      const page = await arrive()
      const list = page.findComponent({ name: 'MatchList' })
      expect(list.props('contact').person.name).toBe('Tobias')
      expect(list.props('searchCenter')).toEqual(HAMBURG)

      expect(listLine(page)).toBe('')

      lookup.resolve(ST_PAULI)
      await flushPromises()
      expect(listLine(page)).toBe('St. Pauli, Hamburg')
    })

    // No place within reach of their point, or the tile file cannot be read: the line names the
    // person. That stays true, and says whose surroundings the list shows.
    it.each([
      ['name no place there', async () => null],
      [
        'cannot be read',
        async () => {
          throw new Error('offline')
        },
      ],
    ])('names the person where the tiles %s', async (_, answer) => {
      placeNameAt.mockImplementation(answer)
      remember('mode', 'liste')
      const page = await arrive()

      expect(placeNameAt).toHaveBeenCalledTimes(1)
      expect(listLine(page)).toBe('Tobias')
    })

    // Somebody under the member's own roof: the search stands on the member's home, and the line
    // calls it that, whatever the tiles name there.
    it("calls the centre the member's home where the person lives there", async () => {
      placeNameAt.mockImplementation(async () => ST_PAULI)
      profile.mockResolvedValue(published(TOBIAS, { position: { ...HOME } }))
      remember('mode', 'liste')
      const page = await arrive()

      expect(listLine(page)).toBe(de.matching.map.centreHome)
    })

    // ⛔ What can be pressed while the place is being read: the search. A place the member picks
    // then carries its own name and is written down with it -- the answer about the person's
    // place comes after and names nothing any more.
    it('names nothing any more once the member has moved the search', async () => {
      const prag = { lat: 50.0874654, lng: 14.4212535, label: 'Prag' }
      const lookup = held()
      placeNameAt.mockImplementation(() => lookup.promise)
      remember('mode', 'liste')
      const page = await arrive()

      await page.findComponent({ name: 'MatchList' }).vm.$emit('recenter', prag)
      await flushPromises()
      lookup.resolve(ST_PAULI)
      await flushPromises()

      expect(listLine(page)).toBe('Prag')
      expect(remembered('centerLabel')).toBe('Prag')
    })

    // The visit ends while the place is being read: the member's own centre has its own name.
    it('names nothing any more once the visit is over', async () => {
      const lookup = held()
      placeNameAt.mockImplementation(() => lookup.promise)
      remember('center', { lat: 50.5, lng: 8.5 })
      remember('centerLabel', 'Mein Dorf')
      remember('mode', 'liste')
      const page = await arrive()

      route.current.query = {}
      await flushPromises()
      lookup.resolve(ST_PAULI)
      await flushPromises()

      expect(listLine(page)).toBe('Mein Dorf')
      expect(remembered('centerLabel')).toBe('Mein Dorf')
    })

    // The address goes on to somebody else while the first place is being read: the line names
    // where the second one is found, whatever the first lookup answers afterwards.
    it('is named for the person the address names now', async () => {
      const first = held()
      placeNameAt.mockImplementationOnce(() => first.promise)
      remember('mode', 'liste')
      const page = await arrive()

      placeNameAt.mockImplementation(async () => ({ place: 'Mitte', context: 'Berlin' }))
      route.current.query = IRA
      await flushPromises()
      first.resolve(ST_PAULI)
      await flushPromises()

      expect(page.findComponent({ name: 'MatchList' }).props('contact').person.name).toBe(
        'Ira-Erste',
      )
      expect(listLine(page)).toBe('Mitte, Berlin')
    })

    // A search the member moves is their own: written down, with the view of it.
    it("is the member's own again once they move it", async () => {
      // Another centre than the home is written down, so that the home afterwards is the move's
      // doing and not what stood there anyway.
      const elsewhere = { lat: 50.5, lng: 8.5 }
      remember('center', elsewhere)
      remember('view', VIEW)
      const page = await arrive()
      expect(remembered('view')).toEqual(VIEW)
      expect(remembered('center')).toEqual(elsewhere)

      // The way home: the search goes back to the member's own place, and the map frames it.
      page.find('.gk-home a').element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await flushPromises()

      expect(remembered('center')).toEqual(HOME)
      expect(load.mock.calls.at(-1)[0].center).toEqual(HOME)
      expect(remembered('view').lat).toBeCloseTo(HOME.lat, 4)
      expect(remembered('view').lng).toBeCloseTo(HOME.lng, 4)
      // And what the member looks at after that is remembered as on any visit. (With a zoom: the
      // stand-in frames a circle in a view of no size at the widest zoom there is, where Berlin
      // lies within the few pixels the map eases back onto the search centre.)
      theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat], zoom: 11 })
      expect(remembered('view').lat).toBeCloseTo(BERLIN.lat, 4)
      expect(remembered('view').lng).toBeCloseTo(BERLIN.lng, 4)
      // The person stays marked: the search moved, they did not.
      expect(marker(page).exists()).toBe(true)
    })

    // The radius and the reach are the member's own settings, during the visit as ever -- but
    // the view that frames the new circle is the visit's, around the person, and is not written
    // down. Found by the second reader: the view that WAS written down is then the one of the
    // old circle, and the next ordinary visit opened on it with a circle that no longer fits.
    // It is forgotten instead, so that visit frames the member's own circle afresh.
    describe('with a radius or a reach changed during it', () => {
      const widen = async (page) => {
        // As the reach tests above set a radius: the draft where the field would set it, and
        // the key that submits on the real element.
        page.vm.radiusDraft = 60
        await page.find('#map-radius-input').trigger('keyup.enter')
        await flushPromises()
      }

      it('searches the new circle around the person, and writes the radius down', async () => {
        remember('view', VIEW)
        const page = await arrive()

        await widen(page)

        expect(load.mock.calls.at(-1)[0]).toMatchObject({ center: HAMBURG, radius: 60 })
        expect(remembered('radius')).toBe(60)
        expect(remembered('center')).toEqual(HOME)
      })

      it("forgets the view of the old circle, and does not write the visit's view in its place", async () => {
        remember('view', VIEW)
        const page = await arrive()

        await widen(page)
        expect(remembered('view')).toBeNull()

        theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat], zoom: 11 })
        expect(remembered('view')).toBeNull()
      })

      it('forgets it for a changed reach as well', async () => {
        remember('view', VIEW)
        const page = await arrive()

        await page.findAll('.reach-btn')[1].trigger('click')
        await flushPromises()

        expect(remembered('reach')).toBe('fern')
        expect(remembered('view')).toBeNull()
        expect(load.mock.calls.at(-1)[0]).toMatchObject({ center: HAMBURG, remoteOnly: true })
      })

      it("lets the next ordinary visit frame the member's own circle afresh", async () => {
        remember('view', VIEW)
        const page = await arrive()
        await widen(page)
        wrapper.unmount()
        wrapper = null

        await arrive(null)

        const fitted = theMap().camera.filter((move) => move.how === 'fitBounds')
        expect(fitted).toHaveLength(1)
        expect(fitted[0].center[0]).toBeCloseTo(HOME.lng, 2)
        expect(fitted[0].center[1]).toBeCloseTo(HOME.lat, 1)
      })

      // The control: on an ordinary visit the same change writes the view of the new circle.
      it('writes the view of the new circle on an ordinary visit', async () => {
        remember('view', VIEW)
        const page = await arrive(null)

        await widen(page)

        expect(remembered('view')).not.toBeNull()
        expect(remembered('view').lat).toBeCloseTo(HOME.lat, 1)
      })
    })

    // ⛔ The list measures from the point the search stands on -- on a visit, the person's
    // PUBLISHED point, which may be blurred. Found by the second reader: the list was still told
    // that its origin is exact, and read "3,2 km östlich" from a point that is itself blurred.
    // The coarser end wins (describeDistance), so the list is told which end this one is.
    describe('how precisely the list is told its origin is known', () => {
      const told = (page) => page.findComponent({ name: 'MatchList' }).props('myPrecision')
      const inList = async (query) => {
        remember('mode', 'liste')
        return arrive(query)
      }

      it("is the person's own precision while the search stands on them", async () => {
        const page = await inList()
        expect(told(page)).toBe('ungefaehr')
      })

      it('is exact for a person whose point is exact', async () => {
        profile.mockResolvedValue(published(TOBIAS, { precision: 'genau' }))
        const page = await inList()
        expect(told(page)).toBe('genau')
      })

      it("is the member's own on an ordinary visit", async () => {
        const page = await inList(null)
        expect(told(page)).toBe('genau')
      })

      it("is the member's own again once they move the search", async () => {
        const page = await inList()
        await page
          .findComponent({ name: 'MatchList' })
          .vm.$emit('recenter', { lat: 50.5, lng: 8.5 })
        await flushPromises()
        expect(told(page)).toBe('genau')
      })

      it("is the member's own where the lens measures from their home", async () => {
        remember('lens', 'wohnort')
        const page = await inList()
        expect(told(page)).toBe('genau')
      })

      // Somebody under the member's own roof, at the same address: their published point IS the
      // member's home, to the last digit. The home is known exactly -- while the search stands
      // there for the visit, and after the member pressed the way home (coderabbit on #4117).
      describe('where the person is found on the very point of the home', () => {
        beforeEach(() => {
          profile.mockResolvedValue(published(TOBIAS, { position: { ...HOME } }))
        })

        it("is the member's own while the search stands on them", async () => {
          const page = await inList()
          const list = page.findComponent({ name: 'MatchList' })

          expect(list.props('contact').person.precision).toBe('ungefaehr')
          expect(list.props('searchCenter')).toEqual(HOME)
          expect(told(page)).toBe('genau')
        })

        it("is the member's own after the way home", async () => {
          remember('mode', 'karte')
          const page = await arrive()
          page.find('.gk-home a').element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
          await flushPromises()
          await page.find('.look-switch > .look-btn:last-child').trigger('click')

          expect(page.findComponent({ name: 'MatchList' }).props('contact').person.name).toBe(
            'Tobias',
          )
          expect(told(page)).toBe('genau')
        })
      })

      // The origin is the person's on their very point only. A search the member moves due east
      // or due north of them shares one of its two numbers with that point (a change put back
      // in that compared the latitude alone went through every test, 10.10.2026).
      it.each([
        ['due east of them', { lat: HAMBURG.lat, lng: HAMBURG.lng + 0.5 }],
        ['due north of them', { lat: HAMBURG.lat + 0.5, lng: HAMBURG.lng }],
      ])("is the member's own for a search they move %s", async (_, point) => {
        const page = await inList()
        await page.findComponent({ name: 'MatchList' }).vm.$emit('recenter', point)
        await flushPromises()

        expect(page.findComponent({ name: 'MatchList' }).props('searchCenter')).toEqual(point)
        expect(told(page)).toBe('genau')
      })
    })
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

  // The map is brought onto the person ONCE. A location answer that comes again -- or late, after
  // the member has looked elsewhere -- restores the view, and must not pull it back to them.
  it('does not pull the map back to the person once the member has looked elsewhere', async () => {
    const page = await arrive()
    expect(centre()).toEqual(HAMBURG)

    // With a zoom: the stand-in frames a circle in a view of no size at the widest zoom there
    // is, where Berlin lies within the few pixels the map eases back onto the search centre.
    theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat], zoom: 11 })
    fire(userLocationQuery, { userLocation: location })
    await page.vm.$nextTick()

    expect(centre()).toEqual(BERLIN)
    // And the search is not asked a second time by that answer in another place.
    expect(load.mock.calls.at(-1)[0].center).toEqual(HAMBURG)
  })

  // The same pair under another address is no new question: the page is asked to show somebody
  // by the pair, and a navigation that keeps both keeps the mark and the view.
  it('asks once for a pair, however often the address is written anew', async () => {
    const page = await arrive()
    theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat], zoom: 11 })
    load.mockClear()

    route.current.query = { ...TOBIAS, theme: 'dark' }
    await flushPromises()

    expect(profile).toHaveBeenCalledTimes(1)
    expect(page.findAll('.gk-shown')).toHaveLength(1)
    expect(centre()).toEqual(BERLIN)
    expect(load).not.toHaveBeenCalled()
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
  // keyboard and a screen reader meet them. The person the page shows is who the member came
  // for: their mark is a button with a name, which answers Enter and the space bar, so a keyboard
  // on the map reaches them without going to the list first.
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

    // The map frames the whole circle around them, so a neighbour stands a few pixels away far
    // more often than at the zoom of a town -- and where the search draws the person, a tap in
    // the ring goes through to the mark the search drew (the rules below). Found in the built
    // wallet at 320 px: the tap stepped the map in instead of opening them.
    describe('on the mark the search drew for them', () => {
      const NEXT_DOOR = { lat: HAMBURG.lat + 0.01, lng: HAMBURG.lng }
      const marks = (page) => page.findAll('.gk-clickable').filter((m) => !m.classes('gk-shown'))
      const cluster = (page) => page.findComponent({ name: 'MatchCluster' })

      it('opens them, however close a neighbour stands', async () => {
        const page = await arrive()
        matches.value = [found(TOBIAS), found(IRA, { position: NEXT_DOOR })]
        await flushPromises()
        const zoom = theMap().getZoom()
        expect(marks(page)).toHaveLength(2)

        tap(marks(page)[0].element)
        await flushPromises()

        expect(window_(page).props('modelValue')).toBe(true)
        expect(window_(page).props('match').name).toBe('Tobias')
        expect(theMap().getZoom()).toBe(zoom)
        expect(cluster(page).exists()).toBe(false)
      })

      // The control: the neighbour's mark is a mark like any other -- the two cannot be told
      // apart at this zoom, and the map steps in.
      it('leaves a tap on the neighbour to the map, which steps in', async () => {
        const page = await arrive()
        matches.value = [found(TOBIAS), found(IRA, { position: NEXT_DOOR })]
        await flushPromises()
        const zoom = theMap().getZoom()

        tap(marks(page)[1].element)
        await flushPromises()

        expect(window_(page).props('modelValue')).toBe(false)
        expect(theMap().getZoom()).toBeGreaterThan(zoom)
      })

      // And the control on an ordinary visit: the same tap on the same person steps in.
      it('steps in for the same two on an ordinary visit', async () => {
        const page = await arrive(null)
        matches.value = [found(TOBIAS), found(IRA, { position: NEXT_DOOR })]
        await flushPromises()
        const zoom = theMap().getZoom()

        tap(marks(page)[0].element)
        await flushPromises()

        expect(window_(page).props('modelValue')).toBe(false)
        expect(theMap().getZoom()).toBeGreaterThan(zoom)
      })

      // Somebody on exactly their point -- a shared address -- is the one case no zoom tells
      // apart: the list of that spot asks which of them, as it always did.
      it('asks which of them where somebody else stands on exactly their point', async () => {
        const page = await arrive()
        matches.value = [found(TOBIAS), found(IRA, { position: HAMBURG })]
        await flushPromises()

        tap(marks(page)[0].element)
        await flushPromises()

        expect(window_(page).props('modelValue')).toBe(false)
        expect(cluster(page).exists()).toBe(true)
        expect(
          cluster(page)
            .props('people')
            .map((item) => item.match.name)
            .sort(),
        ).toEqual(['Ira-Erste', 'Tobias'])
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

    // Told when the person is shown, not only by the next move of the map: where the member moved
    // the search while the answer was on its way, the answer moves nothing -- and the map may
    // rest on the very spot the ring is then drawn at.
    it('steps back at once where the ring is drawn under a map that rests there', async () => {
      const answer = held()
      profile.mockReturnValue(answer.promise)
      const page = await arrive()
      await page.findComponent(GeoSearchField).vm.$emit('pick', {
        lat: 50.0874654,
        lng: 14.4212535,
        label: 'Prag',
      })
      await flushPromises()
      theMap().jumpTo({ center: [HAMBURG.lng, HAMBURG.lat], zoom: 11 })
      await page.vm.$nextTick()
      expect(crosshair(page).style.opacity).toBe('1')

      answer.resolve(published())
      await flushPromises()

      expect(marker(page).exists()).toBe(true)
      expect(centre()).toEqual(HAMBURG)
      expect(crosshair(page).style.opacity).toBe('0')
      expect(crosshair(page).style.pointerEvents).toBe('none')
    })

    it('comes back once the map has moved off them', async () => {
      const page = await arrive()
      theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat], zoom: 11 })
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

  // Bernd, 09.10.2026: "in der Listendarstellung kann man ihn nicht finden". The list is the
  // one representation a blind member has -- the map is inert under it --, so whoever keeps the
  // list keeps it on such a visit as well and meets the person there, first. (Until then the
  // page put the map in its place for the visit.)
  describe('a member who keeps the list', () => {
    const list = (page) => page.findComponent({ name: 'MatchList' })

    it('stays in the list, and the person is handed to it', async () => {
      remember('mode', 'liste')
      const page = await arrive()

      expect(list(page).exists()).toBe(true)
      expect(page.find('.map-shell').classes()).toContain('is-list')
      expect(list(page).props('contact').person).toMatchObject({
        uuid: TOBIAS.with,
        name: 'Tobias',
        position: HAMBURG,
      })
      expect(remembered('mode')).toBe('liste')
    })

    // The control: without somebody to show, the same member opens on their list with nobody
    // first.
    it('opens on the list on an ordinary visit, with nobody first', async () => {
      remember('mode', 'liste')
      const page = await arrive(null)

      expect(list(page).exists()).toBe(true)
      expect(list(page).props('contact')).toBeNull()
    })

    // The switch is their word, there as anywhere: asked for, the map is their choice from then
    // on -- and it stands on the circle around the person, framed under the list meanwhile.
    it('gets the map when they ask for it, framed around the person', async () => {
      remember('mode', 'liste')
      remember('view', VIEW)
      const page = await arrive()

      await page.find('.look-switch > .look-btn').trigger('click')

      expect(list(page).exists()).toBe(false)
      expect(remembered('mode')).toBe('karte')
      expect(centre()).toEqual(HAMBURG)
      expect(marker(page).exists()).toBe(true)
    })

    it.each([
      [
        'this device cannot draw the map',
        () => (HTMLCanvasElement.prototype.getContext = () => null),
      ],
      ['the engine does not arrive', () => (engineLoad.fails = true)],
    ])('has the person in the list where %s', async (_, without) => {
      without()
      remember('mode', 'liste')
      const page = await arrive()

      expect(created).toHaveLength(0)
      expect(list(page).props('contact').person.name).toBe('Tobias')
      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual(HAMBURG)
    })
  })

  // A member who keeps the map and has none to draw is told why it stays empty, as on any visit;
  // the list is one tap away, with the person first.
  it('leaves a member who keeps the map on it where this device cannot draw it', async () => {
    HTMLCanvasElement.prototype.getContext = () => null
    const page = await arrive()

    expect(page.findComponent({ name: 'MatchList' }).exists()).toBe(false)
    expect(page.find('.map-note').exists()).toBe(true)
    expect(profile).toHaveBeenCalledTimes(1)

    await page.find('.look-switch > .look-btn:last-child').trigger('click')
    expect(page.findComponent({ name: 'MatchList' }).props('contact').person.name).toBe('Tobias')
  })

  // What the list is handed (MatchList draws it, and its own spec says how): the person first,
  // with what the search knows of them, and the two lists below without them.
  describe('the list', () => {
    const list = (page) => page.findComponent({ name: 'MatchList' })
    const inList = async () => {
      remember('mode', 'liste')
      const page = await arrive()
      return page
    }
    it('is handed the home, which their distance is measured from', async () => {
      const page = await inList()

      expect(list(page).props('home')).toEqual(HOME)
    })

    it('has the person without a match item where the search does not find them', async () => {
      const page = await inList()

      expect(list(page).props('contact')).toEqual({
        person: {
          uuid: TOBIAS.with,
          name: 'Tobias',
          community: { uuid: TOBIAS.community, name: 'KI Playground' },
          position: HAMBURG,
          precision: 'ungefaehr',
        },
        item: null,
      })
    })

    it('has them with their match item, and not a second time among the matches', async () => {
      const page = await inList()
      matches.value = [found(TOBIAS), found(IRA)]
      await flushPromises()

      const { contact, matches: listed } = list(page).props()
      expect(contact.item.match.uuid).toBe(TOBIAS.with)
      expect(contact.item.peak).toBeGreaterThanOrEqual(1)
      expect(listed.map(({ match }) => match.name)).toEqual(['Ira-Erste'])
    })

    it('does not list them a second time among the others', async () => {
      const page = await inList()
      presence.value = [ring(TOBIAS), ring(IRA)]
      await flushPromises()

      expect(
        list(page)
          .props('silent')
          .map((person) => person.name),
      ).toEqual(['Ira-Erste'])
      expect(list(page).props('contact').item).toBeNull()
    })

    // The pair names a person: the same id in another community is somebody else, and stays.
    it('keeps somebody with the same id in another community in the lists', async () => {
      const page = await inList()
      const twin = { with: TOBIAS.with, community: IRA.community }
      matches.value = [found(twin, { name: 'Zwilling', position: BERLIN })]
      presence.value = [{ ...ring(twin), name: 'Zwilling' }]
      await flushPromises()

      expect(list(page).props('matches')).toHaveLength(1)
      expect(list(page).props('silent')).toHaveLength(1)
      expect(list(page).props('contact').item).toBeNull()
    })

    // ⛔ "Unabhängig davon, ob unten nun entsprechende Angebote, Gesuche, Interessen usw.
    // ausgewählt sind" (Bernd): with every box unticked the person is still first -- only what
    // the search knows of them steps back with the boxes, as their glow on the map does.
    it('has the person first whatever the boxes under the map let through', async () => {
      const page = await inList()
      matches.value = [found(TOBIAS)]
      presence.value = [ring(IRA)]
      await flushPromises()
      expect(list(page).props('contact').item).not.toBeNull()

      for (const box of page.findAll('.map-check input')) await box.setValue(false)
      await flushPromises()

      expect(list(page).props('matches')).toEqual([])
      expect(list(page).props('silent')).toEqual([])
      expect(list(page).props('contact').person.name).toBe('Tobias')
      expect(list(page).props('contact').item).toBeNull()
    })

    it('opens their profile from the list as from the ring: the match where the search found them', async () => {
      const page = await inList()
      matches.value = [found(TOBIAS)]
      await flushPromises()

      list(page).vm.$emit('openContact')
      await flushPromises()

      expect(window_(page).props('modelValue')).toBe(true)
      expect(window_(page).props('match').channels.gesuch).toHaveLength(1)
    })

    it('opens the plain person where the search does not find them', async () => {
      const page = await inList()

      list(page).vm.$emit('openContact')
      await flushPromises()

      expect(window_(page).props('modelValue')).toBe(true)
      expect(window_(page).props('match').name).toBe('Tobias')
    })

    it('has nobody first for somebody who is not on the map', async () => {
      profile.mockRejectedValue(notHeld())
      const page = await inList()

      expect(list(page).props('contact')).toBeNull()
    })

    // The control on an ordinary visit: nobody first, and the lists as the search gives them.
    it('hands the lists over as they are on an ordinary visit', async () => {
      remember('mode', 'liste')
      const page = await arrive(null)
      matches.value = [found(TOBIAS)]
      presence.value = [ring(IRA)]
      await flushPromises()

      expect(list(page).props('contact')).toBeNull()
      expect(list(page).props('matches')).toHaveLength(1)
      expect(list(page).props('silent')).toHaveLength(1)
    })
  })

  // Found by the second reader: such an address is what is left when one account signs out on
  // this page and the contact it showed signs in on the same browser. The house is one's own mark.
  describe('an address that names the member themselves', () => {
    const asTobias = () =>
      walletStore({
        gradidoID: TOBIAS.with.toUpperCase(),
        gmsAllowed: true,
        userLocation: { latitude: 48.2, longitude: 11.6 },
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
      fire(listMatchingEntries, { listMatchingEntries: [] })
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

    // ⛔ The page's first search waited for this answer. Whatever the answer is, it is asked
    // then -- around the place the member searches from, once: a refusal must not leave the
    // page without its search.
    it.each([
      ['is not held', () => profile.mockRejectedValue(notHeld())],
      [
        'could not be asked about',
        () => profile.mockRejectedValue(Object.assign(new Error('HTTP 503'), { status: 503 })),
      ],
      [
        'is held without a usable point',
        () => profile.mockResolvedValue(published(TOBIAS, { position: { lat: 91, lng: 9.99 } })),
      ],
    ])('searches as on any visit where the person %s', async (_, answer) => {
      answer()
      remember('mode', 'liste')
      const page = await arrive()

      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual(HOME)
      expect(remembered('center')).toEqual(HOME)
      const list = page.findComponent({ name: 'MatchList' })
      expect(list.props('contact')).toBeNull()
      expect(list.props('centerLabel')).toBe('Dein Zuhause')
    })

    // And the view of such a visit is the member's own, remembered as ever.
    it('remembers the view as on any visit where nobody is shown after all', async () => {
      remember('view', VIEW)
      profile.mockRejectedValue(notHeld())
      await arrive()

      theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat], zoom: 11 })

      expect(remembered('view').lat).toBeCloseTo(BERLIN.lat, 4)
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

  // `arrive` lets the member's home come first, as it mostly does. The other order: the person
  // is known before the home is. The visit's search is asked at once -- an answer about the home
  // that fails or stays out must not leave the visit without it (second reader) --, and the
  // answer about the home asks the same search once more, as it does on any visit after the
  // member's entries. Never around the member's own circle.
  it('searches around the person at once where their answer comes before the home is known', async () => {
    route.current.query = TOBIAS
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const page = mountMap()
    await flushPromises()
    expect(load).toHaveBeenCalledTimes(1)
    expect(load.mock.calls[0][0].center).toEqual(HAMBURG)

    fire(userLocationQuery, { userLocation: location })
    await page.vm.$nextTick()
    vi.advanceTimersByTime(250)
    vi.useRealTimers()
    await flushPromises()
    await flushPromises()

    expect(load.mock.calls.map(([search]) => search.center)).toEqual([HAMBURG, HAMBURG])
    expect(remembered('center')).toEqual(HOME)
    expect(centre()).toEqual(HAMBURG)
    expect(marker(page).exists()).toBe(true)
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
      // The search goes with them: from the one straight to the other, and the member's own
      // centre stays what it was.
      expect(load.mock.calls.map(([search]) => search.center)).toEqual([HAMBURG, BERLIN])
      expect(remembered('center')).toEqual(HOME)
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
      // Nor does the late answer move the search to the first one.
      expect(load.mock.calls.at(-1)[0].center).toEqual(BERLIN)
      expect(load.mock.calls.some(([search]) => search.center.lat === HAMBURG.lat)).toBe(false)
    })

    it('takes the mark away when it names nobody any more', async () => {
      const page = await arrive()

      route.current.query = {}
      await flushPromises()

      expect(marker(page).exists()).toBe(false)
    })

    // ⛔ The visit is over there, and what the page set for it goes with it (coderabbit on
    // #4115 found the one way out that the first build had missed): the search stands where the
    // member left it again, under its own name, in the view the member left -- and what they
    // look at from then on is remembered.
    it('puts the search back where the member left it when it names nobody any more', async () => {
      const elsewhere = { lat: 50.5, lng: 8.5 }
      remember('center', elsewhere)
      remember('centerLabel', 'Mein Dorf')
      remember('view', VIEW)
      remember('mode', 'liste')
      const page = await arrive()
      const list = () => page.findComponent({ name: 'MatchList' })
      expect(list().props('centerLabel')).toBe('Tobias')
      load.mockClear()

      route.current.query = {}
      await flushPromises()

      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual(elsewhere)
      expect(list().props('contact')).toBeNull()
      expect(list().props('centerLabel')).toBe('Mein Dorf')
      expect(list().props('searchCenter')).toEqual(elsewhere)
      expect(centre()).toEqual({ lat: VIEW.lat, lng: VIEW.lng })

      theMap().jumpTo({ center: [BERLIN.lng, BERLIN.lat], zoom: 11 })
      expect(remembered('view').lat).toBeCloseTo(BERLIN.lat, 4)
    })

    it('puts the search back as well when it comes to name somebody who is not on the map', async () => {
      const page = await arrive()
      load.mockClear()
      toastError.mockClear()
      profile.mockRejectedValue(notHeld())

      route.current.query = IRA
      await flushPromises()

      expect(toastError).toHaveBeenCalledTimes(1)
      expect(marker(page).exists()).toBe(false)
      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].center).toEqual(HOME)
    })

    // The control: on an ordinary visit an address that goes on naming nobody asks no search.
    it('asks no search where there was no visit to end', async () => {
      await arrive(null)
      load.mockClear()

      route.current.query = { theme: 'dark' }
      await flushPromises()

      expect(load).not.toHaveBeenCalled()
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
    const source = pageStyles({ comments: false })
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

/**
 * The "genau" of my entries (KA-018, KA-020, KA-021): the search asks who carries the sentence of
 * each live entry with it, a change of the mark alone asks again, and the first map of a member
 * with such an entry released for the wide search opens wide -- once, and only where the reach was
 * never chosen on this device.
 */
describe('MatchingMap, the "genau" of my entries', () => {
  beforeAll(async () => {
    await import('@/utils/mapEngine/maplibre')
  })

  const CONTACT = {
    with: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
    community: 'cccccccc-0000-4000-8000-cccccccccccc',
  }
  const project = (uuid, over = {}) => ({
    ...entry(uuid),
    matchingType: 'interest',
    summary: 'Kongress Frequency Healing',
    remote: true,
    exactSentence: true,
    ...over,
  })
  const remember = (name, value) => window.localStorage.setItem(KEY + name, JSON.stringify(value))
  const remembered = (name) => JSON.parse(window.localStorage.getItem(KEY + name))
  const lastSearch = () => load.mock.calls.at(-1)[0]
  const list = (...entries) => fire(listMatchingEntries, { listMatchingEntries: entries })
  const located = () => fire(userLocationQuery, { userLocation: location })

  /** The page with its map built (the engine comes after the quarter second) and home known. */
  const withMap = async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const page = mountMap()
    located()
    await page.vm.$nextTick()
    vi.advanceTimersByTime(250)
    vi.useRealTimers()
    await flushPromises()
    await flushPromises()
    return page
  }

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hands the search the live entries with the "genau", and only those', async () => {
    const page = mountMap()
    located()
    list(project('a'), project('b', { active: false }), project('c', { exactSentence: false }))
    await page.vm.$nextTick()

    expect(lastSearch().exactUuids).toEqual(['a'])
    expect(lastSearch().mineUuids).toEqual(['a', 'c'])
  })

  it('asks again where only the "genau" of an entry changed', async () => {
    remember('reach', 'regional')
    const page = mountMap()
    located()
    list(project('a', { exactSentence: false }))
    await page.vm.$nextTick()
    const asked = load.mock.calls.length

    // The link healed it: the same entries, another question.
    list(project('a'))
    await page.vm.$nextTick()

    expect(load).toHaveBeenCalledTimes(asked + 1)
    expect(lastSearch().exactUuids).toEqual(['a'])
  })

  describe('the first map', () => {
    it('opens wide, where the list comes before the map, and remembers it', async () => {
      remember('view', { lat: 48.2, lng: 11.6, zoom: 12 })
      const page = mountMap()
      list(project('a'))
      located()
      await flushPromises()

      expect(lastSearch()).toMatchObject({ radius: 500, remoteOnly: true, exactUuids: ['a'] })
      expect(remembered('reach')).toBe('fern')
      // The view of the 25 km circle would hide the wide one.
      expect(remembered('view')).toBeNull()
      const [regional, wide] = page.findAll('.reach-btn')
      expect(wide.attributes('aria-pressed')).toBe('true')
      expect(regional.attributes('aria-pressed')).toBe('false')
    })

    it('goes the way of the switch where the list comes after the map stands', async () => {
      const page = await withMap()
      expect(lastSearch()).toMatchObject({ radius: 25, remoteOnly: false })
      const asked = load.mock.calls.length

      list(project('a'))
      await flushPromises()

      // One search, the wide one: the switch searched, and the list does not ask a second time.
      expect(load).toHaveBeenCalledTimes(asked + 1)
      expect(lastSearch()).toMatchObject({ radius: 500, remoteOnly: true })
      expect(remembered('reach')).toBe('fern')
      expect(page.findAll('.reach-btn')[1].attributes('aria-pressed')).toBe('true')
    })

    it.each([
      ['a reach the member chose', () => remember('reach', 'regional'), project('a')],
      [
        'an entry with the "genau" not released for the wide search',
        () => {},
        project('a', { remote: false }),
      ],
      ['a released entry without the "genau"', () => {}, project('a', { exactSentence: false })],
      ['a paused entry with the "genau"', () => {}, project('a', { active: false })],
    ])('stays regional for %s', async (_what, before, mine) => {
      before()
      const page = mountMap()
      list(mine)
      located()
      await flushPromises()

      expect(lastSearch()).toMatchObject({ radius: 25, remoteOnly: false })
      expect(page.findAll('.reach-btn')[0].attributes('aria-pressed')).toBe('true')
    })

    it('writes nothing where no reach was chosen and it stays regional', async () => {
      mountMap()
      list(project('a', { remote: false }))
      located()
      await flushPromises()

      expect(window.localStorage.getItem(`${KEY}reach`)).toBeNull()
    })

    // Without the cache the query first answers with no data: that is no list.
    it('takes an answer without data for no list', async () => {
      mountMap()
      fire(listMatchingEntries, undefined)
      located()
      await flushPromises()

      expect(window.localStorage.getItem(`${KEY}reach`)).toBeNull()
      expect(lastSearch()).toMatchObject({ remoteOnly: false })
    })

    it('does not switch during a visit to a contact, and does on the next ordinary visit', async () => {
      route.current.query = CONTACT
      const visit = await withMap()
      list(project('a'))
      await flushPromises()
      expect(window.localStorage.getItem(`${KEY}reach`)).toBeNull()
      expect(visit.findAll('.reach-btn')[0].attributes('aria-pressed')).toBe('true')
      visit.unmount()
      wrapper = null

      route.current.query = {}
      const ordinary = await withMap()
      list(project('a'))
      await flushPromises()
      expect(remembered('reach')).toBe('fern')
      expect(ordinary.findAll('.reach-btn')[1].attributes('aria-pressed')).toBe('true')
    })

    it('switches once: the member who goes back to regional stays there', async () => {
      const page = await withMap()
      list(project('a'))
      await flushPromises()
      expect(remembered('reach')).toBe('fern')

      await page.findAll('.reach-btn')[0].trigger('click')
      await flushPromises()
      list(project('a'), project('b'))
      await flushPromises()

      expect(remembered('reach')).toBe('regional')
      expect(lastSearch()).toMatchObject({ radius: 25, remoteOnly: false })
    })

    // A storage that refuses writes keeps no reach, so the stored one reads as never chosen while the
    // member has tapped "wide" on this visit: nothing to switch, and the list still asks the sentence.
    it('asks the sentence where the reach is wide already and storage kept nothing of it', async () => {
      const page = await withMap()
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      try {
        await page.findAll('.reach-btn')[1].trigger('click')
        await flushPromises()
        expect(window.localStorage.getItem(`${KEY}reach`)).toBeNull()
        const asked = load.mock.calls.length

        list(project('a'))
        await flushPromises()

        expect(load).toHaveBeenCalledTimes(asked + 1)
        expect(lastSearch()).toMatchObject({ radius: 500, remoteOnly: true, exactUuids: ['a'] })
        expect(page.findAll('.reach-btn')[1].attributes('aria-pressed')).toBe('true')
      } finally {
        setItem.mockRestore()
      }
    })

    // Where storage keeps nothing, the stored reach reads as never chosen on every list: only the
    // page's own memory keeps the switch to once (the counter-check of 15.11.2026 found no test).
    it('switches once also where storage keeps nothing: back to regional stays regional', async () => {
      const page = await withMap()
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      try {
        list(project('a'))
        await flushPromises()
        expect(page.findAll('.reach-btn')[1].attributes('aria-pressed')).toBe('true')

        await page.findAll('.reach-btn')[0].trigger('click')
        await flushPromises()
        list(project('a'), project('b'))
        await flushPromises()

        expect(page.findAll('.reach-btn')[0].attributes('aria-pressed')).toBe('true')
        expect(lastSearch()).toMatchObject({ radius: 25, remoteOnly: false })
      } finally {
        setItem.mockRestore()
      }
    })
  })
})

// The tick under the search field (KA-020 point 3, KA-023): set and taken off by hand, with the
// number of the people who carry the sentence, and a chosen entry with it showing only them.
describe('MatchingMap, the tick under the search field', () => {
  beforeAll(async () => {
    await import('@/utils/mapEngine/maplibre')
  })

  const CONTACT = {
    with: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
    community: 'cccccccc-0000-4000-8000-cccccccccccc',
  }
  const BEFORE = '2026-11-15T10:00:00.000Z'
  const WRITTEN = '2026-11-15T12:00:00.000Z'
  const LATER = '2026-11-15T13:00:00.000Z'
  // An entry of mine with the "genau". Not released for the wide search unless a test says so: a
  // tick would open the first map wide where the test is about something else.
  const mine = (uuid, over = {}) => ({
    ...entry(uuid),
    matchingType: 'interest',
    summary: `Kongress ${uuid}`,
    remote: false,
    exactSentence: true,
    updatedAt: BEFORE,
    ...over,
  })
  const remember = (name, value) => window.localStorage.setItem(KEY + name, JSON.stringify(value))
  const remembered = (name) => JSON.parse(window.localStorage.getItem(KEY + name))
  const lastSearch = () => load.mock.calls.at(-1)[0]
  const list = (...entries) => fire(listMatchingEntries, { listMatchingEntries: entries })
  const located = () => fire(userLocationQuery, { userLocation: location })
  const chosen = (uuid) => ({ kind: 'entry', uuid })
  const choose = async (page, selection) => {
    page.findComponent({ name: 'MatchQuery' }).vm.$emit('update:selection', selection)
    await flushPromises()
  }
  const row = (page) => page.find('.exact-check')
  const box = (page) => page.find('.exact-check input')
  const number = (page) => page.find('.exact-count')
  const tap = (page) => box(page).trigger('click')
  const pressed = (page) => page.findAll('.reach-btn').map((btn) => btn.attributes('aria-pressed'))
  /** What the server answers to a tick: the entry with its new state and stand. */
  const written = (uuid, exactSentence, updatedAt = WRITTEN) => ({
    data: { setMatchingEntryExactSentence: { uuid, exactSentence, updatedAt } },
  })
  /** A write held on its way until the test lets it answer. */
  const held = () => {
    const write = {}
    writeExact.mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          write.answer = resolve
          write.fail = reject
        }),
    )
    return write
  }
  // Somebody who carries the sentence of `of`: the brightest there is, at any strength (KA-018).
  const carrier = (uuid, of, { exact = true, strength = 0.46 } = {}) => {
    const channels = {
      interesse: [
        { uuid: `${uuid}-entry`, matchedEntryUuid: of, matchedSubject: null, strength, exact },
      ],
    }
    return {
      uuid,
      name: uuid,
      position: { lat: 48.2, lng: 11.6 },
      community: { uuid: CONTACT.community, name: 'Muenchen' },
      aboutMe: '',
      precision: 'genau',
      channels,
      scores: scoresOf(channels),
    }
  }
  const ring = (id) => ({
    id,
    uuid: `ring-${id}`,
    name: `ring-${id}`,
    community: { uuid: CONTACT.community, name: 'Muenchen' },
    hasEntries: id % 2 === 0,
    position: { lat: 48.2 + id / 1000, lng: 11.6 },
    precision: 'ungefaehr',
  })
  const rings = () => created.at(-1).getSource('gk-presence').data.features.length
  const greyBoxes = (page) =>
    page.findAll('.map-check').filter((label) => /andere (mit|ohne) Angaben/.test(label.text()))

  /** The page without its map: home known, my entries in, `selection` remembered from last time. */
  const page = async (entries, selection = chosen(entries[0].uuid)) => {
    remember('query', selection)
    const mounted = mountMap()
    located()
    list(...entries)
    await flushPromises()
    return mounted
  }

  /** The same with its map built (the engine comes after the quarter second). */
  const withMap = async (entries, selection = chosen(entries[0].uuid)) => {
    remember('query', selection)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const mounted = mountMap()
    located()
    list(...entries)
    await mounted.vm.$nextTick()
    vi.advanceTimersByTime(250)
    vi.useRealTimers()
    await flushPromises()
    await flushPromises()
    return mounted
  }

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('the row', () => {
    it('stands for one chosen entry of mine, ticked as the entry has it', async () => {
      const shown = await page([mine('a', { exactSentence: false }), mine('b')])

      expect(row(shown).text()).toContain('Genau dieser Eintrag')
      expect(box(shown).element.checked).toBe(false)

      await choose(shown, chosen('b'))
      expect(box(shown).element.checked).toBe(true)
    })

    it.each([
      ['all my entries', { kind: 'all' }],
      ['a typed search', { kind: 'typed', text: 'Klavier', matchingType: 'gesuch' }],
    ])('does not stand for %s', async (_what, selection) => {
      const shown = await page([mine('a')], selection)

      expect(row(shown).exists()).toBe(false)
    })

    // Above the map and above the list alike (KA-023, "in beiden Ansichten").
    it('stands in the list as well', async () => {
      remember('mode', 'liste')
      const shown = await page([mine('a')])

      expect(shown.findComponent({ name: 'MatchList' }).exists()).toBe(true)
      expect(box(shown).element.checked).toBe(true)
    })

    // Before the list the page does not know the chosen entry: its place is kept meanwhile.
    it('comes with the list', async () => {
      remember('query', chosen('a'))
      const shown = mountMap()
      located()
      await flushPromises()
      expect(box(shown).exists()).toBe(false)
      expect(shown.find('.exact-pending').exists()).toBe(true)

      list(mine('a'))
      await flushPromises()
      expect(box(shown).exists()).toBe(true)
      expect(shown.find('.exact-pending').exists()).toBe(false)
    })

    it.each([
      [0, '0 Menschen'],
      [1, '1 Mensch'],
      [37, '37 Menschen'],
      [1500, '1.500 Menschen'],
    ])('says %i people while the tick is on and its question answered', async (total, words) => {
      const shown = await page([mine('a')])
      sentenceTotals.value = { a: total }
      await flushPromises()

      expect(number(shown).text()).toBe(words)
    })

    it.each([
      ['its question did not answer (a GMS without it)', {}],
      ['the GMS gave no usable number', { a: null }],
    ])('says no number where %s, and keeps the tick', async (_what, totals) => {
      const shown = await page([mine('a')])
      sentenceTotals.value = totals
      await flushPromises()

      expect(box(shown).element.checked).toBe(true)
      expect(number(shown).exists()).toBe(false)
    })

    it('takes the number away with the tick, at once', async () => {
      const shown = await page([mine('a')])
      sentenceTotals.value = { a: 12 }
      await flushPromises()
      expect(number(shown).text()).toBe('12 Menschen')

      held()
      await tap(shown)
      expect(number(shown).exists()).toBe(false)
    })
  })

  describe('a tap on it', () => {
    beforeEach(() => {
      // A reach the member chose: the first map stays out of these (it has its own cases below).
      remember('reach', 'regional')
    })

    it('ticks the box at once and holds it, asks the server, and searches with its answer', async () => {
      const shown = await page([mine('a', { exactSentence: false })])
      const asked = load.mock.calls.length
      const write = held()

      await tap(shown)

      expect(writeExact).toHaveBeenCalledTimes(1)
      expect(writeExact).toHaveBeenCalledWith({ uuid: 'a', exactSentence: true })
      expect(box(shown).element.checked).toBe(true)
      expect(box(shown).attributes('aria-disabled')).toBe('true')
      // Nothing follows before the server has it.
      expect(load).toHaveBeenCalledTimes(asked)

      write.answer(written('a', true))
      await flushPromises()

      expect(box(shown).element.checked).toBe(true)
      expect(box(shown).attributes('aria-disabled')).toBeUndefined()
      expect(load).toHaveBeenCalledTimes(asked + 1)
      expect(lastSearch().exactUuids).toEqual(['a'])
    })

    it('writes the answer into the cached list, so "Meine Einträge" has it at once', async () => {
      const shown = await page([
        mine('a', { exactSentence: false }),
        mine('b', { exactSentence: false }),
      ])
      writeExact.mockResolvedValueOnce(written('a', true))

      await tap(shown)
      await flushPromises()

      expect(updateCachedQuery).toHaveBeenCalledTimes(1)
      const [{ query }, update] = updateCachedQuery.mock.calls[0]
      expect(query).toBe(listMatchingEntries)
      const cached = {
        listMatchingEntries: [
          mine('a', { exactSentence: false }),
          mine('b', { exactSentence: false }),
        ],
      }
      expect(update(cached)).toEqual({
        listMatchingEntries: [
          mine('a', { exactSentence: true, updatedAt: WRITTEN }),
          mine('b', { exactSentence: false }),
        ],
      })
      // Nothing in the cache, or nothing older there: nothing is written.
      expect(update(null)).toBeUndefined()
      expect(
        update({ listMatchingEntries: [mine('a', { exactSentence: true, updatedAt: WRITTEN })] }),
      ).toBeUndefined()
    })

    // Second reader, 15.11.2026: a list read before the write and answered after it lands in the
    // cache as well, and the next visit would start from it.
    it('tells the cache the tick again where a list older than it came in', async () => {
      const shown = await page([mine('a', { exactSentence: false })])
      writeExact.mockResolvedValueOnce(written('a', true))
      await tap(shown)
      await flushPromises()
      updateCachedQuery.mockClear()

      list(mine('a', { exactSentence: false }))
      await flushPromises()

      expect(updateCachedQuery).toHaveBeenCalledTimes(1)
      const [, update] = updateCachedQuery.mock.calls[0]
      expect(update({ listMatchingEntries: [mine('a', { exactSentence: false })] })).toEqual({
        listMatchingEntries: [mine('a', { exactSentence: true, updatedAt: WRITTEN })],
      })
    })

    it('takes the tick off, and the search asks no sentence any more', async () => {
      const shown = await page([mine('a')])
      expect(lastSearch().exactUuids).toEqual(['a'])
      writeExact.mockResolvedValueOnce(written('a', false))

      await tap(shown)
      await flushPromises()

      expect(writeExact).toHaveBeenCalledWith({ uuid: 'a', exactSentence: false })
      expect(box(shown).element.checked).toBe(false)
      expect(lastSearch().exactUuids).toEqual([])
    })

    it('takes the box back where the write fails, says so, and moves nothing else', async () => {
      const shown = await page([mine('a', { exactSentence: false })])
      remember('cluster', ['somebody', 'somebody-else'])
      const asked = load.mock.calls.length
      writeExact.mockRejectedValueOnce(new Error('Could not change MatchingEntry state'))

      await tap(shown)
      await flushPromises()

      expect(box(shown).element.checked).toBe(false)
      expect(box(shown).attributes('aria-disabled')).toBeUndefined()
      expect(toastError).toHaveBeenCalledWith('Could not change MatchingEntry state')
      expect(load).toHaveBeenCalledTimes(asked)
      expect(updateCachedQuery).not.toHaveBeenCalled()
      // Second reader, 15.11.2026: the window for several people stays as it was.
      expect(remembered('cluster')).toEqual(['somebody', 'somebody-else'])
    })

    it('takes an answer without the entry for a write that failed', async () => {
      const shown = await page([mine('a', { exactSentence: false })])
      const asked = load.mock.calls.length
      writeExact.mockResolvedValueOnce({})

      await tap(shown)
      await flushPromises()

      expect(box(shown).element.checked).toBe(false)
      expect(toastError).toHaveBeenCalledTimes(1)
      expect(load).toHaveBeenCalledTimes(asked)
    })

    // One write at a time (Falle 24): two taps in quick succession could reach the server the
    // wrong way round.
    it('lets a second tap do nothing while the first is on its way', async () => {
      const shown = await page([mine('a', { exactSentence: false })])
      const write = held()

      await tap(shown)
      await tap(shown)

      expect(writeExact).toHaveBeenCalledTimes(1)
      expect(box(shown).element.checked).toBe(true)

      write.answer(written('a', true))
      await flushPromises()
      expect(box(shown).element.checked).toBe(true)

      // And free again once the answer is in.
      writeExact.mockResolvedValueOnce(written('a', false, LATER))
      await tap(shown)
      await flushPromises()
      expect(writeExact).toHaveBeenCalledTimes(2)
      expect(writeExact).toHaveBeenLastCalledWith({ uuid: 'a', exactSentence: false })
      expect(box(shown).element.checked).toBe(false)
    })

    it('closes the window for several people once the server has it, as a change of the choice does', async () => {
      const shown = await page([mine('a', { exactSentence: false })])
      remember('cluster', ['somebody', 'somebody-else'])
      const write = held()

      await tap(shown)
      expect(remembered('cluster')).toEqual(['somebody', 'somebody-else'])

      write.answer(written('a', true))
      await flushPromises()
      expect(remembered('cluster')).toBeNull()
    })
  })

  // A list read before the write can come in after it: the network answer of the arrival's own
  // question, or one the page asks while an entry waits for its words (Falle 16).
  describe('a list older than the tick', () => {
    beforeEach(() => {
      remember('reach', 'regional')
    })

    const ticked = async () => {
      const shown = await page([mine('a', { exactSentence: false })])
      writeExact.mockResolvedValueOnce(written('a', true))
      await tap(shown)
      await flushPromises()
      return shown
    }

    it('does not turn it back after the server took it', async () => {
      const shown = await ticked()
      const asked = load.mock.calls.length

      list(mine('a', { exactSentence: false }))
      await flushPromises()

      expect(box(shown).element.checked).toBe(true)
      expect(load).toHaveBeenCalledTimes(asked)
    })

    it('does not turn it back after the list that confirmed it either', async () => {
      const shown = await ticked()
      list(mine('a', { updatedAt: WRITTEN }))
      await flushPromises()
      const asked = load.mock.calls.length

      list(mine('a', { exactSentence: false }))
      await flushPromises()

      expect(box(shown).element.checked).toBe(true)
      expect(load).toHaveBeenCalledTimes(asked)
    })

    it('does not turn it back where it comes while the tick is on its way', async () => {
      const shown = await page([mine('a', { exactSentence: false })])
      const write = held()
      await tap(shown)

      list(mine('a', { exactSentence: false }))
      await flushPromises()
      expect(box(shown).element.checked).toBe(true)

      write.answer(written('a', true))
      await flushPromises()
      expect(box(shown).element.checked).toBe(true)
      expect(lastSearch().exactUuids).toEqual(['a'])
    })

    it('takes a later list as the server word again', async () => {
      const shown = await ticked()

      // Another device took it off since.
      list(mine('a', { exactSentence: false, updatedAt: LATER }))
      await flushPromises()

      expect(box(shown).element.checked).toBe(false)
      expect(lastSearch().exactUuids).toEqual([])
    })

    // coderabbit, #4297: another device took the tick off after this page wrote it, and a list read
    // before both comes in late.
    it('holds an older list against the newest list, not against the tick it superseded', async () => {
      const shown = await ticked()
      list(mine('a', { exactSentence: false, updatedAt: LATER }))
      await flushPromises()
      expect(box(shown).element.checked).toBe(false)

      list(mine('a', { exactSentence: false }))
      await flushPromises()

      expect(box(shown).element.checked).toBe(false)
      expect(lastSearch().exactUuids).toEqual([])
    })

    it('holds nothing against a list after a write that failed', async () => {
      const shown = await page([mine('a', { exactSentence: false })])
      writeExact.mockRejectedValueOnce(new Error('Could not change MatchingEntry state'))
      await tap(shown)
      await flushPromises()

      // Another device ticked it meanwhile.
      list(mine('a', { exactSentence: true }))
      await flushPromises()

      expect(box(shown).element.checked).toBe(true)
    })
  })

  describe('one chosen entry', () => {
    it('asks its sentence alone where it has the tick, none where it has not, and all for all my entries', async () => {
      const shown = await page([mine('a'), mine('b'), mine('c', { exactSentence: false })], {
        kind: 'all',
      })
      expect(lastSearch().exactUuids).toEqual(['a', 'b'])

      await choose(shown, chosen('b'))
      expect(lastSearch().exactUuids).toEqual(['b'])

      await choose(shown, chosen('c'))
      expect(lastSearch().exactUuids).toEqual([])

      await choose(shown, { kind: 'all' })
      expect(lastSearch().exactUuids).toEqual(['a', 'b'])
    })

    // Falle 12: chosen on its own, an entry far down the list is asked as well.
    it('asks the sentence of an entry past the first ten', async () => {
      const many = Array.from({ length: 12 }, (_, i) => mine(`entry-${i}`))
      const shown = await page(many, { kind: 'all' })

      await choose(shown, chosen('entry-11'))

      expect(lastSearch().exactUuids).toEqual(['entry-11'])
    })

    // Falle 14: the lens builds the scores of what it lets through anew, and "genau" comes with them.
    it('shows its people at stage 5', async () => {
      const shown = await withMap([mine('a'), mine('b')], { kind: 'all' })
      matches.value = [carrier('anna', 'a'), carrier('ben', 'b', { exact: false })]
      sentenceTotals.value = { a: 1 }
      await flushPromises()

      await choose(shown, chosen('a'))
      // The answer of the search the choice asked.
      matches.value = [carrier('anna', 'a'), carrier('ben', 'b', { exact: false })]
      await flushPromises()

      const markers = shown.findAll('.gk-clickable')
      expect(markers).toHaveLength(1)
      expect(markers[0].element.style.width).toBe('64px')
    })

    it('draws no grey rings and steps the two boxes back where it answered with its sentence', async () => {
      const shown = await withMap([mine('a')])
      presence.value = [ring(1), ring(2)]
      await flushPromises()
      expect(rings()).toBe(2)
      expect(greyBoxes(shown)).toHaveLength(2)
      expect(shown.text()).toContain('2 Menschen gefunden')

      sentenceTotals.value = { a: 3 }
      await flushPromises()

      expect(rings()).toBe(0)
      expect(greyBoxes(shown)).toHaveLength(0)
      expect(shown.text()).toContain('0 Menschen gefunden')
    })

    it.each([
      ['its question did not answer (a GMS without it)', mine('a')],
      ['it has no tick', mine('a', { exactSentence: false })],
    ])('keeps the rings where %s', async (_what, chosenEntry) => {
      const shown = await withMap([chosenEntry])
      presence.value = [ring(1), ring(2)]
      sentenceTotals.value = {}
      await flushPromises()

      expect(rings()).toBe(2)
      expect(greyBoxes(shown)).toHaveLength(2)
    })

    // KA-024: during a visit to a contact the rings stay -- they are the people around them.
    it('keeps the rings during a visit to a contact', async () => {
      route.current.query = CONTACT
      const shown = await withMap([mine('a')])
      presence.value = [ring(1), ring(2)]
      sentenceTotals.value = { a: 3 }
      await flushPromises()

      expect(rings()).toBe(2)
      expect(greyBoxes(shown)).toHaveLength(2)
    })

    // The rings are drawn by hand, and a change of the choice asks no new answer where the
    // sentences asked stay the same.
    it('keeps them for all my entries, and tells the map where only the choice changes', async () => {
      const shown = await withMap([mine('a'), mine('b', { exactSentence: false })], { kind: 'all' })
      presence.value = [ring(1), ring(2)]
      sentenceTotals.value = { a: 3 }
      await flushPromises()
      expect(rings()).toBe(2)

      await choose(shown, chosen('a'))
      expect(rings()).toBe(0)

      await choose(shown, chosen('b'))
      expect(rings()).toBe(2)
    })

    it('lists nobody nearby where it answered with its sentence', async () => {
      remember('mode', 'liste')
      const shown = await page([mine('a')])
      presence.value = [ring(1)]
      await flushPromises()
      const listed = () => shown.findComponent({ name: 'MatchList' }).props('silent')
      expect(listed()).toHaveLength(1)

      sentenceTotals.value = { a: 0 }
      await flushPromises()

      expect(listed()).toEqual([])
    })

    it('tells the list where only the people of the sentence are shown', async () => {
      remember('mode', 'liste')
      const shown = await page([mine('a')])
      const only = () => shown.findComponent({ name: 'MatchList' }).props('sentenceOnly')
      expect(only()).toBe(false)

      sentenceTotals.value = { a: 0 }
      await flushPromises()

      expect(only()).toBe(true)
    })

    it('tells the list while an answer to other sentences is on its way', async () => {
      remember('mode', 'liste')
      const shown = await page([mine('a')])
      const waiting = () => shown.findComponent({ name: 'MatchList' }).props('waiting')
      expect(waiting()).toBe(false)

      askingAnew.value = true
      await flushPromises()

      expect(waiting()).toBe(true)
    })
  })

  // A window left open last time opens again where the map shows that person (Falle 20).
  describe('a window left open last time', () => {
    it('does not open on a topic match the lens of the chosen entry leaves out', async () => {
      remember('profile', 'ben')
      remember('query', chosen('a'))
      mountMap()
      located()
      list(mine('a'), mine('b'))
      await flushPromises()

      sentenceTotals.value = { a: 1 }
      matches.value = [carrier('anna', 'a'), carrier('ben', 'b', { exact: false })]
      await flushPromises()

      expect(profile).not.toHaveBeenCalled()
    })

    it('does not open on a ring where the chosen entry shows only its sentence', async () => {
      remember('profile', 'ring-1')
      remember('query', chosen('a'))
      mountMap()
      located()
      list(mine('a'))
      await flushPromises()

      sentenceTotals.value = { a: 1 }
      matches.value = [carrier('anna', 'a')]
      presence.value = [ring(1)]
      await flushPromises()

      expect(profile).not.toHaveBeenCalled()
    })

    it('opens on a person the lens shows', async () => {
      remember('profile', 'anna')
      remember('query', chosen('a'))
      const shown = mountMap()
      located()
      list(mine('a'))
      await flushPromises()

      sentenceTotals.value = { a: 1 }
      matches.value = [carrier('anna', 'a')]
      await flushPromises()

      expect(profile).toHaveBeenCalledTimes(1)
      expect(shown.findComponent({ name: 'MatchProfile' }).props('modelValue')).toBe(true)
    })
  })

  // KA-021 point 1 also for a tick by hand (KA-023 point 4): after the server took it.
  describe('the first map', () => {
    it('opens wide once the server took the tick of an entry released for the wide search', async () => {
      const shown = await withMap([mine('a', { exactSentence: false, remote: true })])
      expect(lastSearch()).toMatchObject({ radius: 25, remoteOnly: false })
      const asked = load.mock.calls.length
      writeExact.mockResolvedValueOnce(written('a', true))

      await tap(shown)
      await flushPromises()

      // One search, the wide one.
      expect(load).toHaveBeenCalledTimes(asked + 1)
      expect(lastSearch()).toMatchObject({ radius: 500, remoteOnly: true, exactUuids: ['a'] })
      expect(remembered('reach')).toBe('fern')
      expect(pressed(shown)).toEqual(['false', 'true'])
    })

    it.each([
      ['an entry not released for the wide search', () => {}, { remote: false }],
      ['a reach the member chose', () => remember('reach', 'regional'), { remote: true }],
    ])('stays regional for %s', async (_what, before, over) => {
      before()
      const shown = await withMap([mine('a', { exactSentence: false, ...over })])
      writeExact.mockResolvedValueOnce(written('a', true))

      await tap(shown)
      await flushPromises()

      expect(lastSearch()).toMatchObject({ radius: 25, remoteOnly: false, exactUuids: ['a'] })
      expect(pressed(shown)).toEqual(['true', 'false'])
    })

    it('does not switch during a visit to a contact', async () => {
      route.current.query = CONTACT
      const shown = await withMap([mine('a', { exactSentence: false, remote: true })])
      writeExact.mockResolvedValueOnce(written('a', true))

      await tap(shown)
      await flushPromises()

      expect(window.localStorage.getItem(`${KEY}reach`)).toBeNull()
      expect(pressed(shown)).toEqual(['true', 'false'])
    })

    it('does not switch where the write failed, and the next tick that holds does', async () => {
      const shown = await withMap([mine('a', { exactSentence: false, remote: true })])
      writeExact.mockRejectedValueOnce(new Error('Could not change MatchingEntry state'))

      await tap(shown)
      await flushPromises()
      expect(window.localStorage.getItem(`${KEY}reach`)).toBeNull()
      expect(pressed(shown)).toEqual(['true', 'false'])

      writeExact.mockResolvedValueOnce(written('a', true))
      await tap(shown)
      await flushPromises()
      expect(remembered('reach')).toBe('fern')
    })

    it('switches nothing back where the tick is taken off', async () => {
      const shown = await withMap([mine('a', { exactSentence: false, remote: true })])
      writeExact.mockResolvedValueOnce(written('a', true))
      await tap(shown)
      await flushPromises()

      writeExact.mockResolvedValueOnce(written('a', false, LATER))
      await tap(shown)
      await flushPromises()

      expect(remembered('reach')).toBe('fern')
      expect(lastSearch()).toMatchObject({ radius: 500, remoteOnly: true, exactUuids: [] })
    })
  })
})

// A single choice remembered from the last visit, on a cold load of the map (KA-023 point 7): the
// query answers first from an empty cache, without data, and that is no list.
describe('MatchingMap, a remembered entry on a cold load', () => {
  beforeAll(async () => {
    await import('@/utils/mapEngine/maplibre')
  })

  const mine = (uuid, over = {}) => ({
    ...entry(uuid),
    matchingType: 'interest',
    summary: `Kongress ${uuid}`,
    remote: false,
    exactSentence: false,
    updatedAt: '2026-11-15T10:00:00.000Z',
    ...over,
  })
  const remember = (name, value) => window.localStorage.setItem(KEY + name, JSON.stringify(value))
  const remembered = (name) => JSON.parse(window.localStorage.getItem(KEY + name))
  const lastSearch = () => load.mock.calls.at(-1)[0]
  const list = (...entries) => fire(listMatchingEntries, { listMatchingEntries: entries })
  const noData = () => fire(listMatchingEntries, undefined)
  const located = () => fire(userLocationQuery, { userLocation: location })
  const chosen = (uuid) => ({ kind: 'entry', uuid })
  const somebody = (uuid, of, { exact = false } = {}) => {
    const channels = {
      interesse: [
        {
          uuid: `${uuid}-entry`,
          matchedEntryUuid: of,
          matchedSubject: 'thema',
          strength: 0.46,
          exact,
        },
      ],
    }
    return {
      uuid,
      name: uuid,
      position: { lat: 48.2, lng: 11.6 },
      community: { uuid: 'cccccccc-0000-4000-8000-cccccccccccc', name: 'Muenchen' },
      aboutMe: '',
      precision: 'genau',
      channels,
      scores: scoresOf(channels),
    }
  }
  const query = (page) => page.findComponent({ name: 'MatchQuery' }).props('selection')
  const windowOpen = (page) => page.findComponent({ name: 'MatchProfile' }).props('modelValue')

  afterEach(() => {
    load.mockReset()
    vi.useRealTimers()
  })

  it('keeps the remembered entry through an answer without data, and the list brings it back', async () => {
    remember('query', chosen('a'))
    const page = mountMap()
    located()
    noData()
    await flushPromises()

    // Remembered, and until the list knows it, the field is handed what the page shows: all my
    // entries -- the bar and the open menu say so alike (second reader, 15.11.2026).
    expect(remembered('query')).toEqual(chosen('a'))
    expect(query(page)).toEqual({ kind: 'all' })

    list(mine('a'), mine('b'))
    await flushPromises()

    expect(query(page)).toEqual(chosen('a'))
    expect(page.find('.exact-check input').exists()).toBe(true)
  })

  it('still sets it back to all my entries where the list does not hold the entry', async () => {
    remember('query', chosen('a'))
    const page = mountMap()
    located()
    noData()
    list(mine('b'))
    await flushPromises()

    expect(remembered('query')).toEqual({ kind: 'all' })
    expect(query(page)).toEqual({ kind: 'all' })
    expect(page.find('.exact-check').exists()).toBe(false)
  })

  // The bar of the search field names "all my entries" for an entry it does not know (MatchQuery):
  // the lens says the same until the list brings the entry.
  it('shows all my entries until the list brings the remembered one', async () => {
    remember('mode', 'liste')
    remember('query', chosen('a'))
    const page = mountMap()
    located()
    await flushPromises()
    const listed = () => page.findComponent({ name: 'MatchList' }).props('matches').length

    matches.value = [somebody('anna', 'a'), somebody('ben', 'b')]
    await flushPromises()
    expect(listed()).toBe(2)
    expect(lastSearch().exactUuids).toEqual([])

    list(mine('a'), mine('b'))
    await flushPromises()
    expect(listed()).toBe(1)
  })

  it('draws the lens of the remembered entry as soon as the list brings it, before a new answer', async () => {
    remember('query', chosen('a'))
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const page = mountMap()
    located()
    await page.vm.$nextTick()
    vi.advanceTimersByTime(250)
    vi.useRealTimers()
    await flushPromises()
    await flushPromises()
    matches.value = [somebody('anna', 'a'), somebody('ben', 'b')]
    await flushPromises()
    expect(page.findAll('.gk-clickable')).toHaveLength(2)

    list(mine('a'), mine('b'))
    await flushPromises()

    expect(page.findAll('.gk-clickable')).toHaveLength(1)
  })

  it('keeps the place of its row, unseen, while the list is on its way, and none for all my entries', async () => {
    remember('query', chosen('a'))
    const page = mountMap()
    located()
    noData()
    await flushPromises()

    const place = page.find('.exact-pending')
    expect(place.exists()).toBe(true)
    expect(place.attributes('aria-hidden')).toBe('true')
    expect(page.find('.exact-check input').exists()).toBe(false)
    page.unmount()
    wrapper = null

    remember('query', { kind: 'all' })
    const all = mountMap()
    located()
    await flushPromises()
    expect(all.find('.exact-pending').exists()).toBe(false)
  })

  it('gives the place back where the list does not come, and keeps the remembered entry', async () => {
    remember('query', chosen('a'))
    const page = mountMap()
    located()
    handlers.get(listMatchingEntries).error(new Error('Failed to fetch'))
    await flushPromises()

    expect(page.find('.exact-pending').exists()).toBe(false)
    expect(remembered('query')).toEqual(chosen('a'))
  })

  // A window left open last time waits for the list (second reader of Scheibe 1, F2).
  describe('a window left open last time', () => {
    it('opens once the list is in, where the list asks nothing anew', async () => {
      remember('profile', 'anna')
      const page = mountMap()
      located()
      await flushPromises()
      matches.value = [somebody('anna', 'x')]
      await flushPromises()
      expect(windowOpen(page)).toBe(false)
      const asked = load.mock.calls.length

      // A member without entries: the list changes nothing, and asks no new search.
      list()
      await flushPromises()

      expect(load).toHaveBeenCalledTimes(asked)
      expect(windowOpen(page)).toBe(true)
    })

    it('waits for the answer of the search the list asked, and opens from that one', async () => {
      load.mockImplementation(() => {
        searchLoading.value = true
      })
      remember('profile', 'ben')
      remember('query', chosen('a'))
      const page = mountMap()
      located()
      await flushPromises()
      // The search before the list: no "genau" asked, Ben a topic match of a.
      matches.value = [somebody('ben', 'a')]
      searchLoading.value = false
      await flushPromises()
      expect(windowOpen(page)).toBe(false)

      // The list: a has its "genau", and the search asks its sentence.
      list(mine('a', { exactSentence: true }))
      await flushPromises()
      expect(searchLoading.value).toBe(true)
      expect(windowOpen(page)).toBe(false)

      // Its answer: only the people of the sentence. Ben is not among them, and no window opens.
      sentenceTotals.value = { a: 1 }
      matches.value = [somebody('anna', 'a', { exact: true })]
      searchLoading.value = false
      await flushPromises()
      expect(profile).not.toHaveBeenCalled()
      expect(windowOpen(page)).toBe(false)
    })
  })
})

// The tick with the real search behind the page (`realSearch`), the GMS answered by a stand-in for
// `fetch`: what the map shows in between, when the sentences asked change (Falle 15) -- on the
// markers, the rings, the list and the number, at once and after the answer.
describe('MatchingMap, the tick with the real search', () => {
  beforeAll(async () => {
    await import('@/utils/mapEngine/maplibre')
  })

  const ACCESS = { url: 'https://ki-playground-gms.gradido.net/user-search', token: 'tok-1' }
  const COMMUNITY = { uuid: 'cccccccc-0000-4000-8000-cccccccccccc', name: 'Muenchen' }
  const mine = (uuid, over = {}) => ({
    ...entry(uuid),
    matchingType: 'interest',
    summary: `Kongress ${uuid}`,
    remote: false,
    exactSentence: true,
    updatedAt: '2026-11-15T10:00:00.000Z',
    ...over,
  })
  const remember = (name, value) => window.localStorage.setItem(KEY + name, JSON.stringify(value))
  const list = (...entries) => fire(listMatchingEntries, { listMatchingEntries: entries })
  const chosen = (uuid) => ({ kind: 'entry', uuid })
  const ok = (body) => ({ ok: true, status: 200, json: async () => body })
  let next = 0
  // The GMS writes a point as [lng, lat]; everybody here lives near home (48.2, 11.6).
  const somebody = (alias, channels) => {
    next += 1
    return {
      uuid: `5e000000-0000-4000-8000-${String(next).padStart(12, '0')}`,
      alias,
      aboutMe: null,
      type: 1,
      location: [11.6 + next / 1000, 48.2],
      community: COMMUNITY,
      channels,
    }
  }
  const channel = (of, strength, words) => [
    {
      matchingType: 'interest',
      strength,
      matches: [
        {
          matchedEntryUuid: of,
          matchedSubject: words,
          uuid: `5f000000-0000-4000-8000-${String(next + 100).padStart(12, '0')}`,
          summary: `Kongress ${of}`,
          details: null,
          remote: true,
          strength,
          score: strength,
          coreWord: true,
        },
      ],
    },
  ]
  // A topic match of `of`: step 1, a glow of 40 px on the dark map. A carrier of its sentence: the
  // brightest there is, 64 px.
  const topicOf = (alias, of) => somebody(alias, channel(of, 0.46, 'thema'))
  const carrierOf = (alias, of) => somebody(alias, channel(of, 0.865, null))

  let gms
  beforeEach(() => {
    next = 0
    realSearch.on = true
    listQuestion.mockImplementation(async ({ query }) =>
      query === authenticateGmsUserSearch
        ? { data: { authenticateGmsUserSearch: ACCESS } }
        : { data: { listMatchingEntries: [] } },
    )
    gms = {
      gate: null,
      sentenceStatus: 200,
      topic: [topicOf('Tina', 'a'), topicOf('Tom', 'b'), topicOf('Carl', 'c')],
      sentences: {
        a: [carrierOf('Anna', 'a'), carrierOf('Arne', 'a')],
        b: [carrierOf('Bert', 'b')],
      },
      rings: [
        {
          id: 1,
          uuid: 'ring-1',
          alias: 'Ruth',
          type: 1,
          location: [11.6, 48.21],
          community: COMMUNITY,
          hasEntries: true,
        },
        {
          id: 2,
          uuid: 'ring-2',
          alias: 'Rolf',
          type: 1,
          location: [11.6, 48.22],
          community: COMMUNITY,
          hasEntries: false,
        },
      ],
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (gms.gate) await gms.gate
        const { pathname, searchParams } = new URL(url)
        if (pathname.endsWith('/community-user/matches')) return ok(gms.topic)
        if (pathname.endsWith('/community-user/user-locations')) return ok(gms.rings)
        if (pathname.endsWith('/community-user/sentence-matches')) {
          if (gms.sentenceStatus !== 200) {
            return { ok: false, status: gms.sentenceStatus, json: async () => ({}) }
          }
          const users = gms.sentences[searchParams.get('entry')] ?? []
          return ok({ total: users.length, users })
        }
        return { ok: false, status: 404, json: async () => ({}) }
      }),
    )
  })

  afterEach(() => {
    realSearch.on = false
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  /** The page with its map built and the arrival's searches answered, in the list view. */
  const withMap = async (entries, selection) => {
    remember('mode', 'liste')
    remember('reach', 'regional')
    remember('query', selection)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const mounted = mountMap()
    fire(userLocationQuery, { userLocation: location })
    list(...entries)
    await mounted.vm.$nextTick()
    vi.advanceTimersByTime(250)
    vi.useRealTimers()
    await settled()
    return mounted
  }
  const settled = async () => {
    for (let round = 0; round < 4; round++) await flushPromises()
  }
  /** Holds the GMS until the returned function lets it answer. */
  const hold = () => {
    let release
    gms.gate = new Promise((resolve) => {
      release = resolve
    })
    return async () => {
      gms.gate = null
      release()
      await settled()
    }
  }
  /** What the page shows: markers by size, rings, the rows of the list, and the number. */
  const onScreen = (page) => {
    const listing = page.findComponent({ name: 'MatchList' })
    return {
      markers: page
        .findAll('.gk-clickable')
        .map((marker) => parseInt(marker.element.style.width, 10))
        .sort((x, y) => x - y),
      rings: created.at(-1).getSource('gk-presence').data.features.length,
      listed: listing.props('matches').length,
      nearby: listing.props('silent').length,
      waiting: listing.props('waiting'),
      number: page.find('.exact-count').exists() ? page.find('.exact-count').text() : null,
    }
  }
  const EMPTY = { markers: [], rings: 0, listed: 0, nearby: 0, waiting: true, number: null }
  const choose = async (page, selection) => {
    page.findComponent({ name: 'MatchQuery' }).vm.$emit('update:selection', selection)
    await settled()
  }

  it('takes everything down at once where other sentences are asked, and shows the answer', async () => {
    const page = await withMap([mine('a'), mine('b'), mine('c', { exactSentence: false })], {
      kind: 'all',
    })
    // All my entries: a and b ask their sentences; Carl answers c by topic.
    expect(onScreen(page)).toEqual({
      markers: [40, 64, 64, 64],
      rings: 2,
      listed: 4,
      nearby: 2,
      waiting: false,
      number: null,
    })

    // From all my entries to one with the tick.
    let answer = hold()
    await choose(page, chosen('a'))
    expect(onScreen(page)).toEqual(EMPTY)
    await answer()
    expect(onScreen(page)).toEqual({
      markers: [64, 64],
      rings: 0,
      listed: 2,
      nearby: 0,
      waiting: false,
      number: '2 Menschen',
    })

    // From one to another.
    answer = hold()
    await choose(page, chosen('b'))
    expect(onScreen(page)).toEqual(EMPTY)
    await answer()
    expect(onScreen(page)).toEqual({
      markers: [64],
      rings: 0,
      listed: 1,
      nearby: 0,
      waiting: false,
      number: '1 Mensch',
    })

    // Back to all my entries.
    answer = hold()
    await choose(page, { kind: 'all' })
    expect(onScreen(page)).toEqual(EMPTY)
    await answer()
    expect(onScreen(page)).toMatchObject({ markers: [40, 64, 64, 64], rings: 2, nearby: 2 })

    // To an entry without the tick.
    answer = hold()
    await choose(page, chosen('c'))
    expect(onScreen(page)).toEqual(EMPTY)
    await answer()
    expect(onScreen(page)).toEqual({
      markers: [40],
      rings: 2,
      listed: 1,
      nearby: 2,
      waiting: false,
      number: null,
    })
  })

  it('takes everything down at once where the tick is set and where it is taken off', async () => {
    const page = await withMap([mine('c', { exactSentence: false })], chosen('c'))
    expect(onScreen(page)).toMatchObject({ markers: [40], rings: 2 })

    // Set: nobody carries the sentence of c.
    writeExact.mockResolvedValueOnce({
      data: {
        setMatchingEntryExactSentence: {
          uuid: 'c',
          exactSentence: true,
          updatedAt: '2026-11-15T12:00:00.000Z',
        },
      },
    })
    let answer = hold()
    await page.find('.exact-check input').trigger('click')
    await settled()
    expect(onScreen(page)).toEqual(EMPTY)
    await answer()
    expect(onScreen(page)).toEqual({
      markers: [],
      rings: 0,
      listed: 0,
      nearby: 0,
      waiting: false,
      number: '0 Menschen',
    })

    // Taken off: Carl and the rings again.
    writeExact.mockResolvedValueOnce({
      data: {
        setMatchingEntryExactSentence: {
          uuid: 'c',
          exactSentence: false,
          updatedAt: '2026-11-15T13:00:00.000Z',
        },
      },
    })
    answer = hold()
    await page.find('.exact-check input').trigger('click')
    await settled()
    expect(onScreen(page)).toEqual(EMPTY)
    await answer()
    expect(onScreen(page)).toMatchObject({ markers: [40], rings: 2, nearby: 2, number: null })
  })

  it('takes everything down for an entry past the limit chosen on its own, and back', async () => {
    const many = Array.from({ length: SENTENCE_QUESTIONS_MAX + 1 }, (_, i) => mine(`e${i}`))
    const last = `e${SENTENCE_QUESTIONS_MAX}`
    gms.topic = []
    gms.sentences = { [last]: [carrierOf('Lena', last)] }
    const page = await withMap(many, { kind: 'all' })
    // All my entries: the last one is not asked, and nobody carries the others.
    expect(onScreen(page)).toMatchObject({ markers: [], rings: 2 })

    let answer = hold()
    await choose(page, chosen(last))
    expect(onScreen(page)).toEqual(EMPTY)
    await answer()
    expect(onScreen(page)).toMatchObject({ markers: [64], rings: 0, number: '1 Mensch' })

    answer = hold()
    await choose(page, { kind: 'all' })
    expect(onScreen(page)).toEqual(EMPTY)
    await answer()
    expect(onScreen(page)).toMatchObject({ markers: [], rings: 2, waiting: false })
  })

  // Falle 13: a GMS without the question (400) cannot be told apart beforehand. The map stands
  // empty for the moment all the same, and then the entry searches as without its "genau".
  it('shows the topic matches and the rings again at a GMS without the question', async () => {
    gms.sentenceStatus = 400
    const page = await withMap([mine('a'), mine('b'), mine('c', { exactSentence: false })], {
      kind: 'all',
    })
    expect(onScreen(page)).toMatchObject({ markers: [40, 40, 40], rings: 2 })

    let answer = hold()
    await choose(page, chosen('a'))
    expect(onScreen(page)).toEqual(EMPTY)
    await answer()
    expect(onScreen(page)).toEqual({
      markers: [40],
      rings: 2,
      listed: 1,
      nearby: 2,
      waiting: false,
      number: null,
    })
    expect(page.find('.exact-check input').element.checked).toBe(true)

    answer = hold()
    await choose(page, { kind: 'all' })
    expect(onScreen(page)).toEqual(EMPTY)
    await answer()
    expect(onScreen(page)).toMatchObject({ markers: [40, 40, 40], rings: 2 })
  })

  // For a member without a change in the sentences asked, a search is what it always was: the
  // answer on screen stays until the new one is there.
  it('takes nothing down where the sentences asked stay the same', async () => {
    gms.topic = [topicOf('Tina', 'a'), topicOf('Tom', 'b')]
    const page = await withMap([mine('a'), mine('b', { exactSentence: false })], { kind: 'all' })
    const before = onScreen(page)
    expect(before).toMatchObject({ markers: [40, 64, 64], rings: 2, waiting: false })

    const answer = hold()
    await choose(page, chosen('a'))
    // Nothing is taken down: the lens of the new choice shows at once, on the markers too (second
    // reader, 15.11.2026), and the rings step back, as the entry shows only its sentence.
    expect(onScreen(page)).toMatchObject({ markers: [64, 64], rings: 0, waiting: false })
    await answer()
    expect(onScreen(page)).toMatchObject({ markers: [64, 64], rings: 0, number: '2 Menschen' })
  })
})
