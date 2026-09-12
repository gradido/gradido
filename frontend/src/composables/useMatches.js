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
 * `matchedEntryUuid`, because no entry of mine is behind it.
 *
 * `remoteOnly` — the reach — is the member's switch, not a property of anybody's
 * entry: it puts `remote=true` on whichever of the two match routes is asked, and
 * only the entries their owners released for the wide search answer. The circle
 * still holds; the wide search has its own, wider radius (MatchingMap keeps two).
 *
 * The rings do not depend on the question — but in the wide search they are not
 * asked for at all: a ring is the neighbour you could walk up to, and eight hundred
 * kilometres away it is not one. So `user-locations` is skipped and `presence` stays
 * empty, which is what everything downstream already knows how to read.
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
 *     scores:    { interesse?: Score[], angebot?: Score[], gesuch?: Score[] },
 *   }
 *
 *   Entry = { uuid, matchedEntryUuid, matchedSubject, summary, details: string|null,
 *             remote, strength, score, coreWord }
 *   Score = { strength, entry, subject }
 *
 * `channels` holds only the entries that answer me - what the matches route knows. The
 * window shows everything the person published: `profile` below reads it from the
 * profile route, and `withProfile` lays these matched entries, with their strength, over
 * it (GMS-111: one window for a match and a ring). An entry of theirs comes once for
 * every entry of mine it answers - one record per pair, which is what the map counts by;
 * the window lists it once (forWindow) and names the entries of mine beside it
 * (withMine). `scores` is what the
 * MAP reads (via displayCore): per channel, one strength for every entry of theirs
 * that answers one of mine, with the entry of mine it answers and what that entry is
 * about (`matchedSubject`, sent by the GMS since 10.09.2026) - the glow counts breadth
 * by the subject (GMS-184). Derived from the same entries, so there is one source of
 * truth. `score` and `coreWord` are what the GMS read the strength off; they ride
 * along for the day the map draws its own levels (Paket 6).
 *
 * Presence is everyone else in range — on the map the grey rings:
 *
 *   { id: number, uuid, name: string, community: { uuid, name }, hasEntries: boolean,
 *     position: { lat, lng }, precision }
 *
 * Since 10.09.2026 the presence route names every person by the pair a profile is
 * opened with - their uuid and their community - and says whether they have stated
 * anything (GMS-115, GMS-74): a ring opens the same window as a match, and the ring is
 * filled for somebody with entries. An older GMS without those fields leaves `uuid` and
 * `community` null and every ring hollow; such a ring cannot be opened. The route also
 * lists the people who are matches, and the seeker: the rings that would stand under a
 * glowing marker are dropped here, or the heading would count those people twice. The
 * seeker's own ring stays - the pair could tell it now, and nothing here asks it to.
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
    // What my entry behind it is about; null for a typed question, for an entry of mine
    // without a subject, and from a GMS that does not send it yet.
    matchedSubject: entry.matchedSubject ?? null,
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
    uuid: user.uuid ?? null,
    name: user.alias,
    community: user.community ?? null,
    hasEntries: user.hasEntries === true,
    position: positionOf(user.location),
    precision: precisionOf(user.type),
  }
}

/**
 * One person of the profile route → the window's shape: every entry they published,
 * keyed by the member's words like a match's, and none with a strength - the strengths
 * come from the searches (withProfile). Newest first, as the GMS sends them.
 */
export function toProfile(person) {
  const channels = {}
  for (const entry of person.entries ?? []) {
    const key = displayType(entry.matchingType)
    const shown = {
      uuid: entry.uuid,
      summary: entry.summary,
      details: entry.details,
      remote: entry.remote,
    }
    channels[key] = channels[key] ? [...channels[key], shown] : [shown]
  }
  return {
    uuid: person.uuid,
    name: person.alias,
    community: person.community,
    aboutMe: person.aboutMe,
    position: positionOf(person.location),
    precision: precisionOf(person.type),
    channels,
  }
}

