import { DltTransactionRegisterAddress } from 'database'
import { CompareError, VoidResult } from 'shared'
import { CompleteTransaction } from 'shared-native'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareConfirmedRegisterUserRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CompleteTransaction,
    protected dbTransaction: DltTransactionRegisterAddress,
  ) {
    super()
  }
  isIdentical(): VoidResult<CompareError> {
    const user = this.dbTransaction.user
    if (!user) {
      throw new CompareError('Missing user')
    }

    if (this.confirmedTx.getTransactionType() !== 'GRDT_TRANSACTION_REGISTER_ADDRESS') {
      return {
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          this.confirmedTx.getTransactionType(),
          'GRDT_TRANSACTION_REGISTER_ADDRESS',
        ),
      }
    }

    return this.isIdenticalUser(
      user,
      this.confirmedTx.getRegisteredAccount(),
      this.confirmedTx.getSenderCommunityUuid(),
    )
  }
}
