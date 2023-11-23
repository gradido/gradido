import { Contribution } from '@entity/Contribution'
import { ContributionMessage } from '@entity/ContributionMessage'
import { User } from '@entity/User'

import { ContributionMessageType } from '@/graphql/enum/ContributionMessageType'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ContributionMessageBuilder {
  private contributionMessage: ContributionMessage

  // https://refactoring.guru/design-patterns/builder/typescript/example
  /**
   * A fresh builder instance should contain a blank product object, which is
   * used in further assembly.
   */
  constructor() {
    this.reset()
  }

  public reset(): void {
    this.contributionMessage = ContributionMessage.create()
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
  public build(): ContributionMessage {
    const result = this.contributionMessage
    this.reset()
    return result
  }

  public setParentContribution(contribution: Contribution): this {
    this.contributionMessage.contributionId = contribution.id
    this.contributionMessage.contribution = contribution
    return this
  }

  /**
   * set contribution message type to history and create message from contribution
   * @param contribution
   * @returns ContributionMessageBuilder for chaining function calls
   */
  public setHistoryType(contribution: Contribution): this {
    const changeMessage = `${contribution.contributionDate.toString()}
    ---
    ${contribution.memo}
    ---
    ${contribution.amount.toString()}`
    this.contributionMessage.message = changeMessage
    this.contributionMessage.type = ContributionMessageType.HISTORY
    return this
  }

  public setUser(user: User): this {
    this.contributionMessage.user = user
    this.contributionMessage.userId = user.id
    return this
  }

  public setUserId(userId: number): this {
    this.contributionMessage.userId = userId
    return this
  }

  public setType(type: ContributionMessageType): this {
    this.contributionMessage.type = type
    return this
  }

  public setIsModerator(value: boolean): this {
    this.contributionMessage.isModerator = value
    return this
  }
}
