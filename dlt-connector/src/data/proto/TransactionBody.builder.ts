import { Account } from '@entity/Account'
import { Community } from '@entity/Community'

import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { LogError } from '@/server/LogError'

import { CommunityRoot } from './3_3/CommunityRoot'
import { CrossGroupType } from './3_3/enum/CrossGroupType'
import { GradidoCreation } from './3_3/GradidoCreation'
import { GradidoTransfer } from './3_3/GradidoTransfer'
import { TransactionBody } from './3_3/TransactionBody'

export class TransactionBodyBuilder {
  private signingAccount?: Account
  private recipientAccount?: Account
  private body: TransactionBody | undefined

  // https://refactoring.guru/design-patterns/builder/typescript/example
  /**
   * A fresh builder instance should contain a blank product object, which is
   * used in further assembly.
   */
  constructor() {
    this.reset()
  }

  public reset(): void {
    this.body = undefined
    this.signingAccount = undefined
    this.recipientAccount = undefined
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
  public build(): TransactionBody {
    const result = this.getTransactionBody()
    this.reset()
    return result
  }

  public getTransactionBody(): TransactionBody {
    if (!this.body) {
      throw new LogError(
        'cannot build Transaction Body, missing information, please call at least fromTransactionDraft or fromCommunityDraft',
      )
    }
    return this.body
  }

  public getSigningAccount(): Account | undefined {
    return this.signingAccount
  }

  public getRecipientAccount(): Account | undefined {
    return this.recipientAccount
  }

  public setSigningAccount(signingAccount: Account): TransactionBodyBuilder {
    this.signingAccount = signingAccount
    return this
  }

  public setRecipientAccount(recipientAccount: Account): TransactionBodyBuilder {
    this.recipientAccount = recipientAccount
    return this
  }

  public setCrossGroupType(type: CrossGroupType): this {
    if (!this.body) {
      throw new LogError(
        'body is undefined, please call fromTransactionDraft or fromCommunityDraft before',
      )
    }
    this.body.type = type
    return this
  }

  public setOtherGroup(otherGroup: string): this {
    if (!this.body) {
      throw new LogError(
        'body is undefined, please call fromTransactionDraft or fromCommunityDraft before',
      )
    }
    this.body.otherGroup = otherGroup
    return this
  }

  public fromTransactionDraft(transactionDraft: TransactionDraft): TransactionBodyBuilder {
    this.body = new TransactionBody(transactionDraft)
    // TODO: load pubkeys for sender and recipient user from db
    switch (transactionDraft.type) {
      case InputTransactionType.CREATION:
        if (!this.recipientAccount) {
          throw new LogError('missing recipient account for creation transaction!')
        }
        this.body.creation = new GradidoCreation(transactionDraft, this.recipientAccount)
        this.body.data = 'gradidoCreation'
        break
      case InputTransactionType.SEND:
      case InputTransactionType.RECEIVE:
        if (!this.recipientAccount || !this.signingAccount) {
          throw new LogError('missing signing and/or recipient account for transfer transaction!')
        }
        this.body.transfer = new GradidoTransfer(
          transactionDraft,
          this.signingAccount,
          this.recipientAccount,
        )
        this.body.data = 'gradidoTransfer'
        break
    }
    return this
  }

  public fromCommunityDraft(
    communityDraft: CommunityDraft,
    community: Community,
  ): TransactionBodyBuilder {
    this.body = new TransactionBody(communityDraft)
    this.body.communityRoot = new CommunityRoot(community)
    this.body.data = 'communityRoot'
    return this
  }
}
