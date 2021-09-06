import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export class TransactionListInput {
  @Field(() => Int)
  firstPage: number

  @Field(() => Int)
  items: number

  @Field(() => String)
  order: string
}

@ArgsType()
export class TransactionSendArgs {
  @Field(() => String)
  email: string

  @Field(() => Number)
  amount: number

  @Field(() => String)
  memo: string
}
