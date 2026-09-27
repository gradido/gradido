// AI-GENERATED — not an architecture reference

import { Location } from '@model/Location'

import { findableWithoutPlace, isUsableLocation } from './Location.logic'

/**
 * ⛔ The rule that was missing. `isValidLocation` on the two mutations that take a position
 * asked `Location2Point(value).type === 'Point'` -- always true, because that function
 * writes `"type": "Point"` in both of its branches. So nothing was ever refused, and text
 * was worse than accepted: JSON.parse threw inside the validator and reached the member as
 * a raw 500.
 */
describe('isUsableLocation', () => {
  const at = (latitude: number, longitude: number) => ({ latitude, longitude }) as Location

  it('is yes for a pair of numbers', () => {
    expect(isUsableLocation(at(49.28, 9.69))).toBe(true)
  })

  // Zero is a coordinate like any other: the prime meridian runs through the UK, France,
  // Spain, Algeria and Ghana, the equator through Ecuador, Kenya and Indonesia.
  it.each([
    ['the equator', 0, 9.69],
    ['the prime meridian', 51.5, 0],
    ['where the two meet', 0, 0],
  ])('is yes on %s', (_name, latitude, longitude) => {
    expect(isUsableLocation(at(latitude, longitude))).toBe(true)
  })

  it('is yes at the ends of the globe', () => {
    expect(isUsableLocation(at(90, 180))).toBe(true)
    expect(isUsableLocation(at(-90, -180))).toBe(true)
  })

  it('is no for nothing at all', () => {
    expect(isUsableLocation(null)).toBe(false)
    expect(isUsableLocation(undefined)).toBe(false)
  })

  it('is no for the empty object -- the shape that used to pass', () => {
    expect(isUsableLocation({} as Location)).toBe(false)
  })

  it('is no for half a pair', () => {
    expect(isUsableLocation({ latitude: 49.28 } as Location)).toBe(false)
    expect(isUsableLocation({ longitude: 9.69 } as Location)).toBe(false)
  })

  // The one that made the validator throw rather than refuse: the scalar copies fields
  // through unchecked, so text arrives here as text.
  it('is no for coordinates that came as text', () => {
    expect(isUsableLocation({ latitude: '49.28', longitude: '9.69' } as unknown as Location)).toBe(
      false,
    )
    expect(isUsableLocation({ latitude: '', longitude: '' } as unknown as Location)).toBe(false)
  })

  it('is no for NaN, which passes every truthy check there is', () => {
    expect(isUsableLocation(at(NaN, NaN))).toBe(false)
  })

  // A latitude of 999 is not a place either. It is what a broken client sends, and the map
  // would draw it somewhere absurd.
  it.each([
    ['latitude past the pole', 999, 9.69],
    ['latitude just past the pole', 90.1, 9.69],
    ['longitude past the meridian', 49.28, 180.1],
    ['longitude far past it', 49.28, -999],
  ])('is no for %s', (_name, latitude, longitude) => {
    expect(isUsableLocation(at(latitude, longitude))).toBe(false)
  })
})

/**
 * Findable needs a place (Bernd, 27.09.2026): the Zuhause tab let a new member switch it on
 * and save without one. The GMS cannot hold such a member, and migration 0140 had switched
 * every one of them off; a save must not bring the state back.
 */
describe('findableWithoutPlace', () => {
  const at = (latitude: number, longitude: number) => ({ latitude, longitude }) as Location
  const home = at(49.28, 9.69)

  it('is yes for switching on with no place at all', () => {
    expect(findableWithoutPlace(true, null, undefined)).toBe(true)
    expect(findableWithoutPlace(true, null, null)).toBe(true)
  })

  it('is no with a place stored', () => {
    expect(findableWithoutPlace(true, home, undefined)).toBe(false)
  })

  it('is no with a place sent along in the same save', () => {
    expect(findableWithoutPlace(true, null, home)).toBe(false)
  })

  // A member who is findable without a place, saved before this rule, can still leave.
  it('never asks when switching off or leaving the setting alone', () => {
    expect(findableWithoutPlace(false, null, undefined)).toBe(false)
    expect(findableWithoutPlace(undefined, null, undefined)).toBe(false)
    expect(findableWithoutPlace(null, null, undefined)).toBe(false)
  })

  // Rows written before 10.09.2026 can hold a latitude of 91: finite, and not a place.
  it('counts a stored point that is not a place as none', () => {
    expect(findableWithoutPlace(true, at(91, 9.69), undefined)).toBe(true)
  })
})
