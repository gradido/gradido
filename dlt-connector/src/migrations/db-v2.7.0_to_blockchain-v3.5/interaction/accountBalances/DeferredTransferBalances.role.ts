import { AccountBalance, AccountBalances, GradidoUnit } from 'gradido-blockchain-js'
import { KeyPairIdentifierLogic } from '../../../../data/KeyPairIdentifier.logic'
import { ResolveKeyPair } from '../../../../interactions/resolveKeyPair/ResolveKeyPair.context'
import { Transaction } from '../../../../schemas/transaction.schema'
import { Context } from '../../Context'
import { TransactionLinkDb } from '../../valibot.schema'
import { AbstractBalancesRole } from './AbstractBalances.role'


export class DeferredTransferBalancesRole extends AbstractBalancesRole  {
  constructor(transaction: Transaction, protected dbTransactionLink: TransactionLinkDb) {
    super(transaction)
  }

  async getAccountBalances(context: Context): Promise<AccountBalances> {
    const senderCommunityContext = context.getCommunityContextByUuid(this.dbTransactionLink.user.communityUuid)
    const accountBalances = new AccountBalances()

    const seededIdentifier = new KeyPairIdentifierLogic(this.transaction.linkedUser!)
    if (!seededIdentifier.isSeedKeyPair()) {
      throw new Error(`linked user is not a seed: ${JSON.stringify(this.transaction, null, 2)}`)
    }
    const seedKeyPair = await ResolveKeyPair(seededIdentifier)    
    const senderAccountBalance = await this.getLastBalanceForUser(this.transaction.user, senderCommunityContext.blockchain)

    let amount = GradidoUnit.fromString(this.dbTransactionLink.amount.toString())
    amount = amount.calculateCompoundInterest((this.dbTransactionLink.validUntil.getTime() - this.dbTransactionLink.createdAt.getTime()) / 60000)
    senderAccountBalance.updateLegacyDecay(amount.negated(), this.dbTransactionLink.createdAt)
    accountBalances.add(senderAccountBalance.getAccountBalance())
    accountBalances.add(new AccountBalance(seedKeyPair.getPublicKey(), amount, ''))    
    return accountBalances
  }
}