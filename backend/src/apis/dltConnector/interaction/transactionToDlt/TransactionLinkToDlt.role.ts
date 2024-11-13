import { DltTransaction } from '@entity/DltTransaction'
import { TransactionLink } from '@entity/TransactionLink'

import { TransactionDraft } from '@dltConnector/model/TransactionDraft'
import { UserAccountDraft } from '@dltConnector/model/UserAccountDraft'

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
    )
    return this
  }

  public getTimestamp(): number {
    if (!this.self) {
      return Infinity
    }
    return this.self.createdAt.getTime()
  }

  public convertToGraphqlInput(): TransactionDraft | UserAccountDraft {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty transaction link')
    }
    return new TransactionDraft(this.self)
  }

  protected setJoinId(dltTransaction: DltTransaction): void {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty transaction link')
    }
    dltTransaction.transactionLinkId = this.self.id
  }
}
