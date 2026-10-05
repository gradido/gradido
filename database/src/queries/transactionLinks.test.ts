import { Duration, GradidoUnit } from 'shared'
import {
  AccountState,
  AppDatabase,
  bibiBloxberg,
  TransactionLink as DbTransactionLink,
  User as DbUser,
  UserContact as DbUserContact,
  dbFindTransactionLinkByCode,
  dbFindTransactionLinkForPreview,
  dbFindTransactionLinkWithOwner,
  dbInsertThankYouGreeting,
  dbInsertThankYouGreetingPicture,
  drizzleDb,
  peterLustig,
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

// What the preview of a redeem link is made from, read with the link in one statement: the
// link's own columns, the member who made it, the greeting and what is known of its pictures.
describe('dbFindTransactionLinkForPreview', () => {
  // Codes as createTransactionLink makes them, 24 hex characters - with letters in them, so
  // that asking in the other case of letters is another text.
  const PLAIN = 'a1f9c2d41b7e19981fa0d001'
  const MOTIF = 'b2e0d5a2996c19981fa0d002'
  const PHOTO = 'c3d1e6b3447d19981fa0d003'
  const NO_USERNAME = 'd4c2f7c4558e19981fa0d004'
  const CLOSED = 'e5b3a8d5669f19981fa0d005'
  const NO_MAKER = 'f6a4b9e6770a19981fa0d006'
  const TWINS = 'a7b5c0f7881b19981fa0d007'
  const CREATED_AT = new Date('2026-10-05T12:00:00.000Z')
  const VALID_UNTIL = new Date('2026-10-19T12:00:00.000Z')
  const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])

  let bibi: DbUser
  let peter: DbUser

  const linkWithCode = async (code: string, maker: DbUser = bibi): Promise<DbTransactionLink> => {
    const link = await transactionLinkFactory(
      {
        email: maker.emailContact.email,
        amount: 20,
        memo: 'Danke für die Suppe!',
        createdAt: CREATED_AT,
      },
      maker.id,
    )
    await DbTransactionLink.update(link.id, { code })
    return link
  }

  /** The statements a function sends, as the pool gets them. */
  const statementsOf = async (run: () => Promise<unknown>): Promise<string[]> => {
    const pool = (drizzleDb() as any).$client
    const original = pool.query
    const sent: string[] = []
    pool.query = function (query: any, params: unknown[]) {
      sent.push(typeof query === 'string' ? query : query.sql)
      return original.call(this, query, params)
    }
    try {
      await run()
    } finally {
      pool.query = original
    }
    return sent
  }

  beforeAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    bibi = await userFactory(bibiBloxberg)
    // Peter has no username: `users.alias` is null.
    peter = await userFactory(peterLustig)
  })

  it('reads a plain link with the member who made it, and no greeting', async () => {
    await linkWithCode(PLAIN)

    expect(await dbFindTransactionLinkForPreview(PLAIN)).toEqual({
      link: {
        code: PLAIN,
        userId: bibi.id,
        validUntil: VALID_UNTIL,
        redeemedAt: null,
        redeemedBy: null,
        deletedAt: null,
      },
      maker: { alias: 'BBB', gradidoId: bibi.gradidoID, language: 'de', deletedAt: null },
      greeting: null,
      pictures: [],
    })
  })

  it('finds the link of a code written in capitals, and answers with the code of the row', async () => {
    const found = await dbFindTransactionLinkForPreview(PLAIN.toUpperCase())

    expect(PLAIN.toUpperCase()).not.toBe(PLAIN)
    expect(found?.link.code).toBe(PLAIN)
  })

  it('reads the motif of a greeting', async () => {
    await linkWithCode(MOTIF)
    await dbInsertThankYouGreeting({
      transactionLinkCode: MOTIF,
      motif: 'bouquet',
      line: 'Einfach so.',
      recipientName: 'Sarah',
    })

    const found = await dbFindTransactionLinkForPreview(MOTIF)
    expect(found?.greeting).toEqual({ motif: 'bouquet' })
    expect(found?.pictures).toEqual([])
  })

  // The motif of a greeting with a photo is null, and that is still a greeting.
  it('reads a greeting with a photo as a greeting, with what is known of both renditions', async () => {
    await linkWithCode(PHOTO)
    await dbInsertThankYouGreeting({
      transactionLinkCode: PHOTO,
      motif: null,
      line: 'Einfach so.',
      recipientName: 'Sarah',
    })
    for (const [rendition, width, height] of [
      ['small', 831, 577],
      ['large', 1080, 750],
    ] as const) {
      await dbInsertThankYouGreetingPicture({
        transactionLinkCode: PHOTO,
        rendition,
        width,
        height,
        image: JPEG,
        mimeType: 'image/jpeg',
      })
    }

    const found = await dbFindTransactionLinkForPreview(PHOTO)
    expect(found?.greeting).toEqual({ motif: null })
    expect(found?.pictures.map(({ id, ...picture }) => ({ ...picture, id: typeof id }))).toEqual(
      expect.arrayContaining([
        { rendition: 'small', width: 831, height: 577, id: 'number' },
        { rendition: 'large', width: 1080, height: 750, id: 'number' },
      ]),
    )
    expect(found?.pictures).toHaveLength(2)
  })

  it('reads a member without a username as the maker all the same', async () => {
    await linkWithCode(NO_USERNAME, peter)

    expect((await dbFindTransactionLinkForPreview(NO_USERNAME))?.maker).toEqual({
      alias: null,
      gradidoId: peter.gradidoID,
      language: 'de',
      deletedAt: null,
    })
  })

  // No condition on the state: the rule that reads the columns stands in the backend.
  it('finds an accepted and a deleted link, and shows what became of them', async () => {
    const link = await linkWithCode(CLOSED)
    const redeemedAt = new Date('2026-10-06T08:00:00.000Z')
    const deletedAt = new Date('2026-10-07T09:00:00.000Z')
    await DbTransactionLink.update(link.id, { redeemedAt, redeemedBy: 4711, deletedAt })

    expect((await dbFindTransactionLinkForPreview(CLOSED))?.link).toEqual(
      expect.objectContaining({ redeemedAt, redeemedBy: 4711, deletedAt }),
    )
  })

  it('finds nothing for a code no link has', async () => {
    expect(await dbFindTransactionLinkForPreview('0123456789abcdef01234567')).toBeNull()
  })

  it('finds nothing where the member who made the link has no row', async () => {
    const link = await linkWithCode(NO_MAKER)
    await DbTransactionLink.update(link.id, { userId: peter.id + 1000 })

    expect(await dbFindTransactionLinkForPreview(NO_MAKER)).toBeNull()
  })

  // The column carries no unique key: of two links one may be open and the other accepted.
  it('finds nothing where two links carry the code', async () => {
    await linkWithCode(TWINS)
    expect(await dbFindTransactionLinkForPreview(TWINS)).not.toBeNull()
    await linkWithCode(TWINS)

    expect(await dbFindTransactionLinkForPreview(TWINS)).toBeNull()
  })

  it('asks once, and reads neither a picture nor amount, memo, line or a name a person carries', async () => {
    const statements = await statementsOf(() => dbFindTransactionLinkForPreview(PHOTO))

    expect(statements).toHaveLength(1)
    // The check reads the statement: what the answer is made of stands in it.
    expect(statements[0]).toContain('`thank_you_greeting_pictures`.`rendition`')
    for (const column of [
      'image',
      'mime_type',
      'amount_gdd4',
      'hold_available_amount_gdd4',
      'memo',
      'line',
      'recipient_name',
      'first_name',
      'last_name',
    ]) {
      expect(statements[0]).not.toContain(`\`${column}\``)
    }
  })

  it('shows a deleted member as deleted', async () => {
    const deletedAt = new Date('2026-10-08T10:00:00.000Z')
    await DbUser.update(bibi.id, { deletedAt, accountState: AccountState.DELETED })

    expect((await dbFindTransactionLinkForPreview(PLAIN))?.maker.deletedAt).toEqual(deletedAt)
  })
})
