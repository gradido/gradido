// AI-GENERATED — not an architecture reference

import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { CONFIG } from '@/config'

/**
 * The table code (E-017): the card a member shows live on "show it to your friends" carries
 * a signed expiry in its link, and whoever scans it in time may choose a password in the
 * registration form. The account is usable at once, unconfirmed, with the grace period and
 * the blockade after it (EM-013).
 *
 * Stateless on purpose - expiry instead of use (E-017 point 3). Nothing is stored; the server
 * checks the seal and the clock. Two guests inside the same ten minutes both get through, and
 * "one code per guest" is the member's button, not a counter.
 *
 * Shape: `<exp>.<sig>`. `exp` is the expiry in Unix seconds, `sig` an HMAC-SHA256 over
 * `alias|communityUuid|exp`, base64url without padding. The seal binds the code to the member
 * who showed it AND to this community: a code cannot be moved to somebody else's name, and a
 * code from another community is worthless here.
 */

/** A constant, not a setting (E-020). Bernd: "sicher nicht länger als 10 Minuten". */
export const PRESENCE_CODE_VALID_MINUTES = 10

/**
 * How many unconfirmed table-code accounts one member may vouch for at a time (E-019): the
 * same for everybody, with no time window. A place frees up when a guest confirms, or when
 * support deletes a dead guest account - never on its own. Counted when a code is minted, and
 * again by `createUser`, which takes the code: right before it opens an account, one
 * registration after another per member (`inMemberLine`).
 */
export const PRESENCE_MAX_UNCONFIRMED = 5

const PRESENCE_CODE_SHAPE = /^(\d+)\.([A-Za-z0-9_-]+)$/

/**
 * Derived from the session secret, so there is no new environment key: every new key needs a
 * Joi entry and a line in each server's own .env. The label gives the seal a key of its own,
 * so the session secret itself never signs a presence code.
 */
const presenceKey = (): Buffer =>
  createHmac('sha256', CONFIG.JWT_SECRET).update('presence-code').digest()

const seal = (alias: string, communityUuid: string, exp: string): string =>
  createHmac('sha256', presenceKey()).update(`${alias}|${communityUuid}|${exp}`).digest('base64url')

/**
 * A fresh code for the member with this alias. A new one on every call, because the expiry is
 * part of it; two calls inside the same second give the same code, which is harmless.
 *
 * `remainingMs` is what is left of the validity at `now`. A device counts it down from the
 * moment the answer arrives, so its own clock never has to agree with this server's: a phone
 * that runs ten minutes fast would otherwise take every fresh code for an expired one.
 */
export const mintPresenceCode = (
  alias: string,
  communityUuid: string,
  now: Date = new Date(),
): { code: string; expiresAt: Date; remainingMs: number } => {
  if (!alias || !communityUuid) {
    throw new Error('mintPresenceCode needs an alias and a community uuid')
  }
  const exp = Math.floor(now.getTime() / 1000) + PRESENCE_CODE_VALID_MINUTES * 60
  return {
    code: `${exp}.${seal(alias, communityUuid, String(exp))}`,
    expiresAt: new Date(exp * 1000),
    remainingMs: exp * 1000 - now.getTime(),
  }
}

/**
 * Whether the code was minted here for this alias and has not run out yet. Anything else - a
 * malformed code, a foreign alias, another community, an expired or altered one - is false.
 *
 * The seal covers the expiry exactly as written, so a code keeps only the spelling it was
 * minted with. The seals are compared as the strings they are, in constant time: a base64url
 * string of 43 characters has more than one spelling of the same bytes, and the string
 * comparison accepts only the one this server writes.
 */
export const verifyPresenceCode = (
  code: string,
  alias: string,
  communityUuid: string,
  now: Date = new Date(),
): boolean => {
  const match = PRESENCE_CODE_SHAPE.exec(code)
  if (!match) {
    return false
  }
  const [, exp, given] = match
  if (Number(exp) * 1000 <= now.getTime()) {
    return false
  }
  const expected = Buffer.from(seal(alias, communityUuid, exp))
  const actual = Buffer.from(given)
  // timingSafeEqual throws on buffers of different length.
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export const presenceCodeSchema = z.string().regex(PRESENCE_CODE_SHAPE)
