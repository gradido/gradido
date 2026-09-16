// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GEO_PROVIDER } from '@/composables/useMapSwitches'
import { searchPlaces } from '@/utils/geoSearch'
import { GeoIndexProvider, makeGeoProvider } from './geoSearchProvider'

const { oldSearch } = vi.hoisted(() => ({ oldSearch: vi.fn() }))

vi.mock('@/utils/geoSearch', () => ({ searchPlaces: vi.fn() }))

// The old provider replaced by a spy - it would ask Nominatim.
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
    // What the wallet's own search field reads.
    expect(results).toEqual([PLACE])
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
    oldSearch.mockResolvedValue([
      { x: 9.7405781, y: 49.2816472, label: 'old', bounds: null, raw: { from: 'osm' } },
    ])
    mapSwitches.mockClear()
    position.geoProvider = GEO_PROVIDER.NOMINATIM
  })

  it('asks the GMS in the new position, and the old search not at all', async () => {
    position.geoProvider = GEO_PROVIDER.GMS

    const results = await make().search({ query: 'Pfarrweg 2' })

    expect(searchPlaces).toHaveBeenCalledWith(BASE, 'Pfarrweg 2', { near: null, language: 'de' })
    expect(oldSearch).not.toHaveBeenCalled()
    expect(results).toEqual([PLACE])
  })

  // leaflet-geosearch answers in x/y. Turning it here is what lets the field take both
  // positions without knowing which one answered.
  it('asks the old search in the old position, and turns its x and y round', async () => {
    const results = await make().search({ query: 'Pfarrweg 2' })

    expect(oldSearch).toHaveBeenCalledWith({ query: 'Pfarrweg 2' })
    expect(searchPlaces).not.toHaveBeenCalled()
    expect(results).toEqual([
      { lat: 49.2816472, lng: 9.7405781, label: 'old', raw: { from: 'osm' } },
    ])
  })

  it('answers in the same shape whichever service was asked', async () => {
    const provider = make()
    const old = await provider.search({ query: 'Pfarrweg 2' })
    position.geoProvider = GEO_PROVIDER.GMS
    const fresh = await provider.search({ query: 'Pfarrweg 2' })

    const shape = (places) => places.map((place) => Object.keys(place).sort().join(','))
    expect(shape(old)).toEqual(shape(fresh))
    expect(shape(old)).toEqual(['label,lat,lng,raw'])
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
})
