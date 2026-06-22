import { transactionLinksDecayed } from 'core'
import {
  DltTransactionTransfer,
  dbUpdateBalanceAndDate,
  TransactionSelect,
  TransactionTypeId,
} from 'database'
import { CompareError, CompleteTransaction, TemporalGradidoUnit, VoidResult } from 'shared'
import { AbstractCompareConfirmedRole, DbUser, DltUser } from './AbstractCompareConfirmed.role'

export class CompareConfirmedTransferRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CompleteTransaction,
    protected dbTransaction: DltTransactionTransfer,
    protected sync: boolean,
  ) {
    super()
  }

  async isIdenticalPart(
    dbTx: TransactionSelect,
    dltAccountBalance: TemporalGradidoUnit,
    accountBalance: TemporalGradidoUnit,
    dltUser: DltUser,
    user: DbUser,
  ): Promise<VoidResult<CompareError>> {
    if (!dbTx.amount) {
      throw new CompareError(`Empty amount on tx with id: ${dbTx.id}`)
    }
    let amount = dbTx.amount
    if (amount.isNegative()) {
      amount = dbTx.amount.negated()
    }
    let result = this.isIdenticalGdd('amount', amount, this.confirmedTx.getAmount())
    if (!result.success) {
      return result
    }

    const balanceCompareDiffResult = this.compareAndGetDifference(
      'transaction balance',
      accountBalance,
      dltAccountBalance,
    )
    if (!balanceCompareDiffResult.success) {
      return balanceCompareDiffResult
    }
    const txBalanceDiff = balanceCompareDiffResult.value

    result = this.isIdenticalUser(user, dltUser)
    if (!result.success) {
      return result
    }

    if (this.sync) {
      if (!dbTx.balance) {
        throw new CompareError('Missing balance for Transaction or LinkedTransaction')
      }

      const newTxBalance = dbTx.balance.subtract(txBalanceDiff)
      await dbUpdateBalanceAndDate({
        id: dbTx.id,
        balance: newTxBalance,
        balanceDate: dbTx.balanceDate,
      })
    }

    return { success: true }
  }

  // for all four variants identical (Send and Receive as link redeem and as simple transfer)
  // dltSender differ on redeem transaction link on confirmed tx
  async isIdenticalCommonPart(
    dltSenderUser: DltUser,
    dltRecipientUser: DltUser,
  ): Promise<VoidResult<CompareError>> {
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

    const user = this.dbTransaction.user
    if (!user) {
      return { success: false, error: new CompareError('Missing user in db') }
    }

    const linkedUser = this.dbTransaction.linkedUser
    if (!linkedUser) {
      return { success: false, error: new CompareError('Missing linked user in db') }
    }

    const dbAccountBalanceDate = new Date(tx.balanceDate)
    const [
      { sumHoldAvailableDecayedAmount },
      { sumHoldAvailableDecayedAmount: linkedUserSumHoldAvailableDecayedAmount },
    ] = await Promise.all([
      transactionLinksDecayed(user.id, dbAccountBalanceDate),
      transactionLinksDecayed(linkedUser.id, dbAccountBalanceDate),
    ])

    if (!dltSenderUser.publicKey) {
      return { success: false, error: new CompareError('Missing sender public key on dlt') }
    }
    const senderAccountBalance = this.confirmedTx.getAccountBalanceForPublicKey(
      dltSenderUser.publicKey,
    )
    if (!senderAccountBalance) {
      return {
        success: false,
        error: new CompareError(`dlt cannot found account balance for ${dltSenderUser.publicKey}`),
      }
    }
    if (!dltRecipientUser.publicKey) {
      return { success: false, error: new CompareError('Missing recipient public key on dlt') }
    }
    const recipientAccountBalance = this.confirmedTx.getAccountBalanceForPublicKey(
      dltRecipientUser.publicKey,
    )
    if (!recipientAccountBalance) {
      return {
        success: false,
        error: new CompareError(
          `dlt cannot found account balance for ${dltRecipientUser.publicKey}`,
        ),
      }
    }
    if (!tx.balance) {
      throw new CompareError(`Missing balance on db transaction with id: ${tx.id}`)
    }
    if (!linkedTx.balance) {
      throw new CompareError(`Missing balance on db transaction with id: ${linkedTx.id}`)
    }
    const dbTxAccountBalance = new TemporalGradidoUnit(
      tx.balance.subtract(sumHoldAvailableDecayedAmount),
      new Date(tx.balanceDate),
    )
    const dbTxLinkedAccountBalance = new TemporalGradidoUnit(
      linkedTx.balance.subtract(linkedUserSumHoldAvailableDecayedAmount),
      new Date(linkedTx.balanceDate),
    )

    if (tx.typeId === TransactionTypeId.SEND) {
      result = await this.isIdenticalPart(
        tx,
        senderAccountBalance.balance,
        dbTxAccountBalance,
        dltSenderUser,
        user,
      )
      if (!result.success) {
        return result
      }

      result = await this.isIdenticalPart(
        linkedTx,
        recipientAccountBalance.balance,
        dbTxLinkedAccountBalance,
        dltRecipientUser,
        linkedUser,
      )
      if (!result.success) {
        return result
      }
    } else if (tx.typeId === TransactionTypeId.RECEIVE) {
      result = await this.isIdenticalPart(
        tx,
        recipientAccountBalance.balance,
        dbTxAccountBalance,
        dltRecipientUser,
        user,
      )
      if (!result.success) {
        return result
      }

      result = await this.isIdenticalPart(
        linkedTx,
        senderAccountBalance.balance,
        dbTxLinkedAccountBalance,
        dltSenderUser,
        linkedUser,
      )
      if (!result.success) {
        return result
      }
    } else {
      throw new CompareError('unexpected branch')
    }
    return { success: true }
  }

  async isIdentical(): Promise<VoidResult<CompareError>> {
    const transactionType = this.confirmedTx.getTransactionType()

    if (transactionType !== 'GRDT_TRANSACTION_TRANSFER') {
      return {
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          transactionType,
          'GRDT_TRANSACTION_TRANSFER',
        ),
      }
    }

    const dltSenderUserPublicKey = this.confirmedTx.getSenderPublicKey()
    if (!dltSenderUserPublicKey) {
      return { success: false, error: new CompareError('Missing sender user in dlt data') }
    }

    const dltSenderUserCommunityUuid = this.confirmedTx.getSenderCommunityUuid()
    if (!dltSenderUserCommunityUuid) {
      return {
        success: false,
        error: new CompareError('Missing sender user community uuid in dlt data'),
      }
    }
    const dltSenderUser: DltUser = {
      publicKey: dltSenderUserPublicKey,
      communityUuid: dltSenderUserCommunityUuid,
    }

    const dltRecipientUserPublicKey = this.confirmedTx.getRecipientPublicKey()
    if (!dltRecipientUserPublicKey) {
      return { success: false, error: new CompareError('Missing recipient user in dlt data') }
    }

    const dltRecipientUserCommunityUuid = this.confirmedTx.getRecipientCommunityUuid()
    if (!dltRecipientUserCommunityUuid) {
      return {
        success: false,
        error: new CompareError('Missing recipient user community uuid in dlt data'),
      }
    }
    const dltRecipientUser: DltUser = {
      publicKey: dltRecipientUserPublicKey,
      communityUuid: dltRecipientUserCommunityUuid,
    }

    const result = await this.isIdenticalCommonPart(dltSenderUser, dltRecipientUser)
    if (!result.success) {
      return result
    }

    return { success: true }
  }
}
