// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authenticateGmsUserSearch } from '@/graphql/queries'
import {
  useMatches,
  apiBaseOf,
  positionOf,
  precisionOf,
  toMatch,
  toPresence,
  withoutMatched,
  GMS_UNAVAILABLE,
  GMS_REJECTED,
  hasUsablePoint,
} from './useMatches'

// The Apollo client the composable asks for the token. `query` is a spy so a test
// can hand over a token, or refuse one.
const query = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query } }),
}))

// --- the wire shapes, field for field as the GMS declares them ----------------
// backend/src/server/output.schema.ts of the GMS: matchedUserSchema, matchedChannelSchema,
// matchedEntrySchema, mapUserSchema. A fake fetch proves nothing about the other side,
// so what it answers is copied from the schema, not invented: the channel words are the
// server's (`offer | need | interest`), the point is `[lng, lat]`, `strength` is the
// brightness of a level (0.46 / 0.595 / 0.73 / 0.865), `type` the publish location type.

const UUID = {
  marta: '5b1f0a1e-0000-4000-8000-000000000001',
  mine: '5b1f0a1e-0000-4000-8000-000000000002',
  entry: '5b1f0a1e-0000-4000-8000-000000000003',
  community: '5b1f0a1e-0000-4000-8000-000000000004',
}

function matchedUser(over = {}) {
  return {
    uuid: UUID.marta,
    alias: 'Marta',
    aboutMe: 'Ich schraube gern an Rädern.',
    type: 0,
    location: [9.69, 49.28],
    community: { uuid: UUID.community, name: 'Gradido Künzelsau' },
    channels: [
      {
        matchingType: 'offer',
        strength: 0.595,
        matches: [
          {
            matchedEntryUuid: UUID.mine,
            uuid: UUID.entry,
            summary: 'Fahrradreparatur',
            details: null,
            remote: false,
            strength: 0.595,
            score: 1.4,
            coreWord: true,
          },
        ],
      },
    ],
    ...over,
  }
}

function mapUser(over = {}) {
  return { id: 7, alias: 'Paul', type: 1, location: [9.7, 49.3], ...over }
}

const SEARCH = { center: { lat: 49.28, lng: 9.69 }, radius: 25 }
const ACCESS = { url: 'https://ki-playground-gms.gradido.net/user-search', token: 'tok-1' }

function okJson(body) {
  return { ok: true, status: 200, json: async () => body }
}

