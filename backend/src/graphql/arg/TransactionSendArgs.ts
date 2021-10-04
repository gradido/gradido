import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class TransactionSendArgs {
  @Field(() => String)
  email: string

  @Field(() => Number)
  amount: number

  @Field(() => String)
  memo: string
}
