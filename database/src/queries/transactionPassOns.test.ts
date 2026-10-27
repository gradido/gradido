// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { GradidoUnit } from 'shared'
import { clearDatabase } from '../../migration/clear'
import { User as DbUser } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { transactionPassOnsTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { transferGradidos } from '../seeds/factory/transaction'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import { dbInsertTransactionPassOn, dbSelectTransactionPassOnsOf } from './transactionPassOns'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

const day = (n: number): Date => new Date(Date.UTC(2026, 7, n, 12, 0, 0))

// Peter thanks Bibi, and Bibi passes that thank-you on: to Bob, then to Peter. [SEND row,
// RECEIVE row] each.
let thanks: { send: number; receive: number }
let toBob: { send: number; receive: number }
let toPeter: { send: number; receive: number }

const passOn = (transactionId: number, originTransactionId: number) => ({
  transactionId,
  originTransactionId,
  createdAt: expect.any(Date),
})

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await clearDatabase()
  await createCommunity(false)
  const bibi = await userFactory(bibiBloxberg)
  const peter = await userFactory(peterLustig)
  const bob = await userFactory(bobBaumeister)
  const transfer = async (from: DbUser, to: DbUser, memo: string, at: Date) => {
    const [send, receive] = await transferGradidos(from, to, new GradidoUnit(10000n), memo, at)
    return { send: send.id, receive: receive.id }
  }
  // Dates only go forward: a booking takes its balance from the member's last one.
  thanks = await transfer(peter, bibi, 'Danke fürs Brot', day(1))
  toBob = await transfer(bibi, bob, 'Weitergegeben', day(2))
  toPeter = await transfer(bibi, peter, 'Und noch einmal weitergegeben', day(3))
})

afterEach(async () => {
  await db.delete(transactionPassOnsTable)
})

afterAll(async () => {
  await clearDatabase()
  await appDB.destroy()
})

describe('dbInsertTransactionPassOn', () => {
  it('notes on the SEND row of a transfer the RECEIVE row of the thank-you it passes on', async () => {
    await dbInsertTransactionPassOn(toBob.send, thanks.receive)

    expect(await db.select().from(transactionPassOnsTable)).toEqual([
      passOn(toBob.send, thanks.receive),
    ])
  })

  // The origin is no key of its own.
  it('lets one thank-you be passed on by two transfers', async () => {
    await dbInsertTransactionPassOn(toBob.send, thanks.receive)
    await dbInsertTransactionPassOn(toPeter.send, thanks.receive)

    const rows = await db.select().from(transactionPassOnsTable)
    expect(rows).toHaveLength(2)
    expect(rows).toEqual(
      expect.arrayContaining([
        passOn(toBob.send, thanks.receive),
        passOn(toPeter.send, thanks.receive),
      ]),
    )
  })

  // ⛔ A transfer passes on one thank-you at most: the primary key refuses a second for it, and
  // the first stays as it was.
  it('refuses a second thank-you for the same transfer', async () => {
    await dbInsertTransactionPassOn(toBob.send, thanks.receive)

    await expect(dbInsertTransactionPassOn(toBob.send, toPeter.receive)).rejects.toThrow()
    expect(await db.select().from(transactionPassOnsTable)).toEqual([
      passOn(toBob.send, thanks.receive),
    ])
  })
})

describe('dbSelectTransactionPassOnsOf', () => {
  it('answers a row for each transfer named that passes one on, and none for one that does not', async () => {
    await dbInsertTransactionPassOn(toBob.send, thanks.receive)
    await dbInsertTransactionPassOn(toPeter.send, thanks.receive)

    const rows = await dbSelectTransactionPassOnsOf([toBob.send, thanks.send, toBob.receive])
    expect(rows).toEqual([passOn(toBob.send, thanks.receive)])
  })

  it('answers every transfer it is asked for', async () => {
    await dbInsertTransactionPassOn(toBob.send, thanks.receive)
    await dbInsertTransactionPassOn(toPeter.send, thanks.receive)

    const rows = await dbSelectTransactionPassOnsOf([toPeter.send, toBob.send])
    expect(rows).toHaveLength(2)
    expect(rows).toEqual(
      expect.arrayContaining([
        passOn(toBob.send, thanks.receive),
        passOn(toPeter.send, thanks.receive),
      ]),
    )
  })

  it('answers nothing for no ids', async () => {
    await dbInsertTransactionPassOn(toBob.send, thanks.receive)

    expect(await dbSelectTransactionPassOnsOf([])).toEqual([])
  })
})
