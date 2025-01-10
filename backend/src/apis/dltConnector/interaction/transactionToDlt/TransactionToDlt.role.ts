import { DltTransaction } from '@entity/DltTransaction'
import { Transaction } from '@entity/Transaction'

import { DltTransactionType } from '@dltConnector/enum/DltTransactionType'
import { TransactionType } from '@dltConnector/enum/TransactionType'
import { CommunityUser } from '@dltConnector/model/CommunityUser'
import { IdentifierSeed } from '@dltConnector/model/IdentifierSeed'
import { TransactionDraft } from '@dltConnector/model/TransactionDraft'
import { UserIdentifier } from '@dltConnector/model/UserIdentifier'

import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LogError } from '@/server/LogError'

import { AbstractTransactionToDltRole } from './AbstractTransactionToDlt.role'

/**
 * send transfer and creations transactions to dlt connector as GradidoTransfer and GradidoCreation
 */
export class TransactionToDltRole extends AbstractTransactionToDltRole<Transaction> {
  private type: DltTransactionType
  async initWithLast(): Promise<this> {
    this.self = await this.createQueryForPendingItems(
      Transaction.createQueryBuilder().leftJoinAndSelect(
        'Transaction.transactionLink',
        'transactionLink',
      ),
      'Transaction.id = dltTransaction.transactionId',
      // eslint-disable-next-line camelcase
      { balance_date: 'ASC', Transaction_id: 'ASC' },
    )
      // we don't need the receive transactions, there contain basically the same data as the send transactions
      .andWhere('Transaction.type_id <> :typeId', { typeId: TransactionTypeId.RECEIVE })
      .getOne()
    return this
  }

  public getTimestamp(): number {
    if (!this.self) {
      return Infinity
    }
    return this.self.balanceDate.getTime()
  }

  public convertToGraphqlInput(): TransactionDraft {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty transaction')
    }
    const draft = new TransactionDraft()
    draft.amount = this.self.amount.abs().toString()

    if (
      !this.self.linkedUserGradidoID ||
      !this.self.linkedUserCommunityUuid ||
      !this.self.userCommunityUuid
    ) {
      throw new LogError(
        `missing necessary field in transaction: ${this.self.id}, need linkedUserGradidoID, linkedUserCommunityUuid and userCommunityUuid`,
      )
    }
    switch (this.self.typeId as TransactionTypeId) {
      case TransactionTypeId.CREATION:
        draft.type = TransactionType.GRADIDO_CREATION
        this.type = DltTransactionType.CREATION
        break
      case TransactionTypeId.SEND:
      case TransactionTypeId.RECEIVE:
        draft.type = TransactionType.GRADIDO_TRANSFER
        this.type = DltTransactionType.TRANSFER
        break
      default:
        throw new LogError('wrong role for type', this.self.typeId as TransactionTypeId)
    }
    // it is a redeem of a transaction link?
    const transactionLink = this.self.transactionLink
    if (transactionLink) {
      draft.user = new UserIdentifier(
        this.self.userCommunityUuid,
        new IdentifierSeed(transactionLink.code),
      )
      this.type = DltTransactionType.REDEEM_DEFERRED_TRANSFER
    } else {
      draft.user = new UserIdentifier(
        this.self.userCommunityUuid,
        new CommunityUser(this.self.userGradidoID, 1),
      )
    }
    draft.linkedUser = new UserIdentifier(
      this.self.linkedUserCommunityUuid,
      new CommunityUser(this.self.linkedUserGradidoID, 1),
    )
    draft.memo = this.self.memo
    draft.createdAt = this.self.balanceDate.toISOString()
    draft.targetDate = this.self.creationDate?.toISOString()
    return draft
  }

  protected setJoinIdAndType(dltTransaction: DltTransaction): void {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty transaction')
    }
    dltTransaction.transactionId = this.self.id
    dltTransaction.typeId = this.type
  }
}
