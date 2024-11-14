// eslint-disable-next-line import/no-extraneous-dependencies
import { ObjectLiteral, OrderByCondition, SelectQueryBuilder } from '@dbTools/typeorm'
import { DltTransaction } from '@entity/DltTransaction'

import { TransactionDraft } from '@dltConnector/model/TransactionDraft'

import { backendLogger as logger } from '@/server/logger'

export abstract class AbstractTransactionToDltRole<T extends ObjectLiteral> {
  protected self: T | null

  // public interface
  public abstract initWithLast(): Promise<this>
  public abstract getTimestamp(): number
  public abstract convertToGraphqlInput(): TransactionDraft

  public getEntity(): T | null {
    return this.self
  }

  public async saveTransactionResult(messageId: string, error: string | null): Promise<void> {
    const dltTransaction = DltTransaction.create()
    dltTransaction.messageId = messageId
    dltTransaction.error = error
    this.setJoinId(dltTransaction)
    await DltTransaction.save(dltTransaction)
    if (dltTransaction.error) {
      logger.error(
        `Store dltTransaction with error: id=${dltTransaction.id}, error=${dltTransaction.error}`,
      )
    } else {
      logger.info(
        `Store dltTransaction: messageId=${dltTransaction.messageId}, id=${dltTransaction.id}`,
      )
    }
  }

  // intern
  protected abstract setJoinId(dltTransaction: DltTransaction): void

  // helper
  protected createQueryForPendingItems(
    qb: SelectQueryBuilder<T>,
    joinCondition: string,
    orderBy: OrderByCondition,
  ): SelectQueryBuilder<T> {
    return qb
      .leftJoin(DltTransaction, 'dltTransaction', joinCondition)
      .where('dltTransaction.user_id IS NULL')
      .andWhere('dltTransaction.transaction_id IS NULL')
      .andWhere('dltTransaction.transaction_link_Id IS NULL')
      .orderBy(orderBy)
      .limit(1)
  }

  protected createDltTransactionEntry(messageId: string, error: string | null): DltTransaction {
    const dltTransaction = DltTransaction.create()
    dltTransaction.messageId = messageId
    dltTransaction.error = error
    return dltTransaction
  }
}
