import { Decimal } from 'decimal.js-light'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class SendCoinsArgs {
  @Field(() => String)
  recipientCommunityUuid: string

  @Field(() => String)
  recipientUserIdentifier: string

  @Field(() => String)
  creationDate: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  senderCommunityUuid: string

  @Field(() => String)
  senderUserUuid: string

  @Field(() => String)
  senderUserName: string

  @Field(() => String, { nullable: true })
  senderAlias?: string | null
}
