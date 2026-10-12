// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { GradidoUnit } from 'shared'
import { clearDatabase } from '../../migration/clear'
import { User as DbUser } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { transactionReactionsTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { foreignReceive, transferGradidos } from '../seeds/factory/transaction'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import {
  dbDeleteTransactionReaction,
  dbSelectTransactionReactions,
  dbUpsertTransactionReaction,
} from './transactionReactions'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

const THUMB = '👍'
const SEEDLING = '🌱'
// With the selector that asks for the coloured drawing: two code points, one sign.
const HEART = '❤️'
const day = (n: number): Date => new Date(Date.UTC(2026, 7, n, 12, 0, 0))

let bibi: DbUser
let peter: DbUser
// Bibi sends to Peter twice, Peter to Bibi once: [SEND row, RECEIVE row] each.
let first: { send: number; receive: number }
let second: { send: number; receive: number }
let back: { send: number; receive: number }
let fromAfar: number

const rowsOf = (transactionId: number) =>
  db
    .select()
    .from(transactionReactionsTable)
    .where(eq(transactionReactionsTable.transactionId, transactionId))

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
  fromAfar = (
    await foreignReceive(
      bibi,
      {
        communityUuid: '99999999-9999-9999-9999-999999999999',
        gradidoID: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        name: 'Sarah',
      },
      day(1),
    )
  ).id
  first = await transfer(bibi, peter, 'for the bread', day(2))
  second = await transfer(bibi, peter, 'for the jam', day(3))
  back = await transfer(peter, bibi, 'and back', day(4))
})

afterAll(async () => {
  await clearDatabase()
  await appDB.destroy()
})

describe('dbUpsertTransactionReaction and dbDeleteTransactionReaction', () => {
  it('files the reaction to a transfer on the booking it is given', async () => {
    await dbUpsertTransactionReaction(first.receive, THUMB)

    const rows = await rowsOf(first.receive)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ transactionId: first.receive, emoji: THUMB })
    expect(rows[0].createdAt).toBeInstanceOf(Date)
  })

  // One reaction a transfer: the unique key, not a second row.
  it('puts another emoji in the place of the first, in the same row', async () => {
    const before = await rowsOf(first.receive)

    await dbUpsertTransactionReaction(first.receive, HEART)

    const rows = await rowsOf(first.receive)
    expect(rows).toHaveLength(1)
    expect(rows[0].emoji).toBe(HEART)
    expect(rows[0].id).toBe(before[0].id)
    expect(rows[0].createdAt).toEqual(before[0].createdAt)
  })

  // ⛔ The tables' own collation takes a thumb and a seedling for one character: the column
  // compares byte by byte, and a seedling in the place of a thumb is a change.
  it('takes a seedling in the place of a thumb for another emoji', async () => {
    await dbUpsertTransactionReaction(second.receive, THUMB)
    await dbUpsertTransactionReaction(second.receive, SEEDLING)

    expect((await rowsOf(second.receive)).map((row) => row.emoji)).toEqual([SEEDLING])
    const found = await db
      .select()
      .from(transactionReactionsTable)
      .where(eq(transactionReactionsTable.emoji, THUMB))
    expect(found).toEqual([])
  })

  it('keeps the same emoji again as it is', async () => {
    await dbUpsertTransactionReaction(second.receive, SEEDLING)

    expect((await rowsOf(second.receive)).map((row) => row.emoji)).toEqual([SEEDLING])
  })

  it('takes the reaction back, and says whether there was one', async () => {
    expect(await dbDeleteTransactionReaction(second.receive)).toBe(true)
    expect(await rowsOf(second.receive)).toEqual([])
    // None is an answer, not a failure.
    expect(await dbDeleteTransactionReaction(second.receive)).toBe(false)
    expect(await dbDeleteTransactionReaction(4_000_000_000)).toBe(false)
    // The other transfer keeps its own.
    expect((await rowsOf(first.receive)).map((row) => row.emoji)).toEqual([HEART])
  })
})

describe('dbSelectTransactionReactions', () => {
  beforeAll(async () => {
    await dbUpsertTransactionReaction(back.receive, SEEDLING)
  })

  it('reads the reactions of a page of bookings in one answer, each with the booking its own names', async () => {
    const found = await dbSelectTransactionReactions([
      first.receive,
      second.receive,
      back.receive,
      fromAfar,
    ])

    expect([...found].sort((a, b) => a.transactionId - b.transactionId)).toEqual(
      [
        { transactionId: first.receive, emoji: HEART, linkedTransactionId: first.send },
        { transactionId: back.receive, emoji: SEEDLING, linkedTransactionId: back.send },
      ].sort((a, b) => a.transactionId - b.transactionId),
    )
  })

  // The sender's side: asked with what their SEND row names, answered with what the RECEIVE
  // row names back -- their own row.
  it('answers a sender who asks with the booking their own row names', async () => {
    expect(await dbSelectTransactionReactions([first.receive])).toEqual([
      { transactionId: first.receive, emoji: HEART, linkedTransactionId: first.send },
    ])
  })

  it('has no row for a booking nobody reacted to, and none for a SEND row', async () => {
    expect(await dbSelectTransactionReactions([second.receive, first.send, back.send])).toEqual([])
  })

  it('answers a reaction to a transfer from afar with no booking named back', async () => {
    await dbUpsertTransactionReaction(fromAfar, THUMB)

    expect(await dbSelectTransactionReactions([fromAfar])).toEqual([
      { transactionId: fromAfar, emoji: THUMB, linkedTransactionId: null },
    ])
    await dbDeleteTransactionReaction(fromAfar)
  })

  it('asks nothing for an empty page, and answers none for ids without a booking', async () => {
    expect(await dbSelectTransactionReactions([])).toEqual([])
    expect(await dbSelectTransactionReactions([4_000_000_000])).toEqual([])
  })
})
