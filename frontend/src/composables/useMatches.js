// AI-GENERATED — not an architecture reference
import { ref } from 'vue'
import { useApolloClient } from '@vue/apollo-composable'
import { authenticateGmsUserSearch } from '@/graphql/queries'
import { displayType, entryType, scoresOf } from '@/components/Matching/displayCore'
import { isPlace } from '@/utils/matchingPosition'

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
 * `query` — the typed question — goes to GET community-user/typed-matches instead
 * of the matches route: the words as typed, the stance in the GMS's words, the same
 * circle, the same token. The
 * GMS folds the words like every keyed word and answers in the same shape; nothing
 * of the member's stored entries is consulted, and every answer carries a null
 * `matchedEntryUuid`, because no entry of mine is behind it. The rings load beside
 * it either way; they do not depend on the question.
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

/** `error.code` when the token or one of the two routes did not come through at all. */
export const GMS_UNAVAILABLE = 'GMS_UNAVAILABLE'

/**
 * `error.code` when the GMS answered and refused: any 4xx.
 *
 * Kept apart from GMS_UNAVAILABLE because the two are opposite facts and the member is
 * told them apart. A refusal means the GMS is there, read the request and would not have
 * it -- calling that "not reachable" is what sent the whole of 09.09.2026 looking at a
 * server that was healthy, while the wallet was asking it about a latitude of `undefined`.
 */
export const GMS_REJECTED = 'GMS_REJECTED'

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
 * Whether one person of a GMS answer can be put on a map at all.
 *
 * ⛔ The pair was taken on trust: `positionOf([])` gives `{lat: undefined, lng: undefined}`
 * and `positionOf(null)` throws — and both shapes are ones the wallet itself has been
 * making. Until 10.09.2026 a member with an empty position was published to the GMS at
 * `location: []`, so the GMS could hand it straight back. The undefined pair turns every
 * distance into NaN, and a NaN comparator leaves Array.prototype.sort free to order as it
 * likes, so the list reshuffles between renders; the thrown one lands in `load`'s try and
 * comes out as "the search is not reachable" while the GMS answered 200 — the very
 * misdiagnosis this whole strand of work exists to end.
 *
 * Dropped rather than drawn: somebody without a place on the map has nothing to show
 * there, and the heading counts what is shown.
 */
