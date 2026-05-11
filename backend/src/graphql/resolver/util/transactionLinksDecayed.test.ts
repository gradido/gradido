import {
  AppDatabase,
  bibiBloxberg,
  TransactionLink as DbTransactionLink,
  User as DbUser,
  UserContact as DbUserContact,
  TransactionLinkInterface,
  transactionLinkFactoryBulk,
  userFactory,
} from 'database'
import { CODE_VALID_DAYS_DURATION, Duration, GradidoUnit } from 'shared'
import { calculateDecay } from 'shared-native'
import { transactionLinksDecayed } from './transactionLinksDecayed'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

let bibiUser: DbUser
const startDate = new Date('2022-03-21T03:33:33Z')

describe('transactionLinksDecayed', () => {
  beforeAll(async () => {
    await DbUser.clear()
    await DbUserContact.clear()
    await DbTransactionLink.clear()

    const bibi = bibiBloxberg
    bibiUser = await userFactory(bibi)
  })
  it('should calculate decayed amounts correctly', async () => {
    const transactionLinks: TransactionLinkInterface[] = [
      {
        email: bibiUser.emailContact.email,
        amount: 100.5,
        memo: 'test',
        createdAt: Duration.days(10).addToDate(startDate),
      },
      {
        email: bibiUser.emailContact.email,
        amount: 17.21,
        memo: 'test',
        createdAt: Duration.days(7).addToDate(startDate),
      },
      {
        email: bibiUser.emailContact.email,
        amount: 124.64,
        memo: 'test',
        createdAt: Duration.days(3).addToDate(startDate),
      },
      {
        email: bibiUser.emailContact.email,
        amount: 100,
        memo: 'test',
        createdAt: Duration.days(1).addToDate(startDate),
      },
    ]
    // fill db
    const transactionLinkDBPromise = transactionLinkFactoryBulk(
      transactionLinks,
      new Map([[bibiUser.emailContact.email, bibiUser]]),
    )

    // calculate decayed sum manually while db is filled
    let decayedSum = new GradidoUnit(0n)
    let sumAmount = new GradidoUnit(0n)
    const endDate = Duration.days(12).addToDate(startDate)
    const linkTime = Duration.days(CODE_VALID_DAYS_DURATION)
    for (const tx of transactionLinks) {
      const duration = GradidoUnit.effectiveDecayDuration(tx.createdAt!, endDate)
      const gddAmount = GradidoUnit.fromNumber(tx.amount).gddCent
      const holdAvailableAmount = calculateDecay(gddAmount, BigInt(-linkTime.seconds))
      const decayed = calculateDecay(holdAvailableAmount, BigInt(duration.seconds))
      decayedSum = decayedSum.add(GradidoUnit.fromGradidoCent(decayed))
      sumAmount = sumAmount.add(GradidoUnit.fromNumber(tx.amount))
    }

    await transactionLinkDBPromise
    const result = await transactionLinksDecayed(bibiUser.id, endDate)
    expect(result.sumAmount.comparedTo(sumAmount)).toBe(0n)
    expect(result.sumHoldAvailableDecayedAmount.comparedTo(decayedSum)).toBe(0n)
    expect(result.transactionLinkCount).toBe(transactionLinks.length)
    // verified reference decay value for fixed test dataset
    expect(result.sumHoldAvailableDecayedAmount.comparedTo(new GradidoUnit(3467208n))).toBe(0n)
  })

  it('test pagination', async () => {
    // the data from previous test are still in db, so let's start after all should be expired
    const localStartDate = Duration.days(17).addToDate(startDate)
    db.changeDefaultBatchSize(10)
    const transactionLinks: TransactionLinkInterface[] = []
    let sumAmount = new GradidoUnit(0n)
    for (let i = 0; i < 25; i++) {
      const amount = Math.random() * 1000
      sumAmount = sumAmount.add(GradidoUnit.fromNumber(amount))
      transactionLinks.push({
        email: bibiUser.emailContact.email,
        amount: amount,
        memo: `test ${i}`,
        createdAt: Duration.days(Math.floor(Math.random() * 11)).addToDate(localStartDate),
      })
    }
    const endDate = Duration.days(12).addToDate(localStartDate)
    await transactionLinkFactoryBulk(
      transactionLinks,
      new Map([[bibiUser.emailContact.email, bibiUser]]),
    )
    const result = await transactionLinksDecayed(bibiUser.id, endDate)
    expect(result.sumAmount.comparedTo(sumAmount)).toBe(0n)
    expect(result.transactionLinkCount).toBe(transactionLinks.length)
    db.changeDefaultBatchSize(100)
  })

  it('fill db with 1.000 random data sets', async () => {
    const localStartDate = Duration.days(35).addToDate(startDate)
    const transactionLinks: TransactionLinkInterface[] = []
    let sumAmount = new GradidoUnit(0n)
    for (let i = 0; i < 1000; i++) {
      const amount = Math.random() * 1000
      sumAmount = sumAmount.add(GradidoUnit.fromNumber(amount))
      transactionLinks.push({
        email: bibiUser.emailContact.email,
        amount: amount,
        memo: `test ${i}`,
        createdAt: Duration.days(Math.floor(Math.random() * 11)).addToDate(localStartDate),
      })
    }
    await transactionLinkFactoryBulk(
      transactionLinks,
      new Map([[bibiUser.emailContact.email, bibiUser]]),
    )
  })

  it('test speed with 1.000 random data sets', async () => {
    const endDate = Duration.days(12 + 35).addToDate(startDate)
    const result = await transactionLinksDecayed(bibiUser.id, endDate)
    expect(result.transactionLinkCount).toBe(1000)
    // no assertion, just to check if it is fast enough
  })
})
