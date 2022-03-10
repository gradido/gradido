import { ObjectType, Field } from 'type-graphql'
import Decimal from 'decimal.js-light'
import { User } from './User'

@ObjectType()
export class TransactionLink {
  @Field(() => Number)
  id: number

  @Field(() => User)
  user: User

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => Decimal)
  holdAvailableAmount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  code: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  @Field(() => Date)
  validUntil: Date

  @Field(() => Date, { nullable: true })
  redeemedAt: Date | null

  @Field(() => User, { nullable: true })
  redeemedBy: User | null
}
