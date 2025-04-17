import { Decimal } from 'decimal.js-light'
import { ObjectType, Field } from 'type-graphql'

import { DisbursementJwtPayloadType } from '@/auth/jwt/payloadtypes/DisbursementJwtPayloadType'

import { Community } from './Community'
import { User } from './User'

@ObjectType()
export class DisbursementLink {
  constructor(
    disbursementPayload: DisbursementJwtPayloadType,
    recipientCommunity: Community,
    recipientUser?: User,
  ) {
    this.recipientCommunity = recipientCommunity
    if (recipientUser !== undefined) {
      this.recipientUser = recipientUser
    } else {
      this.recipientUser = null
    }
    this.senderGradidoID = disbursementPayload.sendergradidoid
    this.senderName = disbursementPayload.sendername
    this.amount = new Decimal(disbursementPayload.amount)
    this.memo = disbursementPayload.memo
    this.code = disbursementPayload.redeemcode
  }

  @Field(() => Community)
  recipientCommunity: Community

  @Field(() => User, { nullable: true })
  recipientUser: User | null

  @Field(() => String)
  senderGradidoID: string

  @Field(() => String)
  senderName: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  code: string
}
