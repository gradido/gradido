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
import {
  dbCountTransactionPassOns,
  dbCountTransactionPassOnsByWeek,
  dbInsertTransactionPassOn,
  dbSelectTransactionPassOnsOf,
} from './transactionPassOns'

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

// The counts of the admin's start page: the thank-you passed on to Bob yesterday and to Peter
// forty days ago, each row written with its moment.
describe('dbCountTransactionPassOns', () => {
  const now = Date.now()
  const daysAgo = (days: number): Date => new Date(now - days * 24 * 60 * 60 * 1000)

  beforeEach(async () => {
    await db.insert(transactionPassOnsTable).values([
      { transactionId: toBob.send, originTransactionId: thanks.receive, createdAt: daysAgo(1) },
      { transactionId: toPeter.send, originTransactionId: thanks.receive, createdAt: daysAgo(40) },
    ])
  })

  // One thank-you passed on twice: two transfers, two rows.
  it('counts every transfer that passed a thank-you on, from each moment on', async () => {
    expect(await dbCountTransactionPassOns([daysAgo(5), daysAgo(20), null])).toEqual([1, 1, 2])
  })
})

// By calendar week, from Monday 7 September 2026: two in its week -- one at its very last
// moment --, none in the week after, one in the week of 21 September, one in the week before.
describe('dbCountTransactionPassOnsByWeek', () => {
  beforeEach(async () => {
    await db.insert(transactionPassOnsTable).values([
      {
        transactionId: toBob.send,
        originTransactionId: thanks.receive,
        createdAt: new Date('2026-09-08T12:00:00.000Z'),
      },
      {
        transactionId: toPeter.send,
        originTransactionId: thanks.receive,
        createdAt: new Date('2026-09-13T23:59:59.999Z'),
      },
      {
        transactionId: thanks.send,
        originTransactionId: thanks.receive,
        createdAt: new Date('2026-09-21T00:00:00.000Z'),
      },
      {
        transactionId: toBob.receive,
        originTransactionId: thanks.receive,
        createdAt: new Date('2026-09-06T23:59:59.999Z'),
      },
    ])
  })

  it('counts the transfers that passed a thank-you on in each week', async () => {
    expect(await dbCountTransactionPassOnsByWeek(new Date('2026-09-07T00:00:00.000Z'))).toEqual([
      { weekStart: '2026-09-07', n: 2 },
      { weekStart: '2026-09-21', n: 1 },
    ])
  })
})
