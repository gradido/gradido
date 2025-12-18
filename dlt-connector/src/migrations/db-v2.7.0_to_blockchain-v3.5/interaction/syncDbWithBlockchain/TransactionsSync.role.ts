import Decimal from 'decimal.js-light'
import { AccountBalance, AccountBalances, GradidoUnit } from 'gradido-blockchain-js'
import { InputTransactionType } from '../../../../data/InputTransactionType.enum'
import { KeyPairIdentifierLogic } from '../../../../data/KeyPairIdentifier.logic'
import { GradidoBlockchainCryptoError } from '../../../../errors'
import { ResolveKeyPair } from '../../../../interactions/resolveKeyPair/ResolveKeyPair.context'
import { AUF_ACCOUNT_DERIVATION_INDEX, GMW_ACCOUNT_DERIVATION_INDEX, hardenDerivationIndex } from '../../../../utils/derivationHelper'
import { addTransaction } from '../../blockchain'
import { transactionDbToTransaction } from '../../convert'
import { loadTransactions } from '../../database'
import { legacyCalculateDecay } from '../../utils'
import { TransactionDb } from '../../valibot.schema'
import { AbstractSyncRole } from './AbstractSync.role'

type BalanceDate = {
  balance: Decimal
  date: Date
}

export class TransactionsSyncRole extends AbstractSyncRole<TransactionDb> {
  private static transactionLinkCodes = new Set<string>()
  static doubleTransactionLinkCodes: string[] = []
  static gmwBalance: BalanceDate | undefined = undefined
  static aufBalance: BalanceDate | undefined = undefined

  getDate(): Date {
    return this.peek().balanceDate
  }

  itemTypeName(): string {
    return 'transactions'
  }

  async loadFromDb(offset: number, count: number): Promise<TransactionDb[]> {
    const result = await loadTransactions(this.context.db, offset, count)
    return result.filter((item) => {
      if (item.transactionLinkCode) {
        if (TransactionsSyncRole.transactionLinkCodes.has(item.transactionLinkCode)) {
          TransactionsSyncRole.doubleTransactionLinkCodes.push(item.transactionLinkCode)
          return false
        }
        TransactionsSyncRole.transactionLinkCodes.add(item.transactionLinkCode)
      }
      return true
    })
  }

  updateGmwAuf(amount: Decimal, date: Date) {
    if(!TransactionsSyncRole.gmwBalance) {
      TransactionsSyncRole.gmwBalance = { balance: amount, date }
    } else {
      const oldGmwBalanceDate = TransactionsSyncRole.gmwBalance
      const newBalance = legacyCalculateDecay(oldGmwBalanceDate.balance, oldGmwBalanceDate.date, date )
      TransactionsSyncRole.gmwBalance = { balance: newBalance, date }
    }
    if(!TransactionsSyncRole.aufBalance) {
      TransactionsSyncRole.aufBalance = { balance: amount, date }
    } else {
      const oldAufBalanceDate = TransactionsSyncRole.aufBalance
      const newBalance = legacyCalculateDecay(oldAufBalanceDate.balance, oldAufBalanceDate.date, date )
      TransactionsSyncRole.aufBalance = { balance: newBalance, date }
    }
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
    const accountBalances = new AccountBalances()
    if (InputTransactionType.GRADIDO_CREATION === transaction.type) {
      const recipientKeyPair = await ResolveKeyPair(
        new KeyPairIdentifierLogic(transaction.linkedUser!),
      )
      accountBalances.add(new AccountBalance(recipientKeyPair.getPublicKey(), item.balance, ''))
      // update gmw and auf
      this.updateGmwAuf(new Decimal(item.amount.toString(4)), item.balanceDate)
      const communityKeyPair = await ResolveKeyPair(new KeyPairIdentifierLogic({ communityTopicId: senderCommunityContext.topicId }))
      const gmwKeyPair = communityKeyPair.deriveChild(
        hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX),
      )
      if (!gmwKeyPair) {
        throw new GradidoBlockchainCryptoError(
          `KeyPairEd25519 child derivation failed, has private key: ${communityKeyPair.hasPrivateKey()} for community: ${senderCommunityContext.communityId}`,
        )
      }
      const aufKeyPair = communityKeyPair.deriveChild(
        hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
      )
      if (!aufKeyPair) {
        throw new GradidoBlockchainCryptoError(
          `KeyPairEd25519 child derivation failed, has private key: ${communityKeyPair.hasPrivateKey()} for community: ${senderCommunityContext.communityId}`,
        )
      }
      accountBalances.add(new AccountBalance(gmwKeyPair.getPublicKey(), GradidoUnit.fromString(
        TransactionsSyncRole.gmwBalance!.balance.toString()), ''))
      accountBalances.add(new AccountBalance(aufKeyPair.getPublicKey(), GradidoUnit.fromString(
        TransactionsSyncRole.aufBalance!.balance.toString()), ''))
    } else if (InputTransactionType.REGISTER_ADDRESS === transaction.type) {
      const recipientKeyPair = await ResolveKeyPair(
        new KeyPairIdentifierLogic(transaction.user),
      )
      accountBalances.add(new AccountBalance(recipientKeyPair.getPublicKey(), GradidoUnit.zero(), ''))
    } else {
      // I use the receiving part of transaction pair, so the user is the recipient and the linked user the sender
      const senderKeyPair = await ResolveKeyPair(
        new KeyPairIdentifierLogic(transaction.linkedUser!),
      )
      const recipientKeyPair = await ResolveKeyPair(
        new KeyPairIdentifierLogic(transaction.user),
      )
      accountBalances.add(new AccountBalance(senderKeyPair.getPublicKey(), item.linkedUserBalance, ''))
      accountBalances.add(new AccountBalance(recipientKeyPair.getPublicKey(), item.balance, ''))
    }
    
    try {
      await addTransaction(
        senderCommunityContext.blockchain,
        recipientCommunityContext.blockchain,
        transaction,
        item.id,
        accountBalances,
      )
    } catch(e) {
      this.context.logger.error(`error adding transaction: ${JSON.stringify(transaction, null, 2)}`)
      throw e
    }
  }
}
