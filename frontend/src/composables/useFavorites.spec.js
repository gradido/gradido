// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ensureFavorites,
  favoritesLoaded,
  forgetFavorites,
  isFavorite,
  markFavorite,
  rememberFavorites,
} from './useFavorites'

vi.mock('@/graphql/contacts.graphql', () => ({ favoriteListQuery: 'favoriteListQuery' }))

const CARLA = { communityUuid: 'home', gradidoID: 'carla' }
const SARAH = { communityUuid: 'provence', gradidoID: 'sarah' }

// A request whose answer the test releases by hand.
const pending = () => {
  let release
  const promise = new Promise((resolve) => {
    release = resolve
  })
  return { query: vi.fn(() => promise), release }
}

describe('useFavorites', () => {
  beforeEach(() => {
    forgetFavorites()
  })

  it('starts empty and not loaded', () => {
    expect(favoritesLoaded()).toBe(false)
    expect(isFavorite(CARLA)).toBe(false)
  })

  it('remembers what the server answered, by the uuid pair', () => {
    rememberFavorites([CARLA])
    expect(favoritesLoaded()).toBe(true)
    expect(isFavorite(CARLA)).toBe(true)
    expect(isFavorite(SARAH)).toBe(false)
    // The same id in another community is another person.
    expect(isFavorite({ communityUuid: 'provence', gradidoID: 'carla' })).toBe(false)
  })

  it('answers false for nobody', () => {
    rememberFavorites([CARLA])
    expect(isFavorite(null)).toBe(false)
    expect(isFavorite({})).toBe(false)
  })

  it('marks and unmarks at once', () => {
    markFavorite(SARAH, true)
    expect(isFavorite(SARAH)).toBe(true)
    markFavorite(SARAH, false)
    expect(isFavorite(SARAH)).toBe(false)
  })

  it('takes a heart away that the server had stored', () => {
    rememberFavorites([CARLA, SARAH])
    markFavorite(CARLA, false)
    expect(isFavorite(CARLA)).toBe(false)
    expect(isFavorite(SARAH)).toBe(true)
  })

  it('forgets everything on logout', () => {
    rememberFavorites([CARLA, SARAH])
    forgetFavorites()
    expect(favoritesLoaded()).toBe(false)
    expect(isFavorite(CARLA)).toBe(false)
  })

  describe('ensureFavorites', () => {
    it('loads from the server, bypassing the cache', async () => {
      const query = vi.fn().mockResolvedValue({ data: { favoriteList: [SARAH] } })
      await ensureFavorites({ query })
      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'favoriteListQuery', fetchPolicy: 'network-only' }),
      )
      expect(isFavorite(SARAH)).toBe(true)
      expect(favoritesLoaded()).toBe(true)
    })

    // A heart tapped before the list arrived is on this device already; a failed load must
    // not take it away again.
    it('leaves what is already here when the server cannot be reached', async () => {
      markFavorite(CARLA, true)
      const query = vi.fn().mockRejectedValue(new Error('offline'))
      await ensureFavorites({ query })
      expect(isFavorite(CARLA)).toBe(true)
      expect(favoritesLoaded()).toBe(false)
    })

    // ⛔ A logout while the request is out: the previous member's hearts must not land in
    // the next member's session, whatever Apollo does with the in-flight query.
    it('drops an answer that arrives after a logout', async () => {
      const { query, release } = pending()
      const load = ensureFavorites({ query })
      forgetFavorites()
      release({ data: { favoriteList: [CARLA] } })
      await load
      expect(isFavorite(CARLA)).toBe(false)
      expect(favoritesLoaded()).toBe(false)
    })

    // The old request settles into the new session; its handle must not clear the new
    // one's, or the next screen starts a second request for the same list.
    it("does not release the next session's request when the old one settles", async () => {
      const first = pending()
      const stale = ensureFavorites({ query: first.query })
      forgetFavorites()
      const second = pending()
      ensureFavorites({ query: second.query })
      first.release({ data: { favoriteList: [CARLA] } })
      await stale
      // The second request is still out; a third caller has to join it, not start its own.
      ensureFavorites({ query: second.query })
      expect(second.query).toHaveBeenCalledTimes(1)
      second.release({ data: { favoriteList: [SARAH] } })
    })

    it('asks once, however many screens ask at the same time', async () => {
      const { query, release } = pending()
      const first = ensureFavorites({ query })
      const second = ensureFavorites({ query })
      expect(query).toHaveBeenCalledTimes(1)
      release({ data: { favoriteList: [CARLA] } })
      await Promise.all([first, second])
      expect(isFavorite(CARLA)).toBe(true)
    })

    it('does nothing once the hearts are here', async () => {
      rememberFavorites([CARLA])
      const query = vi.fn()
      await ensureFavorites({ query })
      expect(query).not.toHaveBeenCalled()
    })

    // The retry the layout's single request at mount never had: a failed first attempt
    // leaves `loaded` false, and the next screen that shows hearts asks again.
    it('asks again after a failed attempt', async () => {
      const query = vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce({ data: { favoriteList: [SARAH] } })
      await ensureFavorites({ query })
      expect(favoritesLoaded()).toBe(false)
      await ensureFavorites({ query })
      expect(query).toHaveBeenCalledTimes(2)
      expect(isFavorite(SARAH)).toBe(true)
    })
  })
})
