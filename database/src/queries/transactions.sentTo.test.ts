// AI-GENERATED — not an architecture reference
// All of the runner's functions from here: a file that imports from bun:test gets none as globals.
import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { GradidoUnit } from 'shared'
import { clearDatabase } from '../../migration/clear'
import { User as DbUser } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { TransactionTypeId } from '../enum'
import { transactionsTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { createTransaction, transferGradidos } from '../seeds/factory/transaction'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '../seeds/users/raeuber-hotzenplotz'
import { dbSelectLastSentToByUser } from './transactions'

/**
 * When a member last sent Gradido to each of some members here (F E-046): what a booking list
 * says a thank-you was answered with, besides a message. The fixture of transactions.seen.test.ts
 * -- Peter sends to Bibi twice, Bibi to Peter once -- and Räuber sends to Peter after all of them.
 * Then Bibi sends Bob something, and Bob redeems a link of hers after that.
 */
const appDB = AppDatabase.getInstance()

const day = (n: number): Date => new Date(Date.UTC(2026, 7, n, 12, 0, 0))

let bibi: DbUser
let peter: DbUser
let raeuber: DbUser
let bob: DbUser
/** The link Bob redeemed: the id it stands under on both rows of its transfer. */
const BIBIS_LINK = 4711

/** The answer by the counterparty's id, the time as milliseconds. */
const lastSentOf = async (userId: number, linkedUserIds: number[]) =>
  Object.fromEntries(
    (await dbSelectLastSentToByUser(userId, linkedUserIds)).map((entry) => [
      entry.linkedUserId,
      entry.lastSentAt.getTime(),
    ]),
  )

beforeAll(async () => {
  await appDB.init()
  await clearDatabase()
  await createCommunity(false)
  bibi = await userFactory(bibiBloxberg)
  peter = await userFactory(peterLustig)
  raeuber = await userFactory(raeuberHotzenplotz)
  bob = await userFactory(bobBaumeister)
  // Dates only go forward: a booking takes its balance from the member's last one. Peter and
  // Räuber send more than they ever receive here.
  for (const giver of [peter, raeuber]) {
    await createTransaction(
      GradidoUnit.fromNumber(1000),
      'to send from',
      giver,
      bibi,
      TransactionTypeId.CREATION,
      day(0),
      day(0),
    )
  }
  await transferGradidos(peter, bibi, new GradidoUnit(10000n), 'for the bread', day(2))
  await transferGradidos(peter, bibi, new GradidoUnit(10000n), 'for the jam', day(3))
  await transferGradidos(bibi, peter, new GradidoUnit(10000n), 'and back', day(4))
  await transferGradidos(raeuber, peter, new GradidoUnit(10000n), 'for the hat', day(5))
  await transferGradidos(bibi, bob, new GradidoUnit(2500n), 'for the cake', day(6))
  // Redeeming a link books its transfer at that moment, the link on both rows, the maker sending:
  // as TransactionLinkResolver does through executeTransaction.
  const redeemed = await transferGradidos(
    bibi,
    bob,
    new GradidoUnit(2500n),
    'from her link',
    day(7),
  )
  await drizzleDb()
    .update(transactionsTable)
    .set({ transactionLinkId: BIBIS_LINK })
    .where(
      inArray(
        transactionsTable.id,
        redeemed.map((row) => row.id),
      ),
    )
})

afterAll(async () => {
  await clearDatabase()
  await appDB.destroy()
})

describe('dbSelectLastSentToByUser', () => {
  // Räuber's sending to Peter is later than hers, and it is not hers.
  it('dates her last sending to him with her booking of it, and nobody else sends for her', async () => {
    expect(await lastSentOf(bibi.id, [peter.id])).toEqual({ [peter.id]: day(4).getTime() })
  })

  // What he received from her (day 4) is no sending of his.
  it('takes the latest of his sendings, and none of what he received', async () => {
    expect(await lastSentOf(peter.id, [bibi.id])).toEqual({ [bibi.id]: day(3).getTime() })
  })

  it('answers for several members at once, and nothing for one she never sent to', async () => {
    expect(await lastSentOf(bibi.id, [peter.id, raeuber.id])).toEqual({
      [peter.id]: day(4).getTime(),
    })
    expect(await lastSentOf(raeuber.id, [bibi.id, peter.id])).toEqual({
      [peter.id]: day(5).getTime(),
    })
  })

  // Redeeming a link books its transfer when the other person redeems it, whenever the link was
  // made: one made before a thank-you would answer it. Her sending of day 6 is her last.
  it('leaves out a sending through a link, booked when it was redeemed', async () => {
    const [newest] = await drizzleDb()
      .select({ linkId: transactionsTable.transactionLinkId, at: transactionsTable.balanceDate })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.userId, bibi.id),
          eq(transactionsTable.typeId, TransactionTypeId.SEND),
          eq(transactionsTable.linkedUserId, bob.id),
        ),
      )
      .orderBy(desc(transactionsTable.balanceDate))
      .limit(1)
    // The link's row is there, and it is the newest of her sendings to him.
    expect({ linkId: newest.linkId, at: newest.at.getTime() }).toEqual({
      linkId: BIBIS_LINK,
      at: day(7).getTime(),
    })
    expect(await lastSentOf(bibi.id, [bob.id])).toEqual({ [bob.id]: day(6).getTime() })
  })

  it('asks nothing for no member', async () => {
    const asked = spyOn(AppDatabase.getInstance(), 'getDrizzleDataSource')
    try {
      expect(await dbSelectLastSentToByUser(bibi.id, [])).toEqual([])
      expect(asked).not.toHaveBeenCalled()
      // The spy sees the statement where there is one to send.
      await dbSelectLastSentToByUser(bibi.id, [peter.id])
      expect(asked).toHaveBeenCalled()
    } finally {
      asked.mockRestore()
    }
  })
})
