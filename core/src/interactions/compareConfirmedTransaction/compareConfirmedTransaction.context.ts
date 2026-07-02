import {
  DltTransactionContribution,
  DltTransactionDeferredTransfer,
  DltTransactionRegisterAddress,
  DltTransactionTransfer,
  DltTransactionType,
} from 'database'
import { CompareError, CompleteTransaction, VoidResult } from 'shared'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'
import { CompareConfirmedContributionRole } from './CompareConfirmedContribution.role'
import { CompareConfirmedRegisterUserRole } from './CompareConfirmedRegisterUser.role'
import { CompareConfirmedTransactionDeleteLinkRole } from './CompareConfirmedTransactionDeleteLink.role'
import { CompareConfirmedTransactionLinkRole } from './CompareConfirmedTransactionLink.role'
import { CompareConfirmedTransactionRedeemLinkRole } from './CompareConfirmedTransactionRedeemLink.role'
import { CompareConfirmedTransferRole } from './CompareConfirmedTransfer.role'

/**
 * compare ConfirmedTransaction from Blockchain with db Transaction

 * @param dbTransaction
 * @param confirmedTx
 * @param sync if set to true, update balance and balanceDate from dbTransaction to ConfirmeTransaction confirmedAt values
 * @returns
 */
export async function compareConfirmedTransaction(
  dbTransaction:
    | DltTransactionTransfer
    | DltTransactionContribution
    | DltTransactionRegisterAddress
    | DltTransactionDeferredTransfer,
  confirmedTx: CompleteTransaction,
  sync: boolean = false,
): Promise<VoidResult<CompareError>> {
  let role: AbstractCompareConfirmedRole

  if (dbTransaction.dltTransaction.typeId === DltTransactionType.DELETE_DEFERRED_TRANSFER) {
    role = new CompareConfirmedTransactionDeleteLinkRole(
      confirmedTx,
      dbTransaction as DltTransactionTransfer,
    )
  } else {
    switch (confirmedTx.getTransactionType()) {
      case 'GRDT_TRANSACTION_TRANSFER':
        role = new CompareConfirmedTransferRole(
          confirmedTx,
          dbTransaction as DltTransactionTransfer,
          sync,
        )
        break
      case 'GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER':
        role = new CompareConfirmedTransactionRedeemLinkRole(
          confirmedTx,
          dbTransaction as DltTransactionTransfer,
          sync,
        )
        break
      case 'GRDT_TRANSACTION_CREATION':
        role = new CompareConfirmedContributionRole(
          confirmedTx,
          dbTransaction as DltTransactionContribution,
          sync,
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
  }
  return role.isIdentical()
}
