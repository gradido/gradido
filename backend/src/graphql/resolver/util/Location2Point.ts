import { Point } from '@dbTools/typeorm'

import { Location } from '@model/Location'

export function Location2Point(location: Location): Point {
  let pointStr: string
  if (location.longitude && location.latitude) {
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

export function Point2Location(point: Point): Location {
  const location = new Location()
  if (point.type === 'Point' && point.coordinates.length === 2) {
    location.longitude = point.coordinates[0]
    location.latitude = point.coordinates[1]
  }
  return location
}

export function Point2StringArray(point: Point): string[] | null {
  if (point != null && point.type === 'Point' && point.coordinates.length === 2) {
    return [point.coordinates[0].toString(), point.coordinates[1].toString()]
  }
  return null
}
