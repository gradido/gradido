// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { hasPosition, isPlace, mayFind } from './matchingPosition'

/**
 * The one question the fault of 09.09.2026 turned on: is this a position?
 *
 * Every one of these cases was answered "yes" somewhere in the wallet that day, because
 * every one of them is truthy. The empty object is the one that actually happened -- the
 * backend's answer for an account that had never set a position -- and it is still in the
 * persisted store of every device that signed in before the fix, which is why these stay
 * measured rather than argued.
 */
describe('matchingPosition', () => {
  describe('hasPosition', () => {
    it('is yes for two numbers', () => {
      expect(hasPosition({ latitude: 51.314472, longitude: 9.495606 })).toBe(true)
    })

    it('is yes for 0/0 -- a place on the globe like any other', () => {
      expect(hasPosition({ latitude: 0, longitude: 0 })).toBe(true)
    })

    it('is no for the empty object, the answer that started all this', () => {
      expect(hasPosition({})).toBe(false)
    })

    it('is no for nothing at all', () => {
      expect(hasPosition(null)).toBe(false)
      expect(hasPosition(undefined)).toBe(false)
    })

    it('is no for half a pair', () => {
      expect(hasPosition({ latitude: 51.3 })).toBe(false)
      expect(hasPosition({ longitude: 9.5 })).toBe(false)
    })

    it('is no for numbers that came as text', () => {
      expect(hasPosition({ latitude: '51.3', longitude: '9.5' })).toBe(false)
    })

    it('is no for NaN, which passes every truthy check there is', () => {
      expect(hasPosition({ latitude: NaN, longitude: NaN })).toBe(false)
    })
  })

  describe('isPlace', () => {
    it('reads the map’s own shape', () => {
      expect(isPlace({ lat: 51.314472, lng: 9.495606 })).toBe(true)
      expect(isPlace({})).toBe(false)
      expect(isPlace(null)).toBe(false)
      expect(isPlace({ lat: 51.3, lng: undefined })).toBe(false)
    })

    // The two shapes are not interchangeable, and saying so here is what stops one of
    // them being handed to the other predicate by mistake.
    it('does not accept the backend’s shape', () => {
      expect(isPlace({ latitude: 51.3, longitude: 9.5 })).toBe(false)
    })
  })

  describe('mayFind', () => {
    const place = { latitude: 51.314472, longitude: 9.495606 }

    it('needs both answers', () => {
      expect(mayFind({ gmsAllowed: true, userLocation: place })).toBe(true)
    })

    it('is no without findability, however good the position', () => {
      expect(mayFind({ gmsAllowed: false, userLocation: place })).toBe(false)
      expect(mayFind({ gmsAllowed: null, userLocation: place })).toBe(false)
    })

    it('is no without a position, however willing the member', () => {
      expect(mayFind({ gmsAllowed: true, userLocation: null })).toBe(false)
      expect(mayFind({ gmsAllowed: true, userLocation: {} })).toBe(false)
    })

    it('is no for a store that has not been filled yet', () => {
      expect(mayFind({})).toBe(false)
      expect(mayFind(undefined)).toBe(false)
    })
  })
})
