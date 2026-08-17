// AI-GENERATED — not an architecture reference
import { ThankYouCardSettingsSelect } from 'database'
import { GradidoUnit } from 'shared'
import { Field, ObjectType } from 'type-graphql'

/**
 * What a member has set for paying with a card. ⛔ The PIN and its salt are not here and
 * must never be — this type is what the wallet reads back after saving.
 *
 * There is no "enabled" field either, because there is no such column: the existence of
 * the settings row IS the switch. A member who has switched card payment off gets no
 * object at all, not an object with a false in it.
 */
@ObjectType()
export class ThankYouCardSettings {
  constructor(dbSettings: ThankYouCardSettingsSelect) {
    this.maxPerPayment = dbSettings.maxPerPayment
    this.maxPerDay = dbSettings.maxPerDay
    this.updatedAt = dbSettings.updatedAt
  }

  @Field(() => GradidoUnit)
  maxPerPayment: GradidoUnit

  @Field(() => GradidoUnit)
  maxPerDay: GradidoUnit

  @Field(() => Date)
  updatedAt: Date
}
