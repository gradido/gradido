// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import L from 'leaflet'
import { GeoSearchControl, JsonProvider } from 'leaflet-geosearch'
import { GEO_PROVIDER } from '@/composables/useMapSwitches'
import { searchPlaces } from '@/utils/geoSearch'
import { GeoIndexProvider, makeGeoProvider } from './geoSearchProvider'

const { oldSearch } = vi.hoisted(() => ({ oldSearch: vi.fn() }))

vi.mock('@/utils/geoSearch', () => ({ searchPlaces: vi.fn() }))

// The real base class, and the old provider replaced by a spy - it would ask Nominatim.
vi.mock('leaflet-geosearch', async () => {
  const actual = await vi.importActual('leaflet-geosearch')
  return {
    ...actual,
    OpenStreetMapProvider: class {
      search(options) {
        return oldSearch(options)
      }
    },
  }
})

const BASE = 'https://ki-playground-gms.gradido.net/gms/'
const PLACE = {
  lat: 49.2816472,
  lng: 9.7405781,
  label: 'Pfarrweg 2, 74653 Künzelsau',
  raw: { name: 'Pfarrweg', number: '2', postcode: '74653', city: 'Künzelsau' },
}

describe('GeoIndexProvider', () => {
  beforeEach(() => {
    vi.mocked(searchPlaces).mockReset()
    vi.mocked(searchPlaces).mockResolvedValue([PLACE])
  })

  it('searches under the address it is given, where the map looks, in the wallet language', async () => {
    const provider = new GeoIndexProvider({
      base: async () => BASE,
      viewpoint: () => ({ lat: 49.28, lng: 9.69 }),
      language: () => 'de',
    })

    const results = await provider.search({ query: 'Pfarrweg 2' })

    expect(searchPlaces).toHaveBeenCalledWith(BASE, 'Pfarrweg 2', {
      near: { lat: 49.28, lng: 9.69 },
      language: 'de',
    })
    // What leaflet-geosearch reads: x the longitude, y the latitude.
    expect(results).toEqual([
      { x: 9.7405781, y: 49.2816472, label: PLACE.label, bounds: null, raw: PLACE.raw },
    ])
  })

  it('reads the view and the language at the moment of each search', async () => {
    let view = { lat: 49.28, lng: 9.69 }
    let language = 'de'
    const provider = new GeoIndexProvider({
      base: async () => BASE,
      viewpoint: () => view,
      language: () => language,
    })
    await provider.search({ query: 'Prag' })

    view = { lat: 50.08, lng: 14.42 }
    language = 'en'
    await provider.search({ query: 'Prag' })

    expect(vi.mocked(searchPlaces).mock.calls[1][2]).toEqual({
      near: { lat: 50.08, lng: 14.42 },
      language: 'en',
    })
  })

  it('is a leaflet-geosearch provider', () => {
    expect(new GeoIndexProvider({ base: async () => BASE })).toBeInstanceOf(JsonProvider)
  })

  const picked = { x: 9.7405781, y: 49.2816472, label: PLACE.label, bounds: null, raw: PLACE.raw }

  it('hands back the row that was picked instead of searching its label again', async () => {
    const provider = new GeoIndexProvider({ base: async () => BASE })

    const results = await provider.search({ query: PLACE.label, data: picked })

    expect(results).toEqual([picked])
    expect(searchPlaces).not.toHaveBeenCalled()
  })

  // Arrowed to a row and typed on: the control still hands the row over, but the words are new.
  it('searches again once the words are no longer the label of the row', async () => {
    const provider = new GeoIndexProvider({ base: async () => BASE })

    await provider.search({ query: 'Pfarrweg 2, Künzelsau', data: picked })

    expect(searchPlaces).toHaveBeenCalledWith(BASE, 'Pfarrweg 2, Künzelsau', {
      near: null,
      language: null,
    })
  })
})

