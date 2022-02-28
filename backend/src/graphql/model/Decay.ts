/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'
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
    this.decay = decay
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

  @Field(() => Number, { nullable: true })
  duration: number | null
}
