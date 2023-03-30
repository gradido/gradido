import { Decimal } from 'decimal.js-light'
import { ObjectType, Field, Int } from 'type-graphql'

interface DecayInterface {
  balance: Decimal
  decay: Decimal
  roundedDecay: Decimal
  start: Date | null
  end: Date | null
  duration: number | null
}

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
