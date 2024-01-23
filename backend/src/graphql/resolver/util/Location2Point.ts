import { Point } from '@dbTools/typeorm'

import { Location } from '@model/Location'

export function Location2Point(location: Location): Point {
  console.log('in Location2Point:', location)
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
  console.log('pointStr:', pointStr)
  const point = JSON.parse(pointStr) as Point
  console.log('point:', point)
  return point
}

export function Point2Location(point: Point): Location {
  console.log('in Point2Location:', point)
  const location = new Location()
  if (point.type === 'Point' && point.coordinates.length === 2) {
    location.longitude = point.coordinates[0]
    location.latitude = point.coordinates[1]
  }
  console.log('location:', location)
  return location
}
