import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class TransactionLinkFilters {
  @Field(() => Boolean, { nullable: true, defaultValue: true })
  byDeleted?: boolean

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  byExpired?: boolean

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  byRedeemed?: boolean
}
