// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { gmsDashboardUrl } from '@/graphql/queries'
import { apiBaseOf } from '@/composables/useMatches'

/**
 * Where the community's GMS answers - `https://…/gms/` - for the address search.
 *
 * That address is server configuration, the same for everybody on this server, and the wallet
 * asks the backend for exactly that (`gmsDashboardUrl`): the query contacts nobody and says
 * nothing about the member. So every member gets it - the one who switched "findable" off as
 * well, and the one the GMS has never been sent. They are who the router sends to the home
 * tab, and the search on the map there is how they set their home (Bernd, 18.09.2026).
 *
 * ⛔ Not `authenticateGmsUserSearch`, which carries the same address next to a member token.
 * Minting that token sends the member's gradidoID to the GMS, and the GMS answers 400 for a
 * member it does not hold. While it was the only source, those members were not asked about
 * at all, and their search stayed empty without a word.
 *
 * What a search then sends to the GMS is the text typed, where the map looks and the wallet's
 * language - no token and nothing that names the member (utils/geoSearch).
 */

/** How long the address is kept, like the GMS access in `useMatches`. */
const KEPT_MAX_AGE_MS = 5 * 60 * 1000

// Module-wide: the address belongs to the community server, not to a component - and not to a
// member either, so somebody else signing in on this device reads the same one rightly.
let kept = null
let keptAt = 0
let pending = null

async function ask(client) {
  try {
    const { data } = await client.query({
      query: gmsDashboardUrl,
      fetchPolicy: 'network-only',
    })
    // `null` where this server has no GMS.
    if (!data.gmsDashboardUrl) return null
    kept = apiBaseOf(data.gmsDashboardUrl)
    keptAt = Date.now()
    return kept
  } catch {
    // Not kept, so the next search asks again.
    return null
  }
}

export function useGmsBase() {
  const { client } = useApolloClient()

  /**
   * @returns {Promise<?string>} the address of the GMS API, or null where there is none to
   *   use; never rejects
   */
  function gmsBase() {
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
