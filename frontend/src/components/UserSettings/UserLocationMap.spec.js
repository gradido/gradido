// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import UserLocationMap from './UserLocationMap.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key, locale: { value: 'de' } }),
}))

// The provider is measured in its own spec (utils/geoSearchProvider); here only what the map
// makes it with and hands to the control.
const { makeGeoProvider, mapSwitches, gmsBase } = vi.hoisted(() => ({
  makeGeoProvider: vi.fn(() => ({ search: async () => [] })),
  mapSwitches: async () => ({ mapEngine: 'LEAFLET', geoProvider: 'GMS' }),
  gmsBase: async () => null,
}))
vi.mock('@/utils/geoSearchProvider', () => ({ makeGeoProvider }))
vi.mock('@/composables/useMapSwitches', () => ({ useMapSwitches: () => ({ mapSwitches }) }))
vi.mock('@/composables/useGmsBase', () => ({ useGmsBase: () => ({ gmsBase }) }))

// The search control is the last thing initMap adds, so a call to addTo proves
// the function ran to its end rather than dying somewhere in the middle.
let searchControlAdded = 0
const searchControlOptions = []
vi.mock('leaflet-geosearch', () => ({
  GeoSearchControl: class {
    constructor(options) {
      searchControlOptions.push(options)
      this.options = { position: 'topleft' }
    }

    onAdd() {
      return document.createElement('div')
    }

    // map.addControl(control) calls control.addTo(map).
    addTo() {
      searchControlAdded += 1
      return this
    }
  },
}))

vi.mock('@/components/UserSettings/CoordinatesDisplay.vue', () => ({
  default: { template: '<div />' },
}))

const coords = { lat: 48.2, lng: 11.6 }

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
    searchControlAdded = 0
    searchControlOptions.length = 0
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
      expect(searchControlAdded).toBe(1)
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
      expect(searchControlAdded).toBe(1)
    })
  })

  // Left out, there is no community pin at all - not one at the 0/0 the map starts from.
  describe('without a community point', () => {
    it('draws only the pin that was asked for', async () => {
      await mountAndSettle({ communityMarkerCoords: undefined })

      expect(document.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1)
      expect(document.body.textContent).toContain('settings.GMS.map.userLocationLabel')
      expect(document.body.textContent).not.toContain('settings.GMS.map.communityLocationLabel')
      expect(searchControlAdded).toBe(1)
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
    it('hands the control a provider made with the admin switch and the GMS address', async () => {
      await mountAndSettle({ userIcon: 'home', communityMarkerCoords: undefined })

      expect(makeGeoProvider).toHaveBeenCalledTimes(1)
      const made = makeGeoProvider.mock.calls[0][0]
      expect(made.mapSwitches).toBe(mapSwitches)
      expect(made.gmsBase).toBe(gmsBase)
      // Read at the moment of a search: where the map looks, in the wallet's language.
      expect(made.viewpoint().lat).toBeCloseTo(coords.lat, 6)
      expect(made.viewpoint().lng).toBeCloseTo(coords.lng, 6)
      expect(made.language()).toBe('de')
      expect(searchControlOptions[0].provider).toBe(makeGeoProvider.mock.results[0].value)
    })
  })
})
