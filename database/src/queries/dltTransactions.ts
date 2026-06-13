import { Column, ColumnBaseConfig, ColumnDataType, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { Result, UnhandledEnum, VoidResult } from 'shared'
import { GrdtTransactionType, LedgerAnchor } from 'shared-native'
import { DBInsertFailed, DBMissingJoin, DBNotFoundError } from '../'
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
  verifiedAt: string,
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
async function dltTransactionContributionJoinsQuery<
  F extends Column<ColumnBaseConfig<ColumnDataType, string>, object, object>,
  V,
>(field: F, value: V) {
  return drizzleDb()
    .select({
      dltTransaction: dltTransactionsTable,
      transaction: transactionsTable,
      user: usersTable,
    })
    .from(dltTransactionsTable)
    .leftJoin(transactionsTable, eq(transactionsTable.id, dltTransactionsTable.transactionId))
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .where(eq(field, value))
}

// dlt transaction with both transactions (tranfer, redeem)
async function dltTransactionTransferJoinsQuery<
  F extends Column<ColumnBaseConfig<ColumnDataType, string>, object, object>,
  V,
>(field: F, value: V) {
  const linkedUsersTable = alias(usersTable, 'linkedUser')
  const linkedTransactionsTable = alias(transactionsTable, 'linkedTransaction')
  return drizzleDb()
    .select({
      dltTransaction: dltTransactionsTable,
      transaction: transactionsTable,
      linkedTransaction: linkedTransactionsTable,
      user: usersTable,
      linkedUser: linkedUsersTable,
    })
    .from(dltTransactionsTable)
    .leftJoin(transactionsTable, eq(transactionsTable.id, dltTransactionsTable.transactionId))
    .leftJoin(
      linkedTransactionsTable,
      eq(linkedTransactionsTable.id, transactionsTable.linkedTransactionId),
    )
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .leftJoin(linkedUsersTable, eq(transactionsTable.linkedUserId, linkedUsersTable.id))
    .where(eq(field, value))
}

// dlt transaction with user (register address)
async function dltTransactionRegisterAddressJoinsQuery<
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
async function dltTransactionDeferredTransferJoinsQuery<
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

// template function for each dlt transaction select with one of the three join options
// will return different errors if hieroTransactionId wasn't found or joining table was missing
async function dbSelectDltTransactionWithJoins<T>(
  ledgerAnchor: LedgerAnchor,
  queryFn: <F extends Column<ColumnBaseConfig<ColumnDataType, string>, object, object>, V>(
    field: F,
    value: V,
  ) => Promise<T[]>,
  joinNames: (keyof T)[],
): Promise<Result<T, DBNotFoundError | DBMissingJoin | UnhandledEnum>> {
  let result: T[] = []
  let where = ''
  const hieroTransactionId = ledgerAnchor.getHieroTransactionId()
  const legacyId = Number(ledgerAnchor.getLegacyId())
  if (hieroTransactionId) {
    where = `hieroTransactionId = ${hieroTransactionId}`
    result = await queryFn(dltTransactionsTable.hieroTransactionId, hieroTransactionId)
  } else if (legacyId) {
    const ledgerAnchorType = ledgerAnchor.getType()

    if (ledgerAnchorType === 'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_TRANSACTION_ID') {
      where = `transactionId = ${legacyId}`
      result = await queryFn(dltTransactionsTable.transactionId, legacyId)
    } else if (ledgerAnchorType === 'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_TRANSACTION_LINK_ID') {
      where = `transactionLinkId = ${legacyId}`
      result = await queryFn(dltTransactionsTable.transactionLinkId, legacyId)
    } else if (ledgerAnchorType === 'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_USER_ID') {
      where = `userId = ${legacyId}`
      result = await queryFn(dltTransactionsTable.userId, legacyId)
    } else if (ledgerAnchorType === 'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_CONTRIBUTION_ID') {
      const contributions = await drizzleDb()
        .select({ transactionId: contributionsTable.transactionId })
        .from(contributionsTable)
        .where(eq(contributionsTable.id, legacyId))
      if (contributions.length !== 1) {
        return { success: false, error: new DBNotFoundError('contributions', `id = ${legacyId}`) }
      }
      where = `transactionId = ${contributions[0].transactionId}`
      result = await queryFn(dltTransactionsTable.transactionId, contributions[0].transactionId)
    } else {
      return {
        success: false,
        error: new UnhandledEnum(
          'ledgerAnchor has unhandled type',
          'GrdtLedgerAnchorType',
          ledgerAnchorType,
        ),
      }
    }
  }
  // const result = await queryFn()

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

export async function dbSelectDltTransactionByLedgerAnchor(
  ledgerAnchor: LedgerAnchor,
  transactionType: GrdtTransactionType,
): Promise<
  Result<
    | DltTransactionTransfer
    | DltTransactionContribution
    | DltTransactionRegisterAddress
    | DltTransactionDeferredTransfer,
    DBNotFoundError | DBMissingJoin | Error
  >
> {
  switch (transactionType) {
    case 'GRDT_TRANSACTION_TRANSFER':
    case 'GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER':
      return dbSelectDltTransactionWithJoins(ledgerAnchor, dltTransactionTransferJoinsQuery, [
        'transaction',
        'linkedTransaction',
        'user',
        'linkedUser',
      ])
    case 'GRDT_TRANSACTION_CREATION':
      return dbSelectDltTransactionWithJoins(ledgerAnchor, dltTransactionContributionJoinsQuery, [
        'transaction',
        'user',
      ])
    case 'GRDT_TRANSACTION_DEFERRED_TRANSFER':
      return dbSelectDltTransactionWithJoins(
        ledgerAnchor,
        dltTransactionDeferredTransferJoinsQuery,
        ['transactionLink', 'user'],
      )
    case 'GRDT_TRANSACTION_REGISTER_ADDRESS':
      return dbSelectDltTransactionWithJoins(
        ledgerAnchor,
        dltTransactionRegisterAddressJoinsQuery,
        ['user'],
      )
    default:
      return {
        success: false,
        error: new UnhandledEnum(`unhandled enum`, 'GrdtTransactionType', transactionType),
      }
  }
}
