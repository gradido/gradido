import { createPinia } from 'pinia'
import { followAuthToken, readAuthToken, tokenBelongsTo } from '../utils/authToken'
import { STATE_KEY, sessionEndOf, useWalletStore } from './useWalletStore'

export { THEME_MODE_STORAGE_KEY } from './useWalletStore'

/** The member the wallet's own blob holds the profile of, or null. */
const memberOfTheBlob = () => {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY))?.gradidoID ?? null
  } catch {
    return null
  }
}

/**
 * The session as it is kept for both apps (utils/authToken.js), not in this app's own blob:
 * read when the wallet opens, and left out of what the blob saves and gives back. A blob
 * saved before the token moved out still carries one, and it is not taken.
 *
 * ⛔ Only a token of the member whose profile the blob holds. Another one would run under the
 * name, the picture and the settings of somebody else; without it the wallet opens on the
 * sign-in, and the way over from the admin interface (/authenticate) brings the profile anew.
 */
const keptSession = () => {
  const kept = readAuthToken()
  if (!kept || !tokenBelongsTo(kept.token, memberOfTheBlob())) {
    return { token: null, tokenTime: null }
  }
  try {
    return { token: kept.token, tokenTime: sessionEndOf(kept.token, kept.at) }
  } catch {
    // No token that can be read: the sign-in guard signs it out.
    return { token: kept.token, tokenTime: null }
  }
}
const withoutSession = ({ token, tokenTime, ...rest }) => rest

/** What the blob holds of the state, or nothing where it cannot be read. */
const savedState = (state) => {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY))
    if (!saved) return {}
    // Only what the store still knows: a blob saved before may carry more.
    return Object.fromEntries(
      Object.entries(withoutSession(saved)).filter(([key]) => Object.hasOwn(state, key)),
    )
  } catch {
    return {}
  }
}

export const pinia = createPinia()

let store

try {
  const wallet = useWalletStore(pinia)
  wallet.$patch({ ...savedState(wallet.$state), ...keptSession() })
  // Saved with every change, as it is made: what reads the blob -- another window, the next
  // load -- never meets a change that is not in it yet.
  wallet.$subscribe(
    (_mutation, state) => {
      window.localStorage.setItem(STATE_KEY, JSON.stringify(withoutSession(state)))
    },
    { detached: true, flush: 'sync' },
  )
  // A renewal in the admin interface, or in another window of the wallet, renews this one too;
  // a logout there signs this one out, and a sign-in of somebody else reloads it. Without that,
  // this window would go on with its own token -- and its next renewal would keep it again,
  // signing in once more whoever signed out.
  followAuthToken(wallet)
  store = wallet
} catch (error) {
  // eslint-disable-next-line no-console
  console.log(error)
}

export { store }
