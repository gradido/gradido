// AI-GENERATED — not an architecture reference

/**
 * The geometry the map seam needs, free of any map library.
 *
 * It lives apart from the engines because both of them need the same numbers: a circle
 * of real metres has to be the same circle whoever draws it, and a view that frames it
 * has to frame the same box.
 */

/** Mean Earth radius in metres, as WGS 84 gives it. */
const EARTH_RADIUS_M = 6371008.8

/** The equator in metres - what a degree of longitude is worth there. */
const EARTH_CIRCUMFERENCE_M = 40075017

/**
 * A point of the seam, in one form: `{ lat, lng }`.
 *
 * A two-number array is read as `[lat, lng]` as well, because that is the pair every
 * map library hands out and takes, and a caller holding one should not have to name its
 * halves to pass it on.
 */
export function latLngOf(point) {
  if (Array.isArray(point)) return { lat: point[0], lng: point[1] }
  return { lat: point.lat, lng: point.lng }
}

/**
 * A ring of real metres around a point.
 *
 * The backend measures with ST_DistanceSphere, so the circle the member sees has
 * to walk the same sphere. A box of degrees would drift from it — imperceptibly
 * at 25 km, visibly at the radius you use to look across a continent.
 */
export function ringPoints(centre, metres, steps = 96) {
  const R = EARTH_RADIUS_M
  const d = metres / R
  const lat1 = (centre.lat * Math.PI) / 180
  const lng1 = (centre.lng * Math.PI) / 180
  const points = []
  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 2 * Math.PI
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing),
    )
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      )
    points.push([(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI])
  }
  return points
}

/**
 * The square box that just holds a circle of `metres` around `centre`.
 *
 * This is the box a view is fitted to, so that the whole circle is on the screen
 * whatever its radius. It is the same arithmetic Leaflet's `LatLng.toBounds(2 * metres)`
 * does — deliberately, so that both engines frame identically; `leaflet.spec.js` holds
 * the two against each other.
 */
export function boundsOfRadius(centre, metres) {
  const { lat, lng } = latLngOf(centre)
  // The box is as wide as the circle, so it reaches the radius in each direction: the
  // 180 degrees of half a turn are worth half the equator, and it is a whole diameter
  // that has to fit between the two sides.
  const latSpan = (180 * 2 * metres) / EARTH_CIRCUMFERENCE_M
  const lngSpan = latSpan / Math.cos((Math.PI / 180) * lat)
  return { south: lat - latSpan, west: lng - lngSpan, north: lat + latSpan, east: lng + lngSpan }
}
