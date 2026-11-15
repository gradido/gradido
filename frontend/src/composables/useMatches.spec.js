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
  toProfile,
  forWindow,
  withMine,
  withProfile,
  withoutMatched,
  GMS_UNAVAILABLE,
  GMS_REJECTED,
  hasUsablePoint,
  isUsablePlace,
  SENTENCE_QUESTIONS_MAX,
  withSameSentence,
} from './useMatches'

// The Apollo client the composable asks for the token. `query` is a spy so a test
// can hand over a token, or refuse one.
const query = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query } }),
}))

// --- the wire shapes, field for field as the GMS declares them ----------------
// backend/src/server/output.schema.ts of the GMS: matchedUserSchema, matchedChannelSchema,
// matchedEntrySchema, mapPresenceSchema, profileUserSchema. A fake fetch proves nothing
// about the other side, so what it answers is copied from the schema, not invented: the
// channel words are the server's (`offer | need | interest`), the point is `[lng, lat]`,
// `strength` is the brightness of a level (0.46 / 0.595 / 0.73 / 0.865), `type` the
// publish location type.

const UUID = {
  marta: '5b1f0a1e-0000-4000-8000-000000000001',
  mine: '5b1f0a1e-0000-4000-8000-000000000002',
  entry: '5b1f0a1e-0000-4000-8000-000000000003',
  community: '5b1f0a1e-0000-4000-8000-000000000004',
  paul: '5b1f0a1e-0000-4000-8000-000000000005',
  other: '5b1f0a1e-0000-4000-8000-000000000006',
  newest: '5b1f0a1e-0000-4000-8000-000000000007',
  mineToo: '5b1f0a1e-0000-4000-8000-000000000008',
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
            matchedSubject: 'lastenrad',
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
  return {
    id: 7,
    uuid: UUID.paul,
    alias: 'Paul',
    type: 1,
    location: [9.7, 49.3],
    community: { uuid: UUID.community, name: 'Gradido Künzelsau' },
    hasEntries: true,
    ...over,
  }
}

/** GET community-user/profile: what the person published, entries newest first. */
function profileUser(over = {}) {
  return {
    uuid: UUID.marta,
    alias: 'Marta',
    aboutMe: 'Ich schraube gern an Rädern.',
    type: 0,
    location: [9.69, 49.28],
    community: { uuid: UUID.community, name: 'Gradido Künzelsau' },
    entries: [
      {
        uuid: UUID.newest,
        matchingType: 'offer',
        summary: 'Lastenrad leihen',
        details: null,
        remote: false,
      },
      {
        uuid: UUID.other,
        matchingType: 'need',
        summary: 'Hilfe im Garten',
        details: 'samstags',
        remote: true,
      },
      {
        uuid: UUID.entry,
        matchingType: 'offer',
        summary: 'Fahrradreparatur',
        details: null,
        remote: false,
      },
    ],
    ...over,
  }
}

/**
 * GET community-user/sentence-matches (gms_workspace#44): `{ total, users }`. Each person with ONE
 * channel and ONE entry -- the oldest of theirs with the sentence --, `strength` 0.865, the entry of
 * mine as `matchedEntryUuid`, `matchedSubject` null.
 */
