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
// makes it with and hands to the control.
const { makeGeoProvider, gmsBase } = vi.hoisted(() => ({
  makeGeoProvider: vi.fn(() => ({ search: async () => [] })),
  gmsBase: async () => null,
}))
vi.mock('@/utils/geoSearchProvider', () => ({ makeGeoProvider }))
vi.mock('@/composables/useGmsBase', () => ({ useGmsBase: () => ({ gmsBase }) }))

// Never the real MapLibre in jsdom: it needs WebGL 2 and would die deep in drawing. The stand-in
// keeps what MapLibre does where the engine can see it (test/maplibreMock.js).
vi.mock('maplibre-gl', () => import('@test/maplibreMock'))
vi.mock('@/utils/mapEngine/maplibreWorkerUrl', () => ({ default: 'worker.js' }))

// The engine, loaded the way the component loads it - unless a test holds it back until it opens
// `gate`, hands over an `engine` of its own, or says it does not arrive at all, as a file does not
// when the connection drops or a deploy has renamed it.
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

// The search field is the page's own element, in the template from the first tick - so
// finding the component proves nothing. The engine hangs it into the map's corner, and that is
// the last thing initMap does: finding it in the corner proves the function ran to its end
// rather than dying somewhere in the middle.
const searchInCorner = () => document.querySelectorAll('.maplibregl-ctrl-top-left .gk-search')
const maps = () => document.querySelectorAll('.maplibregl-map')

vi.mock('@/components/UserSettings/CoordinatesDisplay.vue', () => ({
  default: { template: '<div />' },
}))

const coords = { lat: 48.2, lng: 11.6 }
const PRAGUE = { lat: 50.0874654, lng: 14.4212535, label: 'Prag' }

// These mount into document.body, so the teardown has to run even when an
// assertion throws — otherwise a failing case leaves its markers behind and the
// next one reads them as its own.
let wrapper = null

// initMap is scheduled with setTimeout(..., 250) and then waits for the engine, so the map is
// not there on the tick after mount.
const mountAndSettle = async (props) => {
  wrapper = mount(UserLocationMap, {
    props: { userMarkerCoords: coords, communityMarkerCoords: coords, ...props },
    attachTo: document.body,
  })
  await new Promise((resolve) => setTimeout(resolve, 400))
}

describe('UserLocationMap', () => {
  let context = null

  // The first import of the engine transforms its whole module tree, which can take longer than
  // the wait above; after that the component's own import finds it loaded.
  beforeAll(async () => {
    await import('@/utils/mapEngine/maplibre')
  })

  beforeEach(() => {
    makeGeoProvider.mockClear()
    created.length = 0
    // MapLibre asks the canvas for a WebGL 2 context and for nothing else.
    context = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation((kind) => (kind === 'webgl2' ? {} : null))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
    engineLoad.fails = false
    engineLoad.gate = null
    engineLoad.engine = null
    context.mockRestore()
  })

  // Both markers bind a popup, and a popup that takes the rest of initMap down with it leaves
  // the map click that sets your location, the marker drag and the address search unwired. The
  // map still paints, so it looks whole and answers nothing.
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

      expect(maps()).toHaveLength(1)
      expect(document.querySelectorAll('.maplibregl-marker')).toHaveLength(1)
      expect(document.querySelector('.maplibregl-marker.own-home svg')).not.toBeNull()
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

      expect(document.querySelectorAll('.maplibregl-marker')).toHaveLength(1)
      expect(document.body.textContent).toContain('settings.GMS.map.userLocationLabel')
      expect(document.body.textContent).not.toContain('settings.GMS.map.communityLocationLabel')
      expect(searchInCorner()).toHaveLength(1)
    })
  })

  // `draggable: true` is a promise the pin has to be able to keep: a marker that takes no tap
  // lets it through to the map, so it cannot be picked up either, and the dragend handler would
  // never run. Clicking the map would still move the pin, which is why such a pin once read as a
  // working map for so long. Exactly one marker is the member's own, and only it can be dragged.
  describe('the pin', () => {
    const markers = () => document.querySelectorAll('.maplibregl-marker-draggable')

    it('can actually be dragged on the settings page', async () => {
      await mountAndSettle({})

      expect(markers()).toHaveLength(1)
      expect(markers()[0].style.pointerEvents).not.toBe('none')
    })

    it('can actually be dragged on the matching page', async () => {
      await mountAndSettle({ userIcon: 'home', communityMarkerCoords: undefined })

      expect(markers()).toHaveLength(1)
      expect(markers()[0].style.pointerEvents).not.toBe('none')
    })
  })

  describe('the address search', () => {
    it('hands the field a provider made with the GMS address', async () => {
      await mountAndSettle({ userIcon: 'home', communityMarkerCoords: undefined })

      expect(makeGeoProvider).toHaveBeenCalledTimes(1)
      const made = makeGeoProvider.mock.calls[0][0]
      expect(Object.keys(made).sort()).toEqual(['gmsBase', 'language', 'viewpoint'])
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

  describe('on the MapLibre engine', () => {
    // The pin the member moves: the only marker that can be dragged.
    const ownPin = () => document.querySelector('.maplibregl-marker-draggable')
    const pointer = (type, element, x) =>
      element.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: 0 }))

    // The engine takes a moment to arrive, and the settings dialog may be closed by then.
    it('builds nothing once the component is gone while the engine is on its way', async () => {
      let arrive
      engineLoad.gate = new Promise((resolve) => {
        arrive = resolve
      })
      engineLoad.engine = { createMap: vi.fn(() => ({ success: false, error: new Error('gone') })) }
      await mountAndSettle({})

      wrapper.unmount()
      wrapper = null
      arrive()
      await flushPromises()
      await flushPromises()

      expect(engineLoad.engine.createMap).not.toHaveBeenCalled()
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

    // K-013: MapLibre needs WebGL 2. Without it there is no map, and the address search is not
    // hung anywhere - it stays out of sight (the rule read in the source below). The same mount
    // with a context builds the map (the settings page case above), so this is the device.
    it('draws no map where the device has no WebGL 2', async () => {
      context.mockImplementation(() => null)

      await mountAndSettle({})

      expect(created).toHaveLength(0)
      expect(maps()).toHaveLength(0)
      expect(searchInCorner()).toHaveLength(0)
      expect(document.querySelector('.gk-search').classList.contains('gk-placed')).toBe(false)
    })

    // Not the device: the file did not come.
    it('draws no map when the engine does not arrive', async () => {
      engineLoad.fails = true

      await mountAndSettle({})

      expect(created).toHaveLength(0)
      expect(maps()).toHaveLength(0)
    })

    // jsdom applies no scoped styles, so these rules are read in the source, comments first. The
    // first keeps the field out of sight until the engine has taken it - it marks that with
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
  })
})
