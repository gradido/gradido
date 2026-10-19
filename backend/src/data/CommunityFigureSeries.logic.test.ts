// AI-GENERATED — not an architecture reference
// Unit tests: which weeks the series has, which count each row asks from which Monday, and how
// the weeks a count answers are laid on the weeks of the series. The counts themselves are
// replaced; what they count is tested against the database in `database`.
// Written to run under jest and `bun test --isolate` alike (see validateCommunities.test.ts).
import type { WeeklyCount } from 'database'

// The values of the enum the figures read, as the enum spells them.
const mockEventType = {
  USER_REGISTER: 'USER_REGISTER',
  USER_REGISTER_GUARANTOR: 'USER_REGISTER_GUARANTOR',
  USER_REGISTER_REDEEM: 'USER_REGISTER_REDEEM',
  GUARANTOR_CODE_SHOW: 'GUARANTOR_CODE_SHOW',
  EVENT_MATCHING_ENTRY_NOTE: 'EVENT_MATCHING_ENTRY_NOTE',
  USER_LOGIN: 'USER_LOGIN',
  FIRST_CREATION_DONE: 'FIRST_CREATION_DONE',
  FIRST_CREATION_SKIP: 'FIRST_CREATION_SKIP',
  FIRST_CREATION_REVIEW: 'FIRST_CREATION_REVIEW',
  CHAT_HELLO_SEND: 'CHAT_HELLO_SEND',
  CHAT_VIDEO_ROOM_CREATE: 'CHAT_VIDEO_ROOM_CREATE',
}
// The booking types the figures ask for, with the numbers the enum gives them.
const mockTransactionTypeId = { CREATION: 1, SEND: 2 }
const mockDatabase = {
  EventType: mockEventType,
  TransactionTypeId: mockTransactionTypeId,
  dbCountAndSumTransactionsOfTypeByWeek: jest.fn(),
  dbCountChatConversationsOfKindByWeek: jest.fn(),
  dbCountDistinctUsersOfTypeByWeek: jest.fn(),
  dbCountEventsOfTypesByWeek: jest.fn(),
  dbCountFirstCreationMembersByWeek: jest.fn(),
  dbCountMatchingEntriesByTypeByWeek: jest.fn(),
  dbCountRegisterEventsWithReferrerByWeek: jest.fn(),
  dbCountUsersDeletedByWeek: jest.fn(),
}

jest.mock('database', () => mockDatabase)

type SeriesModule = typeof import('./CommunityFigureSeries.logic')
let countCommunityFigureSeries: SeriesModule['countCommunityFigureSeries']
let mondayOf: SeriesModule['mondayOf']
let weeksFrom: SeriesModule['weeksFrom']

beforeAll(async () => {
  ;({ countCommunityFigureSeries, mondayOf, weeksFrom } = await import(
    './CommunityFigureSeries.logic'
  ))
})

// Chosen on a Thursday afternoon; asked on a Wednesday two weeks later. The weeks: the one of
// Monday 28 September, the one of 5 October, and the running one of 12 October.
const SINCE = new Date('2026-10-01T15:00:00.000Z')
const NOW = new Date('2026-10-14T12:00:00.000Z')
const FROM = new Date('2026-09-28T00:00:00.000Z')
const WEEKS = ['2026-09-28', '2026-10-05', '2026-10-12']

/** A count's answer: the weeks it found, with their numbers -- a week without a row is missing. */
const found = (first: number | null, second: number | null, third: number | null): WeeklyCount[] =>
  [first, second, third].flatMap((n, index) => (n === null ? [] : [{ weekStart: WEEKS[index], n }]))

