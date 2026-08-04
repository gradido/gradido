import { RoleNames } from '@enum/RoleNames'
import { cleanDB, testEnvironment } from '@test/helpers'
import { AppDatabase, CreationGroup, UserCreationGroup, UserRole } from 'database'
import { getLogger as originalGetLogger } from 'log4js'
import { parseModeratorScope } from './util/findContributions'
import { saveModeratorScope } from './util/moderatorCreationGroupScope'
import { saveUserCreationGroups } from './util/userCreationGroups'

// The writes that replace a whole creation-group list. Two properties they share, and both
// come from the same place: creation_groups.tag is utf8mb4_unicode_ci, so the database
// matches regardless of case, while a JavaScript Set does not. Two spellings of one group
// therefore reach the write as two entries and have to be folded together THERE -- after the
// canonical row is known, not before.

let db: AppDatabase

beforeAll(async () => {
  const testEnv = await testEnvironment(originalGetLogger('apollo'))
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

const makeGroup = async (tag: string): Promise<CreationGroup> => {
  const entry = CreationGroup.create()
  entry.tag = tag
  entry.name = tag
  await entry.save()
  return entry
}

const makeModerator = async (userId: number): Promise<void> => {
  const role = UserRole.create()
  role.createdAt = new Date()
  role.userId = userId
  role.role = RoleNames.MODERATOR
  await role.save()
}

describe("a user's personal creation-group list", () => {
  // ⚠️ Without folding on the canonical id this does not merely store a duplicate -- it puts
  // two rows with the same (user_id, creation_group_id) into one insert, and
  // uniq_user_creation_group answers with a raw driver error. In front of the member, for
  // something the code should have collapsed itself.
  it('collapses two spellings of one group instead of failing on the unique index', async () => {
    await makeGroup('brassband')
    await makeGroup('choir')

    const saved = await saveUserCreationGroups(7001, ['brassband', 'BrassBand', 'choir'])

    expect(saved.map((group) => group.tag)).toEqual(['brassband', 'choir'])
    const links = await UserCreationGroup.find({ where: { userId: 7001 } })
    expect(links).toHaveLength(2)
  })

  // The lowest sort order is the member's main group, so which spelling wins is not
  // cosmetic: it decides what the submission field pre-fills.
  it('keeps the first spelling and the order it was given in', async () => {
    await makeGroup('firstwins')
    await makeGroup('secondgroup')

    const saved = await saveUserCreationGroups(7002, ['SecondGroup', 'firstwins', 'secondgroup'])

    expect(saved.map((group) => group.tag)).toEqual(['secondgroup', 'firstwins'])
  })

  it('replaces the previous list rather than adding to it', async () => {
    await makeGroup('oldone')
    await makeGroup('newone')
    await saveUserCreationGroups(7003, ['oldone'])

    const saved = await saveUserCreationGroups(7003, ['newone'])

    expect(saved.map((group) => group.tag)).toEqual(['newone'])
    expect(await UserCreationGroup.find({ where: { userId: 7003 } })).toHaveLength(1)
  })

  it('empties the list when given nothing', async () => {
    await makeGroup('tobecleared')
    await saveUserCreationGroups(7004, ['tobecleared'])

    expect(await saveUserCreationGroups(7004, [])).toEqual([])
    expect(await UserCreationGroup.find({ where: { userId: 7004 } })).toHaveLength(0)
  })
})

describe("a moderator's visibility scope", () => {
  // Harmless to the predicate, but the scope is stored as written: the admin would list the
  // same group twice, for good, and nobody would know why.
  it('stores one entry when two spellings mean the same group', async () => {
    await makeGroup('scopefold')
    await makeModerator(7101)

    const stored = await saveModeratorScope(7101, ['scopefold', 'ScopeFold'])

    expect(stored).toEqual(['scopefold'])
    const role = await UserRole.findOneOrFail({ where: { userId: 7101 } })
    expect(parseModeratorScope(role.visibleCreationGroups)).toEqual(['scopefold'])
  })

  // The sentinels are values, not group names, and must survive the folding untouched.
  it('keeps the reserved values alongside a folded group', async () => {
    await makeGroup('withsentinel')
    await makeModerator(7102)

    const stored = await saveModeratorScope(7102, ['WithSentinel', '*untagged', 'withsentinel'])

    expect(stored).toEqual(['withsentinel', '*untagged'])
  })

  // ⚠️ Stored in the canonical spelling, not as typed: the scope predicate and the rename
  // both compare these strings exactly, so a scope holding "ScopeFold" would match nothing.
  it('stores the canonical spelling, not the one that was typed', async () => {
    await makeGroup('canonical')
    await makeModerator(7103)

    expect(await saveModeratorScope(7103, ['CANONICAL'])).toEqual(['canonical'])
  })
})
