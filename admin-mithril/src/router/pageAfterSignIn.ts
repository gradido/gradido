// AI-GENERATED — not an architecture reference

/**
 * The page a sign-in goes on to: the one the wallet names (`redirect`) when it leads back here,
 * where it is a page of this admin (`knownPaths`); null otherwise, and the sign-in goes to the
 * start. Never an address of another site (to a browser `//host` and `/\host` are one), never the
 * sign-in or the sign-out, and never a page the admin does not know -- the catch-all would answer
 * it with "not found".
 */
export const pageAfterSignIn = (redirect: unknown, knownPaths: string[]): string | null => {
  if (typeof redirect !== 'string' || !/^\/(?![/\\])/.test(redirect) || /[\\\s]/.test(redirect)) {
    return null
  }
  // the path without query and hash; a trailing slash names the same page, as in vue-router
  const path = redirect.replace(/[?#].*$/, '').replace(/(.)\/$/, '$1')
  return knownPaths.includes(path) && !['/authenticate', '/logout'].includes(path) ? redirect : null
}
