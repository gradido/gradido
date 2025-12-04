import { loadDeletedTransactionLinks } from '../../database'
import { TransactionDb } from '../../valibot.schema'
import { TransactionsSyncRole } from './TransactionsSync.role'

export class DeletedTransactionLinksSyncRole extends TransactionsSyncRole {
  itemTypeName(): string {
    return 'deletedTransactionLinks'
  }

  async loadFromDb(offset: number, count: number): Promise<TransactionDb[]> {
    return await loadDeletedTransactionLinks(this.context.db, offset, count)
  }
}
