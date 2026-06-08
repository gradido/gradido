import { ContributionStatus, ContributionsSelect } from 'database'
import { CompareError, VoidResult } from 'shared'
import { CheckedTransactionInput } from '../../apis'
import { CompareConfirmedAbstractRole } from './CompareConfirmedAbstract.role'

export class CompareConfirmedContributionRole extends CompareConfirmedAbstractRole {
  public constructor(
    protected confirmedTx: CheckedTransactionInput,
    protected contribution: ContributionsSelect,
  ) {
    super()
  }
  isIdentical(): VoidResult<CompareError> {
    if (this.contribution.status !== ContributionStatus.CONFIRMED) {
      return {
        success: false,
        error: new CompareError(
          'invalid contribution status',
          ContributionStatus.CONFIRMED,
          this.contribution.status,
        ),
      }
    }
    const result = this.isIdenticalAmount(this.contribution.amount, this.confirmedTx.amount)
    if (!result.success) {
      return result
    }
    return { success: true }
  }
}
