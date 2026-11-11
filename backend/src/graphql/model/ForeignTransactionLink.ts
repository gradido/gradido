import { TransactionLinkWire } from 'core'
import { GradidoUnit } from 'shared'
import { Field, ObjectType } from 'type-graphql'

import { Community } from './Community'
import { ThankYouGreeting } from './ThankYouGreeting'
import { User } from './User'

/**
 * A link of another community, as that community answered it for whoever holds the code
 * (peer-api transactionLink): what the page of a link shows, read the same way as a link of
 * this community (TransactionLink).
 */
@ObjectType()
export class ForeignTransactionLink {
  constructor(wire: TransactionLinkWire, code: string, senderCommunity: Community) {
    this.senderCommunity = senderCommunity
    this.senderUser = new User(null)
    this.senderUser.gradidoID = wire.sender.gradidoId
    this.senderUser.alias = wire.sender.alias
    this.amount = wire.amount
    this.memo = wire.memo
    this.code = code
    this.createdAt = wire.createdAt
    this.validUntil = wire.validUntil
    this.redeemedAt = wire.redeemedAt
    this.deletedAt = wire.deletedAt
    this.greeting = wire.greeting ? new ThankYouGreeting(wire.greeting) : null
    this.senderAvatar = wire.senderAvatar
    this.picture = wire.picture
  }

  @Field(() => Community)
  senderCommunity: Community

  @Field(() => User)
  senderUser: User

  @Field(() => GradidoUnit)
  amount: GradidoUnit

  @Field(() => String)
  memo: string

  @Field(() => String)
  code: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  validUntil: Date

  @Field(() => Date, { nullable: true })
  redeemedAt: Date | null

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  @Field(() => ThankYouGreeting, { nullable: true })
  greeting: ThankYouGreeting | null

  /** The face of the member who made the link, base64, as TransactionLink.senderAvatar. */
  @Field(() => String, { nullable: true })
  senderAvatar: string | null

  /**
   * The photo of a greeting that carries one, base64: the other community's wallet address of it
   * (/api/thank-you-greeting-picture) is not one this wallet may show.
   */
  @Field(() => String, { nullable: true })
  picture: string | null
}