describe('useMatches', () => {
  describe('apiBaseOf', () => {
    it('finds the API on the host of the page the token was minted for', () => {
      expect(apiBaseOf('https://ki-playground-gms.gradido.net/user-search')).toBe(
        'https://ki-playground-gms.gradido.net/gms/',
      )
    })

    it('keeps a port and drops the page path and query', () => {
      expect(apiBaseOf('http://localhost:8080/user-search/?accesstoken=x')).toBe(
        'http://localhost:8080/gms/',
      )
    })

    it('refuses a page that is not an absolute URL', () => {
      expect(() => apiBaseOf('user-search')).toThrow()
    })
  })

  describe('positionOf', () => {
    it('reads the GMS point as longitude first, latitude second', () => {
      expect(positionOf([9.69, 49.28])).toEqual({ lat: 49.28, lng: 9.69 })
    })
  })

  describe('precisionOf', () => {
    it('reads exact as genau and every other publish type as ungefaehr', () => {
      expect(precisionOf(0)).toBe('genau')
      expect(precisionOf(1)).toBe('ungefaehr')
      expect(precisionOf(2)).toBe('ungefaehr')
      expect(precisionOf(undefined)).toBe('ungefaehr')
    })
  })

  describe('toMatch', () => {
    it('turns a MatchedUser into the match the map and the window read', () => {
      const match = toMatch(matchedUser())
      expect(match).toEqual({
        uuid: UUID.marta,
        name: 'Marta',
        position: { lat: 49.28, lng: 9.69 },
        community: { uuid: UUID.community, name: 'Gradido Künzelsau' },
        aboutMe: 'Ich schraube gern an Rädern.',
        precision: 'genau',
        channels: {
          angebot: [
            {
              uuid: UUID.entry,
              matchedEntryUuid: UUID.mine,
              summary: 'Fahrradreparatur',
              details: null,
              remote: false,
              strength: 0.595,
              score: 1.4,
              coreWord: true,
            },
          ],
        },
        scores: { angebot: [0.595] },
      })
    })

    it("keys the channels by the member's words, not the server's", () => {
      const channel = (matchingType) => ({
        matchingType,
        strength: 0.46,
        matches: [{ ...matchedUser().channels[0].matches[0], strength: 0.46 }],
      })
      const match = toMatch(
        matchedUser({ channels: [channel('need'), channel('interest'), channel('offer')] }),
      )
      expect(Object.keys(match.channels).sort()).toEqual(['angebot', 'gesuch', 'interesse'])
      expect(match.scores).toEqual({ angebot: [0.46], gesuch: [0.46], interesse: [0.46] })
    })

    it('carries every strength of a channel into the scores, in order', () => {
      const entry = matchedUser().channels[0].matches[0]
      const match = toMatch(
        matchedUser({
          channels: [
            {
              matchingType: 'offer',
              strength: 0.865,
              matches: [
                { ...entry, strength: 0.46 },
                { ...entry, uuid: UUID.community, strength: 0.865 },
              ],
            },
          ],
        }),
      )
      expect(match.scores).toEqual({ angebot: [0.46, 0.865] })
    })

    it('leaves a person without channels with nothing to glow by', () => {
      const match = toMatch(matchedUser({ channels: [] }))
      expect(match.channels).toEqual({})
      expect(match.scores).toEqual({})
    })

    it('keeps null for someone who wrote nothing about themselves', () => {
      expect(toMatch(matchedUser({ aboutMe: null })).aboutMe).toBeNull()
    })
  })

  describe('toPresence', () => {
    it('turns a map user into a grey ring keyed by the internal id', () => {
      expect(toPresence(mapUser())).toEqual({
        id: 7,
        name: 'Paul',
        position: { lat: 49.3, lng: 9.7 },
        precision: 'ungefaehr',
      })
    })
  })

  /**
   * ⛔ The pair was taken on trust. `positionOf([])` gives `{lat: undefined, lng: undefined}`
   * and `positionOf(null)` throws -- and both are shapes the wallet itself has been making:
   * until 10.09.2026 a member with an empty position was published to the GMS at
   * `location: []`, so it could come straight back.
   */
  describe('hasUsablePoint', () => {
    it('is yes for a pair of numbers', () => {
      expect(hasUsablePoint({ location: [9.69, 49.28] })).toBe(true)
    })

    it('is yes for a zero coordinate -- the prime meridian is a place', () => {
      expect(hasUsablePoint({ location: [0, 51.5] })).toBe(true)
    })

    it.each([
      ['an empty array -- the shape the wallet was publishing', []],
      ['half a pair', [9.69]],
      ['nothing at all', null],
      ['not an array', { lat: 1, lng: 2 }],
      ['numbers that came as text', ['9.69', '49.28']],
    ])('is no for %s', (_name, location) => {
      expect(hasUsablePoint({ location })).toBe(false)
    })

    it('is no for a person that is not there', () => {
      expect(hasUsablePoint(undefined)).toBe(false)
    })
  })

  describe('withoutMatched', () => {
    it('drops the people the matches route already returned', () => {
      const marta = mapUser({ id: 1, alias: 'Marta', location: [9.69, 49.28] })
      const paul = mapUser({ id: 2, alias: 'Paul', location: [9.7, 49.3] })
      expect(withoutMatched([marta, paul], [matchedUser()])).toEqual([paul])
    })

    it('keeps a housemate on the very same point', () => {
      const ben = mapUser({ id: 3, alias: 'Ben', location: [9.69, 49.28] })
      expect(withoutMatched([ben], [matchedUser()])).toEqual([ben])
    })

    it('keeps a namesake somewhere else', () => {
      const other = mapUser({ id: 4, alias: 'Marta', location: [10, 50] })
      expect(withoutMatched([other], [matchedUser()])).toEqual([other])
    })
  })

  describe('load', () => {
    let fetchMock

    beforeEach(() => {
      query.mockReset()
      query.mockResolvedValue({ data: { authenticateGmsUserSearch: ACCESS } })
      fetchMock = vi.fn(async (url) => {
        if (url.includes('community-user/matches')) return okJson([matchedUser()])
        if (url.includes('community-user/typed-matches')) return okJson([matchedUser()])
        if (url.includes('community-user/user-locations')) {
          return okJson([
            mapUser({ id: 1, alias: 'Marta', location: [9.69, 49.28] }),
            mapUser({ id: 2, alias: 'Paul' }),
          ])
        }
        return { ok: false, status: 404, json: async () => ({}) }
      })
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('asks nothing without a centre or a radius', async () => {
      const { load } = useMatches()
      await load({ center: null, radius: 25 })
      await load({ center: SEARCH.center, radius: 0 })
      expect(query).not.toHaveBeenCalled()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    // 09.09.2026: a member without a position reached the map, its centre became
    // `{lat: undefined, lng: undefined}`, and this seam sent it on -- a token fetch and
    // two round trips to be told `latitude must be a number`, which the wallet then read
    // out as "the search is not reachable". A centre that is not two numbers is not a
    // place to search from, and this side is the one that knows it.
    it.each([
      ['an empty object', {}],
      ['half a pair', { lat: 49.28, lng: undefined }],
      ['NaN, which passes every truthy check', { lat: NaN, lng: NaN }],
      ['numbers that came as text', { lat: '49.28', lng: '9.69' }],
    ])('asks nothing about a centre that is %s', async (_name, center) => {
      const { load } = useMatches()
      await load({ center, radius: 25 })

      expect(query).not.toHaveBeenCalled()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    // Refused, not ignored. A silent return would leave the previous place's people on
    // screen under the new place's name, with no toast -- the same "nothing happened and
    // nothing was said" this delivery exists to end.
    it('clears what it has and says so when it refuses a centre', async () => {
      const { matches, presence, loading, error, load } = useMatches()
      await load(SEARCH)
      expect(matches.value.length).toBeGreaterThan(0)

      await load({ center: {}, radius: 25 })

      expect(matches.value).toEqual([])
      expect(presence.value).toEqual([])
      expect(error.value?.code).toBe(GMS_REJECTED)
      expect(loading.value).toBe(false)
    })

    // A refusal supersedes what is in flight. Without that, the older search's answer
    // lands afterwards and paints results for a place the member has already left.
    it('lets no earlier search paint after a refusal', async () => {
      let release
      const held = new Promise((resolve) => {
        release = resolve
      })
      fetchMock.mockImplementationOnce(async () => {
        await held
        return okJson([matchedUser()])
      })
      const { matches, load } = useMatches()

      const first = load(SEARCH)
      await load({ center: {}, radius: 25 })
      release()
      await first

      expect(matches.value).toEqual([])
    })

    it('fetches the token fresh and asks both routes with it', async () => {
      const { load } = useMatches()
      await load(SEARCH)

      expect(query).toHaveBeenCalledWith({
        query: authenticateGmsUserSearch,
        fetchPolicy: 'network-only',
      })
      const calls = fetchMock.mock.calls.map(([url, init]) => [url, init.headers.Authorization])
      // Identity-bound answers stay out of the browser's HTTP cache.
      expect(fetchMock.mock.calls.map(([, init]) => init.cache)).toEqual(['no-store', 'no-store'])
      expect(calls).toEqual([
        [
          'https://ki-playground-gms.gradido.net/gms/community-user/matches?latitude=49.28&longitude=9.69&radius=25',
          'Bearer tok-1',
        ],
        [
          'https://ki-playground-gms.gradido.net/gms/community-user/user-locations?latitude=49.28&longitude=9.69&radius=25',
          'Bearer tok-1',
        ],
      ])
    })

    // A person the GMS answers with but nobody can place is dropped, not drawn: an
    // undefined pair makes every distance NaN, and a NaN comparator leaves sort free to
    // order as it likes. `null` would throw inside the try and come out as "not
    // reachable", while the GMS answered 200.
    it('leaves out the people it could not place, rather than drawing them at nothing', async () => {
      fetchMock.mockImplementation(async (url) => {
        if (url.includes('community-user/matches')) {
          return okJson([
            matchedUser(),
            matchedUser({ uuid: 'ohne-ort', alias: 'Ohne', location: [] }),
            matchedUser({ uuid: 'gar-nichts', alias: 'Nichts', location: null }),
          ])
        }
        return okJson([mapUser(), mapUser({ id: 8, alias: 'Leer', location: [] })])
      })
      const { matches, presence, error, load } = useMatches()
      await load(SEARCH)

      expect(matches.value).toHaveLength(1)
      expect(presence.value).toHaveLength(1)
      // ...and no error: the GMS answered, and what it sent that could be placed is shown.
      expect(error.value).toBeNull()
    })

    it('hands the map the matches and the rings, minus the people who glow', async () => {
      const { matches, presence, loading, error, load } = useMatches()
      const pending = load(SEARCH)
      expect(loading.value).toBe(true)
      await pending

      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(matches.value.map((match) => match.name)).toEqual(['Marta'])
      expect(matches.value[0].scores).toEqual({ angebot: [0.595] })
      expect(presence.value).toEqual([
        { id: 2, name: 'Paul', position: { lat: 49.3, lng: 9.7 }, precision: 'ungefaehr' },
      ])
    })

    it('asks the typed route with the words and the stance, and the rings beside it', async () => {
      const { load, error, matches, presence } = useMatches()
      await load({
        ...SEARCH,
        query: { text: ' Klavier ', matchingType: 'gesuch' },
      })
      expect(error.value).toBeNull()
      const urls = fetchMock.mock.calls.map(([url]) => new URL(url))
      expect(urls.map((url) => url.pathname)).toEqual([
        '/gms/community-user/typed-matches',
        '/gms/community-user/user-locations',
      ])
      // The words as typed, trimmed; the stance in the GMS's words; the circle as
      // for every search.
      expect(urls[0].searchParams.get('text')).toBe('Klavier')
      expect(urls[0].searchParams.get('matchingType')).toBe('need')
      expect(urls[0].searchParams.get('radius')).toBe(String(SEARCH.radius))
      expect(matches.value.map((match) => match.uuid)).toEqual([matchedUser().uuid])
      expect(presence.value).toHaveLength(1)
    })

    it('cuts a typed question at what the route reads', async () => {
      const { load } = useMatches()
      await load({ ...SEARCH, query: { text: 'x'.repeat(250), matchingType: 'angebot' } })
      const url = new URL(fetchMock.mock.calls[0][0])
      expect(url.searchParams.get('text')).toHaveLength(200)
      expect(url.searchParams.get('matchingType')).toBe('offer')
    })

    it('reports a route that could not answer, and shows nothing stale', async () => {
      fetchMock.mockImplementation(async () => ({ ok: false, status: 503, json: async () => ({}) }))
      const { matches, presence, loading, error, load } = useMatches()
      await load(SEARCH)

      expect(error.value?.code).toBe(GMS_UNAVAILABLE)
      expect(error.value?.message).toContain('503')
      expect(matches.value).toEqual([])
      expect(presence.value).toEqual([])
      expect(loading.value).toBe(false)
    })

    // ⭐ A 4xx is the GMS answering and refusing, not the GMS being away, and the member
    // is told the two apart. Calling a refusal "not reachable" is what pointed the whole
    // morning of 09.09.2026 at a healthy server: it had answered 400 `must be a number`,
    // correctly, to a search centred on nothing.
    it.each([400, 422])('reports a refusal as a refusal (%i)', async (status) => {
      fetchMock.mockImplementation(async () => ({ ok: false, status, json: async () => ({}) }))
      const { error, load } = useMatches()
      await load(SEARCH)

      expect(error.value?.code).toBe(GMS_REJECTED)
      expect(error.value?.status).toBe(status)
    })

    // ⛔ 401 and 403 are 4xx and are still NOT the member's doing: `load` fetches a fresh
    // access for every search, so a refused token means the community's GMS key is wrong or
    // has run out. Nobody at this end can act on that, and "the search was refused" would
    // blame them for an outage. From where they stand the service is there and not usable.
    it.each([401, 403])(
      'does not blame the member for a key that is not theirs (%i)',
      async (status) => {
        fetchMock.mockImplementation(async () => ({ ok: false, status, json: async () => ({}) }))
        const { error, load } = useMatches()
        await load(SEARCH)

        expect(error.value?.code).toBe(GMS_UNAVAILABLE)
        // The number survives either way -- the suggestions retry keys on it, not on the code.
        expect(error.value?.status).toBe(status)
      },
    )

    it.each([500, 502, 504])('reports a server that broke as unavailable (%i)', async (status) => {
      fetchMock.mockImplementation(async () => ({ ok: false, status, json: async () => ({}) }))
      const { error, load } = useMatches()
      await load(SEARCH)

      expect(error.value?.code).toBe(GMS_UNAVAILABLE)
    })

    it('reports a token that did not come', async () => {
      query.mockRejectedValue(new Error('missing HomeCommunity GmsApiKey'))
      const { error, load } = useMatches()
      await load(SEARCH)

      expect(error.value?.code).toBe(GMS_UNAVAILABLE)
      expect(error.value?.message).toContain('GmsApiKey')
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('lets only the last search asked for write, whatever order the answers land in', async () => {
      // The first search's routes answer only after the second search is through.
      let releaseFirst
      const firstAnswers = new Promise((resolve) => {
        releaseFirst = resolve
      })
      let call = 0
      fetchMock.mockImplementation(async (url) => {
        call += 1
        const first = call <= 2
        if (first) await firstAnswers
        if (url.includes('community-user/matches')) {
          return okJson([matchedUser({ alias: first ? 'Stale' : 'Fresh' })])
        }
        return okJson([])
      })
      const { matches, loading, load } = useMatches()

      const stale = load(SEARCH)
      const fresh = load({ ...SEARCH, radius: 50 })
      await fresh
      expect(matches.value.map((match) => match.name)).toEqual(['Fresh'])
      expect(loading.value).toBe(false)

      releaseFirst()
      await stale
      expect(matches.value.map((match) => match.name)).toEqual(['Fresh'])
    })
  })

  describe('suggest', () => {
    const SUGGEST_URL =
      'https://ki-playground-gms.gradido.net/gms/community-user/vocabulary-suggest'
    const WORDS = {
      words: [
        { word: 'rasenluefter', entries: 12 },
        { word: 'rasen', entries: 3 },
      ],
    }

    let fetchMock

    beforeEach(() => {
      query.mockReset()
      query.mockResolvedValue({ data: { authenticateGmsUserSearch: ACCESS } })
      fetchMock = vi.fn(async () => okJson(WORDS))
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('asks the route with the prefix and the token, and hands back the words', async () => {
      const { suggest } = useMatches()

      expect(await suggest('ras')).toEqual(WORDS.words)
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(`${SUGGEST_URL}?prefix=ras`)
      expect(init.headers.Authorization).toBe('Bearer tok-1')
      // How many is the GMS's to decide - nothing here sends a limit.
      expect(url).not.toContain('limit')
    })

    it('fetches one access for a whole typing session', async () => {
      const { suggest } = useMatches()
      await suggest('ra')
      await suggest('ras')
      await suggest('rase')

      // Three keystrokes, three route calls - and ONE round trip through the wallet
      // backend for the token. Fetching it per call is what this is here to prevent.
      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(query).toHaveBeenCalledTimes(1)
    })

    it('fetches a new access when the kept one is refused, and asks again with it', async () => {
      query
        .mockResolvedValueOnce({ data: { authenticateGmsUserSearch: ACCESS } })
        .mockResolvedValueOnce({
          data: { authenticateGmsUserSearch: { ...ACCESS, token: 'tok-2' } },
        })
      fetchMock
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
        .mockResolvedValueOnce(okJson(WORDS))
      const { suggest } = useMatches()

      expect(await suggest('ras')).toEqual(WORDS.words)
      expect(query).toHaveBeenCalledTimes(2)
      expect(fetchMock.mock.calls.map(([, init]) => init.headers.Authorization)).toEqual([
        'Bearer tok-1',
        'Bearer tok-2',
      ])
    })

    it('retries nothing but the refusal', async () => {
      // 500 is the GMS having a bad day, not a token that ran out. Fetching a second
      // token would not help and would ask the wallet backend for one per keystroke.
      fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
      const { suggest } = useMatches()

      expect(await suggest('ras')).toEqual([])
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(query).toHaveBeenCalledTimes(1)
    })

    it('asks nothing about a single letter', async () => {
      const { suggest } = useMatches()

      expect(await suggest('r')).toEqual([])
      expect(await suggest('  r  ')).toEqual([])
      expect(fetchMock).not.toHaveBeenCalled()
      // Not even the token: a letter is not a question.
      expect(query).not.toHaveBeenCalled()
    })

    it('cuts a prefix longer than the route reads', async () => {
      const { suggest } = useMatches()
      await suggest('r'.repeat(200))

      // The route refuses more than 80 with a 400, and a search field is a place
      // where somebody may well paste a sentence. Cut, and the answer is the empty
      // one it would have been anyway - no word is that long.
      const prefix = new URL(fetchMock.mock.calls[0][0]).searchParams.get('prefix')
      expect(prefix).toHaveLength(80)
    })

    it('leaves the offers empty when the GMS cannot be reached, without raising', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))
      const { suggest } = useMatches()

      // The search has the toast; the offers beside the field say nothing twice.
      expect(await suggest('ras')).toEqual([])
    })
  })
})
