import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'

import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { LogError } from '@/server/LogError'
import { sign } from '@/utils/cryptoHelper'
import { bodyBytesToTransactionBody, transactionBodyToBodyBytes } from '@/utils/typeConverter'

import { AccountRepository } from './Account.repository'
import { CommunityRepository } from './Community.repository'
import { KeyPair } from './KeyPair'
import { TransactionBodyBuilder } from './proto/TransactionBody.builder'

export class TransactionBuilder {
  private transaction: Transaction

  // https://refactoring.guru/design-patterns/builder/typescript/example
  /**
   * A fresh builder instance should contain a blank product object, which is
   * used in further assembly.
   */
  constructor() {
    this.reset()
  }

  public reset(): void {
    this.transaction = Transaction.create()
  }

  /**
   * Concrete Builders are supposed to provide their own methods for
   * retrieving results. That's because various types of builders may create
   * entirely different products that don't follow the same interface.
   * Therefore, such methods cannot be declared in the base Builder interface
   * (at least in a statically typed programming language).
   *
   * Usually, after returning the end result to the client, a builder instance
   * is expected to be ready to start producing another product. That's why
   * it's a usual practice to call the reset method at the end of the
   * `getProduct` method body. However, this behavior is not mandatory, and
   * you can make your builders wait for an explicit reset call from the
   * client code before disposing of the previous result.
   */
  public build(): Transaction {
    const result = this.transaction
    this.reset()
    return result
  }

  // return transaction without calling reset
  public getTransaction(): Transaction {
    return this.transaction
  }

  public getSenderCommunity(): Community {
    return this.transaction.senderCommunity
  }

  public setSigningAccount(signingAccount: Account): TransactionBuilder {
    this.transaction.signingAccount = signingAccount
    return this
  }

  public setRecipientAccount(recipientAccount: Account): TransactionBuilder {
    this.transaction.recipientAccount = recipientAccount
    return this
  }

  public setSenderCommunity(senderCommunity: Community): TransactionBuilder {
    this.transaction.senderCommunity = senderCommunity
    return this
  }

  public setRecipientCommunity(recipientCommunity?: Community): TransactionBuilder {
    if (!this.transaction.senderCommunity) {
      throw new LogError('Please set sender community first!')
    }

    this.transaction.recipientCommunity =
      recipientCommunity &&
      this.transaction.senderCommunity &&
      this.transaction.senderCommunity.id !== recipientCommunity.id
        ? recipientCommunity
        : undefined
    return this
  }

  public setSignature(signature: Buffer): TransactionBuilder {
    this.transaction.signature = signature
    return this
  }

  public sign(keyPair: KeyPair): TransactionBuilder {
    if (!this.transaction.bodyBytes || this.transaction.bodyBytes.length === 0) {
      throw new LogError('body bytes is empty')
    }
    this.transaction.signature = sign(this.transaction.bodyBytes, keyPair)
    return this
  }

  public setBackendTransactionId(backendTransactionId: number): TransactionBuilder {
    this.transaction.backendTransactionId = backendTransactionId
    return this
  }

  public async setSenderCommunityFromSenderUser(
    senderUser: UserIdentifier,
  ): Promise<TransactionBuilder> {
    // get sender community
    const senderCommunity = await CommunityRepository.getCommunityForUserIdentifier(senderUser)
    if (!senderCommunity) {
      throw new LogError("couldn't find sender community for transaction")
    }
    return this.setSenderCommunity(senderCommunity)
  }

  public async setRecipientCommunityFromRecipientUser(
    recipientUser: UserIdentifier,
  ): Promise<TransactionBuilder> {
    // get recipient community
    const recipientCommunity = await CommunityRepository.getCommunityForUserIdentifier(
      recipientUser,
    )
    return this.setRecipientCommunity(recipientCommunity)
  }

  public async fromGradidoTransactionSearchForAccounts(
    gradidoTransaction: GradidoTransaction,
  ): Promise<TransactionBuilder> {
    this.transaction.bodyBytes = Buffer.from(gradidoTransaction.bodyBytes)
    const transactionBody = bodyBytesToTransactionBody(this.transaction.bodyBytes)
    this.fromTransactionBody(transactionBody)

    const firstSigPair = gradidoTransaction.getFirstSignature()
    // TODO: adapt if transactions with more than one signatures where added

    // get recipient and signer accounts if not already set
    this.transaction.signingAccount ??= await AccountRepository.findByPublicKey(firstSigPair.pubKey)
    this.transaction.recipientAccount ??= await AccountRepository.findByPublicKey(
      transactionBody.getRecipientPublicKey(),
    )
    this.transaction.signature = Buffer.from(firstSigPair.signature)

    return this
  }

  public fromGradidoTransaction(gradidoTransaction: GradidoTransaction): TransactionBuilder {
    this.transaction.bodyBytes = Buffer.from(gradidoTransaction.bodyBytes)
    const transactionBody = bodyBytesToTransactionBody(this.transaction.bodyBytes)
    this.fromTransactionBody(transactionBody)

    const firstSigPair = gradidoTransaction.getFirstSignature()
    // TODO: adapt if transactions with more than one signatures where added
    this.transaction.signature = Buffer.from(firstSigPair.signature)

    return this
  }

  public fromTransactionBody(transactionBody: TransactionBody): TransactionBuilder {
    transactionBody.fillTransactionRecipe(this.transaction)
    this.transaction.bodyBytes ??= transactionBodyToBodyBytes(transactionBody)
    return this
  }

  public fromTransactionBodyBuilder(
    transactionBodyBuilder: TransactionBodyBuilder,
  ): TransactionBuilder {
    const signingAccount = transactionBodyBuilder.getSigningAccount()
    if (signingAccount) {
      this.setSigningAccount(signingAccount)
    }
    const recipientAccount = transactionBodyBuilder.getRecipientAccount()
    if (recipientAccount) {
      this.setRecipientAccount(recipientAccount)
    }
    this.fromTransactionBody(transactionBodyBuilder.getTransactionBody())
    return this
  }
}
