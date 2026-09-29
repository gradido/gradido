// AI-GENERATED — not an architecture reference
import { ChatGroupRole } from '@enum/ChatGroupRole'
import { dbSelectChatGroupsByMember } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'
import { User } from './User'

/** One group of dbSelectChatGroupsByMember: the group, and the member's own row in it. */
export type ChatGroupOfMember = Awaited<ReturnType<typeof dbSelectChatGroupsByMember>>[number]

/**
 * A chat group (P5) as one of its members sees it in the list and in the group's window: its
 * name, where it lives and who opened it, the member's own part in it -- role, mute mark, since
 * when --, how many are in it, what waits unread for them and when the latest message arrived.
 *
 * ⛔ Nothing here says who else muted the group or read what: those are each member's own marks
 * (E-024), and there is no read receipt (E-008, invariant 2).
 */
@ObjectType()
export class ChatGroup {
  /**
   * `communityName`: the name of the community the group lives in (E-026) -- this one in P5.
   * `createdBy`: who opened it, or null where their users row is gone.
   */
  constructor(group: ChatGroupOfMember, communityName: string | null, createdBy: User | null) {
    this.groupUuid = group.groupUuid
    this.conversationId = group.id
    // The column may hold null for a direct conversation; a group always has a name.
    this.title = group.title ?? ''
    this.communityName = communityName
    this.createdBy = createdBy
    this.createdAt = group.createdAt
    this.role = group.role
    this.joinedAt = group.joinedAt
    this.mutedByMe = group.mutedAt !== null
    this.memberCount = group.memberCount
    this.unreadMessages = group.unreadMessages
    this.lastMessageAt = group.lastMessageAt
  }

  /** What the group is known by -- to the wallet, and in the links of its mails (E-049). */
  @Field(() => String)
  groupUuid: string

  /**
   * The conversation its messages carry (ChatMessage.conversationId): what the wallet sorts a
   * message from the chat's beat (newChatMessagesSince) into this group by.
   */
  @Field(() => Int)
  conversationId: number

  @Field(() => String)
  title: string

  /** The community the group lives in (E-026): in P5 the one of all its members. */
  @Field(() => String, { nullable: true })
  communityName: string | null

  /** Who opened the group -- also after they left it; null where their users row is gone. */
  @Field(() => User, { nullable: true })
  createdBy: User | null

  @Field(() => Date)
  createdAt: Date

  /** The reader's own part in the group (E-050 F4). */
  @Field(() => ChatGroupRole)
  role: ChatGroupRole

  /** Since when the reader is in the group. */
  @Field(() => Date)
  joinedAt: Date

  /** Whether the READER muted the group (E-024): their own mark, and only theirs. */
  @Field(() => Boolean)
  mutedByMe: boolean

  @Field(() => Int)
  memberCount: number

  /** The messages above the reader's own read pointer, written by somebody else. */
  @Field(() => Int)
  unreadMessages: number

  /** When the latest message arrived here (E-018); null for a group without one. */
  @Field(() => Date, { nullable: true })
  lastMessageAt: Date | null
}
