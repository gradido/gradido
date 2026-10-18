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
}
const mockDatabase = {
  EventType: mockEventType,
  dbCountDistinctActingUsersOfType: jest.fn(),
  dbCountDistinctAffectedUsersOfType: jest.fn(),
  dbCountEventsOfTypes: jest.fn(),
  dbCountRegisterEventsWithReferrer: jest.fn(),
  dbCountReturningMembers: jest.fn(),
  dbCountUsers: jest.fn(),
  dbCountUsersDeleted: jest.fn(),
}

jest.mock('database', () => mockDatabase)

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
}
const membersByType: Record<string, number[]> = {
  USER_LOGIN: [81, 82, 83],
  FIRST_CREATION_DONE: [111, 112, 113],
  FIRST_CREATION_SKIP: [121, 122, 123],
  FIRST_CREATION_REVIEW: [131, 132, 133],
}

// reset, not only clear: an answer a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
  mockDatabase.dbCountEventsOfTypes.mockImplementation(
    async (types: string[]) => byTypes[types.join(',')],
  )
  mockDatabase.dbCountRegisterEventsWithReferrer.mockResolvedValue([41, 42, 43])
  mockDatabase.dbCountDistinctActingUsersOfType.mockImplementation(async (type: string) =>
    type === 'USER_REGISTER_GUARANTOR' ? [51, 52, 53] : undefined,
  )
  mockDatabase.dbCountReturningMembers.mockResolvedValue(71)
  mockDatabase.dbCountDistinctAffectedUsersOfType.mockImplementation(
    async (type: string) => membersByType[type],
  )
  mockDatabase.dbCountUsersDeleted.mockResolvedValue([91, 92, 93])
  mockDatabase.dbCountUsers.mockResolvedValue(101)
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
      expect(mockDatabase.dbCountDistinctAffectedUsersOfType).toHaveBeenCalledWith(
        type,
        everyColumn,
      )
    }
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
