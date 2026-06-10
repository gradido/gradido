import { DltTransactionWithUser } from 'database'
import { CompareError, VoidResult } from 'shared'
import { CheckedTransactionInput, TransactionType } from '../../apis'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareConfirmedRegisterUserRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CheckedTransactionInput,
    protected dbTransaction: DltTransactionWithUser,
  ) {
    super()
  }
  isIdentical(): VoidResult<CompareError> {
    const user = this.dbTransaction.user
    if (!user) {
      throw new CompareError('Missing user')
    }

    if (this.confirmedTx.transactionType !== TransactionType.GRDT_TRANSACTION_REGISTER_ADDRESS) {
      return {
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          this.confirmedTx.transactionType,
          TransactionType.GRDT_TRANSACTION_REGISTER_ADDRESS,
        ),
      }
    }

    return this.isIdenticalUser(user, this.confirmedTx.sender)
  }
}
