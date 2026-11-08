// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { fullName, GradidoUnit } from 'shared'
import { AppDatabase, drizzleDb } from '../../AppDatabase'
import { User } from '../../entity'
import { TransactionTypeId } from '../../enum'
import { dbDeleteAllRowsExceptMigrations } from '../../queries/informationSchemaTables'
import { transactionsTable } from '../../schemas'
import { createCommunity } from '../community'
import { bibiBloxberg } from '../users/bibi-bloxberg'
import { peterLustig } from '../users/peter-lustig'
import { createTransaction, foreignReceive, transferGradidos } from './transaction'
import { userFactory } from './user'

const db = AppDatabase.getInstance()
const AMOUNT = new GradidoUnit(100000n)
const FIRST_DATE = new Date('2026-01-01T00:00:00.000Z')
const LATER_DATE = new Date('2026-06-01T00:00:00.000Z')
const FUNDING_DATE = new Date('2025-12-01T00:00:00.000Z')

const stored = async (id: number) => {
  const [row] = await drizzleDb()
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, id))
  return row
}

describe('transferGradidos', () => {
  let bibi: User
  let peter: User

  beforeAll(async () => {
    await db.init()
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    bibi = await userFactory(bibiBloxberg)
    peter = await userFactory(peterLustig)
  })

  afterAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await db.destroy()
  })

  beforeEach(async () => {
    await drizzleDb().delete(transactionsTable)
  })

  const fund = (member: User) =>
    createTransaction(
      GradidoUnit.fromNumber(1000),
      'to send from',
      member,
      member === bibi ? peter : bibi,
      TransactionTypeId.CREATION,
      FUNDING_DATE,
      FUNDING_DATE,
    )

  it('writes a SEND and a RECEIVE row that name each other', async () => {
    const funding = await fund(bibi)
    const [send, receive] = await transferGradidos(bibi, peter, AMOUNT, 'a memo', FIRST_DATE)

    expect(await stored(send.id)).toMatchObject({
      typeId: TransactionTypeId.SEND,
      memo: 'a memo',
      userId: bibi.id,
      userGradidoId: bibi.gradidoID,
      userName: fullName(bibi.firstName, bibi.lastName),
      linkedUserId: peter.id,
      linkedUserGradidoId: peter.gradidoID,
      linkedUserName: fullName(peter.firstName, peter.lastName),
      linkedTransactionId: receive.id,
      previous: funding.id,
      balanceDate: FIRST_DATE,
    })
    expect(await stored(receive.id)).toMatchObject({
      typeId: TransactionTypeId.RECEIVE,
      userId: peter.id,
      linkedUserId: bibi.id,
      linkedTransactionId: send.id,
      previous: null,
    })
  })

  it('books the SEND row negative and the RECEIVE row positive', async () => {
    await fund(bibi)

    const [send, receive] = await transferGradidos(bibi, peter, AMOUNT, 'a', FIRST_DATE)

    expect((await stored(send.id)).amount).toEqual(AMOUNT.negated())
    expect((await stored(receive.id)).amount).toEqual(AMOUNT)
    expect((await stored(receive.id)).balance).toEqual(AMOUNT)
  })

  it('builds each row on the last booking of its own member, decayed to the new date', async () => {
    const funding = await fund(bibi)
    await fund(peter)
    const [firstSend, firstReceive] = await transferGradidos(bibi, peter, AMOUNT, 'a', FIRST_DATE)
    const [, secondReceive] = await transferGradidos(peter, bibi, AMOUNT, 'b', LATER_DATE)

    const send = await stored(firstSend.id)
    expect(send.previous).toBe(funding.id)
    const row = await stored(secondReceive.id)
    expect(row.userId).toBe(bibi.id)
    expect(row.previous).toBe(firstSend.id)
    expect(row.previous).not.toBe(firstReceive.id)
    const decay = (send.balance as GradidoUnit).calculateDecay(FIRST_DATE, LATER_DATE)
    expect(row.decay).toEqual(decay.decay)
    expect(row.decayStart).toEqual(decay.start)
    expect(row.balance).toEqual(decay.balance.add(AMOUNT))
  })

  it('refuses a transfer the sender has not the balance for, and writes nothing', async () => {
    await expect(transferGradidos(bibi, peter, AMOUNT, 'a', FIRST_DATE)).rejects.toThrow(
      'cannot send',
    )

    expect(await drizzleDb().select().from(transactionsTable)).toHaveLength(0)
  })

  it('counts decay against the balance: what was enough once is not enough later', async () => {
    await createTransaction(
      AMOUNT,
      'exactly the amount',
      bibi,
      peter,
      TransactionTypeId.CREATION,
      FUNDING_DATE,
      FUNDING_DATE,
    )

    await expect(transferGradidos(bibi, peter, AMOUNT, 'a', LATER_DATE)).rejects.toThrow(
      'cannot send',
    )
  })

  it('leaves nothing behind when a row cannot be built', async () => {
    await fund(bibi)
    await transferGradidos(bibi, peter, AMOUNT, 'a', LATER_DATE)

    // decay does not run backwards
    await expect(transferGradidos(bibi, peter, AMOUNT, 'b', FIRST_DATE)).rejects.toThrow()

    expect(await drizzleDb().select().from(transactionsTable)).toHaveLength(3)
  })
})

describe('foreignReceive', () => {
  const FROM_AFAR = {
    communityUuid: '99999999-9999-9999-9999-999999999999',
    gradidoID: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    name: 'Sarah',
  }
  let bibi: User

  beforeAll(async () => {
    await db.init()
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    bibi = await userFactory(bibiBloxberg)
  })

  afterAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await db.destroy()
  })

  beforeEach(async () => {
    await drizzleDb().delete(transactionsTable)
  })

  it('books a RECEIVE row that names the counterparty by the pair, without a local id', async () => {
    const booked = await foreignReceive(bibi, FROM_AFAR, FIRST_DATE)

    expect(await stored(booked.id)).toMatchObject({
      typeId: TransactionTypeId.RECEIVE,
      memo: 'from afar',
      userId: bibi.id,
      userGradidoId: bibi.gradidoID,
      userName: fullName(bibi.firstName, bibi.lastName),
      linkedUserId: null,
      linkedUserCommunityUuid: FROM_AFAR.communityUuid,
      linkedUserGradidoId: FROM_AFAR.gradidoID,
      linkedUserName: 'Sarah',
      previous: null,
      amount: new GradidoUnit(10000n),
      balance: new GradidoUnit(10000n),
      balanceDate: FIRST_DATE,
    })
  })

  it('stores the users row and the missing name as they are given', async () => {
    const booked = await foreignReceive(
      bibi,
      { ...FROM_AFAR, name: null, linkedUserId: 4711 },
      FIRST_DATE,
    )

    expect(await stored(booked.id)).toMatchObject({ linkedUserId: 4711, linkedUserName: null })
  })

  it('builds on the last booking of the member, decayed to the new date', async () => {
    const first = await foreignReceive(bibi, FROM_AFAR, FIRST_DATE, AMOUNT)
    const second = await foreignReceive(bibi, FROM_AFAR, LATER_DATE, AMOUNT)

    const row = await stored(second.id)
    expect(row.previous).toBe(first.id)
    const decay = AMOUNT.calculateDecay(FIRST_DATE, LATER_DATE)
    expect(row.decay).toEqual(decay.decay)
    expect(row.balance).toEqual(decay.balance.add(AMOUNT))
  })
})
