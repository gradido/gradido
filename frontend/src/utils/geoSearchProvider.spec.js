// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchPlaces } from '@/utils/geoSearch'
import { GeoIndexProvider, makeGeoProvider } from './geoSearchProvider'

vi.mock('@/utils/geoSearch', () => ({ searchPlaces: vi.fn() }))

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
  beforeEach(() => {
    vi.mocked(searchPlaces).mockReset()
    vi.mocked(searchPlaces).mockResolvedValue([PLACE])
  })

  // The list makes its provider in setup, before the wallet has learnt the GMS address.
  it('searches the GMS, asking for its address only when a search goes out', async () => {
    const gmsBase = vi.fn(async () => BASE)
    const provider = makeGeoProvider({ gmsBase, viewpoint: () => null, language: () => 'de' })
    expect(gmsBase).not.toHaveBeenCalled()

    const results = await provider.search({ query: 'Pfarrweg 2' })

    expect(gmsBase).toHaveBeenCalledTimes(1)
    expect(searchPlaces).toHaveBeenCalledWith(BASE, 'Pfarrweg 2', { near: null, language: 'de' })
    expect(results).toEqual([PLACE])
  })
})
