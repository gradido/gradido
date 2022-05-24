import { Field, InputType } from 'type-graphql'

@InputType()
export default class TransactionLinkFilters {
  @Field(() => Boolean, { nullable: true, defaultValue: true })
  withDeleted: boolean

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  withExpired: boolean

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  withRedeemed: boolean
}
