import { transactionLinksDecayed } from 'core'
import { DltTransactionContribution, dbUpdateBalanceAndDate, TransactionTypeId } from 'database'
import { CompareError, CompleteTransaction, TemporalGradidoUnit, VoidResult } from 'shared'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareConfirmedContributionRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CompleteTransaction,
    protected dbTransaction: DltTransactionContribution,
    protected sync: boolean,
  ) {
    super()
  }
  async isIdentical(): Promise<VoidResult<CompareError>> {
    const tx = this.dbTransaction.transaction
    if (!tx) {
      // we throw because this should be already checked before calling into this interaction
      throw new CompareError('Missing transaction')
    }

    if (this.confirmedTx.getTransactionType() !== 'GRDT_TRANSACTION_CREATION') {
      return {
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          this.confirmedTx.getTransactionType(),
          'GRDT_TRANSACTION_CREATION',
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
    let result = this.isIdenticalDate(
      'contributionDate',
      this.dbTransaction.contributionDate,
      this.confirmedTx.getTargetDate(),
    )
    if (!result.success) {
      return result
    }

    const recipientUser = this.dbTransaction.user
    if (!recipientUser) {
      return { success: false, error: new CompareError('Missing recipient user in db') }
    }

    const dltRecipientUser = this.confirmedTx.getRecipientPublicKey()
    if (!dltRecipientUser) {
      return { success: false, error: new CompareError('Missing recipient user in dlt data') }
    }

    const dltRecipientUserCommunityUuid = this.confirmedTx.getRecipientCommunityUuid()
    if (!dltRecipientUserCommunityUuid) {
      return {
        success: false,
        error: new CompareError('Missing recipient user community uuid in dlt data'),
      }
    }

    result = this.isIdenticalGdd('amount', tx.amount, this.confirmedTx.getAmount())
    if (!result.success) {
      return result
    }

    const dbAccountBalanceDate = new Date(tx.balanceDate)
    const { sumHoldAvailableDecayedAmount } = await transactionLinksDecayed(
      tx.userId,
      dbAccountBalanceDate,
    )
    const accountBalance = this.confirmedTx.getAccountBalanceForPublicKey(dltRecipientUser)
    if (!accountBalance) {
      return { success: false, error: new CompareError('Dlt balance is missing') }
    }
    const dbAccountBalance = tx.balance
    if (!dbAccountBalance) {
      return { success: false, error: new CompareError('Db balance is missing') }
    }
    const dbAvailableAccountBalance = new TemporalGradidoUnit(
      dbAccountBalance.subtract(sumHoldAvailableDecayedAmount),
      dbAccountBalanceDate,
    )
    const balanceCompareDiffResult = this.compareAndGetDifference(
      'balance',
      dbAvailableAccountBalance,
      accountBalance.balance,
    )
    if (!balanceCompareDiffResult.success) {
      return balanceCompareDiffResult
    }

    // most expensive compare at the end
    result = this.isIdenticalUser(recipientUser, dltRecipientUser, dltRecipientUserCommunityUuid)
    if (!result.success) {
      return result
    }
    if (this.sync) {
      const newDbBalance = dbAccountBalance.subtract(balanceCompareDiffResult.value)
      await dbUpdateBalanceAndDate({
        id: tx.id,
        balance: newDbBalance,
        balanceDate: accountBalance.balance.balanceDate,
      })
    }
    return { success: true }
  }
}
