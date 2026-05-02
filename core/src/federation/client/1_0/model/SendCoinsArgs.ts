import { GradidoUnit, SendCoinsJwtPayloadType } from 'shared'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class SendCoinsArgs {
  constructor(args: null | SendCoinsJwtPayloadType) {
    if (args) {
      this.recipientCommunityUuid = args.recipientCommunityUuid
      this.recipientUserIdentifier = args.recipientUserIdentifier
      this.creationDate = args.creationDate
      this.amount = GradidoUnit.fromString(args.amount)
      this.memo = args.memo
      this.senderCommunityUuid = args.senderCommunityUuid
      this.senderUserUuid = args.senderUserUuid
      this.senderUserName = args.senderUserName
      this.senderAlias = args.senderAlias
    }
  }

  @Field(() => String)
  recipientCommunityUuid: string

  @Field(() => String)
  recipientUserIdentifier: string

  @Field(() => String)
  creationDate: string

  @Field(() => GradidoUnit)
  amount: GradidoUnit

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
