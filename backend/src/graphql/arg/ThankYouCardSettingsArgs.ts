// AI-GENERATED — not an architecture reference
import { MaxLength, MinLength } from 'class-validator'
import { GradidoUnit } from 'shared'
import { ArgsType, Field } from 'type-graphql'
import {
  THANK_YOU_CARD_CODE_MAX_CHARS,
  THANK_YOU_CARD_LABEL_MAX_CHARS,
  THANK_YOU_CARD_MEMO_MAX_CHARS,
} from '@/data/ThankYouCard.logic'
import { IsPositiveGradidoUnit } from '../validator/GradidoUnit'

// TODO: replace the class-validator decorators with a valibot schema after the update to
// typescript 5 is possible

/**
 * Switching card payment on, and changing it later. The PIN comes as a string rather than
 * a number so that leading zeros survive the trip — 040731 is a PIN, 40731 is not.
 */
@ArgsType()
export class ThankYouCardSettingsArgs {
  @Field(() => String)
  @MinLength(6)
  @MaxLength(6)
  pin: string

  @Field(() => GradidoUnit)
  @IsPositiveGradidoUnit()
  maxPerPayment: GradidoUnit

  @Field(() => GradidoUnit)
  @IsPositiveGradidoUnit()
  maxPerDay: GradidoUnit
}

/** Changing the two limits without touching the PIN. */
@ArgsType()
export class ThankYouCardLimitsArgs {
  @Field(() => GradidoUnit)
  @IsPositiveGradidoUnit()
  maxPerPayment: GradidoUnit

  @Field(() => GradidoUnit)
  @IsPositiveGradidoUnit()
  maxPerDay: GradidoUnit
}

/**
 * What a till enters to ask for a payment.
 *
 * ⛔ These three were plain `@Arg` parameters, and that made the whole mutation unreachable:
 * `amount` is a `GradidoUnit`, which is a CLASS, and type-graphql hands every class-typed
 * argument to class-validator. With `forbidUnknownValues: true` (set in `schema.ts`)
 * class-validator refuses any object whose class carries no validation metadata at all —
 * `ValidationExecutor` line 48, `unknownValue: 'an unknown value was passed to the validate
 * function'` — and type-graphql reports that as a bare **"Argument Validation Error"**.
 *
 * An `@ArgsType` carrying decorators is therefore not tidiness here, it is what makes the
 * argument valid at all. It is also how every other GradidoUnit in this schema already
 * travels; this mutation was the only class-typed `@Arg` in the backend.
 *
 * ⚠️ The GraphQL signature does not change: type-graphql spreads these fields as the
 * mutation's arguments under the same names, so the wallet's document stays as it is.
 */
@ArgsType()
export class ThankYouCardPaymentArgs {
  @Field(() => String)
  @MinLength(1)
  @MaxLength(THANK_YOU_CARD_CODE_MAX_CHARS)
  code: string

  @Field(() => GradidoUnit)
  @IsPositiveGradidoUnit()
  amount: GradidoUnit

  // The column is varchar(512). Unchecked, a longer memo comes back as a raw driver error.
  @Field(() => String)
  @MinLength(1)
  @MaxLength(THANK_YOU_CARD_MEMO_MAX_CHARS)
  memo: string
}

/**
 * Printing a card. The label is the member's own word for it, and it is printed on the
 * card, so the till that scans it shows it back (see `ThankYouCardPaymentTarget`). It is
 * never a secret from whoever is holding the card, and never reaches anybody else.
 */
@ArgsType()
export class ThankYouCardArgs {
  @Field(() => String)
  @MinLength(1)
  @MaxLength(THANK_YOU_CARD_LABEL_MAX_CHARS)
  label: string
}
