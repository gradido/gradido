import { addTransaction } from '../../blockchain'
import { transactionLinkDbToTransaction } from '../../convert'
import { loadTransactionLinks } from '../../database'
import { TransactionLinkDb } from '../../valibot.schema'
import { AbstractSyncRole } from './AbstractSync.role'

export class TransactionLinksSyncRole extends AbstractSyncRole<TransactionLinkDb> {
  getDate(): Date {
    return this.peek().createdAt
  }

  itemTypeName(): string {
    return 'transactionLinks'
  }

  async loadFromDb(offset: number, count: number): Promise<TransactionLinkDb[]> {
    return await loadTransactionLinks(this.context.db, offset, count)
  }

  async pushToBlockchain(item: TransactionLinkDb): Promise<void> {
    const communityContext = this.context.getCommunityContextByUuid(item.user.communityUuid)
    const transaction = transactionLinkDbToTransaction(item, communityContext.topicId)
    await addTransaction(communityContext.blockchain, communityContext.blockchain, transaction)
  }
}
