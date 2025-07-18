import { DltTransaction } from '@entity/DltTransaction'
import { TransactionLink } from '@entity/TransactionLink'

import { DltTransactionType } from '@dltConnector/enum/DltTransactionType'
import { TransactionType } from '@dltConnector/enum/TransactionType'
import { CommunityUser } from '@dltConnector/model/CommunityUser'
import { IdentifierSeed } from '@dltConnector/model/IdentifierSeed'
import { TransactionDraft } from '@dltConnector/model/TransactionDraft'
import { UserIdentifier } from '@dltConnector/model/UserIdentifier'

import { LogError } from '@/server/LogError'

import { AbstractTransactionToDltRole } from './AbstractTransactionToDlt.role'

/**
 * redeem deferred transfer transaction by creator, so "deleting" it
 */
export class TransactionLinkDeleteToDltRole extends AbstractTransactionToDltRole<TransactionLink> {
  async initWithLast(): Promise<this> {
    const queryBuilder = this.createQueryForPendingItems(
      TransactionLink.createQueryBuilder().leftJoinAndSelect('TransactionLink.user', 'user'),
      'TransactionLink.id = dltTransaction.transactionLinkId and dltTransaction.type_id <> 4',
      // eslint-disable-next-line camelcase
      { TransactionLink_deletedAt: 'ASC', User_id: 'ASC' },
    )
      .andWhere('TransactionLink.deletedAt IS NOT NULL')
      .withDeleted()
    /*
    const queryBuilder2 = TransactionLink.createQueryBuilder()
      .leftJoinAndSelect('TransactionLink.user', 'user')
      .where('TransactionLink.deletedAt IS NOT NULL')
      .andWhere(() => {
        const subQuery = DltTransaction.createQueryBuilder()
          .select('1')
          .where('DltTransaction.transaction_link_id = TransactionLink.id')
          .andWhere('DltTransaction.type_id = :typeId', {
            typeId: DltTransactionType.DELETE_DEFERRED_TRANSFER,
          })
          .getQuery()
        return `NOT EXIST (${subQuery})`
      })
      .withDeleted()
      // eslint-disable-next-line camelcase
      .orderBy({ TransactionLink_deletedAt: 'ASC', User_id: 'ASC' })
      */
    // console.log('query: ', queryBuilder.getSql())
    this.self = await queryBuilder.getOne()
    return this
  }

  public getTimestamp(): number {
    if (!this.self) {
      return Infinity
    }
    if (!this.self.deletedAt) {
      throw new LogError('not deleted transaction link selected')
    }
    return this.self.deletedAt.getTime()
  }

  public convertToGraphqlInput(): TransactionDraft {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty transaction link')
    }
    if (!this.self.deletedAt) {
      throw new LogError('not deleted transaction link selected')
    }
    const draft = new TransactionDraft()
    draft.amount = this.self.amount.abs().toString()
    const user = this.self.user
    draft.user = new UserIdentifier(user.communityUuid, new IdentifierSeed(this.self.code))
    draft.linkedUser = new UserIdentifier(user.communityUuid, new CommunityUser(user.gradidoID, 1))
    draft.createdAt = this.self.deletedAt.toISOString()
    draft.type = TransactionType.GRADIDO_REDEEM_DEFERRED_TRANSFER
    return draft
  }

  protected setJoinIdAndType(dltTransaction: DltTransaction): void {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty transaction link')
    }
    dltTransaction.transactionLinkId = this.self.id
    dltTransaction.typeId = DltTransactionType.DELETE_DEFERRED_TRANSFER
  }
}
