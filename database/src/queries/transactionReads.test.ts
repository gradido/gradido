// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { GradidoUnit } from 'shared'
import { clearDatabase } from '../../migration/clear'
import { User as DbUser } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { transactionReadsStartTable, transactionReadsTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { foreignReceive, transferGradidos } from '../seeds/factory/transaction'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import {
  dbMarkReceivedTransferSeen,
  dbMarkReceivedTransfersSeen,
  dbSelectTransactionReadsStart,
  dbSelectUnreadReceivedTransfers,
} from './transactionReads'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

const day = (n: number): Date => new Date(Date.UTC(2026, 7, n, 12, 0, 0))
const SARAH = {
  communityUuid: '99999999-9999-4999-8999-999999999999',
  gradidoId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
}

let bibi: DbUser
let peter: DbUser
// Peter sends to Bibi twice, Bibi to Peter once: [SEND row, RECEIVE row] each.
let first: { send: number; receive: number }
let second: { send: number; receive: number }
let back: { send: number; receive: number }
let fromSarah: number

const peterPair = () => ({ communityUuid: peter.communityUuid, gradidoId: peter.gradidoID })
const seen = async (transactionId: number) =>
  (
    await db
      .select()
      .from(transactionReadsTable)
      .where(eq(transactionReadsTable.transactionId, transactionId))
  ).length === 1

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await clearDatabase()
  await createCommunity(false)
  bibi = await userFactory(bibiBloxberg)
  peter = await userFactory(peterLustig)
  const transfer = async (from: DbUser, to: DbUser, memo: string, at: Date) => {
    const [send, receive] = await transferGradidos(from, to, new GradidoUnit(10000n), memo, at)
    return { send: send.id, receive: receive.id }
  }
  // Dates only go forward: a booking takes its balance from the member's last one.
  fromSarah = (
    await foreignReceive(
      bibi,
      { communityUuid: SARAH.communityUuid, gradidoID: SARAH.gradidoId, name: 'Sarah' },
      day(1),
    )
  ).id
  first = await transfer(peter, bibi, 'for the bread', day(2))
  second = await transfer(peter, bibi, 'for the jam', day(3))
  back = await transfer(bibi, peter, 'and back', day(4))
})

afterAll(async () => {
  await clearDatabase()
  await appDB.destroy()
})

describe('dbSelectTransactionReadsStart', () => {
  afterEach(async () => {
    await db.delete(transactionReadsStartTable)
  })

  it('answers 0 where the row is missing', async () => {
    await db.delete(transactionReadsStartTable)
    expect(await dbSelectTransactionReadsStart()).toBe(0)
  })

  it('answers the booking id the migration kept', async () => {
    await db.delete(transactionReadsStartTable)
    await db.insert(transactionReadsStartTable).values({ id: 1, transactionId: 4242 })
    expect(await dbSelectTransactionReadsStart()).toBe(4242)
  })
})

describe('dbSelectUnreadReceivedTransfers', () => {
  afterEach(async () => {
    await db.delete(transactionReadsTable)
  })

  it('counts what she received and has not seen, per person who sent it', async () => {
    const unread = await dbSelectUnreadReceivedTransfers(bibi.id, 0)
    expect(unread).toHaveLength(2)
    expect(unread).toEqual(
      expect.arrayContaining([
        { ...peterPair(), count: 2, latestId: second.receive },
        { ...SARAH, count: 1, latestId: fromSarah },
      ]),
    )
  })

  // Her own SEND is nothing she received; his RECEIVE is his.
  it('takes her RECEIVE bookings only', async () => {
    const unread = await dbSelectUnreadReceivedTransfers(peter.id, 0)
    expect(unread).toEqual([
      {
        communityUuid: bibi.communityUuid,
        gradidoId: bibi.gradidoID,
        count: 1,
        latestId: back.receive,
      },
    ])
  })

  it('counts only above the start', async () => {
    const unread = await dbSelectUnreadReceivedTransfers(bibi.id, first.receive)
    expect(unread).toEqual([{ ...peterPair(), count: 1, latestId: second.receive }])
  })

  it('leaves out what was seen', async () => {
    await db.insert(transactionReadsTable).values({ transactionId: second.receive })
    expect(await dbSelectUnreadReceivedTransfers(bibi.id, 0)).toEqual(
      expect.arrayContaining([{ ...peterPair(), count: 1, latestId: first.receive }]),
    )
  })

  it('answers nothing for somebody who received nothing', async () => {
    expect(await dbSelectUnreadReceivedTransfers(4_000_000, 0)).toEqual([])
  })
})

describe('dbMarkReceivedTransfersSeen', () => {
  afterEach(async () => {
    await db.delete(transactionReadsTable)
  })

  it('marks what she received from him up to the id, and says how many', async () => {
    expect(await dbMarkReceivedTransfersSeen(bibi.id, peterPair(), first.receive, 0)).toBe(1)
    expect(await seen(first.receive)).toBe(true)
    expect(await seen(second.receive)).toBe(false)
    // Seen before is no failure, and nothing new.
    expect(await dbMarkReceivedTransfersSeen(bibi.id, peterPair(), first.receive, 0)).toBe(0)
  })

  // A booking of another kind or of another person is not touched, whatever id is handed.
  it('marks her RECEIVE bookings from him only', async () => {
    expect(await dbMarkReceivedTransfersSeen(bibi.id, peterPair(), back.receive, 0)).toBe(2)
    expect(await seen(back.send)).toBe(false)
    expect(await seen(back.receive)).toBe(false)
    expect(await seen(fromSarah)).toBe(false)
  })

  it('marks nothing at or below the start', async () => {
    expect(
      await dbMarkReceivedTransfersSeen(bibi.id, peterPair(), second.receive, first.receive),
    ).toBe(1)
    expect(await seen(first.receive)).toBe(false)
    expect(await seen(second.receive)).toBe(true)
  })

  it('takes the person named in capitals, as the column compares', async () => {
    const shouting = {
      communityUuid: peter.communityUuid.toUpperCase(),
      gradidoId: peter.gradidoID.toUpperCase(),
    }
    expect(await dbMarkReceivedTransfersSeen(bibi.id, shouting, second.receive, 0)).toBe(2)
  })

  it('takes a person of another community', async () => {
    expect(await dbMarkReceivedTransfersSeen(bibi.id, SARAH, fromSarah, 0)).toBe(1)
    expect(await seen(fromSarah)).toBe(true)
  })
})

describe('dbMarkReceivedTransferSeen', () => {
  afterEach(async () => {
    await db.delete(transactionReadsTable)
  })

  it('marks the one transfer she received, and no older one of the same person', async () => {
    expect(await dbMarkReceivedTransferSeen(bibi.id, second.receive)).toBe(true)
    expect(await seen(second.receive)).toBe(true)
    expect(await seen(first.receive)).toBe(false)
    // Seen before stays seen, and is no failure.
    expect(await dbMarkReceivedTransferSeen(bibi.id, second.receive)).toBe(true)
  })

  it('refuses her SEND, his booking and an id without one', async () => {
    expect(await dbMarkReceivedTransferSeen(bibi.id, back.send)).toBe(false)
    expect(await dbMarkReceivedTransferSeen(bibi.id, back.receive)).toBe(false)
    expect(await dbMarkReceivedTransferSeen(bibi.id, 4_000_000_000)).toBe(false)
    expect(await seen(back.send)).toBe(false)
    expect(await seen(back.receive)).toBe(false)
  })
})
