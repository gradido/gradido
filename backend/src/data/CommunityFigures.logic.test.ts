// AI-GENERATED — not an architecture reference
// Unit tests: which count each figure asks, from which moments, and where its numbers go. The
// counts themselves are replaced; what they count is tested against the database in `database`.
// Written to run under jest and `bun test --isolate` alike (see validateCommunities.test.ts).

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
  dbCountAcceptedThankYouGreetings: jest.fn(),
  dbCountActiveMatchingEntries: jest.fn(),
  dbCountAndSumTransactionsOfType: jest.fn(),
  dbCountChatConversationsOfKind: jest.fn(),
  dbCountDistinctActingUsersOfType: jest.fn(),
  dbCountDistinctAffectedUsersOfType: jest.fn(),
  dbCountEventsOfTypes: jest.fn(),
  dbCountExpiredThankYouGreetings: jest.fn(),
  dbCountFirstCreationMembers: jest.fn(),
  dbCountFirstSenders: jest.fn(),
  dbCountMatchingEntriesByType: jest.fn(),
  dbCountMembersWithActiveEntry: jest.fn(),
  dbCountRegisterEventsWithReferrer: jest.fn(),
  dbCountReturningMembers: jest.fn(),
  dbCountThankYouGreetings: jest.fn(),
  dbCountTransactionPassOns: jest.fn(),
  dbCountTransactionReactions: jest.fn(),
  dbCountTransactionsWithPicture: jest.fn(),
  dbCountUsers: jest.fn(),
  dbCountUsersDeleted: jest.fn(),
  dbCountUsersFindable: jest.fn(),
  dbCountUsersWithHome: jest.fn(),
}
// The GMS's number of members on the map, as the process holds it.
const mockMapMemberCount = { known: jest.fn() }

jest.mock('database', () => mockDatabase)
jest.mock('@/apis/gms/mapMemberCount', () => ({ mapMemberCount: mockMapMemberCount }))

type CommunityFiguresModule = typeof import('./CommunityFigures.logic')
let countCommunityFigures: CommunityFiguresModule['countCommunityFigures']

beforeAll(async () => {
  countCommunityFigures = (await import('./CommunityFigures.logic')).countCommunityFigures
})

const NOW = new Date('2026-10-18T12:00:00.000Z')
const SINCE = new Date('2026-10-15T00:00:00.000Z')
const WEEK = new Date('2026-10-11T12:00:00.000Z')
const MONTH = new Date('2026-09-18T12:00:00.000Z')

// Every count answers with numbers of its own, so a figure that reads another count's numbers,
// or puts them into the wrong column, shows. A count asked something no figure asks answers
// nothing, and the figure falls over it.
const byTypes: Record<string, number[]> = {
  'USER_REGISTER,USER_REGISTER_GUARANTOR,USER_REGISTER_REDEEM': [11, 12, 13],
  USER_REGISTER_GUARANTOR: [21, 22, 23],
  USER_REGISTER_REDEEM: [31, 32, 33],
  GUARANTOR_CODE_SHOW: [61, 62, 63],
  EVENT_MATCHING_ENTRY_NOTE: [141, 142, 143],
  CHAT_HELLO_SEND: [151, 152, 153],
  CHAT_VIDEO_ROOM_CREATE: [161, 162, 163],
}
const membersByType: Record<string, number[]> = {
  USER_LOGIN: [81, 82, 83],
}
const firstCreationsByType: Record<string, number[]> = {
  FIRST_CREATION_DONE: [111, 112, 113],
  FIRST_CREATION_SKIP: [121, 122, 123],
  FIRST_CREATION_REVIEW: [131, 132, 133],
}
const bookingsByType: Record<number, { counts: number[]; gdd: number[] }> = {
  2: { counts: [171, 172, 173], gdd: [181, 182, 183] },
  1: { counts: [191, 192, 193], gdd: [201, 202, 203] },
}
const conversationsByKind: Record<string, number[]> = {
  direct: [281, 282, 283],
  group: [291, 292, 293],
}

