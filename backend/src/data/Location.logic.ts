// AI-GENERATED — not an architecture reference

import { Location } from '@model/Location'

/**
 * What counts as a position, on the way in.
 *
 * ⛔ Until 10.09.2026 nothing did. The validator on the two mutations that take one --
 * `updateUserInfos(gmsLocation:)` and `updateHomeCommunity(location:)` -- asked
 * `Location2Point(value).type === 'Point'`, and that function writes `"type": "Point"` in
 * BOTH of its branches. So it could never be false: `{}`, half a pair, a latitude of 999
 * and plain text all passed, and text was the worst of them -- `JSON.parse` threw inside
 * the validator, so the member got a raw 500 rather than a rejection.
 *
 * The reading side has been honest since 09.09. (`Point2Location` answers null for a point
 * without coordinates). This is the same rule at the other end, so the two cannot drift:
 * what the column may hold is decided once, before anything is written.
 *
 * Numbers, not truthiness: zero is a coordinate like any other -- the prime meridian runs
 * through the UK, France, Spain, Algeria and Ghana, and the equator through Ecuador, Kenya
 * and Indonesia. And the range, because a latitude of 999 is not a place either; it is the
 * kind of value a broken client sends, and the map would draw it somewhere absurd.
 */
export function isUsableLocation(location: Location | null | undefined): boolean {
  if (!location) {
    return false
  }
  const { latitude, longitude } = location
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

/**
 * Whether a save would switch a member findable (`gmsAllowed`) without a place.
 *
 * Findable hands the member to the GMS, and the GMS cannot hold a member it cannot place:
 * `GmsUser` refuses to build one without a location ("Missing Location"), and migration
 * 0140 switched every member without one off for that reason. This is the same rule on the
 * way in, so a save cannot bring that state back: switching findable on needs a place -
 * the one stored, or one sent along in the same save.
 *
 * Only the switch from off to on is asked. Switching off, not sending the setting, or
 * sending it on while it already is, needs no place: a member left findable without one,
 * before this rule, is not made any worse by a save that keeps it, and can still save the
 * rest.
 */
export function findableWithoutPlace(
  gmsAllowed: boolean | null | undefined,
  allowedNow: boolean,
  stored: Location | null,
  sent: Location | null | undefined,
): boolean {
  return gmsAllowed === true && !allowedNow && !isUsableLocation(sent) && !isUsableLocation(stored)
}
