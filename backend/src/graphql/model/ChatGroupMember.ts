// AI-GENERATED — not an architecture reference
import { ChatGroupRole } from '@enum/ChatGroupRole'
import { Field, ObjectType } from 'type-graphql'
import { User } from './User'

/**
 * A member of a chat group (P5), as the other members see them: the same `User` model the contact
 * list carries -- alias, community, colour digit, the date of the picture, and by the same rule
 * no real name (NU-019) --, their part in the group and since when they are in it.
 *
 * ⛔ Not their mute mark and not their read pointer: those are each member's own (E-024, E-008).
 */
@ObjectType()
export class ChatGroupMember {
  constructor(user: User, role: ChatGroupRole, joinedAt: Date) {
    this.user = user
    this.role = role
    this.joinedAt = joinedAt
  }

  @Field(() => User)
  user: User

  @Field(() => ChatGroupRole)
  role: ChatGroupRole

  @Field(() => Date)
  joinedAt: Date
}
