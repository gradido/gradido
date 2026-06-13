import {
  DltTransactionContribution,
  DltTransactionDeferredTransfer,
  DltTransactionRegisterAddress,
  DltTransactionTransfer,
} from 'database'
import { CompareError, VoidResult } from 'shared'
import { CompleteTransaction } from 'shared-native'
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
  confirmedTx: CompleteTransaction,
): VoidResult<CompareError> {
  if (
    confirmedTx.getCreatedAt().getTime() !==
    new Date(dbTransaction.dltTransaction.createdAt).getTime()
  ) {
    return {
      success: false,
      error: new CompareError(
        'CreatedAt mismatch',
        `${confirmedTx.getCreatedAt()} != ${dbTransaction.dltTransaction.createdAt}`,
      ),
    }
  }

  let role: AbstractCompareConfirmedRole
  switch (confirmedTx.getTransactionType()) {
    case 'GRDT_TRANSACTION_TRANSFER':
    case 'GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER':
      role = new CompareConfirmedTransferRole(confirmedTx, dbTransaction as DltTransactionTransfer)
      break
    case 'GRDT_TRANSACTION_CREATION':
      role = new CompareConfirmedContributionRole(
        confirmedTx,
        dbTransaction as DltTransactionContribution,
      )
      break
    case 'GRDT_TRANSACTION_DEFERRED_TRANSFER':
      role = new CompareConfirmedTransactionLinkRole(
        confirmedTx,
        dbTransaction as DltTransactionDeferredTransfer,
      )
      break
    case 'GRDT_TRANSACTION_REGISTER_ADDRESS':
      role = new CompareConfirmedRegisterUserRole(
        confirmedTx,
        dbTransaction as DltTransactionRegisterAddress,
      )
      break
    default:
      return {
        success: false,
        error: new CompareError('Unhandled transactionType', confirmedTx.getTransactionType()),
      }
  }
  return role.isIdentical()
}
