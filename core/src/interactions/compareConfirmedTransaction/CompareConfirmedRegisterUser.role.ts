import { DltTransactionRegisterAddress } from 'database'
import { CompareError, CompleteTransaction, VoidResult } from 'shared'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareConfirmedRegisterUserRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CompleteTransaction,
    protected dbTransaction: DltTransactionRegisterAddress,
  ) {
    super()
  }
  isIdentical(): Promise<VoidResult<CompareError>> {
    const user = this.dbTransaction.user
    if (!user) {
      throw new CompareError('Missing user')
    }

    if (this.confirmedTx.getTransactionType() !== 'GRDT_TRANSACTION_REGISTER_ADDRESS') {
      return Promise.resolve({
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          this.confirmedTx.getTransactionType(),
          'GRDT_TRANSACTION_REGISTER_ADDRESS',
        ),
      })
    }

    const result = this.isIdenticalDate(
      'createdAt',
      this.dbTransaction.user?.createdAt,
      this.confirmedTx.getCreatedAt(),
    )
    if (!result.success) {
      return Promise.resolve(result)
    }

    return Promise.resolve(
      this.isIdenticalUser(user, {
        publicKey: this.confirmedTx.getRegisteredAccount(),
        communityUuid: this.confirmedTx.getSenderCommunityUuid(),
      }),
    )
  }
}
