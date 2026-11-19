// AI-GENERATED — not an architecture reference
import { t } from '@/i18n'

/** A coordinate as the edit holds it: a number, or '' where none is given. */
export type Coordinate = number | ''

/** What a field reads as a coordinate: its number, '' where it holds none. */
export const parseCoordinate = (text: unknown): Coordinate => {
  const number = parseFloat(text as string)
  return Number.isNaN(number) ? '' : number
}

/**
 * The pair as one line, "latitude, longitude"; empty where one of them is missing. Finite, not
 * truthy: a latitude or longitude of 0 is a coordinate like any other.
 */
export const coordinatesLine = (latitude: unknown, longitude: unknown) =>
  Number.isFinite(latitude) && Number.isFinite(longitude)
    ? t('geo-coordinates.format', { latitude: latitude as number, longitude: longitude as number })
    : ''

/** The pair in a line pasted as one ("49.28, 9.74", as Google Maps gives it), null where it is none. */
export const splitCoordinates = (line: string) => {
  const parts = line.split(',').map((part) => part.trim())
  if (parts.length !== 2) {
    return null
  }
  const [latitude, longitude] = parts.map(parseCoordinate)
  return latitude !== '' && longitude !== '' ? { latitude, longitude } : null
}

/** Both or none: one coordinate alone is no place. */
export const coordinatesComplete = (latitude: Coordinate, longitude: Coordinate) =>
  (latitude === '') === (longitude === '')
