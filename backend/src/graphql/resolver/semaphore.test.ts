import { cleanDB, contributionDateFormatter, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { CONFIG as CORE_CONFIG } from 'core'
import { AppDatabase, Community as DbCommunity } from 'database'
import { GraphQLError } from 'graphql'
// import { TRANSACTIONS_LOCK } from 'database'
import { Mutex } from 'redis-semaphore'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { creationFactory, nMonthsBefore } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import {
  confirmContribution,
  createContribution,
  createContributionLink,
  createTransactionLink,
  login,
  redeemTransactionLink,
  sendCoins,
} from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

jest.mock('@/password/EncryptorUtils')

CONFIG.DLT_ACTIVE = false
CORE_CONFIG.EMAIL = false

let mutate: ApolloServerTestClient['mutate']
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}
beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await testEnv.db.destroy()
})

// Count how many callers are inside the critical section instead of reading it off
// wall clock timestamps. `new Date()` resolves to whole milliseconds, so two entries
// that happen inside the same millisecond carry the same number - and a strict
// `toBeLessThan` on those numbers then fails on a test that is doing nothing wrong.
// A counter answers the question the test actually asks, and it cannot tie.
type Concurrency = { current: number; peak: number; completed: number }

async function fakeWork(concurrency: Concurrency) {
  // const releaseLock = await TRANSACTIONS_LOCK.acquire()
  // create a new mutex for every function call, like in production code
  const mutex = new Mutex(testEnv.db.getRedisClient(), 'TRANSACTIONS_LOCK')
  await mutex.acquire()

  concurrency.current++
  concurrency.peak = Math.max(concurrency.peak, concurrency.current)
  // hold the lock across an await: without the mutex every caller would sit in here
  // at the same time and `current` would climb to the number of callers
  await new Promise((resolve) => setTimeout(resolve, 5))
  concurrency.current--
  concurrency.completed++

  // releaseLock()
  await mutex.release()
}

describe('semaphore', () => {
  it('lets only one caller into the critical section at a time', async () => {
    const concurrency: Concurrency = { current: 0, peak: 0, completed: 0 }

    await Promise.all(Array.from({ length: 20 }, () => fakeWork(concurrency)))

    expect(concurrency.completed).toBe(20)
    expect(concurrency.peak).toBe(1)
  })
})

