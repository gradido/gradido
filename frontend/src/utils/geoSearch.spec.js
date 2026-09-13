// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GEO_SEARCH_LIMIT, labelOf, searchPlaces } from './geoSearch'

// What `GET /gms/geo/search` answers, copied from ki-playground-gms on 13.09.2026 - not
// invented. The shape is `GeoAddress` in gms_workspace, frontend/src/types/GeoAddress.ts.
const PFARRWEG = {
  name: 'Pfarrweg',
  number: '2',
  postcode: '74653',
  city: 'Künzelsau',
  lat: 49.2816472,
  lon: 9.7405781,
  kind: 5,
  importance: 3499,
  matched: 2,
}
const KUENZELSAU = {
  name: 'Künzelsau',
  number: null,
  postcode: '74653',
  city: 'Künzelsau',
  lat: 49.2803765,
  lon: 9.6901512,
  kind: 4,
  importance: 31122,
  matched: 1,
}
const PRAG = {
  name: 'Prag',
  number: null,
  postcode: null,
  city: 'Prag',
  lat: 50.0874654,
  lon: 14.4212535,
  kind: 4,
  importance: 52999,
  matched: 1,
}
const ALTSTADT = {
  name: 'Altstadt',
  number: null,
  postcode: '116 65',
  city: 'Prag',
  lat: 50.0842845,
  lon: 14.4178391,
  kind: 8,
  importance: 35369,
  matched: 1,
}

const BASE = 'https://ki-playground-gms.gradido.net/gms/'

describe('labelOf', () => {
  it('puts street and number first, then postcode and town', () => {
    expect(labelOf(PFARRWEG)).toBe('Pfarrweg 2, 74653 Künzelsau')
  })

  // The GMS dashboard's own label says "Prag, Prag".
  it('names a town once, although it answers with its name twice', () => {
    expect(labelOf(PRAG)).toBe('Prag')
    expect(labelOf(KUENZELSAU)).toBe('74653 Künzelsau')
  })

  it('keeps a district in front of its town', () => {
    expect(labelOf(ALTSTADT)).toBe('Altstadt, 116 65 Prag')
  })

  it('keeps a name that repeats the town once a house number makes it a street', () => {
    expect(labelOf({ name: 'Prag', number: '5', postcode: null, city: 'Prag' })).toBe(
      'Prag 5, Prag',
    )
  })

  it('leaves out what is not there', () => {
    expect(labelOf({ name: null, number: null, postcode: '74653', city: null })).toBe('74653')
  })
})

describe('searchPlaces', () => {
  let fetchMock

  const answer = (body) => async () => ({ json: async () => body })
  const sent = () => new URL(fetchMock.mock.calls[0][0])

  beforeEach(() => {
    fetchMock = vi.fn(answer([PFARRWEG]))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('asks the GMS for the typed words as a beginning, and answers places', async () => {
    const places = await searchPlaces(BASE, 'Pfarrweg 2')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(`${sent().origin}${sent().pathname}`).toBe(`${BASE}geo/search`)
    expect(Object.fromEntries(sent().searchParams)).toEqual({
      query: 'Pfarrweg 2',
      limit: String(GEO_SEARCH_LIMIT),
      prefix: 'true',
    })
    expect(places).toEqual([
      { lat: 49.2816472, lng: 9.7405781, label: 'Pfarrweg 2, 74653 Künzelsau', raw: PFARRWEG },
    ])
  })

  // The route is open, and it stays a search for a place: nothing about the member goes
  // along with it.
  it('sends no credentials', async () => {
    await searchPlaces(BASE, 'Pfarrweg 2')

    const init = fetchMock.mock.calls[0][1]
    expect(init?.headers?.Authorization).toBeUndefined()
    expect(init?.credentials).toBeUndefined()
  })

  it('sends where the map looks and the language, when there are such', async () => {
    await searchPlaces(BASE, 'Pfarrweg 2', { near: { lat: 49.28, lng: 9.69 }, language: 'de' })

    expect(sent().searchParams.get('latitude')).toBe('49.28')
    expect(sent().searchParams.get('longitude')).toBe('9.69')
    expect(sent().searchParams.get('language')).toBe('de')
  })

  // Leaflet does not wrap the centre of a map panned once around the world, and the GMS
  // refuses such a longitude with 400 (measured 13.09.2026).
  it('brings the longitude of a map panned around the world back into range', async () => {
    await searchPlaces(BASE, 'Pfarrweg 2', { near: { lat: 49.28, lng: 369.69 } })

    expect(Number(sent().searchParams.get('longitude'))).toBeCloseTo(9.69, 9)
  })

  it('leaves out a place without a coordinate', async () => {
    fetchMock.mockImplementation(answer([{ ...ALTSTADT, lat: null, lon: null }, PRAG]))

    const places = await searchPlaces(BASE, 'Prag')

    expect(places.map((place) => place.label)).toEqual(['Prag'])
  })

  it('answers an empty list where the GMS answers no list of places', async () => {
    // 503 without an index, in plain text: reading it as JSON fails.
    fetchMock.mockImplementationOnce(async () => ({
      json: async () => {
        throw new SyntaxError('Unexpected token g')
      },
    }))
    expect(await searchPlaces(BASE, 'Prag')).toEqual([])

    // 400 for a refused question: an error object.
    fetchMock.mockImplementationOnce(answer({ error: { message: 'query is required' } }))
    expect(await searchPlaces(BASE, 'Prag')).toEqual([])

    // Nothing at all.
    fetchMock.mockImplementationOnce(async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(await searchPlaces(BASE, 'Prag')).toEqual([])
  })

  it('asks nothing without an address to ask or without words', async () => {
    expect(await searchPlaces(null, 'Prag')).toEqual([])
    expect(await searchPlaces(BASE, '   ')).toEqual([])

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
