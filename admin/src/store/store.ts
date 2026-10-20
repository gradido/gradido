// AI-GENERATED — not an architecture reference
import { createPinia } from 'pinia'
import { followAuthToken, readAuthToken, tokenBelongsTo } from '@/utils/authToken'
import { CONFIG } from '../config'
import { type Moderator, STATE_KEY, useAdminStore } from './useAdminStore'

type AdminState = ReturnType<typeof useAdminStore>['$state']

// The token is kept for both apps (utils/authToken.ts), not in this app's own blob: read when
// the admin interface opens, and left out of what the blob saves and gives back. A blob saved
// before the token moved out still carries one, and it is not taken.
const withoutToken = ({ token, ...rest }: Record<string, unknown>) => rest

/** What the blob holds of the state, or nothing where it cannot be read. */
const savedState = () => {
  try {
    // getItem gives null for a missing blob, which JSON.parse reads as null
    const saved = JSON.parse(localStorage.getItem(STATE_KEY) as string)
    if (!saved) {
      return {}
    }
    // Only what the store still knows: a blob saved before may carry more.
    const { moderator, openCreations } = withoutToken(saved) as Partial<
      Pick<AdminState, 'moderator' | 'openCreations'>
    >
    return {
      ...(moderator !== undefined && { moderator }),
      ...(openCreations !== undefined && { openCreations }),
    }
  } catch {
    return {}
  }
}

/**
 * The token kept, where it is the moderator's whom the blob holds, or null.
 *
 * ⛔ Only theirs. The admin interface has no sign-in of its own: it takes the token the wallet
 * signed in with, and the moderator -- the role, the menus -- only on /authenticate. A token of
 * somebody else would run under the role of the moderator before; without it the page sends to
 * not-found, and the way over from the wallet brings the moderator anew.
 */
const keptToken = () => {
  const kept = readAuthToken()
  let moderator: Moderator | null = null
  try {
    moderator = JSON.parse(localStorage.getItem(STATE_KEY) as string)?.moderator ?? null
  } catch {
    // Nothing that can be read: no moderator.
  }
  return kept && tokenBelongsTo(kept.token, moderator?.gradidoID) ? kept.token : null
}

export const pinia = createPinia()

export const store = useAdminStore(pinia)

store.$patch({
  ...savedState(),
  token: CONFIG.DEBUG_DISABLE_AUTH ? 'validToken' : keptToken(),
})

// Saved with every change, as it is made: `logout` removes the blob after its last change, and
// a save that came later would write it back.
store.$subscribe(
  (_mutation, state) => {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(withoutToken(state)))
  },
  { detached: true, flush: 'sync' },
)

// A renewal in the wallet, or in another window of the admin interface, renews this one too;
// a logout there signs this one out, and a sign-in of somebody else reloads it. Without that,
// this window would go on with its own token -- and its next renewal would keep it again,
// signing in once more whoever signed out.
followAuthToken(store)
