// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import { authenticateGmsUserSearch } from '@/graphql/queries'
import { apiBaseOf } from '@/composables/useMatches'

/**
 * Where the community's GMS answers - `https://…/gms/` - for the address search.
 *
 * The wallet learns that address only from `authenticateGmsUserSearch`, and that query mints
 * a member token on the way: the wallet backend sends the member's gradidoID to the GMS. So
 * it is only asked for a member who takes part in the GMS (`gmsAllowed`). Somebody who
 * switched "findable" off has been deleted over there, would be answered 400, and asking
 * would send their id to a service they left. They get no address, and in the new position
 * of the switch the address search stays empty for them (Bernd, 13.09.2026) - until the
 * address comes from somewhere that needs no token.
 *
 * Only the address is kept, never the token: it is the same for everybody on this server.
 */

/** How long the address is kept, like the GMS access in `useMatches`. */
const KEPT_MAX_AGE_MS = 5 * 60 * 1000

// Module-wide: the address belongs to the community server, not to a component.
let kept = null
let keptAt = 0
let pending = null

async function ask(client) {
  try {
    const { data } = await client.query({
      query: authenticateGmsUserSearch,
      fetchPolicy: 'network-only',
    })
    kept = apiBaseOf(data.authenticateGmsUserSearch.url)
    keptAt = Date.now()
    return kept
  } catch {
    // Not kept, so the next search asks again.
    return null
  }
}

export function useGmsBase() {
  const { client } = useApolloClient()
  const store = useStore()

  /**
   * @returns {Promise<?string>} the address of the GMS API, or null where there is none to
   *   use; never rejects
   */
  function gmsBase() {
    // Before the kept address, and every time: a member who switched "findable" off gets the
    // same answer whether or not somebody else on this device asked a minute ago.
    if (!store.state.gmsAllowed) return Promise.resolve(null)
    if (kept && Date.now() - keptAt < KEPT_MAX_AGE_MS) {
      return Promise.resolve(kept)
    }
    // One question for every search that starts while it is out. Cleared on the promise, so
    // a question that fails at once cannot stay standing as the answer.
    if (!pending) {
      pending = ask(client).finally(() => {
        pending = null
      })
    }
    return pending
  }

  return { gmsBase }
}
