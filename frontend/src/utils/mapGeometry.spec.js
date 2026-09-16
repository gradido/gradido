// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { boundsOfRadius, latLngOf, ringPoints } from './mapGeometry'

const KUENZELSAU = { lat: 49.2816, lng: 9.7406 }

/** Great-circle distance in metres, the sphere the backend measures on. */
const metresBetween = (a, b) => {
  const R = 6371008.8
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

describe('latLngOf', () => {
  it('takes the seam form and hands back the two numbers', () => {
    expect(latLngOf({ lat: 1.5, lng: 2.5 })).toEqual({ lat: 1.5, lng: 2.5 })
  })

  it('reads a pair as latitude first, the way every map library hands one out', () => {
    expect(latLngOf([1.5, 2.5])).toEqual({ lat: 1.5, lng: 2.5 })
  })

  it('keeps nothing else of what it was given', () => {
    expect(latLngOf({ lat: 1, lng: 2, label: 'Prag' })).toEqual({ lat: 1, lng: 2 })
  })
})

describe('ringPoints', () => {
  it('closes: the last point is the first one again', () => {
    const ring = ringPoints(KUENZELSAU, 25000)

    expect(ring).toHaveLength(97)
    expect(ring.at(-1)[0]).toBeCloseTo(ring[0][0], 9)
    expect(ring.at(-1)[1]).toBeCloseTo(ring[0][1], 9)
  })

  // The backend measures with ST_DistanceSphere, so the circle drawn has to be the
  // circle searched - a box of degrees would drift, imperceptibly at 25 km and visibly
  // at the radius used to look across a continent.
  it('lies real metres from the centre, north, east and everywhere between', () => {
    const ring = ringPoints(KUENZELSAU, 25000)

    for (const [lat, lng] of ring) {
      expect(metresBetween(KUENZELSAU, { lat, lng })).toBeCloseTo(25000, 0)
    }
  })

  it('holds at 2000 km, where a box of degrees would be visibly wrong', () => {
    const ring = ringPoints(KUENZELSAU, 2000000)

    for (const [lat, lng] of ring) {
      expect(metresBetween(KUENZELSAU, { lat, lng })).toBeCloseTo(2000000, 0)
    }
  })
})

describe('boundsOfRadius', () => {
  // Within a thousandth of the radius, and knowingly so: the box counts degrees of the
  // equator, as Leaflet's own `toBounds` does, while the ring walks the mean sphere. That
  // is 28 m on a 25 km circle - under one pixel until the map is closer than a street, and
  // the same as before the seam, because the same arithmetic drew the frame then too.
  it('holds the circle: as far north, south, east and west as the radius', () => {
    const { south, west, north, east } = boundsOfRadius(KUENZELSAU, 25000)

    expect(metresBetween(KUENZELSAU, { lat: north, lng: KUENZELSAU.lng })).toBeCloseTo(25000, -2)
    expect(metresBetween(KUENZELSAU, { lat: south, lng: KUENZELSAU.lng })).toBeCloseTo(25000, -2)
    expect(metresBetween(KUENZELSAU, { lat: KUENZELSAU.lat, lng: east })).toBeCloseTo(25000, -2)
    expect(metresBetween(KUENZELSAU, { lat: KUENZELSAU.lat, lng: west })).toBeCloseTo(25000, -2)
  })

  // Degrees of longitude shrink towards the poles, so the same circle needs a wider box
  // the further north it is. Without that the view would cut the circle off east and west.
  it('takes more degrees of longitude the further north the circle sits', () => {
    const near = boundsOfRadius({ lat: 0, lng: 0 }, 25000)
    const far = boundsOfRadius({ lat: 60, lng: 0 }, 25000)

    expect(far.east - far.west).toBeGreaterThan(near.east - near.west)
    expect(far.north - far.south).toBeCloseTo(near.north - near.south, 9)
  })
})
