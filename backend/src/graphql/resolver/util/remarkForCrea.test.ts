// AI-GENERATED — not an architecture reference
// Unit test: for whom the remark is read when Crea is asked, and that the read is counted. That it
// reaches Crea through the schema runs against a database in CreaResolver.remark.test.ts.
//
// Written to run under jest (today) and `bun test --isolate` (later) alike, as
// UserRemarkResolver.setUserRemark.test.ts is: the fakes are declared before `jest.mock`, and the
// module under test is imported in `beforeAll`, after every mock is registered.
import type { Role as RoleType } from '@/auth/Role'
import type { Context } from '@/server/context'

class mockLogError extends Error {}
const mockDatabase = { dbSelectUserRemarkWithMemberNames: jest.fn() }

jest.mock('@/server/LogError', () => ({ LogError: mockLogError }))
jest.mock('database', () => mockDatabase)

const RAEUBER = 9
const FOUND = {
  remark: 'Hotzenplotz ist Rentner seit Januar 2025. Sohn von Ramona.',
  memberNames: ['Räuber', 'Hotzenplotz', 'raeuber'],
}

let remarkForCrea: typeof import('./remarkForCrea')['remarkForCrea']
let newRequestBudget: typeof import('@/server/context')['newRequestBudget']
let Role: typeof import('@/auth/Role')['Role']
let RIGHTS: typeof import('@/auth/RIGHTS')['RIGHTS']
let MODERATOR_RIGHTS: typeof import('@/auth/MODERATOR_RIGHTS')['MODERATOR_RIGHTS']
let MODERATOR_AI_RIGHTS: typeof import('@/auth/MODERATOR_AI_RIGHTS')['MODERATOR_AI_RIGHTS']
let MAX_PER_REQUEST: number

beforeAll(async () => {
  ;({ remarkForCrea } = await import('./remarkForCrea'))
  ;({ newRequestBudget } = await import('@/server/context'))
  ;({ Role } = await import('@/auth/Role'))
  ;({ RIGHTS } = await import('@/auth/RIGHTS'))
  ;({ MODERATOR_RIGHTS } = await import('@/auth/MODERATOR_RIGHTS'))
  ;({ MODERATOR_AI_RIGHTS } = await import('@/auth/MODERATOR_AI_RIGHTS'))
  ;({ USER_REMARKS_MAX_PER_REQUEST: MAX_PER_REQUEST } = await import('@/data/UserRemark.logic'))
})

beforeEach(() => {
  jest.resetAllMocks()
  mockDatabase.dbSelectUserRemarkWithMemberNames.mockResolvedValue(FOUND)
})

const requestBy = (role?: RoleType): Context =>
  ({ token: null, setHeaders: [], requestBudget: newRequestBudget(), role }) as unknown as Context
// The rights of a KI-moderator, as ROLES.ts puts them together: the role names come from the
// database package, which stands in for itself here.
const kiModerator = () => new Role('moderator-ai', [...MODERATOR_RIGHTS, ...MODERATOR_AI_RIGHTS])

describe('remarkForCrea', () => {
  it("reads the remark for a KI-moderator, the member's names written out, and counts the read", async () => {
    const context = requestBy(kiModerator())
    expect(await remarkForCrea(context, RAEUBER)).toBe(
      '[MITGLIED] ist Rentner seit Januar 2025. Sohn von Ramona.',
    )
    expect(mockDatabase.dbSelectUserRemarkWithMemberNames).toHaveBeenCalledWith(RAEUBER)
    expect(context.requestBudget.userRemarksServed).toBe(1)
  })

  // ⛔ Today every holder of AI_SEND_MESSAGE may read the remark; a role that may ask Crea and
  // not read it must not have it read through her.
  it('reads nothing for a caller who may ask Crea but not read the remark', async () => {
    const context = requestBy(new Role('crea-only', [RIGHTS.AI_SEND_MESSAGE]))
    expect(await remarkForCrea(context, RAEUBER)).toBeNull()
    expect(mockDatabase.dbSelectUserRemarkWithMemberNames).not.toHaveBeenCalled()
    expect(context.requestBudget.userRemarksServed).toBe(0)
  })

  it('reads nothing for a request without a role', async () => {
    const context = requestBy()
    expect(await remarkForCrea(context, RAEUBER)).toBeNull()
    expect(mockDatabase.dbSelectUserRemarkWithMemberNames).not.toHaveBeenCalled()
  })

  it('reads nothing where the admin interface names no member', async () => {
    const context = requestBy(kiModerator())
    expect(await remarkForCrea(context, null)).toBeNull()
    expect(await remarkForCrea(context, undefined)).toBeNull()
    expect(mockDatabase.dbSelectUserRemarkWithMemberNames).not.toHaveBeenCalled()
    expect(context.requestBudget.userRemarksServed).toBe(0)
  })

  it('answers null where the moderation keeps no remark, the read counted all the same', async () => {
    mockDatabase.dbSelectUserRemarkWithMemberNames.mockResolvedValue(undefined)
    const context = requestBy(kiModerator())
    expect(await remarkForCrea(context, RAEUBER)).toBeNull()
    expect(context.requestBudget.userRemarksServed).toBe(1)
  })

  // A document may ask Crea under any number of aliases; the read beyond the budget never happens.
  it('refuses a read beyond the budget of the request before it reads', async () => {
    const context = requestBy(kiModerator())
    for (let read = 0; read < MAX_PER_REQUEST; read++) {
      await remarkForCrea(context, RAEUBER)
    }
    mockDatabase.dbSelectUserRemarkWithMemberNames.mockClear()
    await expect(remarkForCrea(context, RAEUBER)).rejects.toThrow(mockLogError)
    expect(mockDatabase.dbSelectUserRemarkWithMemberNames).not.toHaveBeenCalled()
  })
})
