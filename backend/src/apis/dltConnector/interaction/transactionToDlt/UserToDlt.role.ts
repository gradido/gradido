import { DltTransaction } from '@entity/DltTransaction'
import { User } from '@entity/User'

import { TransactionDraft } from '@dltConnector/model/TransactionDraft'
import { TransactionLinkDraft } from '@dltConnector/model/TransactionLinkDraft'
import { UserAccountDraft } from '@dltConnector/model/UserAccountDraft'

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
    )
    return this
  }

  public getTimestamp(): number {
    if (!this.self) {
      return Infinity
    }
    return this.self.createdAt.getTime()
  }

  public convertToGraphqlInput(): TransactionDraft | UserAccountDraft | TransactionLinkDraft {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty transaction')
    }
    return new UserAccountDraft(this.self)
  }

  protected setJoinId(dltTransaction: DltTransaction): void {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty user')
    }
    dltTransaction.userId = this.self.id
  }
}