// Every count answers with numbers of its own, so a row that reads another count's numbers, or
// puts them into another week, shows. Most leave out the middle week.
const byTypes: Record<string, WeeklyCount[]> = {
  'USER_REGISTER,USER_REGISTER_GUARANTOR,USER_REGISTER_REDEEM': found(11, null, 13),
  USER_REGISTER_GUARANTOR: found(21, null, 23),
  USER_REGISTER_REDEEM: found(null, 32, null),
  GUARANTOR_CODE_SHOW: found(61, null, 63),
  EVENT_MATCHING_ENTRY_NOTE: found(141, null, 143),
  CHAT_HELLO_SEND: found(151, null, 153),
  CHAT_VIDEO_ROOM_CREATE: found(161, null, 163),
}
const membersByTypeAndColumn: Record<string, WeeklyCount[]> = {
  'USER_REGISTER_GUARANTOR acting': found(51, null, 53),
  'USER_LOGIN affected': found(81, 82, 83),
}
const firstCreationsByType: Record<string, WeeklyCount[]> = {
  FIRST_CREATION_DONE: found(111, null, 113),
  FIRST_CREATION_SKIP: found(121, null, 123),
  FIRST_CREATION_REVIEW: found(null, null, null),
}
const bookingsByType: Record<number, { weekStart: string; n: number; gdd: number }[]> = {
  2: [
    { weekStart: WEEKS[0], n: 171, gdd: 181 },
    { weekStart: WEEKS[2], n: 173, gdd: 183 },
  ],
  1: [{ weekStart: WEEKS[1], n: 192, gdd: 202 }],
}
const conversationsByKind: Record<string, WeeklyCount[]> = {
  direct: found(281, null, 283),
  group: found(291, null, 293),
}

// What each count answers, by its name.
const answers: Record<string, (...args: never[]) => Promise<unknown>> = {
  dbCountEventsOfTypesByWeek: async (types: string[]) => byTypes[types.join(',')],
  dbCountRegisterEventsWithReferrerByWeek: async () => found(41, null, 43),
  dbCountDistinctUsersOfTypeByWeek: async (type: string, column: string) =>
    membersByTypeAndColumn[`${type} ${column}`],
  dbCountUsersDeletedByWeek: async () => found(91, null, 93),
  dbCountFirstCreationMembersByWeek: async (type: string) => firstCreationsByType[type],
  dbCountAndSumTransactionsOfTypeByWeek: async (typeId: number) => bookingsByType[typeId],
  // Nobody wrote a need: the answer has no line for it. A love in two weeks, an offer in one.
  dbCountMatchingEntriesByTypeByWeek: async () => [
    { matchingType: 'interest', weekStart: WEEKS[0], n: 231 },
    { matchingType: 'offer', weekStart: WEEKS[1], n: 242 },
    { matchingType: 'interest', weekStart: WEEKS[2], n: 233 },
  ],
  dbCountChatConversationsOfKindByWeek: async (kind: string) => conversationsByKind[kind],
}
const countsOf = mockDatabase as unknown as Record<string, jest.Mock>

// reset, not only clear: an answer a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
  for (const [name, answer] of Object.entries(answers)) {
    countsOf[name].mockImplementation(answer)
  }
})

describe('mondayOf', () => {
  it('takes a moment to the Monday of its week, at 00:00 UTC', () => {
    expect(mondayOf(new Date('2026-10-15T18:30:00.000Z'))).toEqual(
      new Date('2026-10-12T00:00:00.000Z'),
    )
  })

  it('keeps a Monday where it is, from its first moment on', () => {
    expect(mondayOf(new Date('2026-10-12T00:00:00.000Z'))).toEqual(
      new Date('2026-10-12T00:00:00.000Z'),
    )
  })

  it('takes the last moment of a Sunday to the Monday before it', () => {
    expect(mondayOf(new Date('2026-10-18T23:59:59.999Z'))).toEqual(
      new Date('2026-10-12T00:00:00.000Z'),
    )
  })

  it('reaches back over the turn of a year', () => {
    expect(mondayOf(new Date('2027-01-01T12:00:00.000Z'))).toEqual(
      new Date('2026-12-28T00:00:00.000Z'),
    )
  })

  it('keeps a moment of the first hundred years in its own century', () => {
    // A Wednesday in the year 50; read through Date.UTC it would be one in 1950.
    expect(mondayOf(new Date('0050-03-10T12:00:00.000Z'))).toEqual(
      new Date('0050-03-07T00:00:00.000Z'),
    )
  })
})

