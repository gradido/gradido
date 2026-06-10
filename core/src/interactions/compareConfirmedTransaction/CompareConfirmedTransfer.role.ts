import { DltTransactionWithBothTransactions, TransactionTypeId } from 'database'
import { CompareError, VoidResult } from 'shared'
import { CheckedTransactionInput, TransactionType } from '../../apis'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareConfirmedTransferRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CheckedTransactionInput,
    protected dbTransaction: DltTransactionWithBothTransactions,
  ) {
    super()
  }


  isIdentical(): VoidResult<CompareError> {
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

    const transactionType = this.confirmedTx.transactionType
    if (!transactionType) {
      throw new CompareError('missing transaction type on dlt transaction')
    }

    if (transactionType !== TransactionType.GRDT_TRANSACTION_TRANSFER && transactionType !== TransactionType.GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER) {
      return {
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          transactionType,
          `${TransactionType.GRDT_TRANSACTION_TRANSFER} or ${TransactionType.GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER}`,
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

    let result = this.isTxPairing(tx, linkedTx)
    if (!result.success) {
      // throw exception, because when both transactions from db, which should belong to the same transaction don't match, we have a serious problem
      throw result.error
    }

    result = this.isIdenticalGdd('amount', tx.amount, this.confirmedTx.amount)
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

    const dltSenderUser = this.confirmedTx.sender
    if (!dltSenderUser) {
      return { success: false, error: new CompareError('Missing sender user in dlt data') }
    }

    const dltRecipientUser = this.confirmedTx.recipient
    if (!dltRecipientUser) {
      return { success: false, error: new CompareError('Missing recipient user in dlt data') }
    }

    if (tx.typeId === TransactionTypeId.SEND) {
      result = this.isIdenticalGdd(
        'send transaction balance',
        tx.balance,
        dltSenderUser.finalBalance,
      )
      if (!result.success) {
        return result
      }
      result = this.isIdenticalGdd(
        'recipient transaction balance',
        linkedTx.balance,
        dltRecipientUser.finalBalance,
      )
      if (!result.success) {
        return result
      }

      result = this.isIdenticalUser(user, dltSenderUser)
      if (!result.success) {
        return result
      }

      return this.isIdenticalUser(linkedUser, dltRecipientUser)
    } else if (tx.typeId === TransactionTypeId.RECEIVE) {
      // in db transactions receive has geswapped user <-> linkedUser compared to blockchain transactions
      result = this.isIdenticalGdd(
        'send transaction balance',
        linkedTx.balance,
        dltSenderUser.finalBalance,
      )
      if (!result.success) {
        return result
      }

      result = this.isIdenticalGdd(
        'recipient transaction balance',
        tx.balance,
        dltRecipientUser.finalBalance,
      )
      if (!result.success) {
        return result
      }

      result = this.isIdenticalUser(user, dltRecipientUser)
      if (!result.success) {
        return result
      }

      return this.isIdenticalUser(linkedUser, dltSenderUser)
    } else {
      throw new CompareError('unexpected branch')
    }
  }
}
