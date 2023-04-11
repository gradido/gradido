import { Decimal } from 'decimal.js-light'
import { ArgsType, Field, InputType } from 'type-graphql'

@InputType()
@ArgsType()
export class ContributionArgs {
  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  creationDate: string
}