export function hasUsablePoint(user) {
  if (!Array.isArray(user?.location) || user.location.length !== 2) {
    return false
  }
  const [lng, lat] = user.location
  // Range as well as finiteness, and the range is not pedantry: the GMS is a foreign
  // system, so nothing our own backend validates protects what comes BACK from it. A
  // latitude of 91 is finite and is not a place; drawn, it lands off the globe.
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
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

/** The most characters the typed route reads; what the field holds beyond it is cut, not refused. */
const TYPED_TEXT_MAX = 200

/**
 * The most characters the suggestions route reads - cut here rather than sent, or
 * every keystroke past it would come back 422. Nothing is lost by the cut: the
 * longest word the vocabulary can hold is shorter than this, so a prefix that long
 * has no offers either way.
 */
const SUGGEST_PREFIX_MAX = 80

/** Fewer letters than this and there is nothing to offer about; the GMS says so too. */
const SUGGEST_MIN_CHARS = 2

/**
 * How long a fetched access stays good for the suggestions.
 *
 * The search fetches one per question, which is right - a question is a deliberate
 * act and happens seldom. The offers are asked for while somebody types, so fetching
 * one per call would put a GraphQL round trip through the wallet backend behind every
 * few keystrokes. Kept for a typing session instead, and a token that has run out in
 * the meantime is answered 401 and fetched again once (below).
 */
const SUGGEST_ACCESS_MAX_AGE_MS = 5 * 60 * 1000

/**
 * The circle plus the question: the words as typed, and the stance in the GMS's
 * words (entryType), which names the channel to search.
 */
function typedParams(search) {
  const params = whereParams(search)
  const { text, matchingType } = search.query
  params.set('text', (text ?? '').trim().slice(0, TYPED_TEXT_MAX))
  params.set('matchingType', entryType(matchingType))
  return params
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
    // 4xx: answered and refused. 5xx and anything else: not usable. See GMS_REJECTED.
    const refused = response.status >= 400 && response.status < 500
    const err = failure(
      refused ? GMS_REJECTED : GMS_UNAVAILABLE,
      `${route}: HTTP ${response.status}`,
    )
    // The number itself, beside the sentence. The suggestions retry exactly one
    // case - a kept token that has run out - and reading that out of a message
    // would break the first time the message is worded differently.
    err.status = response.status
    throw err
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
  // The access the suggestions reuse, and when it was fetched. Only they reuse it:
  // `load` below still fetches per search, on purpose.
  let suggestAccess = null
  let suggestAccessAt = 0
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
    // A centre that is not two numbers is not a place to search from, and the GMS says so
    // too -- `latitude must be a number`, a 400. Refused here rather than sent, because
    // this side is the one that knows it: it costs a token fetch and two round trips to be
    // told what is already known.
    //
    // Refused, not ignored. Returning here without touching anything would leave the
    // previous place's people on screen under the new place's name, and would let an older
    // search still in flight land afterwards and paint -- so this takes the same exit a
    // failure takes: supersede, clear, say so.
    if (!isPlace(search.center)) {
      latest++
      matches.value = []
      presence.value = []
      error.value = failure(GMS_REJECTED, 'search centre is not a pair of numbers')
      loading.value = false
      return
    }
    const request = ++latest
    loading.value = true
    error.value = null
    try {
      const { url, token } = await gmsAccess(client)
      const base = apiBaseOf(url)
      const where = whereParams(search)
      const [people, others] = await Promise.all([
        search.query
          ? gmsGet(base, 'community-user/typed-matches', typedParams(search), token)
          : gmsGet(base, 'community-user/matches', where, token),
        gmsGet(base, 'community-user/user-locations', where, token),
      ])
      if (request !== latest) return
      // ⛔ Filtered before withoutMatched, not after. That function reads `location[0]` on
      // both sides to tell a ring from the glow beneath it, so handing it the raw answers
      // means a person without a place throws inside the try -- and comes out as
      // GMS_UNAVAILABLE although both requests answered 200. The very misdiagnosis this
      // strand exists to end, rebuilt one line further down.
      //
      // ⚠️ And a test can be green for the wrong reason here: `&&` checks the alias first,
      // so an unplaceable person only reaches `location[0]` when some OTHER person shares
      // their alias. The case below is built that way on purpose.
      const placeable = people.filter(hasUsablePoint)
      matches.value = placeable.map(toMatch)
      presence.value = withoutMatched(others.filter(hasUsablePoint), placeable).map(toPresence)
    } catch (err) {
      if (request !== latest) return
      error.value = err.code ? err : failure(GMS_UNAVAILABLE, err.message)
      matches.value = []
      presence.value = []
    } finally {
      if (request === latest) loading.value = false
    }
  }

  /** The access for the offers: the kept one, unless it is stale or `fresh` is asked for. */
  async function accessForSuggest(fresh) {
    if (fresh || !suggestAccess || Date.now() - suggestAccessAt > SUGGEST_ACCESS_MAX_AGE_MS) {
      suggestAccess = await gmsAccess(client)
      suggestAccessAt = Date.now()
    }
    return suggestAccess
  }

  /**
   * What a half-typed word could become — `GET community-user/vocabulary-suggest`.
   *
   * The vocabulary is the whole of what a typed search can find: a word is in it or
   * the search comes back empty. So the offers are read straight off it, and no
   * entry of anybody's is touched. The GMS folds the prefix like every keyed word,
   * leaves out what no entry carries and what has been muted, and answers commonest
   * first — see its README, "the search on key words".
   *
   * How many is the GMS's to decide (eight when nothing is asked for), because it is
   * the side that knows how rare the words are.
   *
   * @param {string} prefix the letters typed so far
   * @returns {Promise<{word: string, entries: number}[]>} the offers, commonest first
   */
  async function suggest(prefix) {
    const typed = (prefix ?? '').trim().slice(0, SUGGEST_PREFIX_MAX)
    if (typed.length < SUGGEST_MIN_CHARS) return []
    const params = new URLSearchParams({ prefix: typed })
    const ask = async (fresh) => {
      const { url, token } = await accessForSuggest(fresh)
      return await gmsGet(apiBaseOf(url), 'community-user/vocabulary-suggest', params, token)
    }
    try {
      let body
      try {
        body = await ask(false)
      } catch (err) {
        // The one case a kept access has that a fetched one does not: it ran out
        // while somebody was typing. Fetch once more and ask again; anything else
        // is not ours to retry.
        if (err.status !== 401) throw err
        body = await ask(true)
      }
      return body.words ?? []
    } catch {
      // Offers are a convenience beside the field, not the answer to a question. A
      // GMS that cannot be reached leaves the list empty and the field usable; the
      // search itself has the toast, and two of them for one outage would only say
      // the same thing twice.
      return []
    }
  }

  return { matches, presence, loading, error, load, suggest }
}
