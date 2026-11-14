// AI-GENERATED — not an architecture reference
import { SupportTicketStatus } from '@enum/SupportTicketStatus'
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * A member's own support request as the member reads it (SUA-001): its number, its words, its
 * state, its group and when it was filed. A type of its own, not a contribution's: the wallet's
 * cache files an answer by type name and number.
 */
@ObjectType()
export class SupportTicket {
  @Field(() => Int)
  id: number

  @Field(() => String)
  text: string

  @Field(() => SupportTicketStatus)
  status: SupportTicketStatus

  // The creation group whose moderators read it, by tag and name; null for the community's
  // support as a whole.
  @Field(() => String, { nullable: true })
  creationGroupTag: string | null

  @Field(() => String, { nullable: true })
  creationGroupName: string | null

  @Field(() => Date)
  createdAt: Date
}

@ObjectType()
export class SupportTicketList {
  @Field(() => Int)
  count: number

  @Field(() => [SupportTicket])
  tickets: SupportTicket[]
}
