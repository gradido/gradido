import { DltTransaction, User } from 'database'

import { AccountType } from '@dltConnector/enum/AccountType'
import { DltTransactionType } from '@dltConnector/enum/DltTransactionType'
import { TransactionType } from '@dltConnector/enum/TransactionType'
import { TransactionDraft } from '@dltConnector/model/TransactionDraft'
import { AccountIdentifier } from '@/apis/dltConnector/model/AccountIdentifier'

import { LogError } from '@/server/LogError'

import { AbstractTransactionToDltRole } from './AbstractTransactionToDlt.role'
import { CommunityAccountIdentifier } from '../../model/CommunityAccountIdentifier'

/**
 * send new user to dlt connector, will be made to RegisterAddress Transaction
 */
export class UserToDltRole extends AbstractTransactionToDltRole<User> {
  async initWithLast(): Promise<this> {
    this.self = await this.createQueryForPendingItems(
      User.createQueryBuilder().leftJoinAndSelect('User.community', 'community'),
      'User.id = dltTransaction.userId',
      // eslint-disable-next-line camelcase
      { User_created_at: 'ASC', User_id: 'ASC' },
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
      throw new LogError('try to create dlt entry for empty transaction')
    }
    if (!this.self.community) {
      throw new LogError(`missing community for user ${this.self.id}`)
    }
    const topicId = this.self.community.hieroTopicId
    if (!topicId) {
      throw new LogError(`missing topicId for community ${this.self.community.id}`)
    }
    const draft = new TransactionDraft()
    draft.user = new AccountIdentifier(topicId, new CommunityAccountIdentifier(this.self.gradidoID))
    draft.createdAt = this.self.createdAt.toISOString()
    draft.accountType = AccountType.COMMUNITY_HUMAN
    draft.type = TransactionType.REGISTER_ADDRESS
    return draft
  }

  protected setJoinIdAndType(dltTransaction: DltTransaction): void {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty user')
    }
    dltTransaction.userId = this.self.id
    dltTransaction.typeId = DltTransactionType.REGISTER_ADDRESS
  }
}
