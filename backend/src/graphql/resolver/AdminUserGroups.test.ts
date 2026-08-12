import { RoleNames } from '@enum/RoleNames'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, User, UserRole } from 'database'
import { getLogger as originalGetLogger } from 'log4js'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { searchAdminUsers } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'

// Group functions: the community info page lists moderators under the group they
// look after. Two things have to hold for that listing to be truthful: a KI-Moderator must
// appear at all (they are a moderator with Crea, not a separate kind), and an unassigned
// moderator must read as "sees every group" — because that is exactly what the contribution
// list grants them.

jest.mock('@/password/EncryptorUtils')

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

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

interface ListedUser {
  firstName: string
  lastName: string
  role: string
  visibleCreationGroups: string[]
  seesAllCreationGroups: boolean
  seesUntagged: boolean
}

const listAdminUsers = async (): Promise<ListedUser[]> => {
  const {
    data: {
      searchAdminUsers: { userList },
    },
  } = await query({ query: searchAdminUsers })
  return userList
}

const ADMIN = 'Peter'
const MODERATOR = 'Bibi'
const AI_MODERATOR = 'Garrick'

const byFirstName = (users: ListedUser[], firstName: string): ListedUser | undefined =>
  users.find((user) => user.firstName === firstName)

const setRole = async (
  userId: number,
  role: RoleNames,
  visibleCreationGroups: string | null,
): Promise<void> => {
  const existing = await UserRole.findOne({ where: { userId } })
  const entry = existing ?? UserRole.create()
  entry.createdAt = entry.createdAt ?? new Date()
  entry.userId = userId
  entry.role = role
  entry.visibleCreationGroups = visibleCreationGroups
  await entry.save()
}

describe('searchAdminUsers — groups shown on the community info page', () => {
  let scopedModerator: User
  let aiModerator: User

  beforeAll(async () => {
    await userFactory(testEnv, peterLustig) // administrator
    scopedModerator = await userFactory(testEnv, bibiBloxberg)
    aiModerator = await userFactory(testEnv, garrickOllivander)

    await setRole(scopedModerator.id, RoleNames.MODERATOR, JSON.stringify(['firefighter']))
    await setRole(aiModerator.id, RoleNames.MODERATOR_AI, null)

    resetToken()
    await mutate({
      mutation: login,
      variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
    })
  })

  afterAll(() => {
    resetToken()
  })

  it('lists a KI-Moderator alongside the plain moderators', async () => {
    // Before the group listing, the query asked only for 'admin' and 'moderator', so a
    // MODERATOR_AI was missing from the page entirely — and with them their groups.
    const users = await listAdminUsers()
    const listed = byFirstName(users, AI_MODERATOR)
    expect(listed).toBeDefined()
    expect(listed?.role).toBe(RoleNames.MODERATOR_AI)
  })

  it('reports the groups a scoped moderator looks after', async () => {
    const users = await listAdminUsers()
    const listed = byFirstName(users, MODERATOR)
    expect(listed?.visibleCreationGroups).toEqual(['firefighter'])
    expect(listed?.seesAllCreationGroups).toBe(false)
  })

  it('reports a moderator without any scope as covering every group', async () => {
    const users = await listAdminUsers()
    const listed = byFirstName(users, AI_MODERATOR)
    expect(listed?.visibleCreationGroups).toEqual([])
    expect(listed?.seesAllCreationGroups).toBe(true)
  })

  it('treats the "*all" sentinel the same as no scope at all', async () => {
    await setRole(scopedModerator.id, RoleNames.MODERATOR, JSON.stringify(['*all', 'firefighter']))
    const users = await listAdminUsers()
    const listed = byFirstName(users, MODERATOR)
    expect(listed?.seesAllCreationGroups).toBe(true)
  })

  it('keeps a moderator scoped only to untagged contributions out of the "all groups" bucket', async () => {
    // '*untagged' is a narrow assignment, not a free pass: such a moderator belongs under
    // their own heading, never under "every group".
    await setRole(scopedModerator.id, RoleNames.MODERATOR, JSON.stringify(['*untagged']))
    const users = await listAdminUsers()
    const listed = byFirstName(users, MODERATOR)
    expect(listed?.visibleCreationGroups).toEqual([])
    expect(listed?.seesAllCreationGroups).toBe(false)
  })

  it('reports the untagged half of a mixed scope separately from the groups', async () => {
    // A scope can cover a group AND the contributions that carry none. '*untagged' is not a
    // group, so it must not appear in visibleCreationGroups — but dropping it silently would
    // leave the admin unable to offer a filter that reaches those contributions.
    await setRole(
      scopedModerator.id,
      RoleNames.MODERATOR,
      JSON.stringify(['firefighter', '*untagged']),
    )
    const users = await listAdminUsers()
    const listed = byFirstName(users, MODERATOR)
    expect(listed?.visibleCreationGroups).toEqual(['firefighter'])
    expect(listed?.seesAllCreationGroups).toBe(false)
    expect(listed?.seesUntagged).toBe(true)
  })

  it('reports a scope of only real groups as not covering the untagged ones', async () => {
    await setRole(scopedModerator.id, RoleNames.MODERATOR, JSON.stringify(['firefighter']))
    const users = await listAdminUsers()
    const listed = byFirstName(users, MODERATOR)
    expect(listed?.seesUntagged).toBe(false)
  })

  it('leaves administrators unrestricted', async () => {
    const users = await listAdminUsers()
    const listed = byFirstName(users, ADMIN)
    expect(listed?.role).toBe(RoleNames.ADMIN)
    expect(listed?.seesAllCreationGroups).toBe(true)
  })
})
