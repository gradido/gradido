import { Transaction } from '@entity/Transaction'

import { AccountLogic } from '@/data/Account.logic'
import { CommunityRepository } from '@/data/Community.repository'
import { KeyPair } from '@/data/KeyPair'
import { TransactionBodyBuilder } from '@/data/proto/TransactionBody.builder'
import { TransactionBuilder } from '@/data/Transaction.builder'
import { UserRepository } from '@/data/User.repository'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { logger } from '@/logging/logger'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { LogError } from '@/server/LogError'

export class TransactionRecipeRole {
  protected transactionBuilder: TransactionBuilder

  public constructor() {
    this.transactionBuilder = new TransactionBuilder()
  }

  public async create(transactionDraft: TransactionDraft): Promise<TransactionRecipeRole> {
    logger.debug('start creating transaction receipt')
    const senderUser = transactionDraft.senderUser
    const recipientUser = transactionDraft.recipientUser

    // loading signing and recipient account
    // TODO: look for ways to use only one db call for both
    const signingAccount = await UserRepository.findAccountByUserIdentifier(senderUser)
    if (!signingAccount) {
      throw new TransactionError(
        TransactionErrorType.NOT_FOUND,
        "couldn't found sender user account in db",
      )
    }
    const recipientAccount = await UserRepository.findAccountByUserIdentifier(recipientUser)
    if (!recipientAccount) {
      throw new TransactionError(
        TransactionErrorType.NOT_FOUND,
        "couldn't found recipient user account in db",
      )
    }
    // create proto transaction body
    const transactionBodyBuilder = new TransactionBodyBuilder()
      .setSigningAccount(signingAccount)
      .setRecipientAccount(recipientAccount)
      .fromTransactionDraft(transactionDraft)

    const community = await CommunityRepository.findByCommunityUuid(senderUser.communityUuid)
    if (!community) {
      throw new LogError('cannot find community', {
        communityUUID: senderUser.communityUuid,
      })
    }

    this.transactionBuilder
      .fromTransactionBodyBuilder(transactionBodyBuilder)
      .addBackendTransaction(transactionDraft)
      .setCommunity(community)

    if (recipientUser.communityUuid && recipientUser.communityUuid !== senderUser.communityUuid) {
      const otherCommunity = await CommunityRepository.findByCommunityUuid(
        recipientUser.communityUuid,
      )
      if (!otherCommunity) {
        throw new LogError('cannot find community', {
          communityUUID: recipientUser.communityUuid,
        })
      }
      this.transactionBuilder.setOtherCommunity(otherCommunity)
    }
    const transaction = this.transactionBuilder.getTransaction()
    // sign
    const accountLogic = new AccountLogic(signingAccount)
    const keyPair = accountLogic.getKeyPair(new KeyPair(this.transactionBuilder.getCommunity()))
    if (!keyPair) {
      throw new LogError('cannot generate key pair, belong user to home community?')
    }
    const signature = keyPair.sign(transaction.bodyBytes)
    logger.debug('sign transaction', {
      signature: signature.toString('hex'),
      publicKey: keyPair.publicKey.toString('hex'),
      bodyBytes: transaction.bodyBytes.toString('hex'),
    })

    this.transactionBuilder.setSignature(signature)

    logger.debug('create transaction receipt', new TransactionLoggingView(transaction))
    return this
  }

  public getTransaction(): Transaction {
    return this.transactionBuilder.getTransaction()
  }
}
