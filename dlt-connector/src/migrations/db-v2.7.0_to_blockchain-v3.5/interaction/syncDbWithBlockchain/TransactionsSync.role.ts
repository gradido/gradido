import { addTransaction } from '../../blockchain'
import { transactionDbToTransaction } from '../../convert'
import { loadTransactions } from '../../database'
import { TransactionDb } from '../../valibot.schema'
import { AbstractSyncRole } from './AbstractSync.role'

export class TransactionsSyncRole extends AbstractSyncRole<TransactionDb> {
  getDate(): Date {
    return this.peek().balanceDate
  }

  itemTypeName(): string {
    return 'transactions'
  }

  async loadFromDb(offset: number, count: number): Promise<TransactionDb[]> {
    return await loadTransactions(this.context.db, offset, count)
  }

  async pushToBlockchain(item: TransactionDb): Promise<void> {
    const senderCommunityContext = this.context.getCommunityContextByUuid(item.user.communityUuid)
    const recipientCommunityContext = this.context.getCommunityContextByUuid(
      item.linkedUser.communityUuid,
    )
    this.context.cache.setHomeCommunityTopicId(senderCommunityContext.topicId)
    const transaction = transactionDbToTransaction(
      item,
      senderCommunityContext.topicId,
      recipientCommunityContext.topicId,
    )
    await addTransaction(
      senderCommunityContext.blockchain,
      recipientCommunityContext.blockchain,
      transaction,
    )
  }
}
