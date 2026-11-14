// AI-GENERATED — not an architecture reference
import { SupportTicketMessageType } from '@enum/SupportTicketMessageType'
import { SupportTicketStatus } from '@enum/SupportTicketStatus'
import { Field, Int, ObjectType } from 'type-graphql'
import { User } from './User'

/**
 * A support request as the moderation lists it (K2): the member's request with the member, its
 * group, who closed it, and who had the last word in its thread. A type of its own beside the
 * member's SupportTicket: the moderation sees the member and the closing, the member does not.
 */
@ObjectType()
export class AdminSupportTicket {
  @Field(() => Int)
  id: number

  @Field(() => Int)
  userId: number

  // The member as the moderation's lists carry them (Contribution.user): the guards of the
  // real name and the pin live on User. Null where their account is deleted.
  @Field(() => User, { nullable: true })
  user: User | null

  // The member's address in force, beside the member rather than on it: User.emailContact asks
  // the database again where no address is in force, and fails there -- for the whole page.
  @Field(() => String, { nullable: true })
  userEmail: string | null

  @Field(() => String)
  text: string

  @Field(() => SupportTicketStatus)
  status: SupportTicketStatus

  @Field(() => String, { nullable: true })
  creationGroupTag: string | null

  @Field(() => String, { nullable: true })
  creationGroupName: string | null

  @Field(() => Date)
  createdAt: Date

  // When and by whom it was closed, and for a deleted one when and by whom it was deleted
  // (closingOf); the name is the real one, for colleagues (findUserNamesByIds).
  @Field(() => Date, { nullable: true })
  closedAt: Date | null

  @Field(() => Int, { nullable: true })
  closedBy: number | null

  @Field(() => String, { nullable: true })
  closedByUserName: string | null

  // When a moderator wants the request back (K4); one in the past is due. Null for none.
  @Field(() => Date, { nullable: true })
  resubmissionAt: Date | null

  // The newest message of the dialog, the notes left out: its kind and whether the moderation
  // wrote it. Null where nobody wrote in the thread yet.
  @Field(() => SupportTicketMessageType, { nullable: true })
  lastMessageType: SupportTicketMessageType | null

  @Field(() => Boolean, { nullable: true })
  lastMessageByModerator: boolean | null
}

@ObjectType()
export class AdminSupportTicketList {
  @Field(() => Int)
  count: number

  @Field(() => [AdminSupportTicket])
  tickets: AdminSupportTicket[]
}