describe('semaphore fullstack', () => {
  let contributionLinkCode = ''
  let bobsTransactionLinkCode = ''
  let bibisTransactionLinkCode = ''
  let bibisOpenContributionId = -1
  let bobsOpenContributionId = -1
  let homeCom: DbCommunity

  beforeAll(async () => {
    const now = new Date()
    homeCom = DbCommunity.create()
    homeCom.communityUuid = uuidv4()
    homeCom.creationDate = new Date('2000-01-01')
    homeCom.description = 'homeCom description'
    homeCom.foreign = false
    homeCom.name = 'homeCom name'
    homeCom.privateKey = Buffer.from('homeCom privateKey')
    homeCom.publicKey = Buffer.from('homeCom publicKey')
    homeCom.url = 'homeCom url'
    homeCom = await DbCommunity.save(homeCom)

    await userFactory(testEnv, bibiBloxberg)
    await userFactory(testEnv, peterLustig)
    await userFactory(testEnv, bobBaumeister)
    await creationFactory(testEnv, {
      email: 'bibi@bloxberg.de',
      amount: 1000,
      memo: 'Herzlich Willkommen bei Gradido!',
      contributionDate: nMonthsBefore(new Date()),
      confirmed: true,
    })
    await creationFactory(testEnv, {
      email: 'bob@baumeister.de',
      amount: 1000,
      memo: 'Herzlich Willkommen bei Gradido!',
      contributionDate: nMonthsBefore(new Date()),
      confirmed: true,
    })
    await mutate({
      mutation: login,
      variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
    })
    const {
      data: { createContributionLink: contributionLink },
    } = await mutate({
      mutation: createContributionLink,
      variables: {
        amount: '200',
        name: 'Test Contribution Link',
        memo: 'Danke für deine Teilnahme an dem Test der Contribution Links',
        cycle: 'ONCE',
        validFrom: new Date(2022, 5, 18).toISOString(),
        validTo: new Date(now.getFullYear() + 1, 7, 14).toISOString(),
        maxAmountPerMonth: '200',
        maxPerCycle: 1,
      },
    })
    contributionLinkCode = `CL-${contributionLink.code}`
    await mutate({
      mutation: login,
      variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
    })
    const {
      data: { createTransactionLink: bobsLink },
    } = await mutate({
      mutation: createTransactionLink,
      variables: {
        email: 'bob@baumeister.de',
        amount: '20',
        memo: 'Bobs Link',
      },
    })
    const {
      data: { createContribution: bobsContribution },
    } = await mutate({
      mutation: createContribution,
      variables: {
        contributionDate: contributionDateFormatter(new Date()),
        amount: '200',
        memo: 'Bobs Contribution',
      },
    })
    await mutate({
      mutation: login,
      variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
    })
    const {
      data: { createTransactionLink: bibisLink },
    } = await mutate({
      mutation: createTransactionLink,
      variables: {
        amount: '20',
        memo: 'Bibis Link',
      },
    })
    const {
      data: { createContribution: bibisContribution },
    } = await mutate({
      mutation: createContribution,
      variables: {
        contributionDate: contributionDateFormatter(new Date()),
        amount: '200',
        memo: 'Bibis Contribution',
      },
    })
    bobsTransactionLinkCode = bobsLink.code
    bibisTransactionLinkCode = bibisLink.code
    bibisOpenContributionId = bibisContribution.id
    bobsOpenContributionId = bobsContribution.id
  })

  it('creates a lot of transactions without errors', async () => {
    await mutate({
      mutation: login,
      variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
    })
    const bibiRedeemContributionLink = mutate({
      mutation: redeemTransactionLink,
      variables: { code: contributionLinkCode },
    })
    const redeemBobsLink = mutate({
      mutation: redeemTransactionLink,
      variables: { code: bobsTransactionLinkCode },
    })
    const bibisTransaction = mutate({
      mutation: sendCoins,
      variables: {
        recipientCommunityIdentifier: homeCom.communityUuid,
        recipientIdentifier: 'bob@baumeister.de',
        amount: '50',
        memo: 'Das ist für dich, Bob',
      },
    })
    await mutate({
      mutation: login,
      variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
    })
    const bobRedeemContributionLink = mutate({
      mutation: redeemTransactionLink,
      variables: { code: contributionLinkCode },
    })
    const redeemBibisLink = mutate({
      mutation: redeemTransactionLink,
      variables: { code: bibisTransactionLinkCode },
    })
    const bobsTransaction = mutate({
      mutation: sendCoins,
      variables: {
        recipientCommunityIdentifier: homeCom.communityUuid,
        recipientIdentifier: 'bibi@bloxberg.de',
        amount: '50',
        memo: 'Das ist für dich, Bibi',
      },
    })
    await mutate({
      mutation: login,
      variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
    })
    const confirmBibisContribution = mutate({
      mutation: confirmContribution,
      variables: { id: bibisOpenContributionId },
    })
    const confirmBobsContribution = mutate({
      mutation: confirmContribution,
      variables: { id: bobsOpenContributionId },
    })
    await expect(bibiRedeemContributionLink).resolves.toMatchObject({ errors: undefined })
    await expect(redeemBobsLink).resolves.toMatchObject({ errors: undefined })
    await expect(bibisTransaction).resolves.toMatchObject({ errors: undefined })
    await expect(bobRedeemContributionLink).resolves.toMatchObject({ errors: undefined })
    await expect(redeemBibisLink).resolves.toMatchObject({ errors: undefined })
    await expect(bobsTransaction).resolves.toMatchObject({ errors: undefined })
    await expect(confirmBibisContribution).resolves.toMatchObject({ errors: undefined })
    await expect(confirmBobsContribution).resolves.toMatchObject({ errors: undefined })
  })

  describe('redeem transaction link twice', () => {
    let myCode: string

    beforeAll(async () => {
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
      const {
        data: { createTransactionLink: bibisLink },
      } = await mutate({
        mutation: createTransactionLink,
        variables: {
          amount: '20',
          memo: 'Bibis Link',
        },
      })
      myCode = bibisLink.code
      await mutate({
        mutation: login,
        variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
      })
    })

    it('does throw error on second redeem call', async () => {
      const result = await Promise.all([
        mutate({
          mutation: redeemTransactionLink,
          variables: {
            code: myCode,
          },
        }),
        mutate({
          mutation: redeemTransactionLink,
          variables: {
            code: myCode,
          },
        }),
      ])
      expect(result).toContainEqual(
        expect.objectContaining({
          errors: [new GraphQLError('Transaction link already redeemed')],
        }),
      )
      expect(result).toContainEqual(
        expect.objectContaining({
          errors: undefined,
        }),
      )
    })
  })
})
