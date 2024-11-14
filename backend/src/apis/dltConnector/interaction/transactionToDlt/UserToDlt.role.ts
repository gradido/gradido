import { DltTransaction } from '@entity/DltTransaction'
import { User } from '@entity/User'

import { AccountType } from '@dltConnector/enum/AccountType'
import { TransactionType } from '@dltConnector/enum/TransactionType'
import { CommunityUser } from '@dltConnector/model/CommunityUser'
import { TransactionDraft } from '@dltConnector/model/TransactionDraft'
import { UserIdentifier } from '@dltConnector/model/UserIdentifier'

import { LogError } from '@/server/LogError'

import { AbstractTransactionToDltRole } from './AbstractTransactionToDlt.role'

/**
 * send new user to dlt connector, will be made to RegisterAddress Transaction
 */
export class UserToDltRole extends AbstractTransactionToDltRole<User> {
  async initWithLast(): Promise<this> {
    this.self = await this.createQueryForPendingItems(
      User.createQueryBuilder(),
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
    const draft = new TransactionDraft()
    draft.user = new UserIdentifier(this.self.communityUuid, new CommunityUser(this.self.gradidoID))
    draft.createdAt = this.self.createdAt.toISOString()
    draft.accountType = AccountType.COMMUNITY_HUMAN
    draft.type = TransactionType.REGISTER_ADDRESS
    return draft
  }

  protected setJoinId(dltTransaction: DltTransaction): void {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty user')
    }
    dltTransaction.userId = this.self.id
  }
}
