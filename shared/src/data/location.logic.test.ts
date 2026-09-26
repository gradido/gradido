// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { isLocationPointsEqual } from './location.logic'

const point = (longitude: number, latitude: number) => ({
  type: 'Point' as const,
  coordinates: [longitude, latitude],
})

describe('isLocationPointsEqual', () => {
  it('is true for two points with the same coordinates', () => {
    expect(isLocationPointsEqual(point(13.4, 52.5), point(13.4, 52.5))).toBe(true)
  })

  it('is true for zero coordinates', () => {
    expect(isLocationPointsEqual(point(0, 0), point(0, 0))).toBe(true)
  })

  it('is false if the longitude differs', () => {
    expect(isLocationPointsEqual(point(13.4, 52.5), point(13.5, 52.5))).toBe(false)
  })

  it('is false if the latitude differs', () => {
    expect(isLocationPointsEqual(point(13.4, 52.5), point(13.4, 52.6))).toBe(false)
  })

  it('is false for swapped coordinates', () => {
    expect(isLocationPointsEqual(point(13.4, 52.5), point(52.5, 13.4))).toBe(false)
  })

  it('is true if both are null or undefined', () => {
    expect(isLocationPointsEqual(null, null)).toBe(true)
    expect(isLocationPointsEqual(undefined, undefined)).toBe(true)
    expect(isLocationPointsEqual(null, undefined)).toBe(true)
  })

  it('is false if only one is null or undefined', () => {
    expect(isLocationPointsEqual(point(13.4, 52.5), null)).toBe(false)
    expect(isLocationPointsEqual(undefined, point(13.4, 52.5))).toBe(false)
  })

  it('is false for points without coordinates', () => {
    // what Location2Point writes for "no position"
    const emptyPoint = { type: 'Point' as const, coordinates: [] }
    expect(isLocationPointsEqual(emptyPoint, emptyPoint)).toBe(false)
    expect(isLocationPointsEqual(emptyPoint, null)).toBe(false)
  })

  it('is false for a geometry which is not a point', () => {
    const line = {
      type: 'LineString' as const,
      coordinates: [
        [13.4, 52.5],
        [13.5, 52.6],
      ],
    }
    expect(isLocationPointsEqual(line, line)).toBe(false)
  })
})
