import { Duration, GradidoUnit } from 'shared'
import {
  AppDatabase,
  bibiBloxberg,
  TransactionLink as DbTransactionLink,
  User as DbUser,
  UserContact as DbUserContact,
  TransactionLinkInterface,
  transactionLinkFactoryBulk,
  transactionLinksPendingFromUserOrderByIdASC,
  userFactory,
} from '..'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

let bibiUser: DbUser
const startDate = new Date('2022-03-21T03:33:33Z')

describe('transactionLinks', () => {
  beforeAll(async () => {
    await DbUser.clear()
    await DbUserContact.clear()
    await DbTransactionLink.clear()

    const bibi = bibiBloxberg
    bibiUser = await userFactory(bibi)
  })
  it('transactionLinksPendingFromUserOrderByIdASC', async () => {
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
    await transactionLinkFactoryBulk(
      transactionLinks,
      new Map([[bibiUser.emailContact.email, bibiUser]]),
    )
    let dbTransactionLinks = await transactionLinksPendingFromUserOrderByIdASC(
      bibiUser.id,
      4,
      0,
      Duration.days(11).addToDate(startDate),
    )
    expect(dbTransactionLinks.length).toBe(4)

    dbTransactionLinks = await transactionLinksPendingFromUserOrderByIdASC(
      bibiUser.id,
      2,
      0,
      Duration.days(11).addToDate(startDate),
    )
    expect(dbTransactionLinks.length).toBe(2)
  })

  it('transactionLinksPendingFromUserOrderByIdASC pagination', async () => {
    // the data from previous test are still in db, so let's start after all should be expired
    const localStartDate = Duration.days(17).addToDate(startDate)
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
    let result = await transactionLinksPendingFromUserOrderByIdASC(bibiUser.id, 10, 0, endDate)
    expect(result.length).toBe(10)
    expect(result[0].id).toBe(5)
    result = await transactionLinksPendingFromUserOrderByIdASC(bibiUser.id, 8, 10, endDate)
    expect(result.length).toBe(8)
    expect(result[0].id).toBe(11)
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
    const result = await transactionLinksPendingFromUserOrderByIdASC(bibiUser.id, 1000, 0, endDate)
    expect(result.length).toBe(1000)
    // no assertion, just to check if it is fast enough
  })
})
