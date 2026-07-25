import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, Contribution as DbContribution, GroupTag as DbGroupTag, User } from 'database'
import { getLogger as originalGetLogger } from 'log4js'
import { userFactory } from '@/seeds/factory/user'
import { createContribution, login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'
import { suggestGroupTagForUser } from './util/suggestGroupTag'
import { saveUserGroupTags } from './util/userGroupTags'

// Group functions: what the group field is pre-filled with when submitting.
// The member's own last STATEMENT wins, walked backwards through their history — an
// entry a moderator made for them only applies where they have never said anything.
//
// The distinction that carries this: a deliberate "no group" is a statement and ends the
// walk, while legacy stock that never said anything is skipped so it cannot silence a
// clear choice further back.

jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendContributionConfirmedEmail: jest.fn(),
    sendContributionDeniedEmail: jest.fn(),
    sendContributionDeletedEmail: jest.fn(),
    sendEmailTranslated: jest.fn(),
  }
})
jest.mock('@/password/EncryptorUtils')

let mutate: ApolloServerTestClient['mutate']
let db: AppDatabase
let testEnv: Awaited<ReturnType<typeof testEnvironment>>

const submit = async (memo: string, groupTags?: string[]): Promise<void> => {
  await mutate({
    mutation: createContribution,
    variables: {
      amount: '100',
      memo,
      contributionDate: new Date().toString(),
      ...(groupTags ? { groupTags } : {}),
    },
  })
}

const asLegacy = async (memo: string): Promise<void> => {
  // Submitting always stamps group_tags_set_at. Clearing it reproduces stock from before
  // the group field existed, where an inline "#tag" is all there is to go on.
  await DbContribution.update({ memo }, { groupTagsSetAt: null })
}

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

beforeAll(async () => {
  testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  db = testEnv.db
  await cleanDB()

  await DbGroupTag.save([
    DbGroupTag.create({ tag: 'feuerwehr', name: 'Feuerwehr' }),
    DbGroupTag.create({ tag: 'hexen', name: 'Hexen' }),
    DbGroupTag.create({ tag: 'chor', name: 'Chor' }),
  ])
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('the member has said something themselves', () => {
  let member: User

  beforeAll(async () => {
    member = await userFactory(testEnv, bibiBloxberg)
    await loginAs('bibi@bloxberg.de')
  })

  it('suggests the group of the most recent contribution', async () => {
    await submit('suggestion: for the choir', ['chor'])
    expect((await suggestGroupTagForUser(member.id))?.tag).toBe('chor')
  })

  it('follows a change of group', async () => {
    await submit('suggestion: for the fire brigade now', ['feuerwehr'])
    expect((await suggestGroupTagForUser(member.id))?.tag).toBe('feuerwehr')
  })

  it('honours a deliberate "no group" and does not reach past it', async () => {
    // The decisive case. Without the group_tags_set_at stamp this would keep suggesting
    // the fire brigade, pushing back a group the member has just opted out of.
    await submit('suggestion: deliberately without a group', [])
    expect(await suggestGroupTagForUser(member.id)).toBeNull()
  })

  it('walks past legacy stock that says nothing, without falling through to the main tag', async () => {
    // A contribution from before the group field, naming no group: not a statement, so the
    // deliberate "no group" before it still stands.
    //
    // The main tag is what makes this test bite. Without it, "stopped at the deliberate no
    // group" and "walked off the end and fell through" would both come out null, and the
    // assertion would pass either way.
    await saveUserGroupTags(member.id, ['chor'])
    await submit('suggestion: legacy without any hashtag')
    await asLegacy('suggestion: legacy without any hashtag')
    expect(await suggestGroupTagForUser(member.id)).toBeNull()
  })
})

describe('the member only ever wrote a hashtag', () => {
  let member: User

  beforeAll(async () => {
    member = await userFactory(testEnv, raeuberHotzenplotz)
    await loginAs('raeuber@hotzenplotz.de')
    await submit('suggestion: #hexen long ago')
    await asLegacy('suggestion: #hexen long ago')
    await submit('suggestion: later, no hashtag at all')
    await asLegacy('suggestion: later, no hashtag at all')
  })

  it('suggests the group from the old hashtag', async () => {
    // Bernd's main case: whoever ever named a group gets it back, even when later
    // contributions said nothing.
    expect((await suggestGroupTagForUser(member.id))?.tag).toBe('hexen')
  })

  it('ignores a hashtag that names no group that exists', async () => {
    await submit('suggestion: #vertipperr is not a group')
    await asLegacy('suggestion: #vertipperr is not a group')
    expect((await suggestGroupTagForUser(member.id))?.tag).toBe('hexen')
  })

  it('lets that old choice outrank a main tag a moderator entered', async () => {
    // Bernd's decision of 22.07.2026: the member's own choice wins. The entry only
    // reaches someone who has never said anything.
    await saveUserGroupTags(member.id, ['feuerwehr'])
    expect((await suggestGroupTagForUser(member.id))?.tag).toBe('hexen')
  })
})

describe('the member has never said anything', () => {
  let member: User

  beforeAll(async () => {
    member = await userFactory(testEnv, peterLustig)
  })

  it('suggests nothing at all when there is nothing to go on', async () => {
    expect(await suggestGroupTagForUser(member.id)).toBeNull()
  })

  it('falls back to the main tag a moderator entered', async () => {
    // The seeding case: the fire brigade signs ten people up, and their first
    // contribution lands in the right place.
    await saveUserGroupTags(member.id, ['feuerwehr', 'chor'])
    expect((await suggestGroupTagForUser(member.id))?.tag).toBe('feuerwehr')
  })
})

describe('a long-standing member whose whole history is silent', () => {
  // The case that cannot be tried out by hand: an account from before the group field
  // that never wrote a hashtag either. Every one of its contributions is legacy stock
  // saying nothing, so the walk has to run all the way through without ever mistaking
  // silence for a statement — and then behave exactly as it did before the field
  // existed: an empty group field.
  let member: User

  beforeAll(async () => {
    member = await userFactory(testEnv, bobBaumeister)
    await loginAs('bob@baumeister.de')
    for (const memo of [
      'suggestion: silent legacy, first',
      'suggestion: silent legacy, second',
      'suggestion: silent legacy, third',
    ]) {
      await submit(memo)
      await asLegacy(memo)
    }
  })

  it('leaves the field empty, as it was before the group field existed', async () => {
    expect(await suggestGroupTagForUser(member.id)).toBeNull()
  })

  it('still lets a main tag through, so seeding reaches such an account', async () => {
    // The second half of the same case, and the one that makes the first bite: silence
    // must not COUNT as a statement, it must be walked past. If the walk stopped at the
    // newest silent contribution instead, this would come out null too.
    await saveUserGroupTags(member.id, ['chor'])
    expect((await suggestGroupTagForUser(member.id))?.tag).toBe('chor')
  })
})
