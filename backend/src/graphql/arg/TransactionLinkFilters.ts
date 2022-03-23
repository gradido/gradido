import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class TransactionLinkFilters {
  @Field(() => Boolean, { nullable: true })
  withDeleted?: boolean

  @Field(() => Boolean, { nullable: true })
  withExpired?: boolean

  @Field(() => Boolean, { nullable: true })
  withRedeemed?: boolean
}
