import { transactionLinksDecayed } from 'core'
import { DltTransactionTransfer, dbUpdateBalanceAndDate, TransactionTypeId } from 'database'
import {
  CompareError,
  CompleteTransaction,
  GradidoUnit,
  TemporalGradidoUnit,
  VoidResult,
} from 'shared'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareConfirmedTransferRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CompleteTransaction,
    protected dbTransaction: DltTransactionTransfer,
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

    const linkedTx = this.dbTransaction.linkedTransaction
    if (!linkedTx) {
      // we throw because this should be already checked before calling into this interaction
      throw new CompareError('Missing linked transaction')
    }

    let result = this.isTxPairing(tx, linkedTx)
    if (!result.success) {
      // throw exception, because when both transactions from db, which should belong to the same transaction don't match, we have a serious problem
      throw result.error
    }

    const transactionType = this.confirmedTx.getTransactionType()

    if (
      transactionType !== 'GRDT_TRANSACTION_TRANSFER' &&
      transactionType !== 'GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER'
    ) {
      return {
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          transactionType,
          'GRDT_TRANSACTION_TRANSFER or GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER',
        ),
      }
    }

    if (tx.typeId !== TransactionTypeId.SEND && tx.typeId !== TransactionTypeId.RECEIVE) {
      return {
        success: false,
        error: new CompareError(
          'Db transaction wrong type',
          tx.typeId?.toString() || 'undefined',
          `${TransactionTypeId.SEND} or ${TransactionTypeId.RECEIVE}`,
        ),
      }
    }

    if (
      linkedTx.typeId !== TransactionTypeId.SEND &&
      linkedTx.typeId !== TransactionTypeId.RECEIVE
    ) {
      return {
        success: false,
        error: new CompareError(
          'Db linked transaction wrong type',
          linkedTx.typeId?.toString() || 'undefined',
          `${TransactionTypeId.SEND} or ${TransactionTypeId.RECEIVE}`,
        ),
      }
    }

    result = this.isIdenticalDate(
      'createdAt',
      this.dbTransaction.transaction?.balanceDate,
      this.confirmedTx.getCreatedAt(),
    )
    if (!result.success) {
      return result
    }

    result = this.isIdenticalGdd('amount', tx.amount, this.confirmedTx.getAmount())
    if (!result.success) {
      return result
    }

    const user = this.dbTransaction.user
    if (!user) {
      return { success: false, error: new CompareError('Missing user in db') }
    }

    const linkedUser = this.dbTransaction.linkedUser
    if (!linkedUser) {
      return { success: false, error: new CompareError('Missing linked user in db') }
    }

    const dltSenderUser = this.confirmedTx.getSenderPublicKey()
    if (!dltSenderUser) {
      return { success: false, error: new CompareError('Missing sender user in dlt data') }
    }

    const dltSenderUserCommunityUuid = this.confirmedTx.getSenderCommunityUuid()
    if (!dltSenderUserCommunityUuid) {
      return {
        success: false,
        error: new CompareError('Missing sender user community uuid in dlt data'),
      }
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

    const dbAccountBalanceDate = new Date(tx.balanceDate)
    const [
      { sumHoldAvailableDecayedAmount },
      { sumHoldAvailableDecayedAmount: linkedUserSumHoldAvailableDecayedAmount },
    ] = await Promise.all([
      transactionLinksDecayed(user.id, dbAccountBalanceDate),
      transactionLinksDecayed(linkedUser.id, dbAccountBalanceDate),
    ])

    const senderAccountBalance = this.confirmedTx.getAccountBalanceForPublicKey(dltSenderUser)
    const recipientAccountBalance = this.confirmedTx.getAccountBalanceForPublicKey(dltRecipientUser)
    const dbTxAccountBalance = tx.balance
      ? new TemporalGradidoUnit(
          tx.balance.subtract(sumHoldAvailableDecayedAmount),
          new Date(tx.balanceDate),
        )
      : null
    const dbTxLinkedAccountBalance = linkedTx.balance
      ? new TemporalGradidoUnit(
          linkedTx.balance.subtract(linkedUserSumHoldAvailableDecayedAmount),
          new Date(linkedTx.balanceDate),
        )
      : null

    let txBalanceDiff: GradidoUnit
    let txLinkedBalanceDiff: GradidoUnit

    if (tx.typeId === TransactionTypeId.SEND) {
      let balanceCompareDiffResult = this.compareAndGetDifference(
        'send transaction balance',
        dbTxAccountBalance,
        senderAccountBalance?.balance,
      )
      if (!balanceCompareDiffResult.success) {
        return balanceCompareDiffResult
      }
      txBalanceDiff = balanceCompareDiffResult.value

      balanceCompareDiffResult = this.compareAndGetDifference(
        'recipient transaction balance',
        dbTxLinkedAccountBalance,
        recipientAccountBalance?.balance,
      )
      if (!balanceCompareDiffResult.success) {
        return balanceCompareDiffResult
      }
      txLinkedBalanceDiff = balanceCompareDiffResult.value

      result = this.isIdenticalUser(user, dltSenderUser, dltSenderUserCommunityUuid)
      if (!result.success) {
        return result
      }

      result = this.isIdenticalUser(linkedUser, dltRecipientUser, dltRecipientUserCommunityUuid)
      if (!result.success) {
        return result
      }
    } else if (tx.typeId === TransactionTypeId.RECEIVE) {
      // in db transactions receive has geswapped user <-> linkedUser compared to blockchain transactions
      let balanceCompareDiffResult = this.compareAndGetDifference(
        'send transaction balance',
        dbTxLinkedAccountBalance,
        senderAccountBalance?.balance,
      )
      if (!balanceCompareDiffResult.success) {
        return balanceCompareDiffResult
      }
      txLinkedBalanceDiff = balanceCompareDiffResult.value

      balanceCompareDiffResult = this.compareAndGetDifference(
        'recipient transaction balance',
        dbTxAccountBalance,
        recipientAccountBalance?.balance,
      )
      if (!balanceCompareDiffResult.success) {
        return balanceCompareDiffResult
      }
      txBalanceDiff = balanceCompareDiffResult.value

      result = this.isIdenticalUser(user, dltRecipientUser)
      if (!result.success) {
        return result
      }

      result = this.isIdenticalUser(linkedUser, dltSenderUser)
      if (!result.success) {
        return result
      }
    } else {
      throw new CompareError('unexpected branch')
    }
    if (this.sync) {
      if (!tx.balance || !linkedTx.balance) {
        throw new CompareError('Missing balance for Transaction or LinkedTransaction')
      }

      const newTxBalance = tx.balance.subtract(txBalanceDiff)
      await dbUpdateBalanceAndDate({
        id: tx.id,
        balance: newTxBalance,
        balanceDate: dbAccountBalanceDate,
      })

      const newTxLinkedBalance = linkedTx.balance.subtract(txLinkedBalanceDiff)
      await dbUpdateBalanceAndDate({
        id: linkedTx.id,
        balance: newTxLinkedBalance,
        balanceDate: dbAccountBalanceDate,
      })
    }
    return { success: true }
  }
}
