import { Location } from '@model/Location'
import { Point } from 'typeorm'

export function Location2Point(location: Location): Point {
  let pointStr: string
  // Number.isFinite, not truthiness: zero is a coordinate like any other, and the
  // prime meridian runs through the UK, France, Spain, Algeria and Ghana. Until
  // 09.09.2026 a member there saved their pin, was told it had worked, and had it
  // written away as a point with no coordinates -- which Point2Location then reads
  // back, correctly, as no position at all. An absent or unusable pair still writes
  // the empty point; that is what "unset" looks like in this column today.
  if (Number.isFinite(location?.longitude) && Number.isFinite(location?.latitude)) {
    pointStr = '{ "type": "Point", "coordinates": ['
      .concat(location.longitude?.toString())
      .concat(', ')
      .concat(location.latitude?.toString())
      .concat('] }')
  } else {
    pointStr = '{ "type": "Point", "coordinates": [] }'
  }
  const point = JSON.parse(pointStr) as Point
  return point
}

/**
 * A point becomes a location only if it carries two usable coordinates.
 *
 * `null` where it does not -- and that is the whole point of this function, not a
 * detail of it. Location2Point above writes `coordinates: []` whenever longitude or
 * latitude is missing OR zero, so "a point exists" and "a place is known" are two
 * different questions, and only the second one can be answered here. Returning an
 * empty Location for the first was the bug of 09.09.2026: `{}` is truthy, so every
 * caller that asked "does this member have a position?" got yes, drew a marker at
 * (undefined, undefined) and asked the GMS about it.
 */
export function Point2Location(point: Point | null | undefined): Location | null {
  if (point?.type !== 'Point' || point.coordinates?.length !== 2) {
    return null
  }
  const [longitude, latitude] = point.coordinates
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null
  }
  const location = new Location()
  location.longitude = longitude
  location.latitude = latitude
  return location
}