describe('weeksFrom', () => {
  it('gives every Monday from the week of the chosen day to the running week', () => {
    expect(weeksFrom(SINCE, NOW).map((week) => week.toISOString())).toEqual([
      '2026-09-28T00:00:00.000Z',
      '2026-10-05T00:00:00.000Z',
      '2026-10-12T00:00:00.000Z',
    ])
  })

  it('gives the running week alone for a day chosen in it', () => {
    expect(weeksFrom(new Date('2026-10-12T00:00:00.000Z'), NOW)).toEqual([
      new Date('2026-10-12T00:00:00.000Z'),
    ])
  })

  it('gives no week for a day still to come in another week', () => {
    expect(weeksFrom(new Date('2026-10-19T00:00:00.000Z'), NOW)).toEqual([])
  })

  it('reaches back two years at most, however far back the day lies', () => {
    for (const since of ['2020-01-01T00:00:00.000Z', '0202-10-15T00:00:00.000Z']) {
      const weeks = weeksFrom(new Date(since), NOW)
      expect(weeks).toHaveLength(104)
      expect(weeks[0]).toEqual(new Date('2024-10-21T00:00:00.000Z'))
      expect(weeks[103]).toEqual(new Date('2026-10-12T00:00:00.000Z'))
    }
    // A day within the two years keeps its own week.
    expect(weeksFrom(new Date('2024-10-23T00:00:00.000Z'), NOW)).toHaveLength(104)
    expect(weeksFrom(new Date('2024-10-28T00:00:00.000Z'), NOW)).toHaveLength(103)
  })
})

