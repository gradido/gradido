import { RoleNames } from '@enum/RoleNames'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, User, UserRole } from 'database'
import { gql } from 'graphql-tag'
import { getLogger as originalGetLogger } from 'log4js'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

// verifyLogin hands the admin interface the signed-in moderator's group visibility scope, so
// its contribution filter can offer only the groups they may actually work in. The derivation
// is describeModeratorGroups (same as the community info page): an administrator or an
// unassigned moderator is unrestricted, a scoped moderator carries their own groups, and a
// moderator scoped to untagged contributions only carries no groups. Both moderator kinds are
// checked, because MODERATOR_AI is scoped exactly like MODERATOR.

jest.mock('@/password/EncryptorUtils')

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

const verifyLoginScope = gql`
  query {
    verifyLogin {
      roles
      visibleGroupTags
      seesAllGroups
      seesUntagged
    }
  }
`

beforeAll(async () => {
  testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

// Set the moderator's role and its visibility scope directly. The scope is not validated on
// read, so the tags need not be seeded as canonical groups for this check.
const setScope = async (userId: number, role: RoleNames, scope: string[] | null): Promise<void> => {
  const existing = await UserRole.findOne({ where: { userId } })
  const entry = existing ?? UserRole.create()
  entry.createdAt = entry.createdAt ?? new Date()
  entry.userId = userId
  entry.role = role
  entry.visibleGroupTags = scope ? JSON.stringify(scope) : null
  await entry.save()
}

const scopeOf = async (): Promise<{
  roles: string[]
  visibleGroupTags: string[]
  seesAllGroups: boolean
  seesUntagged: boolean
}> => {
  const { data } = await query({ query: verifyLoginScope })
  return data.verifyLogin
}

describe('verifyLogin — moderator group visibility scope', () => {
  let moderator: User

  beforeAll(async () => {
    await userFactory(testEnv, peterLustig) // administrator
    moderator = await userFactory(testEnv, bibiBloxberg)
  })

  it('reports an administrator as unrestricted', async () => {
    await loginAs('peter@lustig.de')
    expect(await scopeOf()).toEqual(
      expect.objectContaining({ visibleGroupTags: [], seesAllGroups: true, seesUntagged: true }),
    )
  })

  it('reports an unassigned moderator as unrestricted', async () => {
    await setScope(moderator.id, RoleNames.MODERATOR, null)
    await loginAs('bibi@bloxberg.de')
    expect(await scopeOf()).toEqual({
      roles: ['MODERATOR'],
      visibleGroupTags: [],
      seesAllGroups: true,
      seesUntagged: true,
    })
  })

  it('reports a scoped moderator with exactly their groups', async () => {
    await setScope(moderator.id, RoleNames.MODERATOR, ['firefighter', 'garden'])
    await loginAs('bibi@bloxberg.de')
    expect(await scopeOf()).toEqual({
      roles: ['MODERATOR'],
      visibleGroupTags: ['firefighter', 'garden'],
      seesAllGroups: false,
      seesUntagged: false,
    })
  })

  it('scopes a KI-moderator just the same', async () => {
    await setScope(moderator.id, RoleNames.MODERATOR_AI, ['firefighter'])
    await loginAs('bibi@bloxberg.de')
    expect(await scopeOf()).toEqual({
      roles: ['MODERATOR_AI'],
      visibleGroupTags: ['firefighter'],
      seesAllGroups: false,
      seesUntagged: false,
    })
  })

  it('reports a moderator scoped to untagged contributions with no groups', async () => {
    await setScope(moderator.id, RoleNames.MODERATOR, ['*untagged'])
    await loginAs('bibi@bloxberg.de')
    expect(await scopeOf()).toEqual({
      roles: ['MODERATOR'],
      visibleGroupTags: [],
      seesAllGroups: false,
      seesUntagged: true,
    })
  })

  // The mixed case: one group plus the contributions that carry none. '*untagged' is not a
  // group and must stay out of the tag list, but the admin needs to know it is there — it is
  // the only way it can offer a filter reaching those contributions.
  it('keeps the untagged half of a mixed scope out of the tags but reports it', async () => {
    await setScope(moderator.id, RoleNames.MODERATOR, ['firefighter', '*untagged'])
    await loginAs('bibi@bloxberg.de')
    expect(await scopeOf()).toEqual({
      roles: ['MODERATOR'],
      visibleGroupTags: ['firefighter'],
      seesAllGroups: false,
      seesUntagged: true,
    })
  })
})
