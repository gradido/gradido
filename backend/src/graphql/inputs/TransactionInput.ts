import { ObjectType, ArgsType, Field, Int, Float } from 'type-graphql'
import { Entity, BaseEntity, Column, Double } from 'typeorm'

@ArgsType()
export class TransactionInput {
  @Field(() => Number)
  sessionId: number

  @Field(() => Number)
  firstPage: number

  @Field(() => Number)
  items: number

  @Field(() => String)
  order: string
}

@ArgsType()
export class TransactionSendArgs {
  @Field(() => Number)
  sessionId: number

  @Field(() => String)
  email: string

  @Field(() => Number)
  amount: number

  @Field(() => String)
  memo: string
}

@ArgsType()
export class TransactionCreateArgs {
  @Field(() => Number)
  sessionId: number

  @Field(() => String)
  email: string

  @Field(() => Number)
  amount: number

  @Field(() => String)
  memo: string

  @Field(() => Date)
  targetDate: Date
}
