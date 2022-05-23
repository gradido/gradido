import { Field, InputType } from 'type-graphql'

@InputType()
export default class TransactionLinkFilters {
  @Field(() => Boolean, { nullable: true, defaultValue: true })
  byDeleted: boolean

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  byExpired: boolean

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  byRedeemed: boolean
}
