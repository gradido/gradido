// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GEO_PROVIDER } from '@/composables/useMapSwitches'
import { NOMINATIM_REVERSE_URL, reverseName } from './reverseGeocode'

// The fields of a reverse answer the old lookup reads - nothing more is asserted about it.
const ANSWER = { name: '', address: { road: 'Marktplatz', town: 'Künzelsau', state: 'BW' } }

describe('reverseName', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn(async () => ({ ok: true, json: async () => ANSWER }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('asks nobody in the new position, and has no name', async () => {
    expect(await reverseName(GEO_PROVIDER.GMS, 49.2745, 9.6907, 'de')).toBe('')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('asks the old reverse lookup in the old position, for the point, in the wallet language', async () => {
    const name = await reverseName(GEO_PROVIDER.NOMINATIM, 49.2745, 9.6907, 'de')

    expect(name).toBe('Marktplatz, Künzelsau')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(
      `${NOMINATIM_REVERSE_URL}?format=jsonv2&zoom=16&lat=49.2745&lon=9.6907&accept-language=de`,
    )
    expect(init).toEqual({ headers: { Accept: 'application/json' } })
  })

  it('has no name when the lookup is refused or does not come back', async () => {
    fetchMock.mockImplementationOnce(async () => ({ ok: false, json: async () => ANSWER }))
    expect(await reverseName(GEO_PROVIDER.NOMINATIM, 49.2745, 9.6907, 'de')).toBe('')

    fetchMock.mockImplementationOnce(async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(await reverseName(GEO_PROVIDER.NOMINATIM, 49.2745, 9.6907, 'de')).toBe('')
  })
})
