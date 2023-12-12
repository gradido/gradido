import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { TransactionsManager } from '@/controller/TransactionsManager'
import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { logger } from '@/logging/logger'
import { LogError } from '@/server/LogError'
import { sign } from '@/utils/cryptoHelper'
import {
  bodyBytesToTransactionBody,
  timestampSecondsToDate,
  transactionBodyToBodyBytes,
} from '@/utils/typeConverter'

import { AccountRepository } from './Account.repository'
import { KeyPair } from './KeyPair'
import { ConfirmedTransaction } from './proto/3_3/ConfirmedTransaction'
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

  public getCommunity(): Community {
    return this.transaction.community
  }

  public setSigningAccount(signingAccount: Account): this {
    this.transaction.signingAccount = signingAccount
    return this
  }

  public setRecipientAccount(recipientAccount: Account): this {
    this.transaction.recipientAccount = recipientAccount
    return this
  }

  public setCommunity(community: Community): this {
    this.transaction.community = community
    if (community.id) {
      this.transaction.communityId = community.id
    }
    return this
  }

  public setHomeCommunityAsCommunity(): this {
    const homeCommunity = TransactionsManager.getInstance().getHomeCommunity()
    this.transaction.community = homeCommunity
    if (homeCommunity.id) {
      this.transaction.communityId = homeCommunity.id
    }
    return this
  }

  public setOtherCommunity(otherCommunity?: Community): this {
    if (!this.transaction.community) {
      throw new LogError('Please set community first!')
    }

    this.transaction.otherCommunity =
      otherCommunity &&
      this.transaction.community &&
      this.transaction.community.id !== otherCommunity.id
        ? otherCommunity
        : undefined
    if (this.transaction.otherCommunity && this.transaction.otherCommunity.id) {
      this.transaction.otherCommunityId = this.transaction.otherCommunity.id
    }
    return this
  }

  public setSignature(signature: Buffer): this {
    this.transaction.signature = signature
    return this
  }

  public sign(keyPair: KeyPair): this {
    if (!this.transaction.bodyBytes || this.transaction.bodyBytes.length === 0) {
      throw new LogError('body bytes is empty')
    }
    this.transaction.signature = sign(this.transaction.bodyBytes, keyPair)
    return this
  }

  public setBackendTransactionId(backendTransactionId: number): this {
    this.transaction.backendTransactionId = backendTransactionId
    return this
  }

  public async fromGradidoTransactionSearchForAccounts(
    gradidoTransaction: GradidoTransaction,
  ): Promise<this> {
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
    if (transactionBody.creation && this.transaction.recipientAccount) {
      logger.error(
        'missing recipient account',
        transactionBody.getRecipientPublicKey()?.toString('hex'),
      )
    }
    this.transaction.signature = Buffer.from(firstSigPair.signature)

    return this
  }

  public fromGradidoTransaction(gradidoTransaction: GradidoTransaction): this {
    this.transaction.bodyBytes = Buffer.from(gradidoTransaction.bodyBytes)
    const transactionBody = bodyBytesToTransactionBody(this.transaction.bodyBytes)
    this.fromTransactionBody(transactionBody)

    const firstSigPair = gradidoTransaction.getFirstSignature()
    // TODO: adapt if transactions with more than one signatures where added
    this.transaction.signature = Buffer.from(firstSigPair.signature)

    return this
  }

  public fromTransactionBody(transactionBody: TransactionBody): this {
    transactionBody.fillTransactionRecipe(this.transaction)
    this.transaction.bodyBytes ??= transactionBodyToBodyBytes(transactionBody)
    return this
  }

  public fromConfirmedTransaction(confirmedTransaction: ConfirmedTransaction): this {
    this.transaction.runningHash = confirmedTransaction.runningHash
    this.transaction.nr = confirmedTransaction.id.toNumber()
    if (confirmedTransaction.id.comp(this.transaction.nr) !== 0) {
      throw new LogError(
        "datatype overflow, number isn't enough for transaction nr",
        confirmedTransaction.id.toString(),
      )
    }
    this.transaction.accountBalanceConfirmedAt = new Decimal(confirmedTransaction.accountBalance)
    this.transaction.confirmedAt = timestampSecondsToDate(confirmedTransaction.confirmedAt)
    return this
  }

  public fromTransactionBodyBuilder(transactionBodyBuilder: TransactionBodyBuilder): this {
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
