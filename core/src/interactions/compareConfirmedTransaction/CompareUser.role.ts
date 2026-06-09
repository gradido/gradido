import { UserSelect } from 'database'
import { CompareError, VoidResult } from 'shared'
import { TransactionParty } from '../../apis'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareUserRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected transactionParty: TransactionParty,
    protected dbUser: UserSelect,
  ) {
    super()
  }
  isIdentical(): VoidResult<CompareError> {
    if (this.transactionParty.communityUuid !== this.dbUser.communityUuid) {
      return {
        success: false,
        error: new CompareError(
          'communityUuid does not match',
          `${this.transactionParty.communityUuid} != ${this.dbUser.communityUuid}`,
        ),
      }
    }
    return { success: true }
  }
}
