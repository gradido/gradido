import { TransactionBody } from './3_3/TransactionBody'
import { Account } from '@entity/Account'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { GradidoCreation } from './3_3/GradidoCreation'
import { GradidoTransfer } from './3_3/GradidoTransfer'
import { Community } from '@entity/Community'
import { CommunityRoot } from './3_3/CommunityRoot'
import { LogError } from '@/server/LogError'

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
    const result = this.body
    if (!result) {
      throw new LogError(
        'cannot build Transaction Body, missing information, please call at least fromTransactionDraft or fromCommunityDraft',
      )
    }
    this.reset()
    return result
  }

  public setSigningAccount(signingAccount: Account): TransactionBodyBuilder {
    this.signingAccount = signingAccount
    return this
  }

  public setRecipientAccount(recipientAccount: Account): TransactionBodyBuilder {
    this.recipientAccount = recipientAccount
    return this
  }

  public fromTransactionDraft(transactionDraft: TransactionDraft): TransactionBodyBuilder {
    this.body = new TransactionBody(transactionDraft)
    // TODO: load pubkeys for sender and recipient user from db
    switch (transactionDraft.type) {
      case InputTransactionType.CREATION:
        this.body.creation = new GradidoCreation(transactionDraft, this.recipientAccount)
        this.body.data = 'gradidoCreation'
        break
      case InputTransactionType.SEND:
      case InputTransactionType.RECEIVE:
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
