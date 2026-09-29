// AI-GENERATED — not an architecture reference

import { createCipheriv, createDecipheriv, createHmac } from 'node:crypto'
import { z } from 'zod'
import { CONFIG } from '@/config'
import { CodeType } from './CodeType.enum'

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
 * Shape: `<exp>.<block>`. `exp` is the expiry in Unix seconds, in clear, because the wallet reads
 * it to decide whether the form offers a password. `block` is one AES-256 block, base64url
 * without padding (22 characters), sealing 16 bytes:
 *
 *   bytes 0-7   the member's user id, uint64
 *   byte  8     the code type (CodeType.PRESENCE)
 *   bytes 9-15  the lower 7 bytes of `exp`
 *
 * Self-contained: the code alone names the member who showed it, so no alias has to travel
 * with it and match it, and a rename during the validity changes nothing. The user id never
 * shows outside, because the block is encrypted.
 *
 * The type and the 7 bytes of `exp` inside the block are its check: a forged or altered block
 * decrypts to noise, and noise matches those 8 bytes with a chance of 2^-64 - plenty for a code
 * that lives minutes and can only be tried against this server. The byte `exp` loses there is its most
 * significant one; the bounds check in verifyPresenceCode rules out every value that would
 * need it. The key is derived per community, so a code from another community is worthless.
 */

/** A constant, not a setting (E-020). Bernd: "sicher nicht länger als 10 Minuten". */
export const PRESENCE_CODE_VALID_MINUTES = 10

/**
 * How many unconfirmed table-code accounts one member may vouch for at a time (E-019): the
 * same for everybody, with no time window. A place frees up when a guest confirms, or when
 * support deletes a dead guest account - never on its own. Counted when a code is minted, and
 * again by `createUser`, which takes the code: right before it opens an account, one
 * registration after another per member (`inMemberLine`).
 *
 * Set by E-022 to the size of the group one member looks after without first sorting out who
 * can reach their mailbox - the picture is a cafe full of newcomers. Counted per member, not
 * per cafe: two members at one table can vouch for twice as many between them.
 */
export const PRESENCE_MAX_UNCONFIRMED = 10

const PRESENCE_CODE_SHAPE = /^(\d+)\.([A-Za-z0-9_-]{22})$/

/** A little room for clocks that differ between the server that minted and the one checking. */
const CLOCK_SKEW_SECONDS = 60

const LOWER_56_BITS = (1n << 56n) - 1n

/**
 * Derived from the session secret, so there is no new environment key: every new key needs a
 * Joi entry and a line in each server's own .env. The label gives the code a key of its own,
 * so the session secret itself never seals one; the community uuid gives every community its
 * own key.
 */
const presenceKey = (communityUuid: string): Buffer =>
  createHmac('sha256', CONFIG.JWT_SECRET).update(`presence-code|${communityUuid}`).digest()

// Exactly one block, so ECB without padding is a single application of the block cipher.
const sealBlock = (block: Buffer, communityUuid: string): Buffer => {
  const cipher = createCipheriv('aes-256-ecb', presenceKey(communityUuid), null)
  cipher.setAutoPadding(false)
  return Buffer.concat([cipher.update(block), cipher.final()])
}

const openBlock = (block: Buffer, communityUuid: string): Buffer => {
  const decipher = createDecipheriv('aes-256-ecb', presenceKey(communityUuid), null)
  decipher.setAutoPadding(false)
  return Buffer.concat([decipher.update(block), decipher.final()])
}

/**
 * A fresh code for the member with this user id. A new one on every call, because the expiry
 * is part of it; two calls inside the same second give the same code, which is harmless.
 *
 * `remainingMs` is what is left of the validity at `now`. A device counts it down from the
 * moment the answer arrives, so its own clock never has to agree with this server's: a phone
 * that runs ten minutes fast would otherwise take every fresh code for an expired one.
 */
export const mintPresenceCode = (
  userId: number,
  communityUuid: string,
  now: Date = new Date(),
): { code: string; expiresAt: Date; remainingMs: number } => {
  if (!Number.isSafeInteger(userId) || userId <= 0 || !communityUuid) {
    throw new Error('mintPresenceCode needs a user id and a community uuid')
  }
  const exp = Math.floor(now.getTime() / 1000) + PRESENCE_CODE_VALID_MINUTES * 60
  const block = Buffer.alloc(16)
  block.writeBigUInt64BE(BigInt(userId), 0)
  // The type takes the place of the most significant byte of `exp`.
  block.writeBigUInt64BE((BigInt(CodeType.PRESENCE) << 56n) | (BigInt(exp) & LOWER_56_BITS), 8)
  return {
    code: `${exp}.${sealBlock(block, communityUuid).toString('base64url')}`,
    expiresAt: new Date(exp * 1000),
    remainingMs: exp * 1000 - now.getTime(),
  }
}

/**
 * The user id of the member who showed this code - or null for anything else: a malformed
 * code, one from another community, an expired, altered or forged one, or one whose expiry
 * lies further ahead than a code is ever valid.
 *
 * Both parts are taken only in the spelling this server writes: `exp` without leading zeros,
 * the block as its canonical base64url (22 characters hold 132 bits for 128, so the last
 * character has more than one spelling of the same bytes).
 */
export const verifyPresenceCode = (
  code: string,
  communityUuid: string,
  now: Date = new Date(),
): number | null => {
  const match = PRESENCE_CODE_SHAPE.exec(code)
  if (!match) {
    return null
  }
  const [, expText, blockText] = match
  const exp = BigInt(expText)
  const sealed = Buffer.from(blockText, 'base64url')
  if (exp.toString() !== expText || sealed.toString('base64url') !== blockText) {
    return null
  }
  // Lower bound: not run out. Upper bound: never further ahead than a fresh code - which also
  // rules out every `exp` whose most significant byte the block does not carry.
  const nowSeconds = BigInt(Math.floor(now.getTime() / 1000))
  const latest = nowSeconds + BigInt(PRESENCE_CODE_VALID_MINUTES * 60 + CLOCK_SKEW_SECONDS)
  if (exp * 1000n <= BigInt(now.getTime()) || exp > latest) {
    return null
  }
  const block = openBlock(sealed, communityUuid)
  const tail = block.readBigUInt64BE(8)
  if (
    tail >> 56n !== BigInt(CodeType.PRESENCE) ||
    (tail & LOWER_56_BITS) !== (exp & LOWER_56_BITS)
  ) {
    return null
  }
  const userId = block.readBigUInt64BE(0)
  if (userId === 0n || userId > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null
  }
  return Number(userId)
}

// TODO: replace with valibot schema after update to typescript 5 is possible
export const presenceCodeSchema = z.string().regex(PRESENCE_CODE_SHAPE)
