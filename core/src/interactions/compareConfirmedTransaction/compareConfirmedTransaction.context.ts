import {
  DltTransactionContribution,
  DltTransactionDeferredTransfer,
  DltTransactionRegisterAddress,
  DltTransactionTransfer,
} from 'database'
import { CompareError, VoidResult } from 'shared'
import { CheckedTransactionInput, TransactionType } from '../../apis'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'
import { CompareConfirmedContributionRole } from './CompareConfirmedContribution.role'
import { CompareConfirmedRegisterUserRole } from './CompareConfirmedRegisterUser.role'
import { CompareConfirmedTransactionLinkRole } from './CompareConfirmedTransactionLink.role'
import { CompareConfirmedTransferRole } from './CompareConfirmedTransfer.role'

export function compareConfirmedTransaction(
  dbTransaction:
    | DltTransactionTransfer
    | DltTransactionContribution
    | DltTransactionRegisterAddress
    | DltTransactionDeferredTransfer,
  confirmedTx: CheckedTransactionInput,
): VoidResult<CompareError> {
  if (!confirmedTx.createdAt) {
    return { success: false, error: new CompareError('Missing createdAt in confirmedTx') }
  }
  if (
    new Date(confirmedTx.createdAt).getTime() !==
    new Date(dbTransaction.dltTransaction.createdAt).getTime()
  ) {
    return {
      success: false,
      error: new CompareError(
        'CreatedAt mismatch',
        `${confirmedTx.createdAt} != ${dbTransaction.dltTransaction.createdAt}`,
      ),
    }
  }

  let role: AbstractCompareConfirmedRole
  if (!confirmedTx.transactionType) {
    return { success: false, error: new CompareError('Missing TransactionType in confirmedTx') }
  }
  switch (confirmedTx.transactionType) {
    case TransactionType.GRDT_TRANSACTION_TRANSFER:
    case TransactionType.GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER:
      role = new CompareConfirmedTransferRole(confirmedTx, dbTransaction as DltTransactionTransfer)
      break
    case TransactionType.GRDT_TRANSACTION_CREATION:
      role = new CompareConfirmedContributionRole(
        confirmedTx,
        dbTransaction as DltTransactionContribution,
      )
      break
    case TransactionType.GRDT_TRANSACTION_DEFERRED_TRANSFER:
      role = new CompareConfirmedTransactionLinkRole(
        confirmedTx,
        dbTransaction as DltTransactionDeferredTransfer,
      )
      break
    case TransactionType.GRDT_TRANSACTION_REGISTER_ADDRESS:
      role = new CompareConfirmedRegisterUserRole(
        confirmedTx,
        dbTransaction as DltTransactionRegisterAddress,
      )
      break
    default:
      return {
        success: false,
        error: new CompareError(
          'Unhandled transactionType',
          confirmedTx.transactionType,
          TransactionType.toString(),
        ),
      }
  }
  return role.isIdentical()
}
