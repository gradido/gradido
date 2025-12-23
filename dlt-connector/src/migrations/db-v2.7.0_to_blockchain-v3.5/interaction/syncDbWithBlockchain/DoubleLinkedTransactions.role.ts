import { Context } from '../../Context'
import { loadDoubleLinkedTransactions } from '../../database'
import { AbstractSyncRole } from './AbstractSync.role'

export class DoubleLinkedTransactionsSyncRole extends AbstractSyncRole<{ id: number, balanceDate: Date }> {
  static allTransactionIds: number[] = []
  constructor(readonly context: Context) {
    super(context)
  }
  itemTypeName(): string {
    return 'doubleLinkedTransaction'
  }

  async loadFromDb(offset: number, count: number): Promise<{ id: number, balanceDate: Date }[]> {
    const result = await loadDoubleLinkedTransactions(this.context.db, offset, count)
    DoubleLinkedTransactionsSyncRole.allTransactionIds.push(...result.map((r) => r.id))
    return result
  }

  getDate(): Date {
    return this.peek().balanceDate
  }

  async pushToBlockchain(item: { id: number, balanceDate: Date }): Promise<void> {
    this.logger.warn(`Double transaction_links ${item.id} found.`)
  }
}
