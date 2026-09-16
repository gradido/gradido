// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import UserLocationMap from './UserLocationMap.vue'
import GeoSearchField from '@/components/Matching/GeoSearchField.vue'
import { created } from '@test/maplibreMock'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key, locale: { value: 'de' } }),
}))

// The provider is measured in its own spec (utils/geoSearchProvider); here only what the map
// makes it with and hands to the control. The admin switch draws with Leaflet unless a test
// says otherwise, as on a server nobody has switched.
const { makeGeoProvider, mapSwitches, gmsBase, switchPosition } = vi.hoisted(() => {
  const position = { mapEngine: 'LEAFLET' }
  return {
    makeGeoProvider: vi.fn(() => ({ search: async () => [] })),
    mapSwitches: vi.fn(async () => ({ ...position, geoProvider: 'GMS' })),
    gmsBase: async () => null,
    switchPosition: position,
  }
})
vi.mock('@/utils/geoSearchProvider', () => ({ makeGeoProvider }))
vi.mock('@/composables/useMapSwitches', async (importOriginal) => ({
  ...(await importOriginal()),
  useMapSwitches: () => ({ mapSwitches }),
}))
vi.mock('@/composables/useGmsBase', () => ({ useGmsBase: () => ({ gmsBase }) }))

// Never the real MapLibre in jsdom: it needs WebGL 2 and would die deep in drawing. The stand-in
// keeps what MapLibre does where the engine can see it (test/maplibreMock.js).
vi.mock('maplibre-gl', () => import('@test/maplibreMock'))
vi.mock('@/utils/mapEngine/maplibreWorkerUrl', () => ({ default: 'worker.js' }))

// The engines, loaded the way the component loads them - unless a test says the next one does
// not arrive, as a file does not when the connection drops or a deploy has renamed it.
const engineLoad = { fails: false }
vi.mock('@/utils/mapEngine', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    loadMapEngine: (name) =>
      engineLoad.fails
        ? Promise.reject(new Error('Failed to fetch dynamically imported module'))
        : actual.loadMapEngine(name),
  }
})

// The search field is the page's own element, in the template from the first tick - so
// finding the component proves nothing. Leaflet marks what it has taken into a corner with
// `leaflet-control`, and hanging the field there is the last thing initMap does: finding it
// in the corner proves the function ran to its end rather than dying somewhere in the middle.
const searchInCorner = () => document.querySelectorAll('.leaflet-top.leaflet-left .gk-search')

vi.mock('@/components/UserSettings/CoordinatesDisplay.vue', () => ({
  default: { template: '<div />' },
}))

const coords = { lat: 48.2, lng: 11.6 }
const PRAGUE = { lat: 50.0874654, lng: 14.4212535, label: 'Prag' }

// These mount into document.body, so the teardown has to run even when an
// assertion throws — otherwise a failing case leaves its markers behind and the
// next one reads them as its own.
let wrapper = null

// initMap is scheduled with setTimeout(..., 250), so the map is not there on the
// tick after mount. Everything inside initMap is synchronous once it starts.
const mountAndSettle = async (props) => {
  wrapper = mount(UserLocationMap, {
    props: { userMarkerCoords: coords, communityMarkerCoords: coords, ...props },
    attachTo: document.body,
  })
  await new Promise((resolve) => setTimeout(resolve, 400))
}

