// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { isUsableLocation, locationSchema } from './location.schema'

describe('isUsableLocation', () => {
  const at = (latitude: number, longitude: number) => ({ latitude, longitude })

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

  // What the backend hands over: an instance of its GraphQL model, not a plain object.
  it('is yes for an instance of a class that carries the pair', () => {
    class Model {
      latitude = 49.28
      longitude = 9.69
    }
    expect(isUsableLocation(new Model())).toBe(true)
  })

  it('is no for nothing at all', () => {
    expect(isUsableLocation(null)).toBe(false)
    expect(isUsableLocation(undefined)).toBe(false)
  })

  it('is no for the empty object', () => {
    expect(isUsableLocation({})).toBe(false)
  })

  it('is no for half a pair', () => {
    expect(isUsableLocation({ latitude: 49.28 })).toBe(false)
    expect(isUsableLocation({ longitude: 9.69 })).toBe(false)
  })

  it('is no for coordinates that came as text', () => {
    expect(isUsableLocation({ latitude: '49.28', longitude: '9.69' })).toBe(false)
    expect(isUsableLocation({ latitude: '', longitude: '' })).toBe(false)
  })

  it('is no for NaN, which passes every truthy check there is', () => {
    expect(isUsableLocation(at(NaN, NaN))).toBe(false)
  })

  it('is no for a number without an end', () => {
    expect(isUsableLocation(at(Infinity, 9.69))).toBe(false)
    expect(isUsableLocation(at(49.28, -Infinity))).toBe(false)
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

describe('locationSchema', () => {
  it('names the coordinate it refuses', () => {
    const data = v.safeParse(locationSchema, { latitude: 91, longitude: 9.69 })

    expect(data.success).toBe(false)
    expect(data.issues && v.getDotPath(data.issues[0])).toBe('latitude')
  })
})
