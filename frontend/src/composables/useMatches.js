// AI-GENERATED — not an architecture reference
import { ref } from 'vue'
import { useApolloClient } from '@vue/apollo-composable'
import { authenticateGmsUserSearch } from '@/graphql/queries'
import { displayType, scoresOf } from '@/components/Matching/displayCore'

/**
 * The seam between the glow map and its data: the two GMS routes behind the map.
 *
 * A search, as both sides of this seam mean it:
 *
 *   {
 *     center: { lat, lng },
 *     radius,                            // km
 *     query?: { text, matchingType },    // a question typed instead of stored
 *     mineUuids?: string[],              // my entries — accepted, not sent (below)
 *   }
 *
 * The centre is the deliberate one, not the map's — panning around is looking, and
 * looking must not search. Both routes take the radius as a required parameter, so
 * a search without one is not asked at all.
 *
 * Two GET routes, one token:
 *
 *   community-user/matches         who near the centre answers what I said
 *   community-user/user-locations  everyone near the centre — the grey rings
 *
 * Who is asking comes from the token, never from a parameter: the GMS reads the
 * member's uuid and community out of it, looks up their entries itself and names
 * the one each match answers (`matchedEntryUuid`). That is why `mineUuids` is not
 * sent — the map still passes it, because a change in my entries is what makes it
 * search again, and that trigger is right.
 *
 * The token is the one the older user search already uses (UserSearch.vue):
 * `authenticateGmsUserSearch` has the wallet backend ask the GMS for a member token
 * by the home community's API key, and hands the token back together with the
 * dashboard page it was minted for. The API lives on that page's host (apiBaseOf).
 * It is fetched fresh on every search, `network-only`: the query has no variables,
 * so Apollo would cache one answer under one key for every member who ever logged
 * in on this browser.
 *
 * `query` — the typed question — has no route yet (POST community-user/match-query
 * is Paket 6). Until then a typed question is refused out loud: `error` carries
 * TYPED_QUERY_UNAVAILABLE and the matches are emptied, rather than answering the
 * member's stored entries under a question they never asked. The rings still load;
 * they do not depend on the question.
 *
 * A match, as the map AND the detail window want it:
 *
 *   {
 *     uuid:      string,
 *     name:      string,              // the alias the GMS holds
 *     position:  { lat, lng },        // already blurred by the GMS, never the front door
 *     community: { uuid, name },      // where to reach them — the send form needs it
 *     aboutMe:   string | null,       // their own words; null means they wrote none
 *     precision: 'genau' | 'ungefaehr',
 *     channels:  {
 *       interesse?: Entry[],          // the entries of theirs that answer mine
 *       angebot?:   Entry[],
 *       gesuch?:    Entry[],
 *     },
 *     scores:    { interesse?: number[], angebot?: number[], gesuch?: number[] },
 *   }
 *
 *   Entry = { uuid, matchedEntryUuid, summary, details: string|null, remote,
 *             strength, score, coreWord }
 *
 * `channels` holds only the entries that answer me. The GMS has no profile route
 * ("person X with all their entries") yet, so the rest of a person's list is out of
 * reach — the window shows what answers, floated by strength. `scores` is what the
 * MAP reads (via displayCore): one strength per own entry a person answers on a
 * channel, derived from the same entries so there is one source of truth. `score`
 * and `coreWord` are what the GMS read the strength off; they ride along for the
 * day the map draws its own levels (Paket 6).
 *
 * Presence is everyone else in range — on the map the grey rings:
 *
 *   { id: number, name: string, position: { lat, lng }, precision }
 *
 * The presence route returns the internal id, not a uuid, and says nothing about
 * entries. So the rings are not clickable, and every ring reads as "no entries
 * known" (GMS-115 — the route would have to carry a uuid and that flag). The route
 * also lists the people who are matches, and the seeker: the rings that would stand
 * under a glowing marker are dropped here, or the heading would count those people
 * twice. The seeker's own ring stays — the route gives nothing to tell it by.
 */

