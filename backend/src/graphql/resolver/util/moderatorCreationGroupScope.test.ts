// AI-GENERATED — not an architecture reference
// Unit test: the arguments the wallet's number of waiting creations (MG3) hands findContributions
// -- the filter, the scope and the choice adminListContributions hands it for `waitingForModeration`
// of the start page. Not its relations: the start page joins the member and the address for its
// empty search word, which changes no count. That they count the same rows runs with a database
// (ModerationWaitingResolver.test.ts).
//
// Written to run under jest and `bun test --isolate` alike (AGENTS.md): the fakes are declared
// before `jest.mock`, the factory hands out its own, and the module is imported in `beforeAll`.

const mockFindContributions = jest.fn()
const mockParseModeratorScope = jest.fn()

jest.mock('./findContributions', () => ({
  findContributions: mockFindContributions,
  parseModeratorScope: mockParseModeratorScope,
  buildModeratorScopePredicate: jest.fn(),
  HANDLED_FILTER: '*handled',
  UNTAGGED_FILTER: '*untagged',
}))

type ScopeModule = typeof import('./moderatorCreationGroupScope')
let countContributionsWaitingForModeration: ScopeModule['countContributionsWaitingForModeration']
let handledSupportGroupsOfRole: ScopeModule['handledSupportGroupsOfRole']

beforeAll(async () => {
  ;({ countContributionsWaitingForModeration, handledSupportGroupsOfRole } = await import(
    './moderatorCreationGroupScope'
  ))
})

// reset, not only clear: a `mock…Once` a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
  mockFindContributions.mockResolvedValue([[], 4])
})

const CHOICE = JSON.stringify({ groupIds: [3], untagged: true })

// the arguments after the page: the filter, deleted ones taken along, no relations, the count
// alone, the moderator's scope, and what '*handled' stands for
const handedOn = () => mockFindContributions.mock.calls[0].slice(1)

describe('countContributionsWaitingForModeration', () => {
  it('counts with the start page\'s conditions: waiting for the moderation, no resubmission to come, "Meine Gruppen"', async () => {
    expect(
      await countContributionsWaitingForModeration({
        role: 'ADMIN',
        visibleCreationGroups: null,
        handledCreationGroups: null,
      }),
    ).toBe(4)
    expect(handedOn()).toEqual([
      expect.objectContaining({
        statusFilter: ['PENDING'],
        hideResubmission: true,
        creationGroup: '*handled',
      }),
      true,
      undefined,
      true,
      null,
      null,
    ])
  })

  it('hands on the choice of whoever sees every group, and no scope for an administrator', async () => {
    await countContributionsWaitingForModeration({
      role: 'ADMIN',
      visibleCreationGroups: null,
      handledCreationGroups: CHOICE,
    })
    expect(handedOn().slice(4)).toEqual([null, { groupIds: [3], untagged: true }])
  })

  it('holds a moderator with an assigned scope to it, and the choice in the row does not count', async () => {
    mockParseModeratorScope.mockReturnValue(['choir'])
    await countContributionsWaitingForModeration({
      role: 'MODERATOR',
      visibleCreationGroups: '["choir"]',
      handledCreationGroups: CHOICE,
    })
    expect(mockParseModeratorScope).toHaveBeenCalledWith('["choir"]')
    expect(handedOn().slice(4)).toEqual([['choir'], null])
  })
})

// "Meine Gruppen" of the support (MG2b): the same rule, over the support's own column
describe('handledSupportGroupsOfRole', () => {
  const SUPPORT = JSON.stringify({ groupIds: [5], untagged: false })

  it('reads the column "Support" of whoever sees every group, never the creations\'', () => {
    const chose = { role: 'ADMIN', visibleCreationGroups: null, handledSupportGroups: SUPPORT }
    expect(handledSupportGroupsOfRole(chose)).toEqual({ groupIds: [5], untagged: false })
    const choseCreationsOnly = {
      role: 'ADMIN',
      visibleCreationGroups: null,
      handledCreationGroups: CHOICE,
      handledSupportGroups: null,
    }
    expect(handledSupportGroupsOfRole(choseCreationsOnly)).toBeNull()
  })

  it('gives a moderator with an assigned scope no choice, whatever stands in the row', () => {
    mockParseModeratorScope.mockReturnValue(['choir'])
    expect(
      handledSupportGroupsOfRole({
        role: 'MODERATOR',
        visibleCreationGroups: '["choir"]',
        handledSupportGroups: SUPPORT,
      }),
    ).toBeNull()
  })
})
