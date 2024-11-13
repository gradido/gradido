import { DltTransaction } from '@entity/DltTransaction'
import { Transaction } from '@entity/Transaction'

import { TransactionDraft } from '@dltConnector/model/TransactionDraft'
import { UserAccountDraft } from '@dltConnector/model/UserAccountDraft'

import { LogError } from '@/server/LogError'

import { AbstractTransactionToDltRole } from './AbstractTransactionToDlt.role'

/**
 * send transfer and creations transactions to dlt connector as GradidoTransfer and GradidoCreation
 */
export class TransactionToDltRole extends AbstractTransactionToDltRole<Transaction> {
  async initWithLast(): Promise<this> {
    this.self = await this.createQueryForPendingItems(
      Transaction.createQueryBuilder(),
      'Transaction.id = dltTransaction.transactionId',
      // eslint-disable-next-line camelcase
      { balance_date: 'ASC', Transaction_id: 'ASC' },
    )
    return this
  }

  public getTimestamp(): number {
    if (!this.self) {
      return Infinity
    }
    return this.self.balanceDate.getTime()
  }

  public convertToGraphqlInput(): TransactionDraft | UserAccountDraft {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty transaction')
    }
    return new TransactionDraft(this.self)
  }

  protected setJoinId(dltTransaction: DltTransaction): void {
    if (!this.self) {
      throw new LogError('try to create dlt entry for empty transaction')
    }
    dltTransaction.transactionId = this.self.id
  }
}
