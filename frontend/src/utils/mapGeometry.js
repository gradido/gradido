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
 * The box that just holds a circle of `metres` around `centre`.
 *
 * This is the box a view is fitted to, so that the whole circle is on the screen
 * whatever its radius. It is taken from the ring `ringPoints` gives - the one `setCircle`
 * draws - so the view holds exactly what is drawn. A box of degrees
 * (`latSpan / cos φ`, which is what Leaflet's `LatLng.toBounds` does) is narrower than
 * the round circle and cut it off east and west: 2.5 % of a 2,000 km circle at
 * Künzelsau's latitude (F-11).
 *
 * The longitudes of the ring run on without a jump across the date line (`east` can be
 * beyond 180), so a circle there keeps one box. They jump only where a pole lies inside
 * the circle - the ring then goes round the pole, every longitude is in the circle, and
 * its far side comes back south of the pole. So a pole in the circle gives the box that
 * pole and all longitudes, not the ring's corners: those would frame a band that leaves
 * out the pole side, and for a circle wider than a hemisphere a speck round the far side
 * of the earth.
 */
export function boundsOfRadius(centre, metres) {
  const { lat, lng } = latLngOf(centre)
  // How far the circle reaches along the meridian, in degrees of the same sphere.
  const reach = (metres / EARTH_RADIUS_M) * (180 / Math.PI)
  const northPoleInside = reach >= 90 - lat
  const southPoleInside = reach >= 90 + lat
  if (northPoleInside || southPoleInside) {
    return {
      south: southPoleInside ? -90 : lat - reach,
      west: lng - 180,
      north: northPoleInside ? 90 : lat + reach,
      east: lng + 180,
    }
  }

  const ring = ringPoints({ lat, lng }, metres)
  const lats = ring.map(([pointLat]) => pointLat)
  const lngs = ring.map(([, pointLng]) => pointLng)
  return {
    south: Math.min(...lats),
    west: Math.min(...lngs),
    north: Math.max(...lats),
    east: Math.max(...lngs),
  }
}
