// AI-GENERATED — not an architecture reference

/** The longest address taken. A page of the wallet with its query fits many times over. */
export const SAFE_WALLET_PATH_MAX = 512

// Everything up to the space, and DEL: nothing of it belongs into an address unescaped.
const isSpaceOrControl = (char) => char.charCodeAt(0) <= 0x20 || char.charCodeAt(0) === 0x7f

/**
 * An address inside this wallet, as it came -- or null for anything else.
 *
 * For an address that arrives from outside and says where to go on: the `redirect` of the
 * hand-over `/authenticate?token=…&redirect=…` (routes/guards.js), which the admin interface
 * sets when it opens a page of the wallet in a window of its own. Such a value is whatever
 * somebody put into a link, so it is taken only where it can name nothing but a page here:
 *
 * - a string, and not longer than {@link SAFE_WALLET_PATH_MAX};
 * - beginning with exactly one `/`. An address with a protocol (`https:`, `javascript:`)
 *   does not begin with a slash, and `//host` is how a browser spells another host;
 * - without a backslash, which browsers read as a slash, so that `/\host` is `//host` again;
 * - without a space or a control character: a browser drops tabs and line breaks from an
 *   address before reading it, which makes `/<tab>/host` the same thing once more.
 *
 * The query and the hash stay as they are: they are what such an address is for.
 */
export function safeWalletPath(value) {
  if (typeof value !== 'string' || value.length > SAFE_WALLET_PATH_MAX) return null
  if (value[0] !== '/' || value[1] === '/') return null
  if (value.includes('\\')) return null
  if ([...value].some(isSpaceOrControl)) return null
  return value
}
