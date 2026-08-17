// AI-GENERATED — not an architecture reference
import { MaxLength, MinLength } from 'class-validator'
import { GradidoUnit } from 'shared'
import { ArgsType, Field } from 'type-graphql'
import { THANK_YOU_CARD_LABEL_MAX_CHARS } from '@/data/ThankYouCard.logic'
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

/** Printing a card. The label is the member's own word for it, never shown to anybody else. */
@ArgsType()
export class ThankYouCardArgs {
  @Field(() => String)
  @MinLength(1)
  @MaxLength(THANK_YOU_CARD_LABEL_MAX_CHARS)
  label: string
}