function sentenceUser(over = {}, mine = UUID.mineToo) {
  return {
    uuid: UUID.paul,
    alias: 'Paul',
    aboutMe: null,
    type: 1,
    location: [9.7, 49.3],
    community: { uuid: UUID.community, name: 'Gradido Künzelsau' },
    channels: [
      {
        matchingType: 'interest',
        strength: 0.865,
        matches: [
          {
            matchedEntryUuid: mine,
            matchedSubject: null,
            uuid: UUID.other,
            summary: 'Kongress Frequency Healing',
            details: null,
            remote: true,
            strength: 0.865,
            score: 3.2,
            coreWord: true,
          },
        ],
      },
    ],
    ...over,
  }
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
              matchedSubject: 'lastenrad',
              summary: 'Fahrradreparatur',
              details: null,
              remote: false,
              strength: 0.595,
              score: 1.4,
              coreWord: true,
              exact: false,
            },
          ],
        },
        scores: {
          angebot: [{ strength: 0.595, entry: UUID.mine, subject: 'lastenrad', exact: false }],
        },
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
      const dim = { strength: 0.46, entry: UUID.mine, subject: 'lastenrad', exact: false }
      expect(match.scores).toEqual({ angebot: [dim], gesuch: [dim], interesse: [dim] })
    })

    it('carries every strength of a channel into the scores, in order, with what it answers', () => {
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
      expect(match.scores).toEqual({
        angebot: [
          { strength: 0.46, entry: UUID.mine, subject: 'lastenrad', exact: false },
          { strength: 0.865, entry: UUID.mine, subject: 'lastenrad', exact: false },
        ],
      })
    })

    // A GMS that does not send the subject yet, or an entry of mine without one: the entry
    // stands in, so the map stays whole and only counts such entries as a thing each. A
    // typed question has no entry of mine behind it at all - nothing to count.
    it('lets my entry stand in for a missing subject, and counts nothing for a typed question', () => {
      const entry = matchedUser().channels[0].matches[0]
      const scoresFor = (over) =>
        toMatch(
          matchedUser({
            channels: [
              { matchingType: 'offer', strength: 0.595, matches: [{ ...entry, ...over }] },
            ],
          }),
        ).scores.angebot[0]

      const withoutSubject = { ...entry }
      delete withoutSubject.matchedSubject
      expect(
        toMatch(
          matchedUser({
            channels: [{ matchingType: 'offer', strength: 0.595, matches: [withoutSubject] }],
          }),
        ).scores.angebot[0],
      ).toEqual({ strength: 0.595, entry: UUID.mine, subject: UUID.mine, exact: false })
      expect(scoresFor({ matchedSubject: null })).toEqual({
        strength: 0.595,
        entry: UUID.mine,
        subject: UUID.mine,
        exact: false,
      })
      expect(scoresFor({ matchedEntryUuid: null, matchedSubject: null })).toEqual({
        strength: 0.595,
        entry: null,
        subject: null,
        exact: false,
      })
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
    // GMS-115: the pair that opens the profile, and whether the ring is filled.
    it('turns a map user into a grey ring that can open a profile', () => {
      expect(toPresence(mapUser())).toEqual({
        id: 7,
        uuid: UUID.paul,
        name: 'Paul',
        community: { uuid: UUID.community, name: 'Gradido Künzelsau' },
        hasEntries: true,
        position: { lat: 49.3, lng: 9.7 },
        precision: 'ungefaehr',
      })
    })

    it('reads a GMS that does not name its rings yet as a hollow ring nobody can open', () => {
      const older = { id: 7, alias: 'Paul', type: 1, location: [9.7, 49.3] }
      expect(toPresence(older)).toEqual({
        id: 7,
        uuid: null,
        name: 'Paul',
        community: null,
        hasEntries: false,
        position: { lat: 49.3, lng: 9.7 },
        precision: 'ungefaehr',
      })
    })
  })

  describe('toProfile', () => {
    it('turns the profile route into the window: every entry, keyed by my words, none with a strength', () => {
      expect(toProfile(profileUser())).toEqual({
        uuid: UUID.marta,
        name: 'Marta',
        community: { uuid: UUID.community, name: 'Gradido Künzelsau' },
        aboutMe: 'Ich schraube gern an Rädern.',
        position: { lat: 49.28, lng: 9.69 },
        precision: 'genau',
        channels: {
          // Newest first, as the GMS sent them.
          angebot: [
            { uuid: UUID.newest, summary: 'Lastenrad leihen', details: null, remote: false },
            { uuid: UUID.entry, summary: 'Fahrradreparatur', details: null, remote: false },
          ],
          gesuch: [
            { uuid: UUID.other, summary: 'Hilfe im Garten', details: 'samstags', remote: true },
          ],
        },
      })
    })

    it('shows a person without entries as a person with none', () => {
      expect(toProfile(profileUser({ entries: [], aboutMe: null })).channels).toEqual({})
    })

    // The profile route is the one read of a location that hasUsablePoint does not stand before.
    // A person named without a point is a profile without a usable place -- not a thrown error,
    // which would read as "the profile could not be loaded" while the GMS answered 200.
    it.each([
      ['no location at all', undefined],
      ['a location of null', null],
      ['an empty location', []],
    ])('builds the window for a person held with %s, with no usable place', (_, location) => {
      const person = toProfile(profileUser({ location }))

      expect(person.name).toBe('Marta')
      expect(person.channels.angebot).toHaveLength(2)
      expect(isUsablePlace(person.position)).toBe(false)
    })
  })

  describe('isUsablePlace', () => {
    it('asks the rule of hasUsablePoint of a point in the shape of the map', () => {
      expect(isUsablePlace({ lat: 49.28, lng: 9.69 })).toBe(true)
      expect(isUsablePlace(toProfile(profileUser()).position)).toBe(true)
      // 120 is a longitude and no latitude: the two are not taken for each other.
      expect(isUsablePlace({ lat: 9.69, lng: 120 })).toBe(true)
      expect(isUsablePlace({ lat: 120, lng: 9.69 })).toBe(false)
      expect(isUsablePlace({ lat: 49.28, lng: 181 })).toBe(false)
    })

    it('finds no place where there are no numbers, or no point at all', () => {
      expect(isUsablePlace({ lat: undefined, lng: undefined })).toBe(false)
      expect(isUsablePlace({ lat: '49.28', lng: '9.69' })).toBe(false)
      expect(isUsablePlace({})).toBe(false)
      expect(isUsablePlace(null)).toBe(false)
      expect(isUsablePlace(undefined)).toBe(false)
    })
  })

  // The matches route sends a record per pair, so an offer that answers two of my entries
  // comes twice: the bright pair first, the dim one last.
  const answeringTwo = () => {
    const entry = matchedUser().channels[0].matches[0]
    return toMatch(
      matchedUser({
        channels: [
          {
            matchingType: 'offer',
            strength: 0.865,
            matches: [
              { ...entry, strength: 0.865, matchedEntryUuid: UUID.mineToo, matchedSubject: 'rad' },
              { ...entry, strength: 0.46 },
            ],
          },
        ],
      }),
    )
  }

  describe('forWindow', () => {
    it('lists an entry of theirs once, however many of mine it answers', () => {
      expect(answeringTwo().channels.angebot).toHaveLength(2)

      const offers = forWindow(answeringTwo()).channels.angebot
      expect(offers.map((entry) => entry.uuid)).toEqual([UUID.entry])
    })

    it('gives it the strongest pair wherever it stands, and names every entry of mine, strongest first', () => {
      const brightFirst = answeringTwo()
      const dimFirst = {
        ...brightFirst,
        channels: { angebot: [...brightFirst.channels.angebot].reverse() },
      }

      for (const match of [brightFirst, dimFirst]) {
        const [offer] = forWindow(match).channels.angebot
        expect(offer.strength).toBe(0.865)
        expect(offer.matchedEntryUuid).toBe(UUID.mineToo)
        expect(offer.matchedSubject).toBe('rad')
        expect(offer.mine).toEqual([UUID.mineToo, UUID.mine])
      }
    })

    it('names an entry of mine once, should two pairs name it', () => {
      const entry = matchedUser().channels[0].matches[0]
      const twice = toMatch(
        matchedUser({
          channels: [
            {
              matchingType: 'offer',
              strength: 0.73,
              matches: [entry, { ...entry, strength: 0.73 }],
            },
          ],
        }),
      )

      expect(forWindow(twice).channels.angebot[0].mine).toEqual([UUID.mine])
    })

    // The bike dealer: two offers of his on one need of mine are two entries in his profile.
    it('keeps apart two entries of theirs that answer the same entry of mine', () => {
      const entry = matchedUser().channels[0].matches[0]
      const dealer = toMatch(
        matchedUser({
          channels: [
            {
              matchingType: 'offer',
              strength: 0.595,
              matches: [entry, { ...entry, uuid: UUID.newest, summary: 'Lastenrad leihen' }],
            },
          ],
        }),
      )

      expect(forWindow(dealer).channels.angebot.map((offer) => [offer.uuid, offer.mine])).toEqual([
        [UUID.entry, [UUID.mine]],
        [UUID.newest, [UUID.mine]],
      ])
    })

    it('names no entry of mine for a typed question', () => {
      const entry = { ...matchedUser().channels[0].matches[0], matchedEntryUuid: null }
      const typed = toMatch(
        matchedUser({ channels: [{ matchingType: 'offer', strength: 0.595, matches: [entry] }] }),
      )

      expect(forWindow(typed).channels.angebot[0].mine).toEqual([])
    })

    it('leaves the map its pairs', () => {
      const match = answeringTwo()
      const shown = forWindow(match)

      expect(shown.scores).toEqual(match.scores)
      expect(match.channels.angebot).toHaveLength(2)
    })

    it('opens a ring, which has no channels, with none', () => {
      expect(forWindow(toPresence(mapUser())).channels).toEqual({})
    })
  })

  describe('withProfile', () => {
    const match = () => toMatch(matchedUser())

    // Bauauftrag D: the profile lists the offer once, the map held it twice - and the
    // window used to keep whichever pair came last, here the dim one and one of my two.
    it('keeps both of my entries and the stronger pair when one entry answers two', () => {
      const offers = withProfile(answeringTwo(), toProfile(profileUser())).channels.angebot
      const repair = offers.filter((entry) => entry.uuid === UUID.entry)

      expect(repair).toHaveLength(1)
      expect(repair[0].strength).toBe(0.865)
      expect(repair[0].mine).toEqual([UUID.mineToo, UUID.mine])
    })

    it('lists a matched entry the profile does not know once, too', () => {
      const offers = withProfile(answeringTwo(), toProfile(profileUser({ entries: [] }))).channels
        .angebot

      expect(offers.map((entry) => [entry.uuid, entry.strength])).toEqual([[UUID.entry, 0.865]])
    })

    // Bernd, 10.09.2026: a match opens the whole person, not only what answers me - the
    // matched entry keeps its strength, everything else comes without one.
    it('lays everything the person published in, the matched entry with its strength', () => {
      const shown = withProfile(match(), toProfile(profileUser()))

      expect(shown.channels.angebot.map((entry) => [entry.summary, entry.strength])).toEqual([
        ['Lastenrad leihen', undefined],
        ['Fahrradreparatur', 0.595],
      ])
      expect(shown.channels.gesuch.map((entry) => entry.strength)).toEqual([undefined])
      // The matched entry is the match's own, so the window can still say what it answers.
      expect(shown.channels.angebot[1].matchedEntryUuid).toBe(UUID.mine)
    })

    it('keeps a matched entry the profile does not list', () => {
      const shown = withProfile(match(), toProfile(profileUser({ entries: [] })))

      expect(shown.channels.angebot.map((entry) => entry.summary)).toEqual(['Fahrradreparatur'])
      expect(shown.channels.angebot[0].strength).toBe(0.595)
    })

    // null is an answer, not a gap: the person has no text now. The match was read
    // earlier from the same column, so its text is the older one.
    it('lets a null about-me from the profile replace the older text of the match', () => {
      const shown = withProfile(match(), toProfile(profileUser({ aboutMe: null })))

      expect(match().aboutMe).toBe('Ich schraube gern an Rädern.')
      expect(shown.aboutMe).toBeNull()
    })

    it('keeps what the map knows and takes about-me from the profile', () => {
      const shown = withProfile(match(), toProfile(profileUser({ aboutMe: 'Neu geschrieben.' })))

      expect(shown.uuid).toBe(UUID.marta)
      expect(shown.position).toEqual({ lat: 49.28, lng: 9.69 })
      expect(shown.scores).toEqual(match().scores)
      expect(shown.aboutMe).toBe('Neu geschrieben.')
    })

    it('fills a ring with the profile, nothing of it matched', () => {
      const ring = toPresence(mapUser({ uuid: UUID.marta }))
      const shown = withProfile(ring, toProfile(profileUser()))

      expect(shown.name).toBe('Paul')
      expect(shown.community).toEqual({ uuid: UUID.community, name: 'Gradido Künzelsau' })
      expect(shown.aboutMe).toBe('Ich schraube gern an Rädern.')
      expect(
        Object.values(shown.channels)
          .flat()
          .every((entry) => entry.strength == null),
      ).toBe(true)
    })
  })

  describe('withMine', () => {
    // My own entries as listMatchingEntries hands them to the map, in the words the wallet
    // stores (`offer | need | interest`).
    const myEntries = [
      {
        uuid: UUID.mine,
        matchingType: 'need',
        summary: 'einen Fahrradmechaniker',
        details: null,
        remote: false,
        active: true,
        createdAt: '2026-09-01T10:00:00.000Z',
      },
      {
        uuid: UUID.mineToo,
        matchingType: 'interest',
        summary: 'Lastenräder',
        details: null,
        remote: false,
        active: true,
        createdAt: '2026-09-02T10:00:00.000Z',
      },
    ]

    it('names the sentence of every entry of mine a match answers, strongest first', () => {
      const [offer] = withMine(forWindow(answeringTwo()), myEntries).channels.angebot

      expect(offer.matches).toEqual([
        { uuid: UUID.mineToo, matchingType: 'interest', summary: 'Lastenräder' },
        { uuid: UUID.mine, matchingType: 'need', summary: 'einen Fahrradmechaniker' },
      ])
    })

    it('passes over an entry of mine that is gone since the search', () => {
      const [offer] = withMine(forWindow(answeringTwo()), [myEntries[0]]).channels.angebot

      expect(offer.matches).toEqual([
        { uuid: UUID.mine, matchingType: 'need', summary: 'einen Fahrradmechaniker' },
      ])
    })

    it('gives an entry nothing matched no lines', () => {
      const shown = withMine(withProfile(answeringTwo(), toProfile(profileUser())), myEntries)
      const newest = shown.channels.angebot.find((entry) => entry.uuid === UUID.newest)

      expect(newest.matches).toBeUndefined()
    })

    it('has nothing to show while no window is open', () => {
      expect(withMine(null, myEntries)).toBeNull()
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
      ['three of them', [9.69, 49.28, 100]],
      ['nothing at all', null],
      ['not an array', { lat: 1, lng: 2 }],
      ['numbers that came as text', ['9.69', '49.28']],
    ])('is no for %s', (_name, location) => {
      expect(hasUsablePoint({ location })).toBe(false)
    })

    // The GMS is a foreign system: nothing our own backend validates protects what comes
    // BACK from it. A latitude of 91 is finite and is not a place; drawn, it lands off the
    // globe.
    it.each([
      ['a latitude past the pole', [9.69, 91]],
      ['a longitude past the meridian', [181, 49.28]],
      ['both past', [-181, -91]],
    ])('is no for %s, finite though it is', (_name, location) => {
      expect(hasUsablePoint({ location })).toBe(false)
    })

    it('is yes at the ends of the globe', () => {
      expect(hasUsablePoint({ location: [180, 90] })).toBe(true)
      expect(hasUsablePoint({ location: [-180, -90] })).toBe(true)
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

  /**
   * The topic search and the sentence questions as one list (KA-020): "genau" means only, and a
   * person is community and account together.
   */
  describe('withSameSentence', () => {
    // A topic match of Marta's for an entry of mine.
    const topicFor = (mine, over = {}) => ({
      ...matchedUser().channels[0].matches[0],
      matchedEntryUuid: mine,
      ...over,
    })
    const withTopics = (matches, over = {}) =>
      matchedUser({ channels: [{ matchingType: 'offer', strength: 0.595, matches }], ...over })
    const entriesOf = (people) =>
      people.map((person) => ({
        uuid: person.uuid,
        community: person.community.uuid,
        entries: person.channels.flatMap((channel) =>
          channel.matches.map((match) => [match.matchedEntryUuid, match.exact === true]),
        ),
      }))

    it('passes the topic answer through untouched where no sentence answered', () => {
      const people = [withTopics([topicFor(UUID.mineToo)])]
      expect(withSameSentence(people, [])).toBe(people)
    })

    it('adds a person who only carries my sentence, with their entry marked', () => {
      const merged = withSameSentence([], [{ entry: UUID.mineToo, users: [sentenceUser()] }])
      expect(entriesOf(merged)).toEqual([
        { uuid: UUID.paul, community: UUID.community, entries: [[UUID.mineToo, true]] },
      ])
    })

    it('leaves out the topic matches of that entry, and a person left with none', () => {
      const merged = withSameSentence(
        [withTopics([topicFor(UUID.mineToo)])],
        [{ entry: UUID.mineToo, users: [] }],
      )
      expect(merged).toEqual([])
    })

    it('keeps the topic matches of my other entries', () => {
      const merged = withSameSentence(
        [withTopics([topicFor(UUID.mine), topicFor(UUID.mineToo)])],
        [{ entry: UUID.mineToo, users: [] }],
      )
      expect(entriesOf(merged)).toEqual([
        { uuid: UUID.marta, community: UUID.community, entries: [[UUID.mine, false]] },
      ])
    })

    it('makes one person of a topic match and a sentence, by community and uuid', () => {
      const merged = withSameSentence(
        [withTopics([topicFor(UUID.mine), topicFor(UUID.mineToo)])],
        [{ entry: UUID.mineToo, users: [sentenceUser({ uuid: UUID.marta, alias: 'Marta' })] }],
      )
      expect(entriesOf(merged)).toEqual([
        {
          uuid: UUID.marta,
          community: UUID.community,
          entries: [
            [UUID.mine, false],
            [UUID.mineToo, true],
          ],
        },
      ])
    })

    // coderabbit (#4296): the filter after the merge drops a person without a usable point.
    it('keeps the usable point of the second answer where the first came without one, and its precision', () => {
      const sentence = sentenceUser({ uuid: UUID.marta, alias: 'Marta', type: 1 })
      const merged = withSameSentence(
        [withTopics([topicFor(UUID.mine)], { location: null, type: 0 })],
        [{ entry: UUID.mineToo, users: [sentence] }],
      )
      expect(merged).toHaveLength(1)
      expect(merged[0].location).toEqual(sentence.location)
      // An approximate point is not labelled exact because the other answer had no point at all.
      expect(precisionOf(merged[0].type)).toBe('ungefaehr')
    })

    it('makes one person of two sentences, whatever the case of the uuids', () => {
      const merged = withSameSentence(
        [],
        [
          { entry: UUID.mine, users: [sentenceUser({}, UUID.mine)] },
          {
            entry: UUID.mineToo,
            users: [
              sentenceUser({
                uuid: UUID.paul.toUpperCase(),
                community: { uuid: UUID.community.toUpperCase(), name: 'Gradido Künzelsau' },
              }),
            ],
          },
        ],
      )
      expect(merged).toHaveLength(1)
      expect(entriesOf(merged)[0].entries).toEqual([
        [UUID.mine, true],
        [UUID.mineToo, true],
      ])
    })

    it('keeps two people apart who share a uuid in two communities', () => {
      const elsewhere = { uuid: UUID.other, name: 'Gradido Hamburg' }
      const merged = withSameSentence(
        [withTopics([topicFor(UUID.mine)], { uuid: UUID.paul })],
        [{ entry: UUID.mineToo, users: [sentenceUser({ community: elsewhere })] }],
      )
      expect(entriesOf(merged).map(({ uuid, community }) => [uuid, community])).toEqual([
        [UUID.paul, UUID.community],
        [UUID.paul, UUID.other],
      ])
    })

    it('takes the nearest of a sentence up to the number, counting only those with a point', () => {
      const people = ['a', 'b', 'c', 'd'].map((alias, index) =>
        sentenceUser({
          uuid: `5b1f0a1e-0000-4000-8000-00000000010${index}`,
          alias,
          location: alias === 'b' ? [] : [9.7, 49.3],
        }),
      )
      const merged = withSameSentence([], [{ entry: UUID.mineToo, users: people }], 2)
      expect(merged.map((person) => person.alias)).toEqual(['a', 'c'])
    })

    /**
     * KA-023 point 8: the sentences that answered take their people in turns -- each its next one,
     * nearest first --, so a small project comes in whole and the places it leaves go to the large
     * ones, and three projects draw no more than one.
     */
    describe('in turns', () => {
      const of = (prefix, count, entry = UUID.mine) =>
        Array.from({ length: count }, (_, index) =>
          sentenceUser(
            {
              uuid: `5b1f0a1e-0000-4000-8000-000000000${prefix}0${index}`,
              alias: `${prefix}${index}`,
            },
            entry,
          ),
        )
      const aliases = (merged) => merged.map((person) => person.alias)

      it('takes the next of each sentence, round after round, up to the number', () => {
        const merged = withSameSentence(
          [],
          [
            { entry: UUID.mine, users: of('1', 4) },
            { entry: UUID.mineToo, users: of('2', 4, UUID.mineToo) },
          ],
          5,
        )
        expect(aliases(merged)).toEqual(['10', '20', '11', '21', '12'])
      })

      it('takes a small project whole and gives the places it leaves to the large one', () => {
        const merged = withSameSentence(
          [],
          [
            { entry: UUID.mine, users: of('1', 2) },
            { entry: UUID.mineToo, users: of('2', 6, UUID.mineToo) },
          ],
          6,
        )
        expect(aliases(merged)).toEqual(['10', '20', '11', '21', '22', '23'])
      })

      it('never takes more than the number, however many sentences answered', () => {
        const answered = Array.from({ length: 10 }, (_, index) => ({
          entry: `entry-${index}`,
          users: of(String(index), 3, `entry-${index}`),
        }))
        expect(withSameSentence([], answered, 7)).toHaveLength(7)
      })

      it('counts somebody in two answers once, and keeps the channels of both', () => {
        const both = sentenceUser({ uuid: UUID.paul, alias: 'Paul' }, UUID.mineToo)
        const merged = withSameSentence(
          [],
          [
            {
              entry: UUID.mine,
              users: [sentenceUser({ uuid: UUID.paul, alias: 'Paul' }, UUID.mine), ...of('1', 2)],
            },
            { entry: UUID.mineToo, users: [both, ...of('2', 2, UUID.mineToo)] },
          ],
          3,
        )
        expect(aliases(merged)).toEqual(['Paul', '10', '20'])
        expect(entriesOf(merged)[0].entries).toEqual([
          [UUID.mine, true],
          [UUID.mineToo, true],
        ])
      })
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

    /**
     * The people who carry the sentence of one of my entries with the "genau" (KA-018, KA-020): one
     * question each, beside the matches, with the same circle, reach and token.
     */
    describe('the people who carry one of my sentences', () => {
      const EXACT = { ...SEARCH, exactUuids: [UUID.mineToo] }
      let sentenceAnswer
      beforeEach(() => {
        sentenceAnswer = async () => okJson({ total: 1, users: [sentenceUser()] })
        const others = fetchMock.getMockImplementation()
        fetchMock.mockImplementation(async (url) => {
          if (url.includes('community-user/sentence-matches')) return sentenceAnswer(url)
          if (url.includes('community-user/matches')) {
            return okJson([
              matchedUser({
                channels: [
                  {
                    matchingType: 'offer',
                    strength: 0.595,
                    matches: [
                      matchedUser().channels[0].matches[0],
                      { ...matchedUser().channels[0].matches[0], matchedEntryUuid: UUID.mineToo },
                    ],
                  },
                ],
              }),
            ])
          }
          return others(url)
        })
      })
      const asked = (route) =>
        fetchMock.mock.calls.map(([url]) => new URL(url)).filter((url) => url.pathname === route)
      const matchedFor = (match) =>
        match.channels.angebot?.map((entry) => entry.matchedEntryUuid) ?? []

      it('asks the sentence route for each entry with the "genau", with the circle, the reach and the token', async () => {
        const { load } = useMatches()
        await load({ ...EXACT, remoteOnly: true, exactUuids: [UUID.mine, UUID.mineToo] })

        const urls = asked('/gms/community-user/sentence-matches')
        expect(urls.map((url) => url.searchParams.get('entry'))).toEqual([UUID.mine, UUID.mineToo])
        for (const url of urls) {
          expect(url.searchParams.get('latitude')).toBe(String(SEARCH.center.lat))
          expect(url.searchParams.get('longitude')).toBe(String(SEARCH.center.lng))
          expect(url.searchParams.get('radius')).toBe(String(SEARCH.radius))
          expect(url.searchParams.get('remote')).toBe('true')
        }
        const sent = fetchMock.mock.calls.filter(([url]) => url.includes('sentence-matches'))
        expect(sent.map(([, init]) => init.headers.Authorization)).toEqual([
          'Bearer tok-1',
          'Bearer tok-1',
        ])
        expect(query).toHaveBeenCalledTimes(1)
      })

      it('asks no sentence for a typed question, and none without an entry with the "genau"', async () => {
        const { load } = useMatches()
        await load({ ...EXACT, query: { text: 'Klavier', matchingType: 'gesuch' } })
        await load(SEARCH)
        expect(asked('/gms/community-user/sentence-matches')).toEqual([])
      })

      // KA-023 point 8: ten, in the order of the list.
      it('asks about ten entries at most, the first ten', async () => {
        const many = Array.from({ length: 12 }, (_, i) => `entry-${i}`)
        const { load } = useMatches()
        await load({ ...SEARCH, exactUuids: many })
        const entries = asked('/gms/community-user/sentence-matches').map((url) =>
          url.searchParams.get('entry'),
        )
        expect(entries).toEqual(many.slice(0, 10))
        expect(SENTENCE_QUESTIONS_MAX).toBe(10)
      })

      it('draws the people of the sentence at the top, drops the topic matches of that entry, and the rings under them', async () => {
        const { load, matches, presence, error } = useMatches()
        await load(EXACT)

        expect(error.value).toBeNull()
        expect(matches.value.map((match) => match.name)).toEqual(['Marta', 'Paul'])
        expect(matchedFor(matches.value[0])).toEqual([UUID.mine])
        const paul = matches.value[1]
        expect(paul.scores.interesse).toEqual([
          { strength: 0.865, entry: UUID.mineToo, subject: UUID.mineToo, exact: true },
        ])
        // Marta glows and Paul now too: no ring under either.
        expect(presence.value).toEqual([])
      })

      it.each([404, 400])(
        'searches with that entry as without its "genau" where the GMS answers %s, and says nothing',
        async (status) => {
          sentenceAnswer = async () => ({ ok: false, status, json: async () => ({}) })
          const { load, matches, presence, error } = useMatches()
          await load(EXACT)

          expect(error.value).toBeNull()
          expect(matches.value.map((match) => match.name)).toEqual(['Marta'])
          expect(matchedFor(matches.value[0])).toEqual([UUID.mine, UUID.mineToo])
          expect(presence.value.map((person) => person.name)).toEqual(['Paul'])
        },
      )

      it('keeps the "genau" of one entry where another one is answered 404', async () => {
        sentenceAnswer = async (url) =>
          url.includes(`entry=${UUID.mine}`)
            ? { ok: false, status: 404, json: async () => ({}) }
            : okJson({ total: 1, users: [sentenceUser()] })
        const { load, matches } = useMatches()
        await load({ ...SEARCH, exactUuids: [UUID.mine, UUID.mineToo] })

        expect(matches.value.map((match) => match.name)).toEqual(['Marta', 'Paul'])
        expect(matchedFor(matches.value[0])).toEqual([UUID.mine])
      })

      it.each([401, 403, 500, 503])(
        'fails the search where the GMS answers the sentence %s',
        async (status) => {
          sentenceAnswer = async () => ({ ok: false, status, json: async () => ({}) })
          const { load, matches, presence, error } = useMatches()
          await load(EXACT)

          expect(error.value?.code).toBe(GMS_UNAVAILABLE)
          expect(matches.value).toEqual([])
          expect(presence.value).toEqual([])
        },
      )

      it('fails the search where the sentence question cannot reach the GMS', async () => {
        sentenceAnswer = async () => {
          throw new TypeError('Failed to fetch')
        }
        const { load, matches, error } = useMatches()
        await load(EXACT)

        expect(error.value?.code).toBe(GMS_UNAVAILABLE)
        expect(matches.value).toEqual([])
      })

      it('lets a search that was overtaken write nothing, not even with its late sentence', async () => {
        let release
        sentenceAnswer = () =>
          new Promise((resolve) => {
            release = () => resolve(okJson({ total: 1, users: [sentenceUser()] }))
          })
        const { load, matches } = useMatches()
        const first = load(EXACT)
        await vi.waitFor(() => expect(release).toBeTypeOf('function'))
        const firstRelease = release
        sentenceAnswer = async () => okJson({ total: 0, users: [] })
        await load(EXACT)
        expect(matches.value.map((match) => match.name)).toEqual(['Marta'])

        firstRelease()
        await first
        expect(matches.value.map((match) => match.name)).toEqual(['Marta'])
      })

      /**
       * How many people in the circle carry each sentence (`sentenceTotals`), for the tick at the
       * map: written with the people of the same answer, under the same `latest`, and emptied
       * wherever they are (Falle 10).
       */
      describe('how many carry it', () => {
        const held = (total) => {
          let release
          sentenceAnswer = () =>
            new Promise((resolve) => {
              release = () => resolve(okJson({ total, users: [sentenceUser()] }))
            })
          return () => release
        }

        it('hands back the number of each sentence that answered, by entry', async () => {
          sentenceAnswer = async (url) =>
            url.includes(`entry=${UUID.mine}`)
              ? { ok: false, status: 404, json: async () => ({}) }
              : okJson({ total: 1500, users: [sentenceUser()] })
          const { load, sentenceTotals } = useMatches()
          await load({ ...SEARCH, exactUuids: [UUID.mine, UUID.mineToo] })

          // The entry answered 404 searches as without its "genau": no number for it.
          expect(sentenceTotals.value).toEqual({ [UUID.mineToo]: 1500 })
        })

        it('takes nobody as a number too', async () => {
          sentenceAnswer = async () => okJson({ total: 0, users: [] })
          const { load, sentenceTotals } = useMatches()
          await load(EXACT)

          expect(sentenceTotals.value).toEqual({ [UUID.mineToo]: 0 })
        })

        it.each([
          ['below zero', -1],
          ['a fraction', 2.5],
          ['text', '12'],
          ['missing', undefined],
          ['null', null],
          ['too big to count', 2 ** 53],
        ])('takes no number that is %s, and the people all the same', async (_what, total) => {
          sentenceAnswer = async () => okJson({ total, users: [sentenceUser()] })
          const { load, sentenceTotals, matches } = useMatches()
          await load(EXACT)

          expect(sentenceTotals.value).toEqual({ [UUID.mineToo]: null })
          expect(matches.value.map((match) => match.name)).toEqual(['Marta', 'Paul'])
        })

        it('has none for a typed question', async () => {
          const { load, sentenceTotals } = useMatches()
          await load(EXACT)
          expect(sentenceTotals.value).toEqual({ [UUID.mineToo]: 1 })

          await load({ ...EXACT, query: { text: 'Klavier', matchingType: 'gesuch' } })
          expect(sentenceTotals.value).toEqual({})
        })

        it('keeps none where the search fails', async () => {
          const { load, sentenceTotals } = useMatches()
          await load(EXACT)
          sentenceAnswer = async () => ({ ok: false, status: 500, json: async () => ({}) })

          await load(EXACT)
          expect(sentenceTotals.value).toEqual({})
        })

        it('keeps none where the centre is no place', async () => {
          const { load, sentenceTotals } = useMatches()
          await load(EXACT)

          await load({ ...EXACT, center: {} })
          expect(sentenceTotals.value).toEqual({})
        })

        it('lets a search that was overtaken write no number', async () => {
          const releaseOf = held(7)
          const { load, sentenceTotals } = useMatches()
          const first = load(EXACT)
          await vi.waitFor(() => expect(releaseOf()).toBeTypeOf('function'))
          const firstRelease = releaseOf()
          sentenceAnswer = async () => okJson({ total: 3, users: [] })
          await load(EXACT)
          expect(sentenceTotals.value).toEqual({ [UUID.mineToo]: 3 })

          firstRelease()
          await first
          expect(sentenceTotals.value).toEqual({ [UUID.mineToo]: 3 })
        })
      })

      /**
       * A search that asks other sentences than the answer on screen was for takes that answer
       * down at once (Falle 15): the markers are drawn by hand, and nothing of an answer to other
       * sentences fits what the member now asks for. `askingAnew` says so until its own is there.
       */
      describe('a search that asks other sentences', () => {
        it('takes the answer on screen down at once, and says so until its own is there', async () => {
          const { load, matches, presence, sentenceTotals, askingAnew } = useMatches()
          await load(SEARCH)
          expect(matches.value.map((match) => match.name)).toEqual(['Marta'])
          expect(presence.value.map((person) => person.name)).toEqual(['Paul'])
          let release
          sentenceAnswer = () =>
            new Promise((resolve) => {
              release = () => resolve(okJson({ total: 1, users: [sentenceUser()] }))
            })

          const asking = load(EXACT)
          expect(matches.value).toEqual([])
          expect(presence.value).toEqual([])
          expect(sentenceTotals.value).toEqual({})
          expect(askingAnew.value).toBe(true)

          await vi.waitFor(() => expect(release).toBeTypeOf('function'))
          release()
          await asking
          expect(matches.value.map((match) => match.name)).toEqual(['Marta', 'Paul'])
          expect(sentenceTotals.value).toEqual({ [UUID.mineToo]: 1 })
          expect(askingAnew.value).toBe(false)
        })

        it('takes it down as well where the sentences go', async () => {
          const { load, matches, sentenceTotals, askingAnew } = useMatches()
          await load(EXACT)

          const asking = load(SEARCH)
          expect(matches.value).toEqual([])
          expect(sentenceTotals.value).toEqual({})
          expect(askingAnew.value).toBe(true)

          await asking
          expect(matches.value.map((match) => match.name)).toEqual(['Marta'])
          expect(askingAnew.value).toBe(false)
        })

        it('takes nothing down for the same sentences, in whatever order', async () => {
          const { load, matches, askingAnew } = useMatches()
          await load({ ...SEARCH, exactUuids: [UUID.mine, UUID.mineToo] })
          const before = matches.value

          const asking = load({ ...SEARCH, radius: 30, exactUuids: [UUID.mineToo, UUID.mine] })
          expect(matches.value).toBe(before)
          expect(askingAnew.value).toBe(false)
          await asking
        })

        // A member without a "genau" anywhere: a search is what it always was.
        it('takes nothing down where no sentence is asked, before or now', async () => {
          const { load, matches, presence, askingAnew } = useMatches()
          await load(SEARCH)
          const [before, ringsBefore] = [matches.value, presence.value]

          const asking = load({ ...SEARCH, radius: 30 })
          expect(matches.value).toBe(before)
          expect(presence.value).toBe(ringsBefore)
          expect(askingAnew.value).toBe(false)
          await asking
        })

        // Compared is what is asked after the cut to the limit, not what the page named.
        it('takes nothing down where only entries past the limit differ', async () => {
          const many = Array.from({ length: SENTENCE_QUESTIONS_MAX }, (_, i) => `entry-${i}`)
          const { load, matches, askingAnew } = useMatches()
          await load({ ...SEARCH, exactUuids: [...many, 'beyond-one'] })
          const before = matches.value

          const asking = load({ ...SEARCH, exactUuids: [...many, 'beyond-two'] })
          expect(matches.value).toBe(before)
          expect(askingAnew.value).toBe(false)
          await asking
        })

        it('stops saying so where that search fails', async () => {
          const { load, askingAnew, error } = useMatches()
          await load(EXACT)
          fetchMock.mockImplementation(async () => ({
            ok: false,
            status: 500,
            json: async () => ({}),
          }))

          await load(SEARCH)
          expect(error.value?.code).toBe(GMS_UNAVAILABLE)
          expect(askingAnew.value).toBe(false)
        })

        // Tick, untick, tick again in quick succession: the answer on screen is down after the
        // first change, so the third question takes nothing more down -- and its answer is the one
        // that ends the waiting, not the overtaken one before it.
        it('keeps saying so through an overtaken search, until the last one answers', async () => {
          const { load, matches, askingAnew } = useMatches()
          await load(EXACT)
          // Both topic answers held, and let go one after the other, in the order they were asked.
          const releases = []
          const others = fetchMock.getMockImplementation()
          fetchMock.mockImplementation((url) =>
            url.includes('community-user/matches')
              ? new Promise((resolve) => {
                  releases.push(() => resolve(others(url)))
                })
              : others(url),
          )

          const untick = load(SEARCH)
          const tickAgain = load(EXACT)
          expect(askingAnew.value).toBe(true)
          await vi.waitFor(() => expect(releases).toHaveLength(2))

          releases[0]()
          await untick
          expect(askingAnew.value).toBe(true)
          expect(matches.value).toEqual([])

          releases[1]()
          await tickAgain
          expect(askingAnew.value).toBe(false)
          expect(matches.value.map((match) => match.name)).toEqual(['Marta', 'Paul'])
        })
      })
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
            // ⚠️ The alias is shared with one of the rings below ON PURPOSE. withoutMatched
            // compares the alias FIRST and `&&` short-circuits, so a person without a place
            // is only ever dereferenced when somebody else carries the same name -- and a
            // fixture without that collision passes whether the filtering is in the right
            // order or not. It was, until coderabbit named it on 10.09.2026.
            matchedUser({ uuid: 'gar-nichts', alias: 'Paul', location: null }),
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
      expect(matches.value[0].scores).toEqual({
        angebot: [{ strength: 0.595, entry: UUID.mine, subject: 'lastenrad', exact: false }],
      })
      expect(presence.value).toEqual([
        {
          id: 2,
          uuid: UUID.paul,
          name: 'Paul',
          community: { uuid: UUID.community, name: 'Gradido Künzelsau' },
          hasEntries: true,
          position: { lat: 49.3, lng: 9.7 },
          precision: 'ungefaehr',
        },
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

    it('carries the reach on whichever match route is asked, and never on the rings', async () => {
      const { load } = useMatches()
      await load({ ...SEARCH, remoteOnly: true })
      await load({ ...SEARCH, remoteOnly: true, query: { text: 'Geige', matchingType: 'gesuch' } })

      const urls = fetchMock.mock.calls.map(([url]) => new URL(url))
      // Both match routes carry it - the typed one by construction, because its
      // parameters are built on the same function.
      expect(urls.map((url) => url.pathname)).toEqual([
        '/gms/community-user/matches',
        '/gms/community-user/typed-matches',
      ])
      expect(urls.map((url) => url.searchParams.get('remote'))).toEqual(['true', 'true'])
      // And the gegenprobe: without the reach the parameter is absent, not 'false'.
      fetchMock.mockClear()
      await load(SEARCH)
      const plain = new URL(fetchMock.mock.calls[0][0])
      expect(plain.searchParams.has('remote')).toBe(false)
    })

    it('draws no rings in the wide reach: the route is not asked at all', async () => {
      const { load, presence, matches } = useMatches()
      await load({ ...SEARCH, remoteOnly: true })

      const paths = fetchMock.mock.calls.map(([url]) => new URL(url).pathname)
      expect(paths).not.toContain('/gms/community-user/user-locations')
      // Not asked AND nothing left standing from a search before it: everything
      // downstream reads an empty list, which is a shape it already handles.
      expect(presence.value).toEqual([])
      // The matches themselves are untouched by the reach on this side.
      expect(matches.value.map((match) => match.uuid)).toEqual([matchedUser().uuid])

      // Back to the regional reach and the rings come with it - the same load, so a
      // green half above cannot be the route simply never being asked.
      await load(SEARCH)
      expect(fetchMock.mock.calls.map(([url]) => new URL(url).pathname)).toContain(
        '/gms/community-user/user-locations',
      )
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

  describe('profile', () => {
    const PROFILE_URL = 'https://ki-playground-gms.gradido.net/gms/community-user/profile'

    let fetchMock

    beforeEach(() => {
      query.mockReset()
      query.mockResolvedValue({ data: { authenticateGmsUserSearch: ACCESS } })
      fetchMock = vi.fn(async () => okJson(profileUser()))
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('asks for the person by the pair, and hands back the window', async () => {
      const { profile } = useMatches()

      expect(await profile(UUID.marta, UUID.community)).toEqual(toProfile(profileUser()))
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(`${PROFILE_URL}?uuid=${UUID.marta}&community=${UUID.community}`)
      expect(init.headers.Authorization).toBe('Bearer tok-1')
    })

    // The GMS answered: a person it holds without a point comes back as a person, and the
    // caller that needs the point finds none (coderabbit, PR #4115).
    it.each([
      ['no location at all', undefined],
      ['a location of null', null],
    ])('hands back a person held with %s instead of failing', async (_, location) => {
      fetchMock.mockImplementation(async () => okJson(profileUser({ location })))
      const { profile } = useMatches()

      const person = await profile(UUID.marta, UUID.community)

      expect(person.name).toBe('Marta')
      expect(isUsablePlace(person.position)).toBe(false)
    })

    // A window opens on every tap. One round trip through the wallet backend for a
    // token per tap is what the kept access is for - shared with the suggestions.
    it('keeps one access for the profiles and the suggestions together', async () => {
      const { profile, suggest } = useMatches()
      fetchMock.mockImplementation(async (url) =>
        okJson(url.includes('vocabulary-suggest') ? { words: [] } : profileUser()),
      )

      await profile(UUID.marta, UUID.community)
      await suggest('ras')
      await profile(UUID.paul, UUID.community)

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
        .mockResolvedValueOnce(okJson(profileUser()))
      const { profile } = useMatches()

      expect((await profile(UUID.marta, UUID.community)).name).toBe('Marta')
      expect(fetchMock.mock.calls.map(([, init]) => init.headers.Authorization)).toEqual([
        'Bearer tok-1',
        'Bearer tok-2',
      ])
    })

    // The page shows what the window already has and says the profile did not come;
    // it can only do that if the failure reaches it.
    it('throws a pair that names nobody as a refusal, and an outage as one, asking once', async () => {
      const { profile } = useMatches()

      fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      await expect(profile(UUID.marta, UUID.community)).rejects.toMatchObject({
        code: GMS_REJECTED,
      })

      fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      await expect(profile(UUID.marta, UUID.community)).rejects.toMatchObject({
        code: GMS_UNAVAILABLE,
      })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    // The GMS caps a channel at a hundred; the window shows what came, and cuts nothing
    // of its own on the way.
    it('passes on as many entries as the GMS sent', async () => {
      const offers = Array.from({ length: 100 }, (_, i) => ({
        uuid: `5b1f0a1e-0000-4000-8000-${String(1000 + i).padStart(12, '0')}`,
        matchingType: 'offer',
        summary: `offer ${i}`,
        details: null,
        remote: false,
      }))
      fetchMock.mockResolvedValueOnce(okJson(profileUser({ entries: offers })))
      const { profile } = useMatches()

      expect((await profile(UUID.marta, UUID.community)).channels.angebot).toHaveLength(100)
    })
  })
})
