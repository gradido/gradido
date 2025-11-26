import { Decimal } from 'decimal.js-light'
import { RedeemJwtPayloadType } from 'shared'
import { Field, ObjectType } from 'type-graphql'

import { Community } from './Community'
import { User } from './User'

@ObjectType()
export class RedeemJwtLink {
  constructor(
    redeemJwtPayload: RedeemJwtPayloadType,
    senderCommunity: Community,
    senderUser: User,
    recipientCommunity: Community,
    recipientUser?: User,
  ) {
    this.senderCommunity = senderCommunity
    this.recipientCommunity = recipientCommunity
    this.senderUser = senderUser
    if (recipientUser !== undefined) {
      this.recipientUser = recipientUser
    } else {
      this.recipientUser = null
    }
    this.amount = new Decimal(redeemJwtPayload.amount)
    this.memo = redeemJwtPayload.memo
    this.code = redeemJwtPayload.redeemcode
    this.validUntil = new Date(redeemJwtPayload.validuntil)
  }

  @Field(() => Community)
  senderCommunity: Community

  @Field(() => User)
  senderUser: User

  @Field(() => Community)
  recipientCommunity: Community

  @Field(() => User, { nullable: true })
  recipientUser: User | null

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  code: string

  @Field(() => Date)
  validUntil: Date
}
