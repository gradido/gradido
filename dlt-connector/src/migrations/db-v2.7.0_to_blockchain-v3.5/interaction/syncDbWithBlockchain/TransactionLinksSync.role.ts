import { AccountBalance, AccountBalances, Filter, MemoryBlockPtr, SearchDirection_DESC } from 'gradido-blockchain-js'
import { KeyPairIdentifierLogic } from '../../../../data/KeyPairIdentifier.logic'
import { ResolveKeyPair } from '../../../../interactions/resolveKeyPair/ResolveKeyPair.context'
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
    // I use the receiving part of transaction pair, so the user is the recipient and the linked user the sender
    const accountBalances = new AccountBalances()
    const senderKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic(transaction.user),
    )
    const recipientKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic(transaction.linkedUser!),
    )
    const f = new Filter()
    f.involvedPublicKey = senderKeyPair.getPublicKey()
    f.pagination.size = 1
    f.searchDirection = SearchDirection_DESC
    communityContext.blockchain.findOne(f)
    accountBalances.add(new AccountBalance(senderKeyPair.getPublicKey(), item.linkedUserBalance, ''))
    accountBalances.add(new AccountBalance(recipientKeyPair.getPublicKey(), item.amount, ''))
    

    await addTransaction(communityContext.blockchain, communityContext.blockchain, transaction, item.id, accountBalances)
  }
}
