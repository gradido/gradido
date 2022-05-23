import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class TransactionLinkFilters {
  @Field(() => Boolean, { nullable: true, defaultValue: true })
  filterByDeleted?: boolean

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  filterByExpired?: boolean

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  filterByRedeemed?: boolean
}