describe('countCommunityFigureSeries', () => {
  it('answers the flows in the order of the page, each with its own count laid on the weeks, 0 where a week has none', async () => {
    const series = await countCommunityFigureSeries(SINCE, NOW)

    expect(series.weeks).toEqual(WEEKS.map((week) => new Date(`${week}T00:00:00.000Z`)))
    expect(series.rows).toEqual([
      { key: 'accountsNew', counts: [11, 0, 13] },
      { key: 'accountsViaTableCode', counts: [21, 0, 23] },
      { key: 'accountsViaLink', counts: [0, 32, 0] },
      { key: 'accountsViaAddress', counts: [41, 0, 43] },
      { key: 'accountsViaEvent', counts: [141, 0, 143] },
      { key: 'hostsWithGuest', counts: [51, 0, 53] },
      { key: 'codesShown', counts: [61, 0, 63] },
      { key: 'activeAccounts', counts: [81, 82, 83] },
      { key: 'accountsDeleted', counts: [91, 0, 93] },
      { key: 'firstCreationsDone', counts: [111, 0, 113] },
      { key: 'firstCreationsSkipped', counts: [121, 0, 123] },
      // No week with one: none of it, in every week.
      { key: 'firstCreationsReview', counts: [0, 0, 0] },
      { key: 'transfersSent', counts: [171, 0, 173] },
      { key: 'gddSent', counts: [181, 0, 183] },
      { key: 'creationsBooked', counts: [0, 192, 0] },
      { key: 'gddCreated', counts: [0, 202, 0] },
      { key: 'entriesInterest', counts: [231, 0, 233] },
      { key: 'entriesOffer', counts: [0, 242, 0] },
      // A kind nobody wrote.
      { key: 'entriesNeed', counts: [0, 0, 0] },
      { key: 'conversationsNew', counts: [281, 0, 283] },
      { key: 'groupsNew', counts: [291, 0, 293] },
      { key: 'hellosFromMap', counts: [151, 0, 153] },
      { key: 'videoRoomsCreated', counts: [161, 0, 163] },
    ])
  })

  it('asks every count from the Monday of the week the chosen day lies in', async () => {
    await countCommunityFigureSeries(SINCE, NOW)

    for (const types of [
      ['USER_REGISTER', 'USER_REGISTER_GUARANTOR', 'USER_REGISTER_REDEEM'],
      ['USER_REGISTER_GUARANTOR'],
      ['USER_REGISTER_REDEEM'],
      ['GUARANTOR_CODE_SHOW'],
      ['EVENT_MATCHING_ENTRY_NOTE'],
      ['CHAT_HELLO_SEND'],
      ['CHAT_VIDEO_ROOM_CREATE'],
    ]) {
      expect(mockDatabase.dbCountEventsOfTypesByWeek).toHaveBeenCalledWith(types, FROM)
    }
    expect(mockDatabase.dbCountRegisterEventsWithReferrerByWeek).toHaveBeenCalledWith(FROM)
    expect(mockDatabase.dbCountDistinctUsersOfTypeByWeek).toHaveBeenCalledWith(
      'USER_REGISTER_GUARANTOR',
      'acting',
      FROM,
    )
    // Signed in, each once in a week.
    expect(mockDatabase.dbCountDistinctUsersOfTypeByWeek).toHaveBeenCalledWith(
      'USER_LOGIN',
      'affected',
      FROM,
    )
    expect(mockDatabase.dbCountUsersDeletedByWeek).toHaveBeenCalledWith(FROM)
    for (const type of ['FIRST_CREATION_DONE', 'FIRST_CREATION_SKIP', 'FIRST_CREATION_REVIEW']) {
      expect(mockDatabase.dbCountFirstCreationMembersByWeek).toHaveBeenCalledWith(type, FROM)
    }
    expect(mockDatabase.dbCountChatConversationsOfKindByWeek).toHaveBeenCalledWith('direct', FROM)
    expect(mockDatabase.dbCountChatConversationsOfKindByWeek).toHaveBeenCalledWith('group', FROM)
  })

  it('asks a count that fills several rows once, not once per row', async () => {
    await countCommunityFigureSeries(SINCE, NOW)

    expect(mockDatabase.dbCountAndSumTransactionsOfTypeByWeek).toHaveBeenCalledTimes(2)
    expect(mockDatabase.dbCountAndSumTransactionsOfTypeByWeek).toHaveBeenCalledWith(2, FROM)
    expect(mockDatabase.dbCountAndSumTransactionsOfTypeByWeek).toHaveBeenCalledWith(1, FROM)
    expect(mockDatabase.dbCountMatchingEntriesByTypeByWeek).toHaveBeenCalledTimes(1)
    expect(mockDatabase.dbCountMatchingEntriesByTypeByWeek).toHaveBeenCalledWith(FROM)
  })

  it('asks from the first week of the series where the chosen day lies further back', async () => {
    const series = await countCommunityFigureSeries(new Date('2020-01-01T00:00:00.000Z'), NOW)

    expect(series.weeks).toHaveLength(104)
    expect(mockDatabase.dbCountUsersDeletedByWeek).toHaveBeenCalledWith(
      new Date('2024-10-21T00:00:00.000Z'),
    )
    for (const row of series.rows) {
      expect(row.counts).toHaveLength(104)
    }
  })

  it('leaves out a week a count answers that is not one of the series', async () => {
    countsOf.dbCountUsersDeletedByWeek.mockResolvedValue([
      { weekStart: '2026-09-21', n: 7 },
      ...found(91, null, 93),
      { weekStart: '2026-10-19', n: 9 },
    ])

    const series = await countCommunityFigureSeries(SINCE, NOW)

    expect(series.rows).toContainEqual({ key: 'accountsDeleted', counts: [91, 0, 93] })
  })

  it('gives every row as many numbers as there are weeks, for a day chosen in the running week too', async () => {
    const series = await countCommunityFigureSeries(new Date('2026-10-13T08:00:00.000Z'), NOW)

    expect(series.weeks).toEqual([new Date('2026-10-12T00:00:00.000Z')])
    for (const row of series.rows) {
      expect(row.counts).toHaveLength(1)
    }
    expect(series.rows).toContainEqual({ key: 'accountsNew', counts: [13] })
  })

  it('asks four counts at a time, not all at once, and answers in the order of the page', async () => {
    // Every count waits a moment for its answer, as a statement does -- the early ones longest,
    // so that the answers come in another order than the counts were asked.
    let asked = 0
    let asking = 0
    let mostAtOnce = 0
    for (const [name, answer] of Object.entries(answers)) {
      countsOf[name].mockImplementation(async (...args: never[]) => {
        const wait = Math.max(1, 30 - asked++)
        asking++
        mostAtOnce = Math.max(mostAtOnce, asking)
        await new Promise((resolve) => setTimeout(resolve, wait))
        asking--
        return answer(...args)
      })
    }

    const series = await countCommunityFigureSeries(SINCE, NOW)

    expect(mostAtOnce).toBe(4)
    expect(series.rows.map((row) => row.key)).toEqual([
      'accountsNew',
      'accountsViaTableCode',
      'accountsViaLink',
      'accountsViaAddress',
      'accountsViaEvent',
      'hostsWithGuest',
      'codesShown',
      'activeAccounts',
      'accountsDeleted',
      'firstCreationsDone',
      'firstCreationsSkipped',
      'firstCreationsReview',
      'transfersSent',
      'gddSent',
      'creationsBooked',
      'gddCreated',
      'entriesInterest',
      'entriesOffer',
      'entriesNeed',
      'conversationsNew',
      'groupsNew',
      'hellosFromMap',
      'videoRoomsCreated',
    ])
  })
})
