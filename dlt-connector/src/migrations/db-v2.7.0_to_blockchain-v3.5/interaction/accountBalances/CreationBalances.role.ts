import { AccountBalances } from 'gradido-blockchain-js'
import { Transaction } from '../../../../schemas/transaction.schema'
import { Context } from '../../Context'
import { TransactionDb } from '../../valibot.schema'
import { AbstractBalancesRole } from './AbstractBalances.role'

export class CreationBalancesRole extends AbstractBalancesRole  {

  constructor(transaction: Transaction, protected dbTransaction: TransactionDb) {
    super(transaction)
  }
  
  async getAccountBalances(context: Context): Promise<AccountBalances> {
    if (this.dbTransaction.linkedUser.communityUuid !== this.dbTransaction.user.communityUuid) {
      throw new Error('creation: both recipient and signer must belong to same community')
    }

    const accountBalances = new AccountBalances()
    const communityContext = context.getCommunityContextByUuid(this.dbTransaction.user.communityUuid)
    const balance = await this.getLastBalanceForUser(this.transaction.user, communityContext.blockchain)

    // calculate decay since last balance with legacy calculation method
    balance.updateLegacyDecay(this.dbTransaction.amount, this.dbTransaction.balanceDate)
    communityContext.aufBalance.updateLegacyDecay(this.dbTransaction.amount, this.dbTransaction.balanceDate)
    communityContext.gmwBalance.updateLegacyDecay(this.dbTransaction.amount, this.dbTransaction.balanceDate)

    accountBalances.add(balance.getAccountBalance())
    accountBalances.add(communityContext.aufBalance.getAccountBalance())
    accountBalances.add(communityContext.gmwBalance.getAccountBalance())

    return accountBalances
  } 
}
