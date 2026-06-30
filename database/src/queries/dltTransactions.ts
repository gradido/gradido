import { Column, ColumnBaseConfig, ColumnDataType, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { Result, UnhandledEnum, VoidResult } from 'shared'
import { LedgerAnchor } from 'shared-native'
import {
  DBInsertFailed,
  DBMissingJoin,
  DBNotFoundError,
  dltTransactionWhereByLedgerAnchor,
} from '../'
import { drizzleDb } from '../AppDatabase'
import {
  contributionsTable,
  DltTransactionInsert,
  dltTransactionsTable,
  transactionLinksTable,
  transactionsTable,
  usersTableIdentity as usersTable,
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
  id: number,
  error: string,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(dltTransactionsTable)
    .set({ error })
    .where(eq(dltTransactionsTable.id, id))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return {
    success: false,
    error: DltTransactionNotFound(`id = ${id}`),
  }
}

export async function dbUpdateWithErrorDltTransactionByHieroTransactionId(
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

export async function dbUpdateConfirmedDltTransaction(
  id: number,
  verifiedAt: Date,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(dltTransactionsTable)
    .set({ verifiedAt, verified: 1 })
    .where(eq(dltTransactionsTable.id, id))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return {
    success: false,
    error: DltTransactionNotFound(`id = ${id}`),
  }
}

// dlt transaction with transaction and user (contribution)
export async function dltTransactionContributionJoinsQuery<
  F extends Column<ColumnBaseConfig<ColumnDataType, string>, object, object>,
  V,
>(field: F, value: V) {
  return drizzleDb()
    .select({
      dltTransaction: dltTransactionsTable,
      transaction: transactionsTable,
      contributionDate: contributionsTable.contributionDate,
      user: usersTable,
    })
    .from(dltTransactionsTable)
    .leftJoin(transactionsTable, eq(transactionsTable.id, dltTransactionsTable.transactionId))
    .leftJoin(
      contributionsTable,
      eq(contributionsTable.transactionId, dltTransactionsTable.transactionId),
    )
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .where(eq(field, value))
}

// dlt transaction with both transactions (tranfer, redeem)
export async function dltTransactionTransferJoinsQuery<
  F extends Column<ColumnBaseConfig<ColumnDataType, string>, object, object>,
  V,
>(field: F, value: V) {
  const linkedUsersTable = alias(usersTable, 'linkedUser')
  const linkedTransactionsTable = alias(transactionsTable, 'linkedTransaction')
  const transactionLinkUsersTable = alias(usersTable, 'transactionLinkUser')
  const transactionLinksTableDeep = alias(transactionLinksTable, 'transactionLinksDeep')

  return drizzleDb()
    .select({
      dltTransaction: dltTransactionsTable,
      transaction: transactionsTable,
      transactionLink: transactionLinksTable,
      transactionLinkDeep: transactionLinksTableDeep,
      linkedTransaction: linkedTransactionsTable,
      user: usersTable,
      linkedUser: linkedUsersTable,
      transactionLinkUser: transactionLinkUsersTable,
    })
    .from(dltTransactionsTable)
    .leftJoin(transactionsTable, eq(transactionsTable.id, dltTransactionsTable.transactionId))
    .leftJoin(
      transactionLinksTable,
      eq(transactionLinksTable.id, dltTransactionsTable.transactionLinkId),
    )
    .leftJoin(
      transactionLinksTableDeep,
      eq(transactionLinksTableDeep.id, transactionsTable.transactionLinkId),
    )
    .leftJoin(
      linkedTransactionsTable,
      eq(linkedTransactionsTable.id, transactionsTable.linkedTransactionId),
    )
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .leftJoin(linkedUsersTable, eq(transactionsTable.linkedUserId, linkedUsersTable.id))
    .leftJoin(
      transactionLinkUsersTable,
      eq(transactionLinksTable.userId, transactionLinkUsersTable.id),
    )
    .where(eq(field, value))
}

// dlt transaction with user (register address)
export async function dltTransactionRegisterAddressJoinsQuery<
  F extends Column<ColumnBaseConfig<ColumnDataType, string>, object, object>,
  V,
>(field: F, value: V) {
  return drizzleDb()
    .select({
      dltTransaction: dltTransactionsTable,
      user: usersTable,
    })
    .from(dltTransactionsTable)
    .leftJoin(usersTable, eq(dltTransactionsTable.userId, usersTable.id))
    .where(eq(field, value))
}

// dlt transaction with transaction link
export async function dltTransactionDeferredTransferJoinsQuery<
  F extends Column<ColumnBaseConfig<ColumnDataType, string>, object, object>,
  V,
>(field: F, value: V) {
  return drizzleDb()
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
    .where(eq(field, value))
}

/**
 * Generic query function for fetching a single DLT transaction with optional joins.
 *
 * This function determines the appropriate filter condition based on the provided
 * LedgerAnchor type (Hiero transaction ID or various legacy IDs), executes the
 * supplied query function, and validates that the result contains exactly one row
 * with all requested join relations present.
 *
 * @param ledgerAnchor - The ledger anchor used to identify the transaction
 * @param queryFn - A query builder function that accepts a field-value pair
 * @param joinNames - Array of join relation names that must be non-null in the result
 * @returns A Result object containing the transaction data, or an appropriate error
 */
export async function dbSelectDltTransactionWithJoins<T>(
  ledgerAnchor: LedgerAnchor,
  queryFn: <F extends Column<ColumnBaseConfig<ColumnDataType, string>, object, object>, V>(
    field: F,
    value: V,
  ) => Promise<T[]>,
  joinNames: (keyof T)[],
): Promise<Result<T, Error | DBNotFoundError | DBMissingJoin | UnhandledEnum>> {
  const whereResult = await dltTransactionWhereByLedgerAnchor(ledgerAnchor)
  if (!whereResult.success) {
    return whereResult
  }
  const { field, value, where } = whereResult.value
  const result = await queryFn(field, value)

  if (result.length === 1) {
    const firstRow = result[0]
    for (const joinName of joinNames) {
      if (firstRow[joinName] === null || firstRow[joinName] === undefined) {
        return {
          success: false,
          error: DltTransactionMissingJoin(String(joinName), where),
        }
      }
    }
    return { success: true, value: firstRow }
  }
  return {
    success: false,
    error: DltTransactionNotFound(where),
  }
}

// types via typinferenz

export type DltTransactionContribution = Awaited<
  ReturnType<typeof dltTransactionContributionJoinsQuery>
>[number]

export type DltTransactionTransfer = Awaited<
  ReturnType<typeof dltTransactionTransferJoinsQuery>
>[number]

export type DltTransactionRegisterAddress = Awaited<
  ReturnType<typeof dltTransactionRegisterAddressJoinsQuery>
>[number]

export type DltTransactionDeferredTransfer = Awaited<
  ReturnType<typeof dltTransactionDeferredTransferJoinsQuery>
>[number]
