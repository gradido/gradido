import { eq } from 'drizzle-orm'
import { Result, UnhandledEnum } from 'shared'
import { GrdtTransactionType, LedgerAnchor } from 'shared-native'
import { DBMissingJoin, DBNotFoundError, DltTransactionType } from '../'
import { drizzleDb } from '../AppDatabase'
import {
  DltTransactionContribution,
  DltTransactionDeferredTransfer,
  DltTransactionRegisterAddress,
  DltTransactionTransfer,
  dbSelectDltTransactionWithJoins,
  dltTransactionContributionJoinsQuery,
  dltTransactionDeferredTransferJoinsQuery,
  dltTransactionRegisterAddressJoinsQuery,
  dltTransactionTransferJoinsQuery,
} from '../queries'
import { contributionsTable, dltTransactionsTable } from '../schemas'

export async function dltTransactionWhereByLedgerAnchor(
  ledgerAnchor: LedgerAnchor,
): Promise<
  Result<
    { field: any; value: number | string; where: string },
    Error | DBNotFoundError | UnhandledEnum
  >
> {
  const hieroTransactionId = ledgerAnchor.getHieroTransactionId()
  const legacyId = Number(ledgerAnchor.getLegacyId())
  if (hieroTransactionId) {
    const where = `hieroTransactionId = ${hieroTransactionId}`
    return {
      success: true,
      value: { field: dltTransactionsTable.hieroTransactionId, value: hieroTransactionId, where },
    }
  } else if (legacyId) {
    const ledgerAnchorType = ledgerAnchor.getType()
    if (ledgerAnchorType === 'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_TRANSACTION_ID') {
      const where = `transactionId = ${legacyId}`
      return {
        success: true,
        value: { field: dltTransactionsTable.transactionId, value: legacyId, where },
      }
    } else if (ledgerAnchorType === 'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_TRANSACTION_LINK_ID') {
      const where = `transactionLinkId = ${legacyId}`
      return {
        success: true,
        value: { field: dltTransactionsTable.transactionLinkId, value: legacyId, where },
      }
    } else if (ledgerAnchorType === 'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_USER_ID') {
      const where = `userId = ${legacyId}`
      return {
        success: true,
        value: { field: dltTransactionsTable.userId, value: legacyId, where },
      }
    } else if (ledgerAnchorType === 'GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_CONTRIBUTION_ID') {
      const contributions = await drizzleDb()
        .select({ transactionId: contributionsTable.transactionId })
        .from(contributionsTable)
        .where(eq(contributionsTable.id, legacyId))
      if (contributions.length !== 1) {
        return { success: false, error: new DBNotFoundError('contributions', `id = ${legacyId}`) }
      }
      if (!contributions[0].transactionId) {
        return {
          success: false,
          error: new Error(
            `contribution ${legacyId} linked by ledgerAnchor without transaction id`,
          ),
        }
      }
      const where = `transactionId = ${contributions[0].transactionId}`
      return {
        success: true,
        value: {
          field: dltTransactionsTable.transactionId,
          value: contributions[0].transactionId,
          where,
        },
      }
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
  } else {
    throw new Error('ledger anchor is invalid')
  }
}

/**
 * Fetches a complete DLT transaction with all necessary joins for the given transaction type.
 *
 * For REDEEM_DEFERRED_TRANSFER, special validation is applied because the join structure
 * differs depending on whether the deferred transfer was redeemed or deleted.
 */
export async function resolveDltTransactionByLedgerAnchor(
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
  if (transactionType === 'GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER') {
    const queryResult = await dbSelectDltTransactionWithJoins(
      ledgerAnchor,
      dltTransactionTransferJoinsQuery,
      [],
    )
    if (!queryResult.success) {
      return queryResult
    }
    const t = queryResult.value
    const missingJoins: string[] = []
    if (t.dltTransaction.typeId === DltTransactionType.DELETE_DEFERRED_TRANSFER) {
      if (t.dltTransaction && t.transactionLink && t.transactionLinkUser) {
        return queryResult
      }
      if (!t.dltTransaction) {
        missingJoins.push('dlt_transactions')
      }
      if (!t.transactionLinkDeep) {
        missingJoins.push('transaction_links')
      }
      if (!t.transactionLinkUser) {
        missingJoins.push('users (on transaction_links)')
      }
    } else if (t.dltTransaction.typeId === DltTransactionType.REDEEM_DEFERRED_TRANSFER) {
      if (t.dltTransaction && t.transaction && t.linkedTransaction && t.transactionLinkDeep && t.user && t.linkedUser) {
        return queryResult
      }
      if (!t.dltTransaction) {
        missingJoins.push('dlt_transactions')
      }
      if (!t.transaction) {
        missingJoins.push('transactions')
      }
      if (!t.linkedTransaction) {
        missingJoins.push('transactions (linked by other transaction)')
      }
      if (!t.transactionLinkDeep) {
        missingJoins.push('transaction_links (linked by transaction)')
      }
      if (!t.user) {
        missingJoins.push('users')
      }
      if (!t.linkedUser) {
        missingJoins.push('users (linked by transaction as linked_user')
      }
    }

    const result = await dltTransactionWhereByLedgerAnchor(ledgerAnchor)
    if (!result.success) {
      throw new Error(`dltTransactionWhereByLedgerAnchor returned error: ${result}`)
    }

    return {
      success: false,
      error: new DBMissingJoin('dlt_transactions', missingJoins.join(', '), result.value.where),
    }
  }
  switch (transactionType) {
    case 'GRDT_TRANSACTION_TRANSFER':
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
