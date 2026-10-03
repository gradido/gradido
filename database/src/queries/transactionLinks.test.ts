import { Duration, GradidoUnit } from 'shared'
import {
  AccountState,
  AppDatabase,
  bibiBloxberg,
  TransactionLink as DbTransactionLink,
  User as DbUser,
  UserContact as DbUserContact,
  dbFindTransactionLinkByCode,
  dbFindTransactionLinkWithOwner,
  drizzleDb,
  TransactionLinkInterface,
  transactionLinkFactory,
  transactionLinkFactoryBulk,
  transactionLinksPendingFromUserOrderByIdASC,
  userFactory,
} from '..'

import { createCommunity } from '../seeds/community'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'

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
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)

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

describe('dbFindTransactionLinkByCode', () => {
  let link: DbTransactionLink

  beforeAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    const bibi = await userFactory(bibiBloxberg)
    link = await transactionLinkFactory(
      { email: bibi.emailContact.email, amount: 10, memo: 'for a newcomer' },
      bibi.id,
    )
  })

  it('finds the link, and with it who created it', async () => {
    expect(await dbFindTransactionLinkByCode(link.code)).toEqual(
      expect.objectContaining({ id: link.id, userId: link.userId }),
    )
  })

  it('finds nothing for an unknown code', async () => {
    expect(await dbFindTransactionLinkByCode('unknown-code')).toBeNull()
  })

  it('finds no deleted link', async () => {
    await DbTransactionLink.softRemove(link)
    expect(await dbFindTransactionLinkByCode(link.code)).toBeNull()
  })
})

// What decides whether a redeem link vouches for an account, read with the link: the link's
// own columns, and where the account of the member who made it stands.
describe('dbFindTransactionLinkWithOwner', () => {
  let bibi: DbUser
  let link: DbTransactionLink

  beforeAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    bibi = await userFactory(bibiBloxberg)
    link = await transactionLinkFactory(
      { email: bibi.emailContact.email, amount: 20, memo: 'for a newcomer' },
      bibi.id,
    )
  })

  it('reads an open link of a confirmed member as that', async () => {
    // As the column holds it: without the milliseconds the factory's date had.
    const { validUntil } = await DbTransactionLink.findOneByOrFail({ id: link.id })

    expect(await dbFindTransactionLinkWithOwner(link.id)).toEqual({
      userId: bibi.id,
      validUntil,
      redeemedAt: null,
      redeemedBy: null,
      deletedAt: null,
      ownerDeletedAt: null,
      ownerForeign: false,
      ownerEmailChecked: true,
    })
  })

  it('finds nothing for an unknown id', async () => {
    expect(await dbFindTransactionLinkWithOwner(link.id + 1000)).toBeNull()
  })

  it('answers the same inside a transaction', async () => {
    const inside = await drizzleDb().transaction((tx) =>
      dbFindTransactionLinkWithOwner(link.id, tx),
    )
    expect(inside).toEqual(await dbFindTransactionLinkWithOwner(link.id))
  })

  it('shows that the thank-you was accepted, and by whom', async () => {
    const redeemedAt = new Date('2026-10-03T08:00:00.000Z')
    await DbTransactionLink.update(link.id, { redeemedAt, redeemedBy: 4711 })

    expect(await dbFindTransactionLinkWithOwner(link.id)).toEqual(
      expect.objectContaining({ redeemedAt, redeemedBy: 4711 }),
    )
  })

  // Unlike dbFindTransactionLinkByCode, a deleted link is found here: the caller holds its id
  // from before the lock, and has to see that it was deleted since.
  it('shows a deleted link as deleted', async () => {
    await DbTransactionLink.softRemove(link)

    const found = await dbFindTransactionLinkWithOwner(link.id)
    expect(found?.deletedAt).toBeInstanceOf(Date)
  })

  // The address in force is the one `users.email_id` names.
  it('shows a member whose address is not confirmed', async () => {
    await DbUserContact.update(bibi.emailId as number, { emailChecked: false })

    expect((await dbFindTransactionLinkWithOwner(link.id))?.ownerEmailChecked).toBe(false)
  })

  it('shows a deleted member as deleted', async () => {
    await DbUser.update(bibi.id, { deletedAt: new Date(), accountState: AccountState.DELETED })

    expect((await dbFindTransactionLinkWithOwner(link.id))?.ownerDeletedAt).toBeInstanceOf(Date)
  })
})