/** Great-circle distance in km — the sphere the backend measures on. */
export function distanceKm(a, b) {
  const R = 6371.0088
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const dLat = lat2 - lat1
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** `error.code` when the member typed a question and there is no route for it yet. */
export const TYPED_QUERY_UNAVAILABLE = 'TYPED_QUERY_UNAVAILABLE'
/** `error.code` when the token or one of the two routes did not come through. */
export const GMS_UNAVAILABLE = 'GMS_UNAVAILABLE'

function failure(code, message) {
  const err = new Error(message)
  err.code = code
  return err
}

/**
 * The API behind a GMS page.
 *
 * The GMS deploys dashboard and API on one host: the dashboard pages at the root
 * (its nginx template, `location /$USER_MAP_BASE_PATH`) and the API under `/gms/`
 * (`location /gms/` — a fixed path in that template, not a variable). So the origin
 * of the page the token was minted for is the origin of the API, and `/gms/` is
 * where it answers. Throws on anything that is not an absolute URL: a token
 * without a place to use it is a programmer error upstream, not a search result.
 *
 * The scheme is kept as configured. It is the operator's `GMS_DASHBOARD_URL`, and
 * the older user search has handed this same token to that very origin for years
 * (as a query parameter, even); `http://localhost:8080/` is the documented local
 * setup. Whether the GMS is reached over TLS is decided where that URL is set,
 * not second-guessed here.
 */
export function apiBaseOf(pageUrl) {
  return `${new URL(pageUrl).origin}/gms/`
}

/**
 * The GMS sends `[lng, lat]` — a PostGIS point, x before y (`ST_MakePoint(lng, lat)`
 * in its queries). Leaflet and this map say `{ lat, lng }`.
 */
export function positionOf(location) {
  return { lat: location[1], lng: location[0] }
}

/**
 * How precisely a person let themselves be found, from the GMS's publish location
 * type: 0 exact, 1 approximate, 2 random (GMS_PUBLISH_LOCATION_TYPES, by index).
 * Anything else reads as approximate — the coarser end is the one that never
 * claims more than the person allowed.
 */
export function precisionOf(type) {
  return type === 0 ? 'genau' : 'ungefaehr'
}

function toEntry(entry) {
  return {
    uuid: entry.uuid,
    matchedEntryUuid: entry.matchedEntryUuid,
    summary: entry.summary,
    details: entry.details,
    remote: entry.remote,
    strength: entry.strength,
    score: entry.score,
    coreWord: entry.coreWord,
  }
}

/**
 * One `MatchedUser` of the matches route → one match as the map wants it.
 *
 * The GMS keys its channels by what the OTHER person said, in its own words
 * (`offer | need | interest`); the map keys them by the member's words
 * (`angebot | gesuch | interesse`), translated once, in displayCore.
 */
export function toMatch(user) {
  const channels = {}
  for (const channel of user.channels ?? []) {
    const key = displayType(channel.matchingType)
    const entries = (channel.matches ?? []).map(toEntry)
    channels[key] = channels[key] ? channels[key].concat(entries) : entries
  }
  return {
    uuid: user.uuid,
    name: user.alias,
    position: positionOf(user.location),
    community: user.community,
    aboutMe: user.aboutMe,
    precision: precisionOf(user.type),
    channels,
    scores: scoresOf(channels),
  }
}

/** One person of the presence route → one grey ring. */
export function toPresence(user) {
  return {
    id: user.id,
    name: user.alias,
    position: positionOf(user.location),
    precision: precisionOf(user.type),
  }
}

/**
 * The presence route lists everyone in range, matches included. Drop the ones the
 * matches route already returned, so nobody is drawn as a ring under their own
 * glow and counted twice. Both routes read the same row of the same table, so alias
 * and point agree to the digit — and a housemate with the same point keeps their
 * ring, because the alias tells them apart.
 */
export function withoutMatched(people, matched) {
  return people.filter(
    (person) =>
      !matched.some(
        (match) =>
          match.alias === person.alias &&
          match.location[0] === person.location[0] &&
          match.location[1] === person.location[1],
      ),
  )
}

function whereParams({ center, radius }) {
  return new URLSearchParams({
    latitude: String(center.lat),
    longitude: String(center.lng),
    radius: String(radius),
  })
}

async function gmsGet(base, route, params, token) {
  // What comes back is one member's view, keyed by the token and not by the URL:
  // no-store keeps it out of the browser's HTTP cache, where the next member on
  // the same device could otherwise be served it. The GMS answers with `Vary: *`
  // and no cache headers today; this seam does not depend on that staying so.
  const response = await fetch(`${base}${route}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw failure(GMS_UNAVAILABLE, `${route}: HTTP ${response.status}`)
  }
  return response.json()
}

async function gmsAccess(client) {
  const { data } = await client.query({
    query: authenticateGmsUserSearch,
    fetchPolicy: 'network-only',
  })
  return data.authenticateGmsUserSearch
}

export function useMatches() {
  const { client } = useApolloClient()
  const matches = ref([])
  const presence = ref([])
  const loading = ref(false)
  const error = ref(null)
  // The number of the search asked for last. Two searches can be in flight when the
  // member moves the centre twice; only the last one asked for may write, or the
  // older answer could land after the newer one and overwrite it.
  let latest = 0

  /**
   * @param {object} search
   * @param {{lat: number, lng: number}} search.center where the member chose to search
   * @param {number} search.radius how far out, km
   * @param {?{text: string, matchingType: string}} [search.query]
   *   a question typed on the spot instead of read from the member's entries
   * @param {string[]} [search.mineUuids] the member's own entry uuids — not sent, the
   *   GMS knows them from the token
   */
  async function load(search) {
    if (!search?.center || !(search.radius > 0)) return
    const request = ++latest
    loading.value = true
    error.value = null
    try {
      const { url, token } = await gmsAccess(client)
      const base = apiBaseOf(url)
      const where = whereParams(search)
      const [people, others] = await Promise.all([
        search.query ? [] : gmsGet(base, 'community-user/matches', where, token),
        gmsGet(base, 'community-user/user-locations', where, token),
      ])
      if (request !== latest) return
      matches.value = people.map(toMatch)
      presence.value = withoutMatched(others, people).map(toPresence)
      if (search.query) {
        error.value = failure(TYPED_QUERY_UNAVAILABLE, 'no route for a typed question yet')
      }
    } catch (err) {
      if (request !== latest) return
      error.value = err.code ? err : failure(GMS_UNAVAILABLE, err.message)
      matches.value = []
      presence.value = []
    } finally {
      if (request === latest) loading.value = false
    }
  }

  return { matches, presence, loading, error, load }
}
