// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CONFIG from '@/config'
import { GEO_PROVIDER } from '@/composables/useMapSwitches'
import { archiveFor } from '@/utils/mapTiles'
import { placeNameAt } from '@/utils/placeName'
import { NOMINATIM_REVERSE_URL, reverseName } from './reverseGeocode'

vi.mock('@/utils/placeName', () => ({ placeNameAt: vi.fn() }))

// The fields of a reverse answer the old lookup reads - nothing more is asserted about it.
const ANSWER = { name: '', address: { road: 'Marktplatz', town: 'Künzelsau', state: 'BW' } }

describe('reverseName', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn(async () => ({ ok: true, json: async () => ANSWER }))
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(placeNameAt).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('in the new position', () => {
    it('names the point from the tile file of the map, in the wallet language, and asks nobody else', async () => {
      vi.mocked(placeNameAt).mockResolvedValue({ place: 'Pfedelbach', context: 'Öhringen' })

      expect(await reverseName(GEO_PROVIDER.GMS, 49.1792, 9.5031, 'de')).toBe(
        'Pfedelbach, Öhringen',
      )
      expect(placeNameAt).toHaveBeenCalledWith(
        archiveFor(CONFIG.MAP_TILES_URL),
        49.1792,
        9.5031,
        'de',
      )
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('names a place with no bigger one near by itself', async () => {
      vi.mocked(placeNameAt).mockResolvedValue({ place: 'Künzelsau', context: null })

      expect(await reverseName(GEO_PROVIDER.GMS, 49.2804, 9.6902, 'de')).toBe('Künzelsau')
    })

    it('has no name where the tiles have none', async () => {
      vi.mocked(placeNameAt).mockResolvedValue(null)

      expect(await reverseName(GEO_PROVIDER.GMS, 40, -40, 'de')).toBe('')
    })

    it('keeps the file open between lookups', async () => {
      vi.mocked(placeNameAt).mockResolvedValue({ place: 'Gaisbach', context: 'Künzelsau' })

      await reverseName(GEO_PROVIDER.GMS, 49.2574, 9.6862, 'de')
      await reverseName(GEO_PROVIDER.GMS, 49.2574, 9.6862, 'de')

      const [first, second] = vi.mocked(placeNameAt).mock.calls.map(([archive]) => archive)
      expect(second).toBe(first)
    })

    it('has no name when the file cannot be read', async () => {
      vi.mocked(placeNameAt).mockRejectedValueOnce(new TypeError('Failed to fetch'))

      expect(await reverseName(GEO_PROVIDER.GMS, 49.2574, 9.6862, 'de')).toBe('')
    })

    it('waits fifteen seconds for the tiles, and then has no name', async () => {
      vi.useFakeTimers()
      vi.mocked(placeNameAt).mockImplementationOnce(() => new Promise(() => {}))
      let settled = false
      const pending = reverseName(GEO_PROVIDER.GMS, 49.2574, 9.6862, 'de').then((name) => {
        settled = true
        return name
      })

      // Fifteen seconds, written out: the list shows "the chosen point" meanwhile.
      await vi.advanceTimersByTimeAsync(14999)
      expect(settled).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      expect(await pending).toBe('')
    })
  })

  describe('in the old position', () => {
    it('asks the old reverse lookup, for the point, in the wallet language', async () => {
      const name = await reverseName(GEO_PROVIDER.NOMINATIM, 49.2745, 9.6907, 'de')

      expect(name).toBe('Marktplatz, Künzelsau')
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(
        `${NOMINATIM_REVERSE_URL}?format=jsonv2&zoom=16&lat=49.2745&lon=9.6907&accept-language=de`,
      )
      expect(init).toEqual({ headers: { Accept: 'application/json' } })
      expect(placeNameAt).not.toHaveBeenCalled()
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
})
