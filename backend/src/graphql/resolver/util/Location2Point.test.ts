// AI-GENERATED — not an architecture reference

import { Location } from '@model/Location'
import { Point } from 'typeorm'

import { Location2Point, Point2Location } from './Location2Point'

/**
 * The root of the "empty position" fault of 09.09.2026.
 *
 * An account that had never set a position reached the find map, drew its own marker at
 * (undefined, undefined) and asked the GMS about it -- which answered 400, and the wallet
 * turned that into "the search is not reachable". Nothing on that road was wrong except
 * the first step: Point2Location handed out an EMPTY Location instead of null, and `{}`
 * is truthy, so every "does this member have a position?" downstream read yes.
 *
 * Both directions are covered here, because the pair is what makes the empty point in the
 * first place: Location2Point writes `coordinates: []` when a coordinate is missing OR
 * zero, and Point2Location has to read that back as "no position", not as a position.
 */
describe('Location2Point / Point2Location', () => {
  const point = (coordinates: number[]): Point => ({ type: 'Point', coordinates })

  describe('Point2Location', () => {
    it('gives the two coordinates back, longitude first as the column stores them', () => {
      expect(Point2Location(point([9.495606, 51.314472]))).toEqual({
        longitude: 9.495606,
        latitude: 51.314472,
      })
    })

    it('says null for a point without coordinates -- the account that never set one', () => {
      expect(Point2Location(point([]))).toBeNull()
    })

    it('says null for no point at all', () => {
      expect(Point2Location(null)).toBeNull()
      expect(Point2Location(undefined)).toBeNull()
    })

    it('says null for half a pair, so no reader can take undefined for a coordinate', () => {
      expect(Point2Location(point([9.495606]))).toBeNull()
    })

    it('says null for coordinates that are not numbers', () => {
      expect(
        Point2Location({ type: 'Point', coordinates: [null, null] } as unknown as Point),
      ).toBeNull()
      expect(
        Point2Location({ type: 'Point', coordinates: ['9.5', '51.3'] } as unknown as Point),
      ).toBeNull()
    })

    it('says null for something that is not a Point', () => {
      expect(
        Point2Location({ type: 'LineString', coordinates: [1, 2] } as unknown as Point),
      ).toBeNull()
    })

    // 0/0 IS a place on the globe, and it is the one the broken map kept showing. It can
    // never be stored, though: Location2Point below drops it, so it can only ever arrive
    // here from outside the wallet -- and then it is two numbers like any other.
    it('gives back 0/0 when the column really holds it', () => {
      expect(Point2Location(point([0, 0]))).toEqual({ longitude: 0, latitude: 0 })
    })
  })

  describe('Location2Point', () => {
    it('writes the pair', () => {
      expect(Location2Point({ longitude: 9.495606, latitude: 51.314472 })).toEqual(
        point([9.495606, 51.314472]),
      )
    })

    // ⛔ This is where the empty point used to come from. `if (longitude && latitude)`
    // stood here, so zero -- a coordinate like any other, and the prime meridian runs
    // through the UK, France, Spain, Algeria and Ghana -- was stored as "no coordinates".
    // The member was told the save had worked and then found they had no position.
    it('keeps a zero coordinate, which is a place like any other', () => {
      expect(Location2Point({ longitude: 0, latitude: 51.314472 })).toEqual(point([0, 51.314472]))
      expect(Location2Point({ longitude: 9.495606, latitude: 0 })).toEqual(point([9.495606, 0]))
    })

    it('round-trips 0/0 back out as 0/0', () => {
      expect(Point2Location(Location2Point({ longitude: 0, latitude: 0 }))).toEqual({
        longitude: 0,
        latitude: 0,
      })
    })

    // What "unset" looks like in this column: an absent or unusable pair still writes the
    // empty point, and Point2Location reads that back as no position.
    it('still writes the empty point for a pair that is not two numbers', () => {
      expect(Location2Point({} as unknown as Location)).toEqual(point([]))
      expect(Location2Point({ longitude: NaN, latitude: 51.3 } as Location)).toEqual(point([]))
      expect(Location2Point({ longitude: '9.5', latitude: '51.3' } as unknown as Location)).toEqual(
        point([]),
      )
      expect(Point2Location(Location2Point({} as unknown as Location))).toBeNull()
    })
  })
})
