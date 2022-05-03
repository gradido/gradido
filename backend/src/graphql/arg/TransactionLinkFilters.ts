import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class TransactionLinkFilters {
  @Field(() => Boolean, { nullable: true, defaultValue: true })
  filterByDeleted?: boolean

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  withExpired?: boolean

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  withRedeemed?: boolean
}
