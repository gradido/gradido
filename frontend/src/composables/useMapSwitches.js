// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { matchingMapSwitches } from '@/graphql/queries'

/**
 * Which map the wallet draws and which place search it asks (plan decision K-008). An
 * admin sets both per community server in the admin panel, and the wallet reads them
 * here - so switching needs no deploy.
 *
 * The values are the names of the GraphQL enums.
 */
export const MAP_ENGINE = Object.freeze({ LEAFLET: 'LEAFLET', MAPLIBRE: 'MAPLIBRE' })
export const GEO_PROVIDER = Object.freeze({ NOMINATIM: 'NOMINATIM', GMS: 'GMS' })

/**
 * The old pair: what the wallet did before the switches existed, and the answer whenever
 * the question fails.
 */
export const OLD_MAP_SWITCHES = Object.freeze({
  mapEngine: MAP_ENGINE.LEAFLET,
  geoProvider: GEO_PROVIDER.NOMINATIM,
})

/**
 * How long an answer is kept, like the GMS access in `useMatches`: calls within this time
 * share one question, and an older answer is asked again on the next call.
 */
const KEPT_MAX_AGE_MS = 5 * 60 * 1000

// Module-wide rather than per component: the switches belong to the community server, not
// to a component or to a member.
let kept = null
let keptAt = 0
let pending = null

async function ask(client) {
  try {
    const { data } = await client.query({
      query: matchingMapSwitches,
      fetchPolicy: 'network-only',
    })
    const { mapEngine, geoProvider } = data.matchingMapSwitches
    kept = { mapEngine, geoProvider }
    keptAt = Date.now()
    return kept
  } catch {
    // Not kept, so the next map that opens asks again.
    return OLD_MAP_SWITCHES
  }
}

export function useMapSwitches() {
  const { client } = useApolloClient()

  /**
   * The switch positions of this server.
   *
   * @returns {Promise<{mapEngine: string, geoProvider: string}>} never rejects
   */
  function mapSwitches() {
    if (kept && Date.now() - keptAt < KEPT_MAX_AGE_MS) {
      return Promise.resolve(kept)
    }
    // One question for everybody who asks while it is out. Cleared once it has settled,
    // on the promise rather than inside `ask`, so a question that fails at once cannot be
    // left standing as the answer.
    if (!pending) {
      pending = ask(client).finally(() => {
        pending = null
      })
    }
    return pending
  }

  return { mapSwitches }
}