/**
 * The window's view of a person as the map holds them: one entry per entry of theirs.
 *
 * The matches route sends a record per pair - an entry of theirs and the entry of mine it
 * answers - so an offer that answers two of my needs comes twice. The map counts by those
 * pairs; the window lists entries, and listing one twice is wrong (a doubled key, too).
 * Folded here: the strongest pair gives the entry its strength and the rest of its fields,
 * and `mine` names every entry of mine it answers, strongest first. A typed question has
 * no entry of mine behind it, so there `mine` stays empty.
 */
export function forWindow(person) {
  const channels = {}
  for (const [key, entries] of Object.entries(person.channels ?? {})) {
    const pairsOf = new Map()
    for (const entry of entries) {
      pairsOf.set(entry.uuid, [...(pairsOf.get(entry.uuid) ?? []), entry])
    }
    channels[key] = [...pairsOf.values()].map((pairs) => {
      const strongestFirst = [...pairs].sort((a, b) => b.strength - a.strength)
      const mine = [...new Set(strongestFirst.map((pair) => pair.matchedEntryUuid).filter(Boolean))]
      return { ...strongestFirst[0], mine }
    })
  }
  return { ...person, channels }
}

/**
 * The person the window shows: what the map knows of them, with everything they
 * published laid in (GMS-111). An entry the search matched keeps its strength -
 * the window opens its area and floats it to the top; every other entry comes without
 * one and folds behind "X more", newest first. A matched entry the profile does not
 * list (the cap, or an edit in between) stays: what glows on the map is never missing
 * from the window. The matched entries come folded (forWindow), so an entry that answers
 * two of mine keeps both and the stronger pair's strength.
 */
export function withProfile(person, profile) {
  const folded = forWindow(person).channels
  const matched = new Map()
  for (const entries of Object.values(folded)) {
    for (const entry of entries) matched.set(entry.uuid, entry)
  }
  const channels = {}
  const listed = new Set()
  for (const [key, entries] of Object.entries(profile.channels ?? {})) {
    channels[key] = entries.map((entry) => {
      listed.add(entry.uuid)
      return matched.get(entry.uuid) ?? entry
    })
  }
  for (const [key, entries] of Object.entries(folded)) {
    const missing = entries.filter((entry) => !listed.has(entry.uuid))
    if (missing.length) channels[key] = [...(channels[key] ?? []), ...missing]
  }
  return {
    ...person,
    community: person.community?.name ? person.community : profile.community,
    // The profile's, null included: it is the newer read of the same column, and null
    // says the person has no text now - the route always carries the field. Falling back
    // to the match's text would show one they have just removed.
    aboutMe: profile.aboutMe,
    channels,
  }
}

/**
 * The sentences of mine a matched entry answers, for the lines "passt zu" under it.
 *
 * Bernd, 10.09.2026: with the whole person in the window, nothing showed why they match -
 * so the window names my entry after all, which GMS-111 had left out. Read off my own
 * entries, which the map holds anyway; no server is asked. An entry of mine that is gone
 * since the search (deleted or paused) has no sentence left and is left out; an entry of
 * theirs the search did not match has no `mine` and gets no lines.
 */
