// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * What the wallet's menu and the admin's support page know of the support (K5): whether new
 * requests are switched on in this community, and of the member's own requests how many wait for
 * them and how many are not closed. Two numbers and a truth value, no words.
 */
@ObjectType()
export class SupportTicketsMenu {
  // the community's switch (SUA-019): members file new requests
  @Field(() => Boolean)
  active: boolean

  // the member's own requests with a question back (IN_PROGRESS): the mark at the menu entry
  @Field(() => Int)
  inProgress: number

  // the member's own requests not closed (OPEN or IN_PROGRESS): with the switch off, the menu
  // keeps "Support" for them
  @Field(() => Int)
  unfinished: number
}