// What each count answers, by its name: every one with numbers of its own.
const answers: Record<string, (...args: never[]) => Promise<unknown>> = {
  dbCountEventsOfTypes: async (types: string[]) => byTypes[types.join(',')],
  dbCountRegisterEventsWithReferrer: async () => [41, 42, 43],
  dbCountDistinctActingUsersOfType: async (type: string) =>
    type === 'USER_REGISTER_GUARANTOR' ? [51, 52, 53] : undefined,
  dbCountReturningMembers: async () => 71,
  dbCountDistinctAffectedUsersOfType: async (type: string) => membersByType[type],
  dbCountFirstCreationMembers: async (type: string) => firstCreationsByType[type],
  dbCountUsersDeleted: async () => [91, 92, 93],
  dbCountUsers: async () => 101,
  dbCountAndSumTransactionsOfType: async (typeId: number) => bookingsByType[typeId],
  dbCountFirstSenders: async () => [301, 302, 303],
  // Asked for the SEND rows: anything else answers nothing.
  dbCountTransactionsWithPicture: async (typeId: number) =>
    typeId === 2 ? [311, 312, 313] : undefined,
  dbCountTransactionReactions: async () => [321, 322, 323],
  dbCountTransactionPassOns: async () => [331, 332, 333],
  dbCountThankYouGreetings: async () => ({ sent: [341, 342, 343], withPicture: [351, 352, 353] }),
  dbCountAcceptedThankYouGreetings: async () => ({
    accepted: [361, 362, 363],
    withNewAccount: [371, 372, 373],
  }),
  dbCountExpiredThankYouGreetings: async () => [381, 382, 383],
  dbCountUsersWithHome: async () => 211,
  dbCountUsersFindable: async () => 221,
  // Nobody wrote a need: the answer has no line for it.
  dbCountMatchingEntriesByType: async () => ({
    interest: [231, 232, 233],
    offer: [241, 242, 243],
  }),
  dbCountActiveMatchingEntries: async () => 251,
  dbCountMembersWithActiveEntry: async () => 261,
  dbCountChatConversationsOfKind: async (kind: string) => conversationsByKind[kind],
}
const countsOf = mockDatabase as unknown as Record<string, jest.Mock>

// reset, not only clear: an answer a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
  for (const [name, answer] of Object.entries(answers)) {
    countsOf[name].mockImplementation(answer)
  }
  mockMapMemberCount.known.mockReturnValue(271)
})

