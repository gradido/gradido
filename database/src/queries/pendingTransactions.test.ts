import { GradidoUnit, PendingTransactionState } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { User as DbUser, TransactionTypeId } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { pendingTransactionsTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { pendingTransactionFactory } from '../seeds/factory/pendingTransaction'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { garrickOllivander } from '../seeds/users/garrick-ollivander'
import { peterLustig } from '../seeds/users/peter-lustig'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'
import {
  countOpenPendingTransactions,
  dbFindPendingTransaction,
  dbInsertPendingTransaction,
} from './pendingTransactions'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('countOpenPendingTransactions', () => {
  let bibi: DbUser
  let peter: DbUser
  let bob: DbUser
  let garrick: DbUser
  beforeAll(async () => {
    await dbDeleteAllRowsExceptMigrations()

    await createCommunity(false)

    bibi = await userFactory(bibiBloxberg)
    peter = await userFactory(peterLustig)
    bob = await userFactory(bobBaumeister)
    garrick = await userFactory(garrickOllivander)

    // Bibi -> Peter
    await pendingTransactionFactory(
      bibi,
      peter,
      GradidoUnit.fromNumber(10),
      'Bibi -> Peter new',
      PendingTransactionState.NEW,
    )
    await pendingTransactionFactory(
      bibi,
      peter,
      GradidoUnit.fromNumber(100.01),
      'Bibi -> Peter settled',
      PendingTransactionState.SETTLED,
    )

    // Peter -> Bibi
    await pendingTransactionFactory(
      peter,
      bibi,
      GradidoUnit.fromNumber(12),
      'Peter -> Bibi new',
      PendingTransactionState.NEW,
    )

    // Bob -> Peter
    await pendingTransactionFactory(
      bob,
      peter,
      GradidoUnit.fromNumber(17.1),
      'Bob -> Peter new',
      PendingTransactionState.NEW,
    )
  })
  it('should return 0 if called with empty array', async () => {
    const count = await countOpenPendingTransactions([], PendingTransactionState.NEW)
    expect(count).toBe(0)
  })

  it('should return 0 if called with unknown gradido id', async () => {
    const count = await countOpenPendingTransactions([uuidv4()], PendingTransactionState.NEW)
    expect(count).toBe(0)
  })

  it('should return 0 if there are no pending transactions for the given user', async () => {
    const count = await countOpenPendingTransactions(
      [garrick.gradidoID],
      PendingTransactionState.NEW,
    )
    expect(count).toBe(0)
  })

  it('bibi and peter have two transactions together and peter one additional, should return 3', async () => {
    const count = await countOpenPendingTransactions(
      [bibi.gradidoID, peter.gradidoID],
      PendingTransactionState.NEW,
    )
    expect(count).toBe(3)
  })

  it('peter and bob have one transaction together, peter two additional, should return 3', async () => {
    const count = await countOpenPendingTransactions(
      [peter.gradidoID, bob.gradidoID],
      PendingTransactionState.NEW,
    )
    expect(count).toBe(3)
  })

  it('peter has three transactions, should return 3', async () => {
    const count = await countOpenPendingTransactions([peter.gradidoID], PendingTransactionState.NEW)
    expect(count).toBe(3)
  })

  it('bibi has two transactions, should return 2', async () => {
    const count = await countOpenPendingTransactions([bibi.gradidoID], PendingTransactionState.NEW)
    expect(count).toBe(2)
  })

  it('bob has one transaction, should return 1', async () => {
    const count = await countOpenPendingTransactions([bob.gradidoID], PendingTransactionState.NEW)
    expect(count).toBe(1)
  })
})

describe('dbInsertPendingTransaction', () => {
  it('writes the row as it is given', async () => {
    await drizzleDb().delete(pendingTransactionsTable)
    const row = {
      state: PendingTransactionState.NEW,
      memo: 'a memo',
      amount: GradidoUnit.fromNumber(12.5),
      userId: 1,
      userGradidoId: uuidv4(),
      userCommunityUuid: uuidv4(),
      linkedUserId: 2,
      linkedUserGradidoId: uuidv4(),
      linkedUserCommunityUuid: uuidv4(),
    }

    await dbInsertPendingTransaction(row)

    const rows = await drizzleDb().select().from(pendingTransactionsTable)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject(row)
  })
})

describe('dbFindPendingTransaction', () => {
  const bibi = { alias: 'bibi', gradidoId: uuidv4(), communityUuid: uuidv4() }
  const peter = { alias: 'peter', gradidoId: uuidv4(), communityUuid: uuidv4() }
  const balanceDate = new Date('2026-11-08T10:00:00.123Z')
  const memo = 'for the broom'
  const row = {
    state: PendingTransactionState.NEW,
    typeId: TransactionTypeId.SEND,
    memo,
    amount: GradidoUnit.fromNumber(-12.5),
    balanceDate,
    userId: 1,
    userGradidoId: bibi.gradidoId,
    userCommunityUuid: bibi.communityUuid,
    linkedUserGradidoId: peter.gradidoId,
    linkedUserCommunityUuid: peter.communityUuid,
  }
  let id: number

  beforeAll(async () => {
    await drizzleDb().delete(pendingTransactionsTable)
    const inserted = await dbInsertPendingTransaction(row)
    if (!inserted.success) {
      throw inserted.error
    }
    id = inserted.value
  })

  it('finds the row by both users, type, state, the date to the millisecond and memo', async () => {
    const found = await dbFindPendingTransaction(
      bibi,
      peter,
      TransactionTypeId.SEND,
      PendingTransactionState.NEW,
      balanceDate,
      memo,
    )
    expect(found).toMatchObject({ id, ...row })
  })

  it('finds nothing when one of them differs', async () => {
    const { SEND, RECEIVE } = TransactionTypeId
    const { NEW, SETTLED } = PendingTransactionState
    const oneMsLater = new Date(balanceDate.getTime() + 1)
    const lookups: Parameters<typeof dbFindPendingTransaction>[] = [
      [peter, bibi, SEND, NEW, balanceDate, memo],
      [bibi, peter, RECEIVE, NEW, balanceDate, memo],
      [bibi, peter, SEND, SETTLED, balanceDate, memo],
      [bibi, peter, SEND, NEW, oneMsLater, memo],
      [bibi, peter, SEND, NEW, balanceDate, 'for the hat'],
      [{ ...bibi, communityUuid: uuidv4() }, peter, SEND, NEW, balanceDate, memo],
      [bibi, { ...peter, gradidoId: uuidv4() }, SEND, NEW, balanceDate, memo],
    ]
    for (const args of lookups) {
      expect(await dbFindPendingTransaction(...args)).toBeNull()
    }
  })
})
