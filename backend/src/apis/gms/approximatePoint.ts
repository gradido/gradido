// AI-GENERATED — not an architecture reference
import { createHmac } from 'node:crypto'

/**
 * Where a member who lets themselves be found "approximately" is sent to the GMS: their home,
 * moved by a few hundred metres. The wallet tells them so -- "in the surroundings, never on the
 * doorstep" (Bernd, 10.10.2026).
 *
 * Moved on this server, before anything is sent: what is not handed on cannot be shown, kept
 * or logged anywhere else.
 *
 * The same point every time, for one member at one home. A point that moved with every update
 * would let somebody who watches it find its middle; one that stays tells no more on the
 * hundredth look than on the first. A member who sets another home gets another point, and two
 * members under one roof get two.
 *
 * Which point is decided by a keyed hash of the member and their home. Without the key the
 * way back from the point to the home cannot be computed, with it it can -- so the point is as
 * well kept as the key is.
 */

/** Never on the doorstep. */
export const APPROXIMATE_MIN_METERS = 150
/** Never out of the neighbourhood: the reach the GMS has always moved such a point by. */
export const APPROXIMATE_MAX_METERS = 500

// The sphere the wallet and the GMS measure distances on.
const EARTH_RADIUS_METERS = 6_371_000

/** Says what the hash is for, so that the key is not used for two things in one way. */
const PURPOSE = 'gms-approximate-point'

/**
 * The home counts to seven decimals of a degree, about a centimetre. A number may come back from
 * the database with other last digits than it went in with, and those must not decide the point:
 * the member is sent from memory when they save, and from the database on every later update.
 */
const HOME_DECIMALS = 7

export interface GeoPoint {
  latitude: number
  longitude: number
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180
const toDegrees = (radians: number): number => (radians * 180) / Math.PI

// No "-0.0000000" for a home a hair west of Greenwich or south of the equator.
const toCentimetre = (degrees: number): string => {
  const text = degrees.toFixed(HOME_DECIMALS)
  return Number(text) === 0 ? (0).toFixed(HOME_DECIMALS) : text
}

/** The point reached from `from` after `meters` on the bearing `bearing` (radians, 0 = north). */
function destination(from: GeoPoint, meters: number, bearing: number): GeoPoint {
  const angle = meters / EARTH_RADIUS_METERS
  const latitude = toRadians(from.latitude)
  const there = Math.asin(
    Math.sin(latitude) * Math.cos(angle) + Math.cos(latitude) * Math.sin(angle) * Math.cos(bearing),
  )
  const turned = Math.atan2(
    Math.sin(bearing) * Math.sin(angle) * Math.cos(latitude),
    Math.cos(angle) - Math.sin(latitude) * Math.sin(there),
  )
  // Back into -180..180: a home next to the date line may be moved across it.
  const longitude = ((((from.longitude + toDegrees(turned) + 180) % 360) + 360) % 360) - 180
  return { latitude: toDegrees(there), longitude }
}

/**
 * The point to send for a member who is not to be found at their home itself.
 *
 * @param home the member's home as it is stored
 * @param memberId what names the member for good (their gradidoID)
 * @param key a secret of this server that nobody outside it knows
 */
export function approximatePoint(home: GeoPoint, memberId: string, key: string): GeoPoint {
  // A caller's mistake, not something that happens at runtime: without a key, or without a
  // member, the point could be computed back by anybody.
  if (!key) {
    throw new Error('approximatePoint: no key')
  }
  if (!memberId) {
    throw new Error('approximatePoint: no member')
  }
  const latitude = toCentimetre(home.latitude)
  const longitude = toCentimetre(home.longitude)
  const digest = createHmac('sha256', key)
    .update(`${PURPOSE}|${memberId}|${latitude}|${longitude}`)
    .digest()
  // Two numbers in 0..1, from the first eight of its thirty-two bytes.
  const share = digest.readUInt32BE(0) / 2 ** 32
  const turn = digest.readUInt32BE(4) / 2 ** 32
  // Spread evenly over the AREA between the two circles, not over the distance between them:
  // even over the distance, the points would crowd towards the home.
  const meters = Math.sqrt(
    APPROXIMATE_MIN_METERS ** 2 +
      share * (APPROXIMATE_MAX_METERS ** 2 - APPROXIMATE_MIN_METERS ** 2),
  )
  // From the home as it was hashed, so that the point is the same to its last digit.
  return destination(
    { latitude: Number(latitude), longitude: Number(longitude) },
    meters,
    turn * 2 * Math.PI,
  )
}
