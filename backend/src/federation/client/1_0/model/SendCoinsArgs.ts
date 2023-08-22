import { Decimal } from 'decimal.js-light'
import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export class SendCoinsArgs {
  @Field(() => String)
  communityReceiverIdentifier: string

  @Field(() => String)
  userReceiverIdentifier: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  communitySenderIdentifier: string

  @Field(() => String)
  userSenderIdentifier: string

  @Field(() => String)
  userSenderName: string
}
