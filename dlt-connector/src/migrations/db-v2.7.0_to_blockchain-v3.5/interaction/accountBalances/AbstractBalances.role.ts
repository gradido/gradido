import { AccountBalances, Filter, InMemoryBlockchain, SearchDirection_DESC } from 'gradido-blockchain-js'
import { KeyPairIdentifierLogic } from '../../../../data/KeyPairIdentifier.logic'
import { ResolveKeyPair } from '../../../../interactions/resolveKeyPair/ResolveKeyPair.context'
import { IdentifierAccount } from '../../../../schemas/account.schema'
import { Transaction } from '../../../../schemas/transaction.schema'
import { Context } from '../../Context'
import { Balance } from '../../data/Balance'

export abstract class AbstractBalancesRole {
  public constructor(protected transaction: Transaction) {}

  abstract getAccountBalances(context: Context): Promise<AccountBalances>

  async getLastBalanceForUser(identifierAccount: IdentifierAccount, blockchain: InMemoryBlockchain): Promise<Balance> {
    const userKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic(identifierAccount),
    )
    const f = new Filter()
    f.involvedPublicKey = userKeyPair.getPublicKey()
    f.pagination.size = 1
    f.searchDirection = SearchDirection_DESC
    const lastSenderTransaction = blockchain.findOne(f)
    if (!lastSenderTransaction) {
      throw new Error(`no last transaction found for user: ${JSON.stringify(identifierAccount, null, 2)}`)
    }
    const lastConfirmedTransaction = lastSenderTransaction.getConfirmedTransaction()
    if (!lastConfirmedTransaction) {
      throw new Error(`invalid transaction, getConfirmedTransaction call failed for transaction nr: ${lastSenderTransaction.getTransactionNr()}`)
    }
    const senderLastAccountBalance = lastConfirmedTransaction.getAccountBalance(userKeyPair.getPublicKey(), '')
    if (!senderLastAccountBalance) {
      throw new Error(
        `no sender account balance found for transaction nr: ${lastSenderTransaction.getTransactionNr()} and public key: ${userKeyPair.getPublicKey()?.convertToHex()}`
      )
    }
    return Balance.fromAccountBalance(senderLastAccountBalance, lastConfirmedTransaction.getConfirmedAt().getDate())
  }
}