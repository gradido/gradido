import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ObjectType()
export class Decay {
  constructor(data: {
    balance: Decimal
    decay: Decimal
    roundedDecay: Decimal
    start: Date | null
    end: Date | null
    duration: number | null
  }) {
    this.balance = data.balance
    this.decay = data.decay
    this.roundedDecay = data.roundedDecay
    this.start = data.start
    this.end = data.end
    this.duration = data.duration
  }

  @Field(() => Decimal)
  balance: Decimal

  @Field(() => Decimal)
  decay: Decimal

  @Field(() => Decimal)
  roundedDecay: Decimal

  @Field(() => Date, { nullable: true })
  start: Date | null

  @Field(() => Date, { nullable: true })
  end: Date | null

  @Field(() => Int, { nullable: true })
  duration: number | null
}
