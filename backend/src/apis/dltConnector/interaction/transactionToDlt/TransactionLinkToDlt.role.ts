import { DltTransaction, TransactionLink } from 'database'

import { DltTransactionType } from '@dltConnector/enum/DltTransactionType'
import { TransactionType } from '@dltConnector/enum/TransactionType'
import { CommunityUser } from '@dltConnector/model/CommunityUser'
import { IdentifierSeed } from '@dltConnector/model/IdentifierSeed'
import { TransactionDraft } from '@dltConnector/model/TransactionDraft'
import { UserIdentifier } from '@dltConnector/model/UserIdentifier'

import { LogError } from '@/server/LogError'

import { AbstractTransactionToDltRole } from './AbstractTransactionToDlt.role'

/**
 * send transactionLink as Deferred Transfers
 */
export class TransactionLinkToDltRole extends AbstractTransactionToDltRole<TransactionLink> {
  async initWithLast(): Promise<this> {
    this.self = await this.createQueryForPendingItems(
      TransactionLink.createQueryBuilder().leftJoinAndSelect('TransactionLink.user', 'user'),
      'TransactionLink.id = dltTransaction.transactionLinkId',
      // eslint-disable-next-line camelcase
      { TransactionLink_createdAt: 'ASC', User_id: 'ASC' },
    ).getOne()
    return this
  }

  public getTimestamp(): number {
    if (!this.self) {
      return Infinity
    }
    return this.self.createdAt.getTime()
  }

  public convertToGraphqlInput(): TransactionDraft {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty transaction link')
    }
    const draft = new TransactionDraft()
    draft.amount = this.self.amount.abs().toString()
    const user = this.self.user
    draft.user = new UserIdentifier(user.communityUuid, new CommunityUser(user.gradidoID, 1))
    draft.linkedUser = new UserIdentifier(user.communityUuid, new IdentifierSeed(this.self.code))
    draft.createdAt = this.self.createdAt.toISOString()
    draft.timeoutDuration = (this.self.validUntil.getTime() - this.self.createdAt.getTime()) / 1000
    draft.memo = this.self.memo
    draft.type = TransactionType.GRADIDO_DEFERRED_TRANSFER
    return draft
  }

  protected setJoinIdAndType(dltTransaction: DltTransaction): void {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty transaction link')
    }
    dltTransaction.transactionLinkId = this.self.id
    dltTransaction.typeId = DltTransactionType.DEFERRED_TRANSFER
  }
}
