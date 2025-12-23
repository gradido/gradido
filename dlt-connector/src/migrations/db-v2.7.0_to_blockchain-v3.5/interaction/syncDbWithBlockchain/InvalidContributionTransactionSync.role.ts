import { Context } from '../../Context'
import { loadInvalidContributionTransactions } from '../../database'
import { AbstractSyncRole } from './AbstractSync.role'

export class InvalidContributionTransactionSyncRole extends AbstractSyncRole<{ id: number, balanceDate: Date }> {
  static allTransactionIds: number[] = []
  constructor(readonly context: Context) {
    super(context)
  }
  itemTypeName(): string {
    return 'invalidContributionTransaction'
  }

  async loadFromDb(offset: number, count: number): Promise<{ id: number, balanceDate: Date }[]> {
    const result = await loadInvalidContributionTransactions(this.context.db, offset, count)
    InvalidContributionTransactionSyncRole.allTransactionIds.push(...result.map((r) => r.id))
    return result
  }

  getDate(): Date {
    return this.peek().balanceDate
  }

  async pushToBlockchain(item: { id: number, balanceDate: Date }): Promise<void> {
    this.logger.warn(`Invalid contribution transaction ${item.id} found.`)
  }
}
