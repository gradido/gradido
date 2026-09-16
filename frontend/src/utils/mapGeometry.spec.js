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
  const holdsRing = (box, centre, metres) =>
    ringPoints(centre, metres).every(
      ([lat, lng]) => lat >= box.south && lat <= box.north && lng >= box.west && lng <= box.east,
    )

  // The view is fitted to this box, and the circle drawn is this ring - so every point of
  // it has to be inside, or the view cuts the circle off.
  it('holds every point of the ring that is drawn', () => {
    const metres = 2000000

    expect(holdsRing(boundsOfRadius(KUENZELSAU, metres), KUENZELSAU, metres)).toBe(true)
  })

  it('reaches exactly the radius north and south, on the sphere the ring walks', () => {
    const { south, north } = boundsOfRadius(KUENZELSAU, 25000)

    expect(metresBetween(KUENZELSAU, { lat: north, lng: KUENZELSAU.lng })).toBeCloseTo(25000, 0)
    expect(metresBetween(KUENZELSAU, { lat: south, lng: KUENZELSAU.lng })).toBeCloseTo(25000, 0)
  })

  // F-11, measured on 16.09.2026: how far east (and west) the drawn ring reaches, in degrees
  // of longitude from its centre. The box of degrees stopped short of it - 0.1 % at 25 km,
  // 0.2 % at 500 km, 2.5 % at 2,000 km, 5.8 % at 2,000 km on the 60th parallel.
  it.each([
    [25, KUENZELSAU.lat, 0.345],
    [500, KUENZELSAU.lat, 6.9],
    [2000, KUENZELSAU.lat, 28.252],
    [2000, 60, 38.138],
  ])('reaches as far east and west as the ring of %i km at latitude %f', (km, lat, degrees) => {
    const centre = { lat, lng: KUENZELSAU.lng }
    const { west, east } = boundsOfRadius(centre, km * 1000)

    expect(east - centre.lng).toBeCloseTo(degrees, 3)
    expect(centre.lng - west).toBeCloseTo(degrees, 3)
  })

  // The ring's longitudes run on past 180, so the box does too: one box across the date
  // line, not two halves at either end of the world.
  it('keeps a circle across the date line in one box', () => {
    const fiji = { lat: -17.7, lng: 178.1 }
    const box = boundsOfRadius(fiji, 1500000)

    expect(box.west).toBeLessThan(180)
    expect(box.east).toBeGreaterThan(180)
    expect(holdsRing(box, fiji, 1500000)).toBe(true)
  })

  // A circle round a pole contains every longitude near it, and the ring's far side comes
  // back south of the pole - its corners would frame a band without the pole side.
  it('frames a circle round a pole from its edge up to the pole, at every longitude', () => {
    const { south, west, north, east } = boundsOfRadius(KUENZELSAU, 5000000)

    expect(north).toBe(90)
    expect(south).toBeCloseTo(KUENZELSAU.lat - (5000000 / 6371008.8) * (180 / Math.PI), 9)
    expect(east - west).toBeCloseTo(360, 9)
  })

  it('frames the whole world for a circle round both poles', () => {
    expect(boundsOfRadius(KUENZELSAU, 20000000)).toEqual({
      south: -90,
      west: KUENZELSAU.lng - 180,
      north: 90,
      east: KUENZELSAU.lng + 180,
    })
  })

  // The distance search reaches 20,000 km. A ring wider than a hemisphere closes round the
  // far side of the earth, so a box from its corners would leave out the member's own place.
  it.each([25, 500, 2000, 4500, 5000, 10000, 15000, 20000])(
    'keeps the centre inside the frame at %i km',
    (km) => {
      const { south, west, north, east } = boundsOfRadius(KUENZELSAU, km * 1000)

      expect(KUENZELSAU.lat).toBeGreaterThanOrEqual(south)
      expect(KUENZELSAU.lat).toBeLessThanOrEqual(north)
      expect(KUENZELSAU.lng).toBeGreaterThanOrEqual(west)
      expect(KUENZELSAU.lng).toBeLessThanOrEqual(east)
    },
  )

  // Degrees of longitude shrink towards the poles, so the same circle needs a wider box
  // the further north it is. Without that the view would cut the circle off east and west.
  it('takes more degrees of longitude the further north the circle sits', () => {
    const near = boundsOfRadius({ lat: 0, lng: 0 }, 25000)
    const far = boundsOfRadius({ lat: 60, lng: 0 }, 25000)

    expect(far.east - far.west).toBeGreaterThan(near.east - near.west)
    expect(far.north - far.south).toBeCloseTo(near.north - near.south, 9)
  })
})
