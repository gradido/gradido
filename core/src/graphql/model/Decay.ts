import { Transaction } from 'database'
import Decimal from 'decimal.js-light'
import { Decay as DecayInterface } from 'shared'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class Decay {
  constructor(input: DecayInterface | Transaction) {
    if (input instanceof Transaction) {
      const transaction = input
      if (!transaction.decayStart) {
        this.balance = transaction.balance.toDecimalPlaces(2, Decimal.ROUND_DOWN).toString()
        this.decay = '0'
        this.roundedDecay = '0'
        this.start = null
        this.end = null
        this.duration = null
      } else {
        this.balance = transaction.balance.toDecimalPlaces(2, Decimal.ROUND_DOWN).toString()
        this.decay = transaction.decay.toDecimalPlaces(2, Decimal.ROUND_FLOOR).toString()
        // TODO: add correct value when decay must be rounded in transaction context
        this.roundedDecay = '0'
        this.start = transaction.decayStart
        this.end = transaction.balanceDate
        this.duration = Math.round(
          (transaction.balanceDate.getTime() - transaction.decayStart.getTime()) / 1000,
        )
      }
    } else if (input instanceof DecayInterface) {
      const { balance, decay, roundedDecay, start, end, duration }: DecayInterface = input
      this.balance = balance.toString()
      this.decay = decay.toString()
      this.roundedDecay = roundedDecay.toString(2)
      this.start = start
      this.end = end
      this.duration = duration
    }
  }

  @Field(() => String)
  balance: string

  @Field(() => String)
  decay: string

  @Field(() => String)
  roundedDecay: string

  @Field(() => Date, { nullable: true })
  start: Date | null

  @Field(() => Date, { nullable: true })
  end: Date | null

  @Field(() => Int, { nullable: true })
  duration: number | null
}
