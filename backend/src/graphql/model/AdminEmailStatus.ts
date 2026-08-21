// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/**
 * What the e-mail tab of the admin's member search shows beyond the current address: the
 * address the GDT server is asked with (the member's oldest row), a change that is under
 * way, and whether the current - unconfirmed - address may be corrected at all.
 */
@ObjectType()
export class AdminEmailStatus {
  constructor(fields: {
    gdtEmail: string
    currentConfirmed: boolean
    elopageBuysOnCurrent: boolean
    pendingEmail: string | null
    pendingSince: Date | null
  }) {
    this.gdtEmail = fields.gdtEmail
    this.currentConfirmed = fields.currentConfirmed
    this.elopageBuysOnCurrent = fields.elopageBuysOnCurrent
    this.pendingEmail = fields.pendingEmail
    this.pendingSince = fields.pendingSince
  }

  /** The oldest living address - the key the GDT server knows this member by. */
  @Field(() => String)
  gdtEmail: string

  /** A confirmed address is the member's to change; an unconfirmed one may be corrected. */
  @Field(() => Boolean)
  currentConfirmed: boolean

  /**
   * Purchases filed under the current address. Accounts the Elopage webhook opened carry an
   * unconfirmed address that is nevertheless real - a warning, not a lock.
   */
  @Field(() => Boolean)
  elopageBuysOnCurrent: boolean

  @Field(() => String, { nullable: true })
  pendingEmail: string | null

  @Field(() => Date, { nullable: true })
  pendingSince: Date | null
}
