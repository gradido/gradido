// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  favoriteKey,
  favoritesLoaded,
  forgetFavorites,
  isFavorite,
  loadFavorites,
  markFavorite,
  rememberFavorites,
} from './useFavorites'

vi.mock('@/graphql/contacts.graphql', () => ({ favoriteListQuery: 'favoriteListQuery' }))

const CARLA = { communityUuid: 'home', gradidoID: 'carla' }
const SARAH = { communityUuid: 'provence', gradidoID: 'sarah' }

describe('useFavorites', () => {
  beforeEach(() => {
    forgetFavorites()
  })

  it('starts empty and not loaded', () => {
    expect(favoritesLoaded()).toBe(false)
    expect(isFavorite(CARLA)).toBe(false)
  })

  it('keys by the uuid pair', () => {
    expect(favoriteKey(CARLA)).toBe('home/carla')
    expect(favoriteKey({ gradidoID: 'x' })).toBe('/x')
  })

  it('remembers what the server answered', () => {
    rememberFavorites([CARLA])
    expect(favoritesLoaded()).toBe(true)
    expect(isFavorite(CARLA)).toBe(true)
    expect(isFavorite(SARAH)).toBe(false)
    // The same id in another community is another person.
    expect(isFavorite({ communityUuid: 'provence', gradidoID: 'carla' })).toBe(false)
  })

  it('matches a row without a community by the gradido id alone', () => {
    rememberFavorites([CARLA])
    expect(isFavorite({ communityUuid: null, gradidoID: 'carla' })).toBe(true)
    expect(isFavorite({ gradidoID: 'sarah' })).toBe(false)
  })

  it('answers false for nobody', () => {
    rememberFavorites([CARLA])
    expect(isFavorite(null)).toBe(false)
    expect(isFavorite({})).toBe(false)
  })

  it('marks and unmarks at once, keeping the id fallback consistent', () => {
    markFavorite(SARAH, true)
    expect(isFavorite(SARAH)).toBe(true)
    expect(isFavorite({ gradidoID: 'sarah' })).toBe(true)
    markFavorite(SARAH, false)
    expect(isFavorite(SARAH)).toBe(false)
    expect(isFavorite({ gradidoID: 'sarah' })).toBe(false)
  })

  it('forgets everything on logout', () => {
    rememberFavorites([CARLA, SARAH])
    forgetFavorites()
    expect(favoritesLoaded()).toBe(false)
    expect(isFavorite(CARLA)).toBe(false)
  })

  it('loads from the server, bypassing the cache', async () => {
    const query = vi.fn().mockResolvedValue({ data: { favoriteList: [SARAH] } })
    await loadFavorites({ query })
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'favoriteListQuery', fetchPolicy: 'network-only' }),
    )
    expect(isFavorite(SARAH)).toBe(true)
    expect(favoritesLoaded()).toBe(true)
  })

  it('stays as it was when the server cannot be reached', async () => {
    rememberFavorites([CARLA])
    const query = vi.fn().mockRejectedValue(new Error('offline'))
    await loadFavorites({ query })
    expect(isFavorite(CARLA)).toBe(true)
  })
})
