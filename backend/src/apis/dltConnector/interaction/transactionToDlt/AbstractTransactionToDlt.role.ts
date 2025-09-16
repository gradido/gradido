// eslint-disable-next-line import/no-extraneous-dependencies
import { ObjectLiteral, OrderByCondition, SelectQueryBuilder } from 'typeorm'
import { DltTransaction } from 'database'

import { TransactionDraft } from '@dltConnector/model/TransactionDraft'
import { Logger } from 'log4js'

export abstract class AbstractTransactionToDltRole<T extends ObjectLiteral> {
  protected self: T | null

  // public interface
  public abstract initWithLast(): Promise<this>
  public abstract getTimestamp(): number
  public abstract convertToGraphqlInput(): TransactionDraft


  public constructor(protected logger: Logger) {}

  public getEntity(): T | null {
    return this.self
  }

  public async saveTransactionResult(messageId: string, error: string | null): Promise<void> {
    const dltTransaction = DltTransaction.create()
    dltTransaction.messageId = messageId
    dltTransaction.error = error
    this.setJoinIdAndType(dltTransaction)
    await DltTransaction.save(dltTransaction)
    if (dltTransaction.error) {
      this.logger.error(
        `Store dltTransaction with error: id=${dltTransaction.id}, error=${dltTransaction.error}`,
      )
    } else {
      this.logger.info(
        `Store dltTransaction: messageId=${dltTransaction.messageId}, id=${dltTransaction.id}`,
      )
    }
  }

  // intern
  protected abstract setJoinIdAndType(dltTransaction: DltTransaction): void

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
  }

  protected createDltTransactionEntry(messageId: string, error: string | null): DltTransaction {
    const dltTransaction = DltTransaction.create()
    dltTransaction.messageId = messageId
    dltTransaction.error = error
    return dltTransaction
  }
}
