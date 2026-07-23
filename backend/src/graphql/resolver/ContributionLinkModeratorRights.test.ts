import { RoleNames } from '@enum/RoleNames'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, User, UserRole } from 'database'
import { GraphQLError } from 'graphql'
import { getLogger as originalGetLogger } from 'log4js'
import { userFactory } from '@/seeds/factory/user'
import {
  createContributionLink,
  deleteContributionLink,
  login,
  updateContributionLink,
} from '@/seeds/graphql/mutations'
import { listContributionLinks } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

// Starting-balance links ("Startguthaben") hand out newly created Gradido, so setting them
// up belongs to administrators. Moderators keep the read side on purpose: they look a link
// up and pass it on as promotional material — they just cannot create, change or remove one.
// Both moderator kinds are checked, because MODERATOR_AI inherits the same rights.

jest.mock('@/password/EncryptorUtils')

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

const LINK = {
  amount: '200',
  name: 'Startguthaben rights test',
  memo: 'Startguthaben rights test memo',
  validFrom: new Date('2022-04-01').toISOString(),
  validTo: new Date('2022-12-31').toISOString(),
  cycle: 'ONCE',
  maxPerCycle: 1,
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

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

const setRole = async (userId: number, role: RoleNames): Promise<void> => {
  const existing = await UserRole.findOne({ where: { userId } })
  const entry = existing ?? UserRole.create()
  entry.createdAt = entry.createdAt ?? new Date()
  entry.userId = userId
  entry.role = role
  await entry.save()
}

const unauthorized = expect.objectContaining({
  errors: [new GraphQLError('401 Unauthorized')],
})

describe('contribution links — only administrators may set up a starting balance', () => {
  let moderator: User

  beforeAll(async () => {
    await userFactory(testEnv, peterLustig) // administrator
    moderator = await userFactory(testEnv, bibiBloxberg)
    await setRole(moderator.id, RoleNames.MODERATOR)
  })

  afterAll(() => {
    resetToken()
  })

  it('refuses to let a moderator create one', async () => {
    await loginAs('bibi@bloxberg.de')
    await expect(mutate({ mutation: createContributionLink, variables: LINK })).resolves.toEqual(
      unauthorized,
    )
  })

  it('refuses to let a moderator change one', async () => {
    await loginAs('bibi@bloxberg.de')
    await expect(
      mutate({ mutation: updateContributionLink, variables: { ...LINK, id: 1 } }),
    ).resolves.toEqual(unauthorized)
  })

  it('refuses to let a moderator delete one', async () => {
    await loginAs('bibi@bloxberg.de')
    await expect(
      mutate({ mutation: deleteContributionLink, variables: { id: 1 } }),
    ).resolves.toEqual(unauthorized)
  })

  it('refuses a KI-Moderator just the same', async () => {
    await setRole(moderator.id, RoleNames.MODERATOR_AI)
    await loginAs('bibi@bloxberg.de')
    await expect(mutate({ mutation: createContributionLink, variables: LINK })).resolves.toEqual(
      unauthorized,
    )
  })

  it('still lets a moderator look the links up, so they can pass them on', async () => {
    await setRole(moderator.id, RoleNames.MODERATOR)
    await loginAs('bibi@bloxberg.de')
    const { errors } = await query({
      query: listContributionLinks,
      variables: { currentPage: 1, pageSize: 25 },
    })
    expect(errors).toBeUndefined()
  })

  it('lets an administrator create one', async () => {
    await loginAs('peter@lustig.de')
    const { errors } = await mutate({ mutation: createContributionLink, variables: LINK })
    expect(errors).toBeUndefined()
  })
})
