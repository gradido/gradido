// AI-GENERATED — not an architecture reference

import { RoleNames } from '@enum/RoleNames'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, User as DbUser, UserRole } from 'database'
import { gql } from 'graphql-tag'
import { getLogger as originalGetLogger } from 'log4js'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

// The real-name guard (NU-019): firstName and lastName on the shared User type read as
// null to everyone except the moderation and the member themselves. The wallet speaks of
// members by alias, and the digit avatarColorIndex keeps their circle colours where the
// names no longer travel (NU-017). Without this guard every display fix is one query
// away from being undone -- `user()` hands out any member to any signed-in member.
//
// Cast: bibi is the member being looked at (and looks at herself), bob is a plain
// member (a stranger, later given the moderator role), peter is the seeded ADMIN, whose
// sight proves that the right reaches admins by inheriting MODERATOR_RIGHTS.

jest.mock('@/password/EncryptorUtils')

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}
let bob: DbUser

const userNameFields = gql`
  query ($identifier: String!) {
    user(identifier: $identifier) {
      alias
      firstName
      lastName
      avatarColorIndex
    }
  }
`

const loginNameFields = gql`
  mutation ($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      firstName
      lastName
      alias
    }
  }
`

const verifyLoginNameFields = gql`
  query {
    verifyLogin {
      firstName
      lastName
    }
  }
`

beforeAll(async () => {
  testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
  await userFactory(testEnv, peterLustig) // the seeded administrator
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

const bibiAsSeenByCaller = async (): Promise<{
  alias: string
  firstName: string | null
  lastName: string | null
  avatarColorIndex: number
}> => {
  const { data } = await query({ query: userNameFields, variables: { identifier: 'BBB' } })
  return data.user
}

describe('the real-name guard on the shared User type', () => {
  it('hands a member their own name in the login answer', async () => {
    // Login runs on an inalienable right, so no authenticated caller exists while the
    // answer is serialised -- the resolver names the just-authenticated member to the
    // context instead. Without that, the wallet's own store would fill with null names.
    resetToken()
    const { data, errors } = await mutate({
      mutation: loginNameFields,
      variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
    })
    expect(errors).toBeUndefined()
    expect(data.login.firstName).toBe('Bibi')
    expect(data.login.lastName).toBe('Bloxberg')
  })

  it('hands a member their own name through verifyLogin', async () => {
    await loginAs('bibi@bloxberg.de')
    const { data } = await query({ query: verifyLoginNameFields })
    expect(data.verifyLogin.firstName).toBe('Bibi')
    expect(data.verifyLogin.lastName).toBe('Bloxberg')
  })

  it('hands a member their own name when they look themselves up', async () => {
    await loginAs('bibi@bloxberg.de')
    const bibi = await bibiAsSeenByCaller()
    expect(bibi.firstName).toBe('Bibi')
    expect(bibi.lastName).toBe('Bloxberg')
  })

  it('reads as null to another member, who gets alias and colour digit instead', async () => {
    await loginAs('bob@baumeister.de')
    const bibi = await bibiAsSeenByCaller()
    // Null, not an error: a caller who asks for too much sees nothing, and the
    // enclosing user survives for the fields they may read.
    expect(bibi.firstName).toBeNull()
    expect(bibi.lastName).toBeNull()
    expect(bibi.alias).toBe('BBB')
    // The finished digit computed from the real initials 'BB' (NU-017) -- delivered
    // precisely where the names are not, so no circle colour moves.
    expect(bibi.avatarColorIndex).toBe(2)
  })

  it('shows the real name to an administrator', async () => {
    await loginAs('peter@lustig.de')
    const bibi = await bibiAsSeenByCaller()
    expect(bibi.firstName).toBe('Bibi')
    expect(bibi.lastName).toBe('Bloxberg')
  })

  it('shows the real name to a moderator, whose rights list carries the new right', async () => {
    // The role is what decides, so set it directly, the way the scope tests do.
    const existing = await UserRole.findOne({ where: { userId: bob.id } })
    const entry = existing ?? UserRole.create()
    entry.createdAt = entry.createdAt ?? new Date()
    entry.userId = bob.id
    entry.role = RoleNames.MODERATOR
    await entry.save()

    await loginAs('bob@baumeister.de')
    const bibi = await bibiAsSeenByCaller()
    expect(bibi.firstName).toBe('Bibi')
    expect(bibi.lastName).toBe('Bloxberg')
  })
})
