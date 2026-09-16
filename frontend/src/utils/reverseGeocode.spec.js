// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CONFIG from '@/config'
import { archiveFor } from '@/utils/mapTiles'
import { placeNameAt } from '@/utils/placeName'
import { reverseName } from './reverseGeocode'

vi.mock('@/utils/placeName', () => ({ placeNameAt: vi.fn() }))

describe('reverseName', () => {
  // Held out so a test can see that nothing is fetched from anywhere: the name comes from the
  // tile file, which placeNameAt reads, and placeNameAt is replaced here.
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(placeNameAt).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('names the point from the tile file of the map, in the wallet language, and asks nobody else', async () => {
    vi.mocked(placeNameAt).mockResolvedValue({ place: 'Pfedelbach', context: 'Öhringen' })

    expect(await reverseName(49.1792, 9.5031, 'de')).toBe('Pfedelbach, Öhringen')
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

    expect(await reverseName(49.2804, 9.6902, 'de')).toBe('Künzelsau')
  })

  it('has no name where the tiles have none', async () => {
    vi.mocked(placeNameAt).mockResolvedValue(null)

    expect(await reverseName(40, -40, 'de')).toBe('')
  })

  it('keeps the file open between lookups', async () => {
    vi.mocked(placeNameAt).mockResolvedValue({ place: 'Gaisbach', context: 'Künzelsau' })

    await reverseName(49.2574, 9.6862, 'de')
    await reverseName(49.2574, 9.6862, 'de')

    const [first, second] = vi.mocked(placeNameAt).mock.calls.map(([archive]) => archive)
    expect(second).toBe(first)
  })

  it('has no name when the file cannot be read', async () => {
    vi.mocked(placeNameAt).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    expect(await reverseName(49.2574, 9.6862, 'de')).toBe('')
  })

  it('waits fifteen seconds for the tiles, and then has no name', async () => {
    vi.useFakeTimers()
    vi.mocked(placeNameAt).mockImplementationOnce(() => new Promise(() => {}))
    let settled = false
    const pending = reverseName(49.2574, 9.6862, 'de').then((name) => {
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
