// AI-GENERATED — not an architecture reference
import {
  APPROXIMATE_MAX_METERS,
  APPROXIMATE_MIN_METERS,
  approximatePoint,
  GeoPoint,
} from './approximatePoint'

const KEY = 'a key only this server knows'
const BIBI = '3a2f6f1e-6c1a-4e1a-9d3e-2f1b7c8d9e01'
const BENJAMIN = '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f'
const HOME: GeoPoint = { latitude: 49.28, longitude: 9.69 }
// Another town, sixty kilometres on.
const NEW_HOME: GeoPoint = { latitude: 49.79, longitude: 9.93 }

const EARTH_RADIUS_METERS = 6_371_000
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

// The distance on the sphere, by another formula than the one that moves the point.
function metersBetween(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLng = toRadians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

// The way from a home to its point: metres to the north and to the east.
function wayFrom(home: GeoPoint, point: GeoPoint): { north: number; east: number } {
  return {
    north: toRadians(point.latitude - home.latitude) * EARTH_RADIUS_METERS,
    east:
      toRadians(point.longitude - home.longitude) *
      EARTH_RADIUS_METERS *
      Math.cos(toRadians(home.latitude)),
  }
}

// Which of the eight directions a way points in: 0 = north, 2 = east, ...
function directionOf(way: { north: number; east: number }): number {
  const degrees = (Math.atan2(way.east, way.north) * 180) / Math.PI
  return Math.round((degrees + 360) / 45) % 8
}

const members = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`)

// Half a metre for the arithmetic: the point is computed and measured in two ways.
const SLACK = 0.5

describe('approximatePoint', () => {
  it('is the same point every time, for one member at one home', () => {
    const first = approximatePoint(HOME, BIBI, KEY)

    expect(approximatePoint(HOME, BIBI, KEY)).toEqual(first)
    expect(approximatePoint({ ...HOME }, BIBI, KEY)).toEqual(first)
  })

  // The point itself is part of the promise: a release that computed it another way would move
  // every such member on the map at their next update. Changed on purpose only. The two numbers
  // were worked out a second time outside this code (HMAC-SHA256, then 470.5 m on a bearing of
  // 56.6 degrees), not copied from what the function returned.
  it('is the point it has been since it was introduced', () => {
    const point = approximatePoint(HOME, BIBI, KEY)

    expect(point.latitude).toBeCloseTo(49.2823299074, 9)
    expect(point.longitude).toBeCloseTo(9.6954140275, 9)
    expect(metersBetween(HOME, point)).toBeCloseTo(470.478, 2)
  })

  it('lies between the two circles: never on the doorstep, never out of the neighbourhood', () => {
    const homes: GeoPoint[] = [HOME, NEW_HOME]
    for (let latitude = -80; latitude <= 80; latitude += 20) {
      for (let longitude = -170; longitude <= 170; longitude += 34) {
        homes.push({ latitude: latitude + 0.123, longitude: longitude + 0.456 })
      }
    }
    let nearest = Infinity
    let farthest = 0
    for (const home of homes) {
      for (const member of members(40)) {
        const meters = metersBetween(home, approximatePoint(home, member, KEY))
        nearest = Math.min(nearest, meters)
        farthest = Math.max(farthest, meters)
      }
    }

    expect(nearest).toBeGreaterThanOrEqual(APPROXIMATE_MIN_METERS - SLACK)
    expect(farthest).toBeLessThanOrEqual(APPROXIMATE_MAX_METERS + SLACK)
  })

  // What a watcher of many members at one address must not find: a favoured direction, or a
  // favoured distance.
  it('spreads over the whole ring: every direction, near and far, evenly over its area', () => {
    const ways = members(800).map((member) => wayFrom(HOME, approximatePoint(HOME, member, KEY)))
    const meters = ways.map((way) => Math.hypot(way.north, way.east))

    expect(new Set(ways.map(directionOf)).size).toBe(8)
    expect(Math.min(...meters)).toBeLessThan(APPROXIMATE_MIN_METERS + 30)
    expect(Math.max(...meters)).toBeGreaterThan(APPROXIMATE_MAX_METERS - 30)
    // The circle that halves the ring's area: about half of the points lie inside it.
    const halving = Math.sqrt((APPROXIMATE_MIN_METERS ** 2 + APPROXIMATE_MAX_METERS ** 2) / 2)
    const inside = meters.filter((m) => m < halving).length / meters.length
    expect(inside).toBeGreaterThan(0.44)
    expect(inside).toBeLessThan(0.56)
  })

  // How far says nothing about which way: in every direction there are points near and far.
  // Were the two tied to each other, the points would lie on one curve around the home, and a
  // point on a known curve gives its home away.
  it('goes near and far in every direction', () => {
    const ways = members(800).map((member) => wayFrom(HOME, approximatePoint(HOME, member, KEY)))
    const halving = Math.sqrt((APPROXIMATE_MIN_METERS ** 2 + APPROXIMATE_MAX_METERS ** 2) / 2)

    for (let direction = 0; direction < 8; direction++) {
      const meters = ways
        .filter((way) => directionOf(way) === direction)
        .map((way) => Math.hypot(way.north, way.east))
      expect(meters.filter((m) => m < halving).length).toBeGreaterThan(10)
      expect(meters.filter((m) => m >= halving).length).toBeGreaterThan(10)
    }
  })

  it('gives two members under one roof two points', () => {
    const one = approximatePoint(HOME, BIBI, KEY)
    const other = approximatePoint(HOME, BENJAMIN, KEY)

    expect(metersBetween(one, other)).toBeGreaterThan(10)
  })

  // Not the same way walked from another door: somebody who knew the old home and its point
  // could otherwise read the new home off the new point.
  it('takes one member another way from another home', () => {
    const before = wayFrom(HOME, approximatePoint(HOME, BIBI, KEY))
    const after = wayFrom(NEW_HOME, approximatePoint(NEW_HOME, BIBI, KEY))

    expect(Math.hypot(after.north - before.north, after.east - before.east)).toBeGreaterThan(10)
  })

  it('cannot be computed without the key: another key, another point', () => {
    const one = approximatePoint(HOME, BIBI, KEY)
    const other = approximatePoint(HOME, BIBI, 'another key')

    expect(metersBetween(one, other)).toBeGreaterThan(10)
  })

  it.each([
    ['next to the date line, east of it', { latitude: 10, longitude: 179.9995 }],
    ['next to the date line, west of it', { latitude: -17.5, longitude: -179.9995 }],
    ['a few hundred metres from the north pole', { latitude: 89.998, longitude: 20 }],
    ['a few hundred metres from the south pole', { latitude: -89.998, longitude: -70 }],
    ['where the equator meets the prime meridian', { latitude: 0, longitude: 0 }],
  ])('stays a place on the globe %s', (_where, home) => {
    for (const member of members(60)) {
      const point = approximatePoint(home, member, KEY)

      expect(Math.abs(point.latitude)).toBeLessThanOrEqual(90)
      expect(point.longitude).toBeGreaterThanOrEqual(-180)
      expect(point.longitude).toBeLessThanOrEqual(180)
      const meters = metersBetween(home, point)
      expect(meters).toBeGreaterThanOrEqual(APPROXIMATE_MIN_METERS - SLACK)
      expect(meters).toBeLessThanOrEqual(APPROXIMATE_MAX_METERS + SLACK)
    }
  })

  // A caller's mistake, loud: without either, anybody could walk the way back.
  it('refuses to work without a key, and without a member', () => {
    expect(() => approximatePoint(HOME, BIBI, '')).toThrow('no key')
    expect(() => approximatePoint(HOME, '', KEY)).toThrow('no member')
  })
})
