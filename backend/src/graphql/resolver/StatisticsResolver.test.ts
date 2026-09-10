// AI-GENERATED — not an architecture reference

import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, User as DbUser, foreignReceive, getLastTransaction } from 'database'
import { GradidoUnit } from 'shared'
import { CONFIG } from '@/config'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { dynamicStatisticsQuery } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

// The dynamic statistics take every member's LATEST booking - one per member - and decay
// it up to now. Production had a member with two bookings at the very same moment; the
// query matched `balance_date = MAX(balance_date)` and answered both, so the member was
// counted twice as active and both balances went into the sums.
//
// The sums are decayed up to the moment the resolver runs, which the test cannot know
// exactly. Decay counts whole seconds and only ever grows, so the answer has to lie
// between what the latest bookings give decayed up to just before the query and up to
// just after it. A second balance counted in lies far outside of that.

jest.mock('@/password/EncryptorUtils')

CONFIG.DLT_ACTIVE = false

const FOREIGN_COMMUNITY = '99999999-9999-9999-9999-999999999999'
const fromAfar = (gradidoID: string) => ({
  communityUuid: FOREIGN_COMMUNITY,
  gradidoID,
  name: 'Sarah',
})
const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let members: DbUser[]

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()

  const bibi = await userFactory(testEnv, bibiBloxberg)
  const peter = await userFactory(testEnv, peterLustig)
  members = [bibi, peter]

  await foreignReceive(
    peter,
    fromAfar('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    daysAgo(3),
    new GradidoUnit(1000000n),
  )
  await foreignReceive(
    bibi,
    fromAfar('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    daysAgo(2),
    new GradidoUnit(1000000n),
  )
  // Two bookings of bibi at the same moment: only the later one - by id - is her balance.
  const moment = daysAgo(1)
  await foreignReceive(
    bibi,
    fromAfar('cccccccc-cccc-cccc-cccc-cccccccccccc'),
    moment,
    new GradidoUnit(200000n),
  )
  await foreignReceive(
    bibi,
    fromAfar('dddddddd-dddd-dddd-dddd-dddddddddddd'),
    moment,
    new GradidoUnit(300000n),
  )

  await mutate({
    mutation: login,
    variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
  })
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

/** What the statistics must say at `now`, from each member's latest booking, as the API rounds it. */
async function expectedAt(now: Date): Promise<{ available: number; unbookedDecayed: number }> {
  let available = new GradidoUnit(0n)
  let unbookedDecayed = new GradidoUnit(0n)
  for (const member of members) {
    const latest = await getLastTransaction(member.id)
    if (!latest) {
      throw new Error(`the fixture gives member ${member.id} bookings`)
    }
    const decay = latest.balance.calculateDecay(latest.balanceDate, now)
    available = available.add(decay.balance)
    unbookedDecayed = unbookedDecayed.add(decay.decay)
  }
  const asSent = (unit: GradidoUnit) => Number(GradidoUnit.fromString(unit.toString()).gddCent)
  return { available: asSent(available), unbookedDecayed: asSent(unbookedDecayed) }
}

describe('dynamic statistics with a member who has two bookings at the same moment', () => {
  it('counts every member once, with their latest balance only', async () => {
    const before = new Date()
    const {
      data: {
        communityStatistics: { dynamicStatisticsFields },
      },
    } = await query({ query: dynamicStatisticsQuery })
    const after = new Date()

    expect(dynamicStatisticsFields.activeUsers).toBe(2)

    const early = await expectedAt(before)
    const late = await expectedAt(after)
    const available = Number(
      GradidoUnit.fromString(dynamicStatisticsFields.totalGradidoAvailable).gddCent,
    )
    const unbookedDecayed = Number(
      GradidoUnit.fromString(dynamicStatisticsFields.totalGradidoUnbookedDecayed).gddCent,
    )
    expect(available).toBeLessThanOrEqual(early.available)
    expect(available).toBeGreaterThanOrEqual(late.available)
    expect(unbookedDecayed).toBeLessThanOrEqual(early.unbookedDecayed)
    expect(unbookedDecayed).toBeGreaterThanOrEqual(late.unbookedDecayed)
  })
})
