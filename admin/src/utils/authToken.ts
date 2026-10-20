// AI-GENERATED — not an architecture reference

/**
 * The session token, kept in one place for both apps: localStorage['auth-token'].
 *
 * Where the wallet and the admin interface share one origin (every deployment: the admin
 * interface lives under `/admin`), they share one localStorage, and so the one token: going from
 * one to the other hands nothing over and signs nobody out -- the app arriving finds the token
 * there already. A renewal in one app is the renewal of both, and a logout in one is the logout
 * of both. Where they do not share one (development: two vite servers on two ports), each has
 * a token of its own: going over, the token goes in the address, and the app left signs out, as
 * it always did.
 *
 * Kept with the time this device received it (`at`): the wallet counts the end of a session
 * from there by its own clock (store.ts), also for a token another app received.
 *
 * ⛔ An app that shares the origin of the other takes a token ONLY from here, never out of the
 * address -- so on a deployment a link with `?token=` signs nobody in.
 *
 * The two apps share no code: this file is written down in both (frontend/src/utils/authToken.js),
 * and the key is held by a test in each.
 */
export const AUTH_TOKEN_KEY = 'auth-token'

/** What is kept: the token and when this device received it (ms since the epoch). */
export type KeptToken = { token: string; at: number }

/** What followAuthToken needs of a store. */
type TokenStore = {
  token: string | null
  logout: () => unknown
  setToken: (token: string) => unknown
}

/** The token kept, as `{ token, at }`, or null where none is kept. */
export const readAuthToken = (win: Window = window): KeptToken | null => {
  try {
    const kept = JSON.parse(win.localStorage.getItem(AUTH_TOKEN_KEY) as string)
    return typeof kept?.token === 'string' && kept.token !== '' && Number.isFinite(kept.at)
      ? kept
      : null
  } catch {
    // Private mode, or something that is no JSON.
    return null
  }
}

/**
 * Keeps `token`, or removes the one kept where `token` is none.
 *
 * The token kept already is not written again: its `at` stays the time it was received, and an
 * app that takes it over from the other (onAuthTokenChange) does not answer with a write of its
 * own, which the other would answer again, and so on.
 */
export const keepAuthToken = (
  token: string | null | undefined,
  win: Window = window,
  now: number = Date.now(),
) => {
  try {
    if (!token) {
      win.localStorage.removeItem(AUTH_TOKEN_KEY)
    } else if (readAuthToken(win)?.token !== token) {
      win.localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify({ token, at: now }))
    }
  } catch {
    // Private mode or a full storage: the session lives in this app's memory only.
  }
}

/**
 * Calls `handle` with the token kept (`{ token, at }`, or null) whenever another window of this
 * origin changes it: renews it, or signs out. A window's own writes do not call it -- the
 * browser tells only the other windows.
 */
export const onAuthTokenChange = (
  handle: (kept: KeptToken | null) => void,
  win: Window = window,
) => {
  win.addEventListener('storage', (event) => {
    // `key` null: the other window cleared all of localStorage.
    if (event.key === AUTH_TOKEN_KEY || event.key === null) {
      handle(readAuthToken(win))
    }
  })
}

/**
 * Whom `token` names: its `sub`, the member's gradidoID, lowercased -- read, not verified (the
 * server verifies every request). null where it names nobody.
 */
export const tokenSubject = (token: string | null | undefined): string | null => {
  try {
    const payload = (token as string).split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { sub } = JSON.parse(atob(payload))
    return typeof sub === 'string' && sub !== '' ? sub.toLowerCase() : null
  } catch {
    return null
  }
}

/** Whether `token` names the member of `gradidoID`. */
export const tokenBelongsTo = (
  token: string | null | undefined,
  gradidoID: string | null | undefined,
) => {
  const subject = tokenSubject(token)
  return subject !== null && typeof gradidoID === 'string' && subject === gradidoID.toLowerCase()
}

/**
 * Follows the token kept as another window of this origin changes it (onAuthTokenChange):
 *
 * - a renewal -- a token of the member this window is signed in as -- is taken over;
 * - a logout there is a logout here;
 * - a token of anybody else -- somebody signed in there -- reloads this window. What it holds
 *   in memory belongs to the member before: the store's profile, the Apollo cache, drafts,
 *   pictures. A reload lets all of it go and opens on the session there, without signing out:
 *   that would remove the token just kept (`logout` removes it, keepAuthToken).
 *
 * A window signed in as nobody -- the admin on not-found, its stored moderator not the member
 * of the token -- reloads only where somebody new signs in, not on every renewal there: the
 * other app renews with every answer, and the window would reload with every click. So it
 * remembers whom the kept token named last, from the start on, and before it reloads.
 */
export const followAuthToken = (store: TokenStore, win: Window = window) => {
  let lastSubject = tokenSubject(readAuthToken(win)?.token)
  onAuthTokenChange((kept) => {
    if (!kept) {
      lastSubject = null
      if (store.token) {
        store.logout()
      }
      return
    }
    const subject = tokenSubject(kept.token)
    if (tokenBelongsTo(store.token, subject)) {
      store.setToken(kept.token)
    } else if (store.token || subject !== lastSubject) {
      lastSubject = subject
      win.location.reload()
    }
  }, win)
}

/** Whether `url` lies on the origin `win` is opened on. */
export const sharesOrigin = (url: unknown, win: Window = window) => {
  if (typeof url !== 'string' || url === '') {
    return false
  }
  try {
    return new URL(url, win.location.href).origin === win.location.origin
  } catch {
    return false
  }
}

/**
 * The address to go to for the other app, given its `authUrl` (ending in `?token=`): as it is
 * where the other app shares this origin, and so the token; with the token in the address
 * otherwise.
 */
export const handOverAddress = (
  authUrl: string,
  token: string | null | undefined,
  win: Window = window,
) => (sharesOrigin(authUrl, win) ? authUrl : authUrl + encodeURIComponent(token ?? ''))

/**
 * The token to sign in with on `/authenticate`, or null: the one kept where the other app
 * (`otherAppUrl`) shares this origin, the one in the address (`tokenInAddress`) where it does
 * not.
 */
export const takeHandedOverToken = (
  tokenInAddress: unknown,
  otherAppUrl: unknown,
  win: Window = window,
): string | null => {
  if (sharesOrigin(otherAppUrl, win)) {
    return readAuthToken(win)?.token ?? null
  }
  return typeof tokenInAddress === 'string' && tokenInAddress !== '' ? tokenInAddress : null
}
