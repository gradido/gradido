// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/**
 * What the settings page shows while a change is under way: which address is waiting
 * for its click, and from when on the mail may be sent again. Nothing else about the
 * row leaves the server - no codes, no id.
 */
@ObjectType()
export class PendingEmailChange {
  constructor(email: string, requestedAt: Date, resendAllowedAt: Date) {
    this.email = email
    this.requestedAt = requestedAt
    this.resendAllowedAt = resendAllowedAt
  }

  @Field(() => String)
  email: string

  @Field(() => Date)
  requestedAt: Date

  @Field(() => Date)
  resendAllowedAt: Date
}