describe('UserLocationMap', () => {
  beforeEach(() => {
    makeGeoProvider.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  // Both markers bind a popup, and a popup with no pane to attach to takes the
  // rest of initMap down with it: the map click that sets your location, the
  // marker drag and the address search all sit below the popup and never get
  // wired. The map still paints, so it looks whole and answers nothing.
  describe('the settings page (default props)', () => {
    it('shows both labels and finishes wiring the map', async () => {
      await mountAndSettle({})

      expect(document.body.textContent).toContain('settings.GMS.map.userLocationLabel')
      expect(document.body.textContent).toContain('settings.GMS.map.communityLocationLabel')
      expect(searchInCorner()).toHaveLength(1)
    })
  })

  // The matching page asks for the home house and gives no community point (Bernd,
  // 11.09.2026: its centre only confused there) - so the house stands alone.
  describe('the matching page (userIcon=home)', () => {
    it('shows the house alone and finishes wiring the map', async () => {
      await mountAndSettle({ userIcon: 'home', communityMarkerCoords: undefined })

      expect(document.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1)
      expect(document.body.textContent).not.toContain('settings.GMS.map.communityLocationLabel')
      // The home house explains itself; only the pin carries a label.
      expect(document.body.textContent).not.toContain('settings.GMS.map.userLocationLabel')
      expect(searchInCorner()).toHaveLength(1)
    })
  })

  // Left out, there is no community pin at all - not one at the 0/0 the map starts from.
  describe('without a community point', () => {
    it('draws only the pin that was asked for', async () => {
      await mountAndSettle({ communityMarkerCoords: undefined })

      expect(document.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1)
      expect(document.body.textContent).toContain('settings.GMS.map.userLocationLabel')
      expect(document.body.textContent).not.toContain('settings.GMS.map.communityLocationLabel')
      expect(searchInCorner()).toHaveLength(1)
    })
  })

  // Leaflet builds MarkerDrag inside _initInteraction, which returns early when
  // interactive is false - so `draggable: true` beside it is a promise the marker
  // cannot keep, and the dragend handler can never run. Clicking the map still
  // moved the pin, which is why this read as a working map for so long.
  describe('the pin', () => {
    const markers = () => document.querySelectorAll('.leaflet-marker-draggable')

    it('can actually be dragged on the settings page', async () => {
      await mountAndSettle({})

      expect(markers()).toHaveLength(1)
    })

    it('can actually be dragged on the matching page', async () => {
      await mountAndSettle({ userIcon: 'home', communityMarkerCoords: undefined })

      expect(markers()).toHaveLength(1)
    })
  })

  // The admin switch decides at each search which service answers (K-008) - on this map as
  // on the big one.
  describe('the address search', () => {
    it('hands the field a provider made with the admin switch and the GMS address', async () => {
      await mountAndSettle({ userIcon: 'home', communityMarkerCoords: undefined })

      expect(makeGeoProvider).toHaveBeenCalledTimes(1)
      const made = makeGeoProvider.mock.calls[0][0]
      expect(made.mapSwitches).toBe(mapSwitches)
      expect(made.gmsBase).toBe(gmsBase)
      // Read at the moment of a search: where the map looks, in the wallet's language.
      expect(made.viewpoint().lat).toBeCloseTo(coords.lat, 6)
      expect(made.viewpoint().lng).toBeCloseTo(coords.lng, 6)
      expect(made.language()).toBe('de')
      expect(wrapper.findComponent(GeoSearchField).props('provider')).toBe(
        makeGeoProvider.mock.results[0].value,
      )
    })

    // Searching an address is how somebody who cannot point at their house sets it. The
    // pin follows, and the map comes close enough to see what it landed on - a map that
    // was already closer keeps its own zoom (K-010).
    it('moves the pin to the place picked and comes at least that close', async () => {
      await mountAndSettle({})
      const map = wrapper.vm.map

      map.setView([coords.lat, coords.lng], 6)
      await wrapper.findComponent(GeoSearchField).vm.$emit('pick', PRAGUE)

      expect(wrapper.emitted('update:userPosition').at(-1)).toEqual([
        { lat: PRAGUE.lat, lng: PRAGUE.lng },
      ])
      expect(map.getZoom()).toBe(15)
      expect(map.getCenter().lat).toBeCloseTo(PRAGUE.lat, 4)
    })

    it('leaves a map that is already closer at its own zoom', async () => {
      await mountAndSettle({})
      const map = wrapper.vm.map

      map.setView([coords.lat, coords.lng], 17)
      await wrapper.findComponent(GeoSearchField).vm.$emit('pick', PRAGUE)

      expect(map.getZoom()).toBe(17)
    })
  })

  // K-008: the admin switch picks the engine this map is drawn with, as it does for the big one.
  describe('on the MapLibre engine', () => {
    const leafletMaps = () => document.querySelectorAll('.leaflet-container')
    const mapLibreMaps = () => document.querySelectorAll('.maplibregl-map')
    // The pin the member moves: the only marker that can be dragged.
    const ownPin = () => document.querySelector('.maplibregl-marker-draggable')
    const pointer = (type, element, x) =>
      element.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: 0 }))

    // The first import of the engine transforms its whole module tree, which can take longer
    // than the wait below; after that the component's own import finds it loaded.
    beforeAll(async () => {
      await import('@/utils/mapEngine/maplibre')
    })

    beforeEach(() => {
      switchPosition.mapEngine = 'MAPLIBRE'
      created.length = 0
      // MapLibre asks the canvas for a WebGL 2 context and for nothing else.
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((kind) =>
        kind === 'webgl2' ? {} : null,
      )
    })

    afterEach(() => {
      switchPosition.mapEngine = 'LEAFLET'
      engineLoad.fails = false
      vi.restoreAllMocks()
    })

    it('stands the house as a MapLibre marker and finishes wiring the map', async () => {
      await mountAndSettle({ userIcon: 'home', communityMarkerCoords: undefined })

      expect(mapLibreMaps()).toHaveLength(1)
      expect(leafletMaps()).toHaveLength(0)
      expect(document.querySelectorAll('.maplibregl-marker')).toHaveLength(1)
      expect(document.querySelector('.maplibregl-marker.own-home svg')).not.toBeNull()
      expect(document.querySelectorAll('.maplibregl-ctrl-top-left .gk-search')).toHaveLength(1)
    })

    it('sets the position where the pin is dragged to', async () => {
      await mountAndSettle({})

      pointer('mousedown', ownPin(), 0)
      const canvas = document.querySelector('.maplibregl-canvas')
      pointer('mousemove', canvas, 30)
      pointer('mouseup', canvas, 30)

      const [position] = wrapper.emitted('update:userPosition').at(-1)
      expect(position.lng).toBeGreaterThan(coords.lng)
      expect(position.lat).toBeCloseTo(coords.lat, 6)
    })

    // This map has no looks; MapLibre still draws a style, and names its places in the wallet's
    // language only when it is told which - otherwise in English.
    it("draws the normal style, with the places named in the wallet's language", async () => {
      await mountAndSettle({})

      const { style } = created.at(-1)
      expect(style.sprite).toMatch(/\/light$/)
      expect(JSON.stringify(style.layers)).toContain('name:de')
    })

    // K-013: until the old engine goes, a device without WebGL 2 keeps the old map.
    it('draws the old map where the device has no WebGL 2', async () => {
      HTMLCanvasElement.prototype.getContext.mockImplementation(() => null)

      await mountAndSettle({})

      expect(created).toHaveLength(0)
      expect(leafletMaps()).toHaveLength(1)
      expect(searchInCorner()).toHaveLength(1)
    })

    it('draws the old map when the new engine does not arrive', async () => {
      engineLoad.fails = true

      await mountAndSettle({})

      expect(created).toHaveLength(0)
      expect(leafletMaps()).toHaveLength(1)
    })

    // jsdom applies no scoped styles, so these rules are read in the source, comments first. The
    // first keeps the field out of sight until an engine has taken it - both mark that with
    // `gk-placed`; the other two give MapLibre's zoom buttons the lens's measure.
    it('hides the search field until the map takes it, and sizes the zoom buttons like the lens', () => {
      const source = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'UserLocationMap.vue'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '')

      expect(source).toMatch(/\n\.gk-search:not\(\.gk-placed\) \{[^}]*display: none;/)
      const group = source.match(/\n\.map-container :deep\(\.maplibregl-ctrl-group\) \{([^}]*)\}/)
      expect(group?.[1]).toMatch(/border: 2px solid rgb\(0 0 0 \/ 20%\);/)
      expect(group?.[1]).toMatch(/box-shadow: none;/)
      const buttons = source.match(
        /\n\.map-container :deep\(\.maplibregl-ctrl-group button\) \{([^}]*)\}/,
      )
      expect(buttons?.[1]).toMatch(/width: 30px;/)
      expect(buttons?.[1]).toMatch(/height: 30px;/)
    })

    // A slow connection must not decide which map somebody sees.
    it('waits for a switch that answers late, and builds the map it names', async () => {
      let answer
      mapSwitches.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            answer = resolve
          }),
      )
      await mountAndSettle({})

      expect(leafletMaps()).toHaveLength(0)
      expect(mapLibreMaps()).toHaveLength(0)

      answer({ mapEngine: 'MAPLIBRE', geoProvider: 'GMS' })
      await flushPromises()
      await flushPromises()

      expect(mapLibreMaps()).toHaveLength(1)
      expect(leafletMaps()).toHaveLength(0)
    })
  })
})
