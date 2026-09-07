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
  TYPED_QUERY_UNAVAILABLE,
  GMS_UNAVAILABLE,
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

    it('fetches the token fresh and asks both routes with it', async () => {
      const { load } = useMatches()
      await load(SEARCH)

      expect(query).toHaveBeenCalledWith({
        query: authenticateGmsUserSearch,
        fetchPolicy: 'network-only',
      })
      const calls = fetchMock.mock.calls.map(([url, init]) => [url, init.headers.Authorization])
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

    it('refuses a typed question out loud and still loads the rings', async () => {
      const { matches, presence, error, load } = useMatches()
      await load({ ...SEARCH, query: { text: 'Klavier', matchingType: 'gesuch' } })

      expect(error.value?.code).toBe(TYPED_QUERY_UNAVAILABLE)
      expect(matches.value).toEqual([])
      expect(presence.value.map((person) => person.name)).toEqual(['Marta', 'Paul'])
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        'https://ki-playground-gms.gradido.net/gms/community-user/user-locations?latitude=49.28&longitude=9.69&radius=25',
      ])
    })

    it('reports a route that answers with an error, and shows nothing stale', async () => {
      fetchMock.mockImplementation(async () => ({ ok: false, status: 401, json: async () => ({}) }))
      const { matches, presence, loading, error, load } = useMatches()
      await load(SEARCH)

      expect(error.value?.code).toBe(GMS_UNAVAILABLE)
      expect(error.value?.message).toContain('401')
      expect(matches.value).toEqual([])
      expect(presence.value).toEqual([])
      expect(loading.value).toBe(false)
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
})
