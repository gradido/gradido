// AI-GENERATED — not an architecture reference
// Unit test: which counts the resolver runs for which role, and what it answers when one fails.
// What the counts read, and that they are the start page's, runs with a database in
// ModerationWaitingResolver.test.ts.
//
// Written to run under jest (today) and `bun test --isolate` (later) alike, as AGENTS.md asks and
// validateCommunities.test.ts shows: the fakes are declared before `jest.mock`, each factory hands
// out its own fakes, and the module under test is imported in `beforeAll`.
import type { Context } from '@/server/context'

const mockCountSupportTickets = jest.fn()
const mockCountCreations = jest.fn()
const mockDescribe = jest.fn()
// the rule of the column "Support" (MG2b): the requests' number follows it
const mockHandledSupport = jest.fn()
const mockDatabaseErrorCode = jest.fn()
const mockLogError = jest.fn()

// the role names as well: ROLES reads them (through @enum/RoleNames) to hand out the rights
jest.mock('database', () => ({
  dbCountOpenSupportTicketsInScope: mockCountSupportTickets,
  RoleNames: {
    UNAUTHORIZED: 'UNAUTHORIZED',
    USER: 'USER',
    MODERATOR: 'MODERATOR',
    MODERATOR_AI: 'MODERATOR_AI',
    ADMIN: 'ADMIN',
    DLT_CONNECTOR: 'DLT_CONNECTOR_ROLE',
  },
}))
jest.mock('core', () => ({ databaseErrorCode: mockDatabaseErrorCode }))
jest.mock('log4js', () => ({ getLogger: () => ({ error: mockLogError }) }))
jest.mock('./util/moderatorCreationGroupScope', () => ({
  countContributionsWaitingForModeration: mockCountCreations,
  describeModeratorCreationGroups: mockDescribe,
  handledSupportGroupsOfRole: mockHandledSupport,
}))

type ResolverModule = typeof import('./ModerationWaitingResolver')
type RolesModule = typeof import('@/auth/ROLES')
let ModerationWaitingResolver: ResolverModule['ModerationWaitingResolver']
let roleOfHolder: RolesModule['roleOfHolder']

// ROLES as well: its role names come from `database`, which is one of the fakes
beforeAll(async () => {
  ;({ ModerationWaitingResolver } = await import('./ModerationWaitingResolver'))
  ;({ roleOfHolder } = await import('@/auth/ROLES'))
})

const SCOPE = { tags: [], seesAllCreationGroups: true, seesUntagged: true }
const CHOICE = { groupIds: [7], untagged: true }

// reset, not only clear: a `mock…Once` a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
  mockDescribe.mockReturnValue(SCOPE)
  mockHandledSupport.mockReturnValue(CHOICE)
  mockCountCreations.mockResolvedValue(3)
  mockCountSupportTickets.mockResolvedValue({
    forModeration: 2,
    forMember: 5,
    onResubmission: 1,
    elsewhere: 4,
    elsewhereOnResubmission: 0,
  })
  mockDatabaseErrorCode.mockReturnValue('ECONNRESET')
})

// the role row as isAuthorized loads it with the member, and the rights it hands out for it
const requestOf = (row: { role: string; supportDuty: boolean } | null): Context =>
  ({
    token: null,
    setHeaders: [],
    user: { id: 1, userRole: row },
    role: roleOfHolder(row),
  }) as unknown as Context

// the names as the role row holds them (RoleNames)
const MEMBER = null
const MODERATOR = { role: 'MODERATOR', supportDuty: false }
const SUPPORTING_MODERATOR = { role: 'MODERATOR', supportDuty: true }
const ADMIN = { role: 'ADMIN', supportDuty: false }

const waiting = (row: { role: string; supportDuty: boolean } | null) =>
  new ModerationWaitingResolver().moderationWaiting(requestOf(row))

describe('ModerationWaitingResolver', () => {
  it('answers a member who moderates nothing null, and counts nothing', async () => {
    expect(await waiting(MEMBER)).toBeNull()
    expect(mockCountCreations).not.toHaveBeenCalled()
    expect(mockCountSupportTickets).not.toHaveBeenCalled()
  })

  it('counts the creations of a moderator without the support, and leaves the support null', async () => {
    expect(await waiting(MODERATOR)).toEqual({ creations: 3, supportTickets: null })
    expect(mockCountCreations).toHaveBeenCalledWith(MODERATOR)
    expect(mockCountSupportTickets).not.toHaveBeenCalled()
  })

  it.each([
    ['a moderator who handles the support', SUPPORTING_MODERATOR],
    ['an administrator', ADMIN],
  ])(
    "counts both for %s: of the support only what waits for the moderation, in the role's groups",
    async (_, row) => {
      expect(await waiting(row)).toEqual({ creations: 3, supportTickets: 2 })
      expect(mockCountCreations).toHaveBeenCalledWith(row)
      expect(mockDescribe).toHaveBeenCalledWith(row)
      expect(mockHandledSupport).toHaveBeenCalledWith(row)
      expect(mockCountSupportTickets).toHaveBeenCalledWith(SCOPE, expect.any(Date), CHOICE)
    },
  )

  it.each([
    ['the creations', () => mockCountCreations.mockRejectedValueOnce(new Error('gone'))],
    ['the support', () => mockCountSupportTickets.mockRejectedValueOnce(new Error('gone'))],
  ])('answers null where counting %s fails, never throws, and logs the code', async (_, fail) => {
    fail()
    expect(await waiting(ADMIN)).toBeNull()
    expect(mockLogError).toHaveBeenCalledWith('moderation waiting not counted (ECONNRESET)')
  })
})
