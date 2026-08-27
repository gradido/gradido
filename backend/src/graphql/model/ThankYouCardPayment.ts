// AI-GENERATED — not an architecture reference
import { ThankYouCardPaymentSelect } from 'database'
import { GradidoUnit } from 'shared'
import { Field, Int, ObjectType } from 'type-graphql'
import { ThankYouCardPaymentStatus } from '@/graphql/enum/ThankYouCardPaymentStatus'

/**
 * The request a merchant creates by entering an amount. It carries no name and no
 * account — at this point nobody has proved anything yet, and a request that told the
 * merchant whose card they scanned would hand out that answer for free.
 */
@ObjectType()
export class ThankYouCardPayment {
  constructor(dbPayment: ThankYouCardPaymentSelect) {
    this.id = dbPayment.id
    this.amount = dbPayment.amount
    this.memo = dbPayment.memo
    this.validUntil = dbPayment.validUntil
  }

  @Field(() => Int)
  id: number

  @Field(() => GradidoUnit)
  amount: GradidoUnit

  @Field(() => String)
  memo: string

  @Field(() => Date)
  validUntil: Date
}

/**
 * The answer to "here is the PIN".
 *
 * Everything the merchant's screen needs is here as data, so the wallet can write the
 * sentence. `payerName` is filled in only on SUCCESS — before that, nothing has been
 * proved, and afterwards the payer is standing right there anyway and the name is
 * already in the booking.
 */
@ObjectType()
export class ThankYouCardPaymentResult {
  constructor(status: ThankYouCardPaymentStatus) {
    this.status = status
  }

  @Field(() => ThankYouCardPaymentStatus)
  status: ThankYouCardPaymentStatus

  /** How many tries are left before the card blocks. Only set on WRONG_PIN. */
  @Field(() => Int, { nullable: true })
  attemptsLeft?: number

  @Field(() => String, { nullable: true })
  payerName?: string

  @Field(() => GradidoUnit, { nullable: true })
  amount?: GradidoUnit
}
