// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'
import { UnconfirmedGuest } from './UnconfirmedGuest'

/**
 * The table code a member shows live (E-017): the wallet puts `code` into the link of the
 * card as `?presence=`, behind the address of `alias`, and counts `remainingMs` down from the
 * moment the answer arrives.
 *
 * `alias` is the user name the code is sealed for. The wallet's own copy of the name can be
 * stale (renamed on another device), and a link with any other name opens nothing.
 * `remainingMs` lets the device count without its clock: `expiresAt` is this server's clock,
 * and a device whose clock runs ahead would take a fresh code for an expired one.
 *
 * `unconfirmedGuests` are the member's own table guests who have not confirmed their address
 * (E-020). Once there are `PRESENCE_MAX_UNCONFIRMED` of them there is no code (`code` is null,
 * `remainingMs` 0, E-019), so that the member sees it on their own screen before a guest scans.
 */
@ObjectType()
export class PresenceCode {
  @Field(() => String, { nullable: true })
  code: string | null

  @Field()
  alias: string

  @Field(() => Date, { nullable: true })
  expiresAt: Date | null

  @Field(() => Int)
  remainingMs: number

  @Field(() => [UnconfirmedGuest])
  unconfirmedGuests: UnconfirmedGuest[]
}
