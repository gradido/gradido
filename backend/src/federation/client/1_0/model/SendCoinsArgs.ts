import { Decimal } from 'decimal.js-light'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class SendCoinsArgs {
  @Field(() => String)
  communityReceiverIdentifier: string

  @Field(() => String)
  userReceiverIdentifier: string

  @Field(() => String)
  creationDate: string

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