describe('makeGeoProvider', () => {
  const position = { geoProvider: GEO_PROVIDER.NOMINATIM }
  const mapSwitches = vi.fn(async () => ({ mapEngine: 'LEAFLET', ...position }))
  const gmsBase = async () => BASE
  const make = () =>
    makeGeoProvider({ mapSwitches, gmsBase, viewpoint: () => null, language: () => 'de' })

  beforeEach(() => {
    vi.mocked(searchPlaces).mockReset()
    vi.mocked(searchPlaces).mockResolvedValue([PLACE])
    oldSearch.mockReset()
    oldSearch.mockResolvedValue([{ x: 1, y: 2, label: 'old', bounds: null, raw: {} }])
    mapSwitches.mockClear()
    position.geoProvider = GEO_PROVIDER.NOMINATIM
  })

  it('asks the GMS in the new position, and the old search not at all', async () => {
    position.geoProvider = GEO_PROVIDER.GMS

    const results = await make().search({ query: 'Pfarrweg 2' })

    expect(searchPlaces).toHaveBeenCalledWith(BASE, 'Pfarrweg 2', { near: null, language: 'de' })
    expect(oldSearch).not.toHaveBeenCalled()
    expect(results.map((result) => result.label)).toEqual([PLACE.label])
  })

  it('asks the old search in the old position, with what the control handed over', async () => {
    const options = { query: 'Pfarrweg 2', data: { label: 'from the list' } }

    const results = await make().search(options)

    expect(oldSearch).toHaveBeenCalledWith(options)
    expect(searchPlaces).not.toHaveBeenCalled()
    expect(results.map((result) => result.label)).toEqual(['old'])
  })

  // The list makes its provider in setup, before the switch has answered - and an admin may
  // flip the switch while a page stays open.
  it('reads the switch at every search, not when it is made', async () => {
    const provider = make()
    expect(mapSwitches).not.toHaveBeenCalled()

    position.geoProvider = GEO_PROVIDER.GMS
    await provider.search({ query: 'Prag' })
    position.geoProvider = GEO_PROVIDER.NOMINATIM
    await provider.search({ query: 'Prag' })

    expect(mapSwitches).toHaveBeenCalledTimes(2)
    expect(searchPlaces).toHaveBeenCalledTimes(1)
    expect(oldSearch).toHaveBeenCalledTimes(1)
  })

  // The contract with leaflet-geosearch itself, so the real control and not a stub says what a
  // click hands over. Two places the GMS labels the same, as it answered "Paris" near
  // Künzelsau on 13.09.2026: France first, Texas further down.
  describe('in the real search control', () => {
    const PARIS_FRANCE = { lat: 48.8534951, lng: 2.3483915, label: 'Paris', raw: { kind: 4 } }
    const PARIS_TEXAS = { lat: 33.6617962, lng: -95.555513, label: 'Paris', raw: { kind: 4 } }
    let container
    let map

    // The provider answers through a few awaits; a couple of turns of the microtask queue let
    // it arrive without running any timer.
    const settle = async () => {
      for (let turn = 0; turn < 20; turn++) await Promise.resolve()
    }

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      container = document.createElement('div')
      document.body.appendChild(container)
      map = L.map(container, { center: [49.28, 9.69], zoom: 8 })
    })

    afterEach(() => {
      map.remove()
      container.remove()
      vi.useRealTimers()
    })

    it('shows the place that was clicked, also when another suggestion carries the same label', async () => {
      position.geoProvider = GEO_PROVIDER.GMS
      vi.mocked(searchPlaces).mockResolvedValue([PARIS_FRANCE, PARIS_TEXAS])
      const shown = []
      map.on('geosearch/showlocation', (event) => shown.push(event.location))
      map.addControl(
        new GeoSearchControl({
          provider: make(),
          style: 'button',
          showMarker: false,
          showPopup: false,
        }),
      )
      const input = container.querySelector('input')

      input.value = 'Paris'
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }))
      vi.advanceTimersByTime(250)
      await settle()
      const rows = container.querySelectorAll('[data-key]')
      expect(Array.from(rows).map((row) => row.textContent)).toEqual(['Paris', 'Paris'])

      rows[1].click()
      await settle()

      expect(shown.map((place) => [place.y, place.x])).toEqual([[33.6617962, -95.555513]])
    })
  })
})
