import { DltTransactionSelect } from 'database'
import { CompareError, VoidResult } from 'shared'
import { CheckedTransactionInput, TransactionType } from '../../apis'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'
import { CompareConfirmedContributionRole } from './CompareConfirmedContribution.role'

export function compareConfirmedTransaction(
  nodeTx: DltTransactionSelect,
  confirmedTx: CheckedTransactionInput,
): VoidResult<CompareError> {
  if (!confirmedTx.transactionType) {
    return { success: false, error: new CompareError('Missing TransactionType in confirmedTx') }
  }

  let role : AbstractCompareConfirmedRole | undefined
  switch (confirmedTx.transactionType) {
    case TransactionType.GRADIDO_CREATION:
      role = new CompareConfirmedContributionRole(confirmedTx, nodeTx.contribution)
      break
  }
  return { success: true }
}