describe('countCommunityFigures', () => {
  it('answers the figures in the order of the page, each with the numbers of its own count', async () => {
    expect(await countCommunityFigures(SINCE, NOW)).toEqual([
      { key: 'accountsNew', since: 11, week: 12, total: 13 },
      { key: 'accountsViaTableCode', since: 21, week: 22, total: 23 },
      { key: 'accountsViaLink', since: 31, week: 32, total: 33 },
      { key: 'accountsViaAddress', since: 41, week: 42, total: 43 },
      { key: 'accountsViaEvent', since: 141, week: 142, total: 143 },
      { key: 'hostsWithGuest', since: 51, week: 52, total: 53 },
      { key: 'codesShown', since: 61, week: 62, total: 63 },
      { key: 'returners', since: 71, week: null, total: null },
      { key: 'activeAccounts', since: 81, week: 82, total: 83 },
      { key: 'accountsDeleted', since: 91, week: 92, total: 93 },
      { key: 'accountsTotal', since: null, week: null, total: 101 },
      { key: 'firstCreationsDone', since: 111, week: 112, total: 113 },
      { key: 'firstCreationsSkipped', since: 121, week: 122, total: 123 },
      { key: 'firstCreationsReview', since: 131, week: 132, total: 133 },
      { key: 'transfersSent', since: 171, week: 172, total: 173 },
      { key: 'gddSent', since: 181, week: 182, total: 183 },
      { key: 'firstSenders', since: 301, week: 302, total: 303 },
      { key: 'transfersWithPicture', since: 311, week: 312, total: 313 },
      { key: 'thanksAnswered', since: 321, week: 322, total: 323 },
      { key: 'thanksPassedOn', since: 331, week: 332, total: 333 },
      { key: 'creationsBooked', since: 191, week: 192, total: 193 },
      { key: 'gddCreated', since: 201, week: 202, total: 203 },
      { key: 'greetingsSent', since: 341, week: 342, total: 343 },
      { key: 'greetingsWithPhoto', since: 351, week: 352, total: 353 },
      { key: 'greetingsAccepted', since: 361, week: 362, total: 363 },
      { key: 'greetingsWithAccount', since: 371, week: 372, total: 373 },
      { key: 'greetingsExpired', since: 381, week: 382, total: 383 },
      { key: 'homesSet', since: null, week: null, total: 211 },
      { key: 'findableOnMap', since: null, week: null, total: 221 },
      { key: 'entriesInterest', since: 231, week: 232, total: 233 },
      { key: 'entriesOffer', since: 241, week: 242, total: 243 },
      // A kind nobody wrote: none of it, in every column.
      { key: 'entriesNeed', since: 0, week: 0, total: 0 },
      { key: 'entriesActive', since: null, week: null, total: 251 },
      { key: 'membersWithEntry', since: null, week: null, total: 261 },
      { key: 'membersOnMap', since: null, week: null, total: 271 },
      { key: 'conversationsNew', since: 281, week: 282, total: 283 },
      { key: 'groupsNew', since: 291, week: 292, total: 293 },
      { key: 'hellosFromMap', since: 151, week: 152, total: 153 },
      { key: 'videoRoomsCreated', since: 161, week: 162, total: 163 },
    ])
  })

  it('counts the flows from the chosen day, seven days back and over all of it, in one call each', async () => {
    await countCommunityFigures(SINCE, NOW)

    const everyColumn = [SINCE, WEEK, null]
    for (const types of [
      ['USER_REGISTER', 'USER_REGISTER_GUARANTOR', 'USER_REGISTER_REDEEM'],
      ['USER_REGISTER_GUARANTOR'],
      ['USER_REGISTER_REDEEM'],
      ['GUARANTOR_CODE_SHOW'],
      ['EVENT_MATCHING_ENTRY_NOTE'],
      ['CHAT_HELLO_SEND'],
      ['CHAT_VIDEO_ROOM_CREATE'],
    ]) {
      expect(mockDatabase.dbCountEventsOfTypes).toHaveBeenCalledWith(types, everyColumn)
    }
    expect(mockDatabase.dbCountRegisterEventsWithReferrer).toHaveBeenCalledWith(everyColumn)
    expect(mockDatabase.dbCountDistinctActingUsersOfType).toHaveBeenCalledWith(
      'USER_REGISTER_GUARANTOR',
      everyColumn,
    )
    expect(mockDatabase.dbCountUsersDeleted).toHaveBeenCalledWith(everyColumn)
    for (const type of ['FIRST_CREATION_DONE', 'FIRST_CREATION_SKIP', 'FIRST_CREATION_REVIEW']) {
      expect(mockDatabase.dbCountFirstCreationMembers).toHaveBeenCalledWith(type, everyColumn)
    }
    expect(mockDatabase.dbCountChatConversationsOfKind).toHaveBeenCalledWith('direct', everyColumn)
    expect(mockDatabase.dbCountChatConversationsOfKind).toHaveBeenCalledWith('group', everyColumn)
    expect(mockDatabase.dbCountFirstSenders).toHaveBeenCalledWith(everyColumn)
    expect(mockDatabase.dbCountTransactionsWithPicture).toHaveBeenCalledWith(2, everyColumn)
    expect(mockDatabase.dbCountTransactionReactions).toHaveBeenCalledWith(everyColumn)
    expect(mockDatabase.dbCountTransactionPassOns).toHaveBeenCalledWith(everyColumn)
    for (const count of [
      mockDatabase.dbCountFirstSenders,
      mockDatabase.dbCountTransactionsWithPicture,
      mockDatabase.dbCountTransactionReactions,
      mockDatabase.dbCountTransactionPassOns,
      mockDatabase.dbCountExpiredThankYouGreetings,
    ]) {
      expect(count).toHaveBeenCalledTimes(1)
    }
  })

  it('counts the greetings that ran out from the chosen day and seven days back, up to now', async () => {
    await countCommunityFigures(SINCE, NOW)

    expect(mockDatabase.dbCountExpiredThankYouGreetings).toHaveBeenCalledWith(
      [SINCE, WEEK, null],
      NOW,
    )
  })

  it('asks a count that fills several rows once, not once per row', async () => {
    await countCommunityFigures(SINCE, NOW)

    const everyColumn = [SINCE, WEEK, null]
    // The SEND rows and the creations, each once for its number and its Gradido.
    expect(mockDatabase.dbCountAndSumTransactionsOfType).toHaveBeenCalledTimes(2)
    expect(mockDatabase.dbCountAndSumTransactionsOfType).toHaveBeenCalledWith(2, everyColumn)
    expect(mockDatabase.dbCountAndSumTransactionsOfType).toHaveBeenCalledWith(1, everyColumn)
    // The three kinds of entry in one count.
    expect(mockDatabase.dbCountMatchingEntriesByType).toHaveBeenCalledTimes(1)
    expect(mockDatabase.dbCountMatchingEntriesByType).toHaveBeenCalledWith(everyColumn)
    // The greetings sent and those with a photo; accepted and those by a new account.
    expect(mockDatabase.dbCountThankYouGreetings).toHaveBeenCalledTimes(1)
    expect(mockDatabase.dbCountThankYouGreetings).toHaveBeenCalledWith(everyColumn)
    expect(mockDatabase.dbCountAcceptedThankYouGreetings).toHaveBeenCalledTimes(1)
    expect(mockDatabase.dbCountAcceptedThankYouGreetings).toHaveBeenCalledWith(everyColumn)
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

    const rows = await countCommunityFigures(SINCE, NOW)

    expect(mostAtOnce).toBe(4)
    expect(rows.map((row) => row.key)).toEqual([
      'accountsNew',
      'accountsViaTableCode',
      'accountsViaLink',
      'accountsViaAddress',
      'accountsViaEvent',
      'hostsWithGuest',
      'codesShown',
      'returners',
      'activeAccounts',
      'accountsDeleted',
      'accountsTotal',
      'firstCreationsDone',
      'firstCreationsSkipped',
      'firstCreationsReview',
      'transfersSent',
      'gddSent',
      'firstSenders',
      'transfersWithPicture',
      'thanksAnswered',
      'thanksPassedOn',
      'creationsBooked',
      'gddCreated',
      'greetingsSent',
      'greetingsWithPhoto',
      'greetingsAccepted',
      'greetingsWithAccount',
      'greetingsExpired',
      'homesSet',
      'findableOnMap',
      'entriesInterest',
      'entriesOffer',
      'entriesNeed',
      'entriesActive',
      'membersWithEntry',
      'membersOnMap',
      'conversationsNew',
      'groupsNew',
      'hellosFromMap',
      'videoRoomsCreated',
    ])
  })

  it('leaves the members on the map open while the GMS has said no number', async () => {
    mockMapMemberCount.known.mockReturnValue(null)

    expect(await countCommunityFigures(SINCE, NOW)).toContainEqual({
      key: 'membersOnMap',
      since: null,
      week: null,
      total: null,
    })
  })

  it('counts the active accounts of the last thirty days as their "all of it"', async () => {
    await countCommunityFigures(SINCE, NOW)

    expect(mockDatabase.dbCountDistinctAffectedUsersOfType).toHaveBeenCalledWith('USER_LOGIN', [
      SINCE,
      WEEK,
      MONTH,
    ])
  })

  it('measures a return against the chosen day', async () => {
    await countCommunityFigures(SINCE, NOW)

    expect(mockDatabase.dbCountReturningMembers).toHaveBeenCalledWith(SINCE)
  })
})
