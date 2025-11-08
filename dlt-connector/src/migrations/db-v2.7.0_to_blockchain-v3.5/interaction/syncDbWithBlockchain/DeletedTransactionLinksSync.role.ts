import { loadDeletedTransactionLinks } from '../../database'
import { TransactionsSyncRole } from './TransactionsSync.role'
import { TransactionDb } from '../../valibot.schema'

export class DeletedTransactionLinksSyncRole extends TransactionsSyncRole {
  itemTypeName(): string {
    return 'deletedTransactionLinks'
  }

  async loadFromDb(offset: number, count: number): Promise<TransactionDb[]> {
    return await loadDeletedTransactionLinks(this.context.db, offset, count)
  }
}