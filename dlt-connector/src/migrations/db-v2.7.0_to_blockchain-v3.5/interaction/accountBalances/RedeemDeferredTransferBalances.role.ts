import { AccountBalances } from 'gradido-blockchain-js'
import { Transaction } from '../../../../schemas/transaction.schema'
import { Context } from '../../Context'
import { TransactionDb } from '../../valibot.schema'
import { AbstractBalancesRole } from './AbstractBalances.role'

export class RedeemDeferredTransferBalancesRole extends AbstractBalancesRole  {
  constructor(transaction: Transaction, protected dbTransaction: TransactionDb) {
    super(transaction)
  }

  async getAccountBalances(context: Context): Promise<AccountBalances> {
    // I use the receiving part of transaction pair, so the user is the recipient and the linked user the sender and amount is positive
    const senderCommunityContext = context.getCommunityContextByUuid(this.dbTransaction.linkedUser.communityUuid)
    const recipientCommunityContext = context.getCommunityContextByUuid(this.dbTransaction.user.communityUuid)
    const accountBalances = new AccountBalances()
    
    context.cache.setHomeCommunityTopicId(senderCommunityContext.topicId)
    const senderLastBalance = await this.getLastBalanceForUser(this.transaction.linkedUser!, senderCommunityContext.blockchain)
    context.cache.setHomeCommunityTopicId(recipientCommunityContext.topicId)
    const recipientLastBalance = await this.getLastBalanceForUser(this.transaction.user, recipientCommunityContext.blockchain)

    senderLastBalance.updateLegacyDecay(this.dbTransaction.amount.negate(), this.dbTransaction.balanceDate)
    recipientLastBalance.updateLegacyDecay(this.dbTransaction.amount, this.dbTransaction.balanceDate)
    
    accountBalances.add(senderLastBalance.getAccountBalance())
    accountBalances.add(recipientLastBalance.getAccountBalance())
    return accountBalances
  }
}