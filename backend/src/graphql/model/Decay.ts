import { dbTransactionsSchema, Transaction, transactionsSchema } from 'core'
import { Transaction as dbTransaction } from 'database'
import Decimal from 'decimal.js-light'
import { Decay as DecayInterface, Duration, decaySchema, GradidoUnit } from 'shared'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class Decay {
  public constructor(input?: DecayInterface) {
    if (input) {
      const { balance, decay, start, end, duration } = decaySchema.parse(input)
      this.balance = balance
      this.decay = decay
      this.start = start
      this.end = end
      this.duration = duration
    } else {
      this.balance = new GradidoUnit(0n)
      this.decay = new GradidoUnit(0n)
      this.start = null
      this.end = null
      this.duration = null
    }
  }

  static createFromDBTransaction(input: dbTransaction): Decay {
    const { balance, decay, decayStart, balanceDate } = dbTransactionsSchema.parse(input)
    const self = new Decay()

    self.balance = GradidoUnit.fromDecimal(balance.toDecimalPlaces(4, Decimal.ROUND_DOWN))
    self.end = balanceDate

    if (!decayStart) {
      self.decay = GradidoUnit.fromDecimal(new Decimal(0))
      self.start = null
      self.duration = null
    } else {
      self.decay = GradidoUnit.fromDecimal(decay.toDecimalPlaces(4, Decimal.ROUND_FLOOR))
      self.start = decayStart
      self.duration = Duration.fromDateDiff(decayStart, balanceDate)
      if (self.decay.gddCent > 0) {
        console.log(`why?, src: ${decay.toString()}, gddCent: ${self.decay.gddCent}`)
      }
    }
    return self
  }

  // DTO Transaction is the graphql model Transaction, but in this case represented by a zod schema, because it is in a layer above in backend declared
  static createFromDTOTransaction(input: Transaction): Decay {
    const { balance, decay, balanceDate } = transactionsSchema.parse(input)
    const self = new Decay()

    self.balance = balance
    self.end = balanceDate

    if (!decay.start) {
      self.decay = new GradidoUnit(0n)
      self.start = null
      self.duration = null
      return self
    } else {
      self.decay = decay.decay
      self.start = decay.start
      self.duration = decay.duration
    }
    return self
  }

  @Field(() => GradidoUnit)
  balance: GradidoUnit

  @Field(() => GradidoUnit)
  decay: GradidoUnit

  @Field(() => Date, { nullable: true })
  start: Date | null

  @Field(() => Date, { nullable: true })
  end: Date | null

  @Field(() => Duration, { nullable: true })
  duration: Duration | null
}
