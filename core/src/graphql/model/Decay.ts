import { Decimal } from 'decimal.js-light'
import { Field, Int, ObjectType } from 'type-graphql'
import { Decay as DecayInterface } from 'shared'

@ObjectType()
export class Decay {
  constructor({ balance, decay, roundedDecay, start, end, duration }: DecayInterface) {
    this.balance = balance
    this.decay = decay
    this.roundedDecay = roundedDecay
    this.start = start
    this.end = end
    this.duration = duration
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
