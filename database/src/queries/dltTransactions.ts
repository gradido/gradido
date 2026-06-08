import { eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { Result, VoidResult } from 'shared'
import { DBInsertFailed, DBMissingJoin, DBNotFoundError } from '../'
import { drizzleDb } from '../AppDatabase'
import {
  DltTransactionInsert,
  dltTransactionsTable,
  transactionLinksTable,
  transactionsTable,
  usersTable,
} from '../schemas'

const DltTransactionNotFound = (where: string) => new DBNotFoundError('dlt_transactions', where)
const DltTransactionInsertFailed = (row: DltTransactionInsert) =>
  new DBInsertFailed<DltTransactionInsert>('dlt_transactions', row)
const DltTransactionMissingJoin = (joinTable: string, where: string) =>
  new DBMissingJoin('dlt_transactions', joinTable, where)

export async function dbInsertDltTransaction(
  dltTransactionRow: DltTransactionInsert,
): Promise<Result<DltTransactionInsert, DBInsertFailed<DltTransactionInsert>>> {
  const result = await drizzleDb().insert(dltTransactionsTable).values(dltTransactionRow)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true, value: { id: firstRow.insertId, ...dltTransactionRow } }
  }

  return { success: false, error: DltTransactionInsertFailed(dltTransactionRow) }
}

export async function dbUpdateWithErrorDltTransaction(
  hieroTransactionId: string,
  error: string,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(dltTransactionsTable)
    .set({ error })
    .where(eq(dltTransactionsTable.hieroTransactionId, hieroTransactionId))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return {
    success: false,
    error: DltTransactionNotFound(`hieroTransactionId = ${hieroTransactionId}`),
  }
}
// dlt transaction with transaction (transfer, contribution, redeem link)
async function dltTransactionWithTransactionJoinsQuery(hieroTransactionId: string) {
  const linkedUsers = alias(usersTable, 'linkedUser')
  return await drizzleDb()
    .select({
      dltTransaction: dltTransactionsTable,
      transaction: transactionsTable,
      user: usersTable,
      linkedUser: linkedUsers,
    })
    .from(dltTransactionsTable)
    .leftJoin(transactionsTable, eq(transactionsTable.id, dltTransactionsTable.transactionId))
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .leftJoin(linkedUsers, eq(transactionsTable.linkedUserId, linkedUsers.id))
    .where(eq(dltTransactionsTable.hieroTransactionId, hieroTransactionId))
}

// dlt transaction with user (register address)
async function dltTransactionWithUserJoinsQuery(hieroTransactionId: string) {
  return await drizzleDb()
    .select({
      dltTransaction: dltTransactionsTable,
      user: usersTable,
    })
    .from(dltTransactionsTable)
    .leftJoin(usersTable, eq(dltTransactionsTable.userId, usersTable.id))
    .where(eq(dltTransactionsTable.hieroTransactionId, hieroTransactionId))
}

// dlt transaction with transaction link
async function dltTransactionWithTransactionLinkJoinsQuery(hieroTransactionId: string) {
  return await drizzleDb()
    .select({
      dltTransaction: dltTransactionsTable,
      transactionLink: transactionLinksTable,
      user: usersTable,
    })
    .from(dltTransactionsTable)
    .leftJoin(
      transactionLinksTable,
      eq(transactionLinksTable.id, dltTransactionsTable.transactionLinkId),
    )
    .leftJoin(usersTable, eq(transactionLinksTable.userId, usersTable.id))
    .where(eq(dltTransactionsTable.hieroTransactionId, hieroTransactionId))
}

// template function for each dlt transaction select with one of the three join options
// will return different errors if hieroTransactionId wasn't found or joining table was missing
async function dbSelectDltTransactionWithJoins<T>(
  hieroTransactionId: string,
  queryFn: (hieroTransactionId: string) => Promise<T[]>,
  joinName: string,
): Promise<Result<T, DBNotFoundError | DBMissingJoin>> {
  const result = await queryFn(hieroTransactionId)

  if (result.length === 1) {
    const firstRow = result[0]
    if (!(firstRow as Record<string, unknown>)[joinName]) {
      return {
        success: false,
        error: DltTransactionMissingJoin(joinName, `hieroTransactionId = ${hieroTransactionId}`),
      }
    }
    return { success: true, value: firstRow }
  }
  return {
    success: false,
    error: DltTransactionNotFound(`hieroTransactionId = ${hieroTransactionId}`),
  }
}

// type via typinferenz
export type DltTransactionWithTransaction = Awaited<
  ReturnType<typeof dltTransactionWithTransactionJoinsQuery>
>[number]

export async function dbSelectDltTransactionWithTransaction(
  hieroTransactionId: string,
): Promise<Result<DltTransactionWithTransaction, DBNotFoundError | DBMissingJoin>> {
  return dbSelectDltTransactionWithJoins(
    hieroTransactionId,
    dltTransactionWithTransactionJoinsQuery,
    'transaction',
  )
}

// type via typinferenz
export type DltTransactionWithUser = Awaited<
  ReturnType<typeof dltTransactionWithUserJoinsQuery>
>[number]

export async function dbSelectDltTransactionWithUser(
  hieroTransactionId: string,
): Promise<Result<DltTransactionWithUser, DBNotFoundError | DBMissingJoin>> {
  return dbSelectDltTransactionWithJoins(
    hieroTransactionId,
    dltTransactionWithUserJoinsQuery,
    'user',
  )
}

// type via typinferenz
export type DltTransactionWithTransactionLink = Awaited<
  ReturnType<typeof dltTransactionWithTransactionLinkJoinsQuery>
>[number]

export async function dbSelectDltTransactionWithTransactionLink(
  hieroTransactionId: string,
): Promise<Result<DltTransactionWithTransactionLink, DBNotFoundError | DBMissingJoin>> {
  return dbSelectDltTransactionWithJoins(
    hieroTransactionId,
    dltTransactionWithTransactionLinkJoinsQuery,
    'transactionLink',
  )
}
