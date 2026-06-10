import { DltTransactionContribution, TransactionTypeId } from 'database'
import { CompareError, VoidResult } from 'shared'
import { CheckedTransactionInput, TransactionType } from '../../apis'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareConfirmedContributionRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CheckedTransactionInput,
    protected dbTransaction: DltTransactionContribution,
  ) {
    super()
  }
  isIdentical(): VoidResult<CompareError> {
    const tx = this.dbTransaction.transaction
    if (!tx) {
      // we throw because this should be already checked before calling into this interaction
      throw new CompareError('Missing transaction')
    }

    if (this.confirmedTx.transactionType !== TransactionType.GRDT_TRANSACTION_CREATION) {
      return {
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          this.confirmedTx.transactionType,
          TransactionType.GRDT_TRANSACTION_CREATION,
        ),
      }
    }

    if (tx.typeId !== TransactionTypeId.CREATION) {
      return {
        success: false,
        error: new CompareError(
          'DB transaction wrong type',
          tx.typeId?.toString() || 'undefined',
          TransactionTypeId[TransactionTypeId.CREATION],
        ),
      }
    }

    const recipientUser = this.dbTransaction.user
    if (!recipientUser) {
      return { success: false, error: new CompareError('Missing recipient user in db') }
    }

    const dltRecipientUser = this.confirmedTx.recipient
    if (!dltRecipientUser) {
      return { success: false, error: new CompareError('Missing recipient user in dlt data') }
    }

    let result = this.isIdenticalGdd('amount', tx.amount, this.confirmedTx.amount)
    if (!result.success) {
      return result
    }

    result = this.isIdenticalGdd('balance', tx.balance, dltRecipientUser.finalBalance)
    if (!result.success) {
      return result
    }

    // most expensive compare at the end
    return this.isIdenticalUser(recipientUser, dltRecipientUser)
  }
}
