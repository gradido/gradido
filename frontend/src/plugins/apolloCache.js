/**
 * A hand-off so the store can empty the Apollo cache without importing the client.
 *
 * The direction is fixed: `apolloProvider.js` imports the store (its auth link reads and
 * writes the token), so the store must not import `apolloProvider.js` back. This module
 * imports nothing at all, which is what lets both sides reach it.
 *
 * Why it exists: logging out does not reload the page, and nothing ever emptied the
 * cache. `aliasStatus` takes no variables, so it lives under a single key - the next
 * member to sign in read the previous member's answer and was told how many name changes
 * *they* had left. The window at first login stayed away for the same reason.
 */

let clear = null

/** Called once by `apolloProvider.js`, as soon as the client exists. */
export function registerApolloCacheClear(fn) {
  clear = fn
}

/**
 * Empties the cache. `clearStore`, not `resetStore`: resetting refetches every active
 * query, and at the moment of logging out there is no token left to answer them with.
 */
export async function clearApolloCache() {
  if (clear) {
    await clear()
  }
}