export function withMine(person, myEntries) {
  if (!person) return person
  const byUuid = new Map(myEntries.map((entry) => [entry.uuid, entry]))
  const channels = {}
  for (const [key, entries] of Object.entries(person.channels)) {
    channels[key] = entries.map((entry) => {
      if (!entry.mine) return entry
      const matches = entry.mine
        .map((uuid) => byUuid.get(uuid))
        .filter(Boolean)
        .map(({ uuid, matchingType, summary }) => ({ uuid, matchingType, summary }))
      return { ...entry, matches }
    })
  }
  return { ...person, channels }
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

/**
 * The circle, plus the reach if one was switched. Both match routes go through here,
 * so the flag reaches the typed search by construction rather than by remembering to
 * add it in two places. The presence route deliberately does NOT use this: it knows
 * nothing of the reach, and in the wide search it is not asked at all (load, below).
 */
function matchParams(search) {
  const params = whereParams(search)
  if (search.remoteOnly) params.set('remote', 'true')
  return params
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
 * How long a fetched access stays good for the suggestions and the profiles.
 *
 * The search fetches one per question, which is right - a question is a deliberate
 * act and happens seldom. The offers are asked for while somebody types, and a profile
 * every time a window opens, so fetching one per call would put a GraphQL round trip
 * through the wallet backend behind every few keystrokes and every tap. Kept for a while
 * instead, and a token that has run out in the meantime is answered 401 and fetched
 * again once (askKept, below).
 */
const KEPT_ACCESS_MAX_AGE_MS = 5 * 60 * 1000

/**
 * The circle plus the question: the words as typed, and the stance in the GMS's
 * words (entryType), which names the channel to search.
 */
function typedParams(search) {
  const params = matchParams(search)
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
    //
    // ⛔ Except 401 and 403, and that is not a detail. `load` fetches a FRESH access for
    // every search, so a refused token there cannot be the member's doing -- it means the
    // community's GMS key is wrong or has run out, which nobody at this end can act on.
    // Telling them the search was refused would blame them for an outage. From where they
    // stand the service is there and not usable, and that is what "not reachable" says.
    const OPERATORS_FAULT = [401, 403]
    const refused =
      response.status >= 400 && response.status < 500 && !OPERATORS_FAULT.includes(response.status)
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
  // The access the suggestions and the profiles reuse, and when it was fetched. Only
  // they reuse it: `load` below still fetches per search, on purpose.
  let keptAccess = null
  let keptAccessAt = 0
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
   * @param {boolean} [search.remoteOnly] the reach: ask only for the entries released
   *   for the wide search, and draw no rings
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
      const [people, others] = await Promise.all([
        search.query
          ? gmsGet(base, 'community-user/typed-matches', typedParams(search), token)
          : gmsGet(base, 'community-user/matches', matchParams(search), token),
        // Not asked for in the wide search, rather than asked for and thrown away:
        // over a 500 km circle that is hundreds of rings nobody can walk up to, and
        // one request that pays for nothing. An empty list is a shape everything
        // downstream already handles — withoutMatched, the count line, the section
        // of quiet people — so nothing below needs to know which reach it is in.
        search.remoteOnly
          ? Promise.resolve([])
          : gmsGet(base, 'community-user/user-locations', whereParams(search), token),
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

  /** The kept access: the one fetched last, unless it is stale or `fresh` is asked for. */
  async function accessKept(fresh) {
    if (fresh || !keptAccess || Date.now() - keptAccessAt > KEPT_ACCESS_MAX_AGE_MS) {
      keptAccess = await gmsAccess(client)
      keptAccessAt = Date.now()
    }
    return keptAccess
  }

  /**
   * One GET with the kept access. The one case a kept access has that a fetched one
   * does not - it ran out in the meantime - is answered 401: fetch once more and ask
   * again. Anything else is not ours to retry and is thrown as gmsGet threw it.
   */
  async function askKept(route, params) {
    const ask = async (fresh) => {
      const { url, token } = await accessKept(fresh)
      return await gmsGet(apiBaseOf(url), route, params, token)
    }
    try {
      return await ask(false)
    } catch (err) {
      if (err.status !== 401) throw err
      return await ask(true)
    }
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
    try {
      const body = await askKept('community-user/vocabulary-suggest', params)
      return body.words ?? []
    } catch {
      // Offers are a convenience beside the field, not the answer to a question. A
      // GMS that cannot be reached leaves the list empty and the field usable; the
      // search itself has the toast, and two of them for one outage would only say
      // the same thing twice.
      return []
    }
  }

  /**
   * One person's profile — `GET community-user/profile` — in the window's shape
   * (toProfile): everything they published, at most a hundred entries of a kind (the
   * GMS's cap, passed on as it comes), none with a strength. The pair is what names
   * them: a uuid names a person only within one community.
   *
   * Throws what gmsGet throws - a 404 for a pair that names nobody, an outage - and the
   * page says so and keeps what the window already shows.
   *
   * @param {string} uuid the person's uuid
   * @param {string} communityUuid the uuid of their community
   */
  async function profile(uuid, communityUuid) {
    const params = new URLSearchParams({ uuid, community: communityUuid })
    return toProfile(await askKept('community-user/profile', params))
  }

  return { matches, presence, loading, error, load, suggest, profile }
}
