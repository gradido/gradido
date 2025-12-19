import { InputTransactionType } from '../../../../data/InputTransactionType.enum'
import { Transaction } from '../../../../schemas/transaction.schema'
import { Context } from '../../Context'
import { TransactionDb } from '../../valibot.schema'
import { AbstractBalancesRole } from './AbstractBalances.role'
import { CreationBalancesRole } from './CreationBalances.role'

export function accountBalancesContext(transaction: Transaction, dbTransaction: TransactionDb, context: Context) {
    let role: AbstractBalancesRole | null = null
    if (InputTransactionType.GRADIDO_CREATION === transaction.type) {
        role = new CreationBalancesRole()
    }
}

/*
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
      */