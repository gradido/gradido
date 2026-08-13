// AI-GENERATED — not an architecture reference

import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase } from 'database'
import { CONFIG } from '@/config'
import { creationFactory, nMonthsBefore } from '@/seeds/factory/creation'
import { transactionLinkFactory } from '@/seeds/factory/transactionLink'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { transactionsQuery } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

// The balance carries two counts of transaction links, and they answer different questions.
//
// linkCount is what the list of links pages against, and that list shows expired links as
// well, so it must keep counting them. openLinkCount is what a member is told - the links
// that can still be redeemed. Counting the expired ones there said "12 open" while two were.
//
// A link expires CODE_VALID_DAYS_DURATION days after it was created, so a link created long
// enough ago is expired without touching the row afterwards.

jest.mock('@/password/EncryptorUtils')

CONFIG.DLT_ACTIVE = false

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()

  await userFactory(testEnv, bibiBloxberg)
  // the creation is only confirmed by a moderator, and the factory looks for this one
  await userFactory(testEnv, peterLustig)
  await creationFactory(testEnv, {
    email: 'bibi@bloxberg.de',
    amount: 1000,
    memo: 'Herzlich Willkommen bei Gradido!',
    contributionDate: nMonthsBefore(new Date()),
    confirmed: true,
  })

  const longAgo = new Date()
  longAgo.setFullYear(longAgo.getFullYear() - 1)

  await transactionLinkFactory(testEnv, {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: 'expired long ago',
    createdAt: longAgo,
  })
  await transactionLinkFactory(testEnv, {
    email: 'bibi@bloxberg.de',
    amount: 19.99,
    memo: 'still open',
  })

  await mutate({
    mutation: login,
    variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
  })
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('balance of a member with one expired and one open link', () => {
  it('counts both for the list and only the open one for the member', async () => {
    const {
      data: {
        transactionList: { balance },
      },
    } = await query({ query: transactionsQuery, variables: { currentPage: 1, pageSize: 25 } })

    expect(balance).toMatchObject({
      linkCount: 2,
      openLinkCount: 1,
    })
  })
})
