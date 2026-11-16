// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import {
  AppDatabase,
  ContributionStatus,
  ContributionType,
  contributionsTable,
  DbUser,
  dbCountContributionsInProgressByUserId,
  drizzleDb,
  userContactsTable,
  usersTable,
} from 'database'
import { eq } from 'drizzle-orm'
import { gql } from 'graphql-tag'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactoryDrizzle } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

// The member's contributions that wait for their answer, as the wallet's chat beat asks for them
// (the mark at "Schöpfen") and the admin for the number at the moderator's face. What the count
// reads of the table is the query's test (database); here: whose, through the schema, and that
// it never takes the chat's answer down with it.

// The count passes through to the database and can be made to fail once.
jest.mock('database', () => {
  const original = jest.requireActual('database')
  return {
    __esModule: true,
    ...original,
    dbCountContributionsInProgressByUserId: jest.fn(
      original.dbCountContributionsInProgressByUserId,
    ),
  }
})

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let bibi: DbUser
let bob: DbUser
let peter: DbUser

const countContributionsInProgress = gql`
  query {
    countContributionsInProgress
  }
`
// the document of the chat's beat as the wallet sends it, the count as its third field
const chatBeat = gql`
  query {
    newChatMessagesSince {
      latestId
      unreadConversations
    }
    supportTicketsMenu {
      active
      inProgress
      unfinished
    }
    countContributionsInProgress
  }
`
// the admin's question for the number at the moderator's face, as the admin sends it: the
// document itself, with its aliases, through the server's own rules
const moderatorWalletNews = gql(
  readFileSync(
    join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'admin',
      'src',
      'graphql',
      'moderatorWalletNews.graphql',
    ),
    'utf8',
  ),
)

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  expect(errors).toBeUndefined()
}

const contribution = (userId: number, status: ContributionStatus, deletedAt: Date | null = null) =>
  drizzleDb().insert(contributionsTable).values({
    userId,
    memo: 'Ich habe im Garten geholfen',
    type: ContributionType.USER,
    status,
    contributionDate: new Date(),
    deletedAt,
  })

beforeAll(async () => {
  const testEnv = await testEnvironment(getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`))
  mutate = testEnv.mutate
  query = testEnv.query
  await cleanDB()
  bibi = await userFactoryDrizzle(bibiBloxberg)
  bob = await userFactoryDrizzle(bobBaumeister)
  peter = await userFactoryDrizzle(peterLustig)
})

afterAll(async () => {
  await cleanDB()
  await AppDatabase.getInstance().destroy()
})

afterEach(async () => {
  await drizzleDb().delete(contributionsTable)
})

describe('countContributionsInProgress', () => {
  it('is refused without a login', async () => {
    resetToken()
    const res: any = await query({ query: countContributionsInProgress })
    expect(res.errors?.[0].message).toBe('401 Unauthorized')
  })

  it("counts the member's own contributions with a question back, none of another's", async () => {
    await contribution(bibi.id, ContributionStatus.IN_PROGRESS)
    await contribution(bibi.id, ContributionStatus.IN_PROGRESS)
    await contribution(bibi.id, ContributionStatus.PENDING)
    await contribution(bibi.id, ContributionStatus.DENIED)
    await contribution(bob.id, ContributionStatus.IN_PROGRESS)
    await loginAs('bibi@bloxberg.de')

    const res: any = await query({ query: countContributionsInProgress })
    expect(res.errors).toBeUndefined()
    expect(res.data.countContributionsInProgress).toBe(2)
  })

  it('answers null where it cannot count, and the chat beside it goes on', async () => {
    await loginAs('bibi@bloxberg.de')
    ;(dbCountContributionsInProgressByUserId as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error('the database is gone'), { code: 'ECONNRESET' }),
    )
    const res: any = await query({ query: chatBeat })
    expect(res.errors).toBeUndefined()
    expect(res.data.countContributionsInProgress).toBeNull()
    expect(res.data.newChatMessagesSince).toEqual(
      expect.objectContaining({ unreadConversations: 0 }),
    )
    expect(res.data.supportTicketsMenu).toEqual({ active: true, inProgress: 0, unfinished: 0 })
  })

  it("reaches an account unconfirmed past its grace period, and a project account, in the chat's beat", async () => {
    // confirmed so that a password exists, then unconfirmed and two days old (as in the chat)
    const garrick = await userFactoryDrizzle({ ...garrickOllivander, emailChecked: true })
    await drizzleDb()
      .update(usersTable)
      .set({ createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) })
      .where(eq(usersTable.id, garrick.id))
    await drizzleDb()
      .update(userContactsTable)
      .set({ emailChecked: false })
      .where(eq(userContactsTable.userId, garrick.id))
    const raeuber = await userFactoryDrizzle(raeuberHotzenplotz)
    await drizzleDb()
      .update(usersTable)
      .set({ creationAllowed: false })
      .where(eq(usersTable.id, raeuber.id))
    await contribution(garrick.id, ContributionStatus.IN_PROGRESS)

    for (const [email, inProgress] of [
      ['garrick@ollivander.com', 1],
      ['raeuber@hotzenplotz.de', 0],
    ] as const) {
      await loginAs(email)
      const res: any = await query({ query: chatBeat })
      expect([email, res.errors]).toEqual([email, undefined])
      expect([email, res.data.countContributionsInProgress]).toEqual([email, inProgress])
    }
  })

  it("answers a moderator the admin's question for the number at their face", async () => {
    // peter is the one administrator of the seeds
    await contribution(peter.id, ContributionStatus.IN_PROGRESS)
    await loginAs('peter@lustig.de')

    const res: any = await query({ query: moderatorWalletNews })
    expect(res.errors).toBeUndefined()
    expect(res.data).toEqual({
      walletChat: { unreadConversations: 0 },
      walletSupport: { inProgress: 0 },
      walletContributions: 1,
    })
  })
})
