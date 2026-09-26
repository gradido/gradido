import { Geometry } from 'geojson'
import { LocationPointInput, locationPointSchema } from '../schema'

// return true if a and b are both a location point and both contain the same coordinates or if both are null and/or undefined
export function isLocationPointsEqual(
  a: LocationPointInput | undefined | null | Geometry,
  b: LocationPointInput | undefined | null | Geometry,
): boolean {
  if (!a && !b) {
    return true
  }
  const locationAResult = locationPointSchema.safeParse(a)
  const locationBResult = locationPointSchema.safeParse(b)
  if (!locationAResult.success || !locationBResult.success) {
    return false
  }
  const coordsA = locationAResult.data.coordinates
  const coordsB = locationBResult.data.coordinates
  return coordsA[0] === coordsB[0] && coordsA[1] === coordsB[1]
}
