import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'

import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { LogError } from '@/server/LogError'
import { bodyBytesToTransactionBody, transactionBodyToBodyBytes } from '@/utils/typeConverter'

import { AccountRepository } from './Account.repository'
import { BackendTransactionFactory } from './BackendTransaction.factory'
import { CommunityRepository } from './Community.repository'
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

  public getOtherCommunity(): Community | undefined {
    return this.transaction.otherCommunity
  }

  public setSigningAccount(signingAccount: Account): TransactionBuilder {
    this.transaction.signingAccount = signingAccount
    return this
  }

  public setRecipientAccount(recipientAccount: Account): TransactionBuilder {
    this.transaction.recipientAccount = recipientAccount
    return this
  }

  public setCommunity(community: Community): TransactionBuilder {
    this.transaction.community = community
    return this
  }

  public setOtherCommunity(otherCommunity?: Community): TransactionBuilder {
    if (!this.transaction.community) {
      throw new LogError('Please set community first!')
    }

    this.transaction.otherCommunity =
      otherCommunity &&
      this.transaction.community &&
      this.transaction.community.id !== otherCommunity.id
        ? otherCommunity
        : undefined
    return this
  }

  public setSignature(signature: Buffer): TransactionBuilder {
    this.transaction.signature = signature
    return this
  }

  public addBackendTransaction(transactionDraft: TransactionDraft): TransactionBuilder {
    if (!this.transaction.backendTransactions) {
      this.transaction.backendTransactions = []
    }
    this.transaction.backendTransactions.push(
      BackendTransactionFactory.createFromTransactionDraft(transactionDraft),
    )
    return this
  }

  public async setCommunityFromUser(user: UserIdentifier): Promise<TransactionBuilder> {
    // get sender community
    const community = await CommunityRepository.getCommunityForUserIdentifier(user)
    if (!community) {
      throw new LogError("couldn't find community for transaction")
    }
    return this.setCommunity(community)
  }

  public async setOtherCommunityFromUser(user: UserIdentifier): Promise<TransactionBuilder> {
    // get recipient community
    const otherCommunity = await CommunityRepository.getCommunityForUserIdentifier(user)
    return this.setOtherCommunity(otherCommunity)
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
    this.transaction.signingAccount ??= await AccountRepository.findAccountByPublicKey(
      firstSigPair.pubKey,
    )
    this.transaction.recipientAccount ??= await AccountRepository.findAccountByPublicKey(
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
