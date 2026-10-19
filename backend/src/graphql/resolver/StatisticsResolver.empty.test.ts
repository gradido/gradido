// AI-GENERATED — not an architecture reference
// A community without a single booking -- a new server, an emptied test server: the totals of
// the former /statistic page, which the admin's start page shows now, answer zero there instead
// of failing (a sum of no rows is NULL). The figures with bookings: StatisticsResolver.test.ts.

import { ApolloServerTestClient, cleanDB, testEnvironment } from '@test/helpers'
import { AppDatabase } from 'database'
import { CONFIG } from '@/config'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { totalGradidoQuery } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'

CONFIG.DLT_ACTIVE = false

let query: ApolloServerTestClient['query']
let db: AppDatabase

beforeAll(async () => {
  const testEnv = await testEnvironment()
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  // One member, to ask: the totals are a right of every member. No booking at all.
  await userFactory(testEnv, bibiBloxberg)
  await testEnv.mutate({
    mutation: login,
    variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
  })
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('the totals of a community without a booking', () => {
  it('answer zero for what was created and what decayed', async () => {
    const { data, errors } = await query({ query: totalGradidoQuery })

    expect(errors).toBeUndefined()
    expect(data.communityStatistics).toEqual({ totalGradidoCreated: '0', totalGradidoDecayed: '0' })
  })
})
