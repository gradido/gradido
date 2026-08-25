// AI-GENERATED — not an architecture reference

/**
 * The colour index (0-9) of a member's avatar circle, computed on the server.
 *
 * This is a deliberate duplicate. The rule lives in the wallet
 * (frontend/src/utils/avatarColor.js hashes the seed that
 * frontend/src/utils/avatarLettering.js builds from the first characters of the real
 * name), and it has to keep living there because the printed card draws the same colour
 * on a canvas. The backend needs the same rule because the wallet is to stop receiving
 * other members' real names (NU-019) while no existing circle colour may move (AS-010):
 * the server, which still knows the name, sends the finished digit instead (NU-017).
 *
 * The wallet cannot import from the backend and the backend cannot import from the
 * wallet, so the two copies are guarded by a drift test on the wallet side
 * (frontend/src/utils/avatarColorIndex.drift.spec.js), the same way the admin's copy of
 * avatarColor.js is guarded against the wallet's.
 *
 * ⛔ Do not fix or improve the hash, the seed, or the palette size here alone — every
 * change must land in both places at once, and the drift test is what makes forgetting
 * that impossible.
 */

/** Must equal AVATAR_COLOR_PALETTE.length in frontend/src/utils/avatarColor.js. */
const AVATAR_COLOR_PALETTE_SIZE = 10

// Same algorithm as stringToIndex in frontend/src/utils/avatarColor.js, character for
// character: charCodeAt gives UTF-16 code units and << coerces to 32-bit integers in
// TypeScript exactly as it does in the browser, so the two runtimes cannot disagree.
const stringToIndex = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash % AVATAR_COLOR_PALETTE_SIZE)
}

/**
 * The palette index for a member's circle, from the same seed the wallet has always
 * hashed: first character of first and last name, RAW. The case sensitivity is part of
 * the promise — "bh" and "BH" are different colours, and the uppercasing a member sees
 * on screen is CSS, which never reaches the hash (see avatarLettering.js).
 *
 * Exempt from Result on purpose: any input, including null and empty names, produces a
 * valid index — there is no failure to model.
 */
export const avatarColorIndex = (firstName?: string | null, lastName?: string | null): number =>
  stringToIndex(`${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`)
