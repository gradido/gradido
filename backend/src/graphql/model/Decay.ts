import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ObjectType()
export class Decay {
  constructor(
    balance: Decimal,
    decay: Decimal,
    start: Date | null,
    end: Date | null,
    duration: number | null,
  ) {
    this.balance = balance
    this.decay = decay.toDecimalPlaces(2, Decimal.ROUND_FLOOR)
    this.start = start
    this.end = end
    this.duration = duration
  }

  @Field(() => Decimal)
  balance: Decimal

  @Field(() => Decimal)
  decay: Decimal

  @Field(() => Date, { nullable: true })
  start: Date | null

  @Field(() => Date, { nullable: true })
  end: Date | null

  @Field(() => Int, { nullable: true })
  duration: number | null
}
