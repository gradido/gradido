// AI-GENERATED — not an architecture reference
import { ChatMessageDeliveryState } from '@enum/ChatMessageDeliveryState'
import { ChatMessageMailState } from '@enum/ChatMessageMailState'
import { ChatMessageNotify } from '@enum/ChatMessageNotify'
import { ChatMemberRef, ChatMessageImageInfo, ChatMessageSelect } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'
import { isSameChatMember } from '@/data/ChatConversation.logic'
import { ChatMessageImage } from './ChatMessageImage'
import { MemberRef } from './MemberRef'
import { User } from './User'

/**
 * One message of a conversation, as the member reading it may see it.
 *
 * ⛔ What the sender knows about their own message, and nobody else: whether it reached the
 * other server, whether they asked for a mail, and what became of that mail -- sent, or held back
 * because the recipient muted the conversation (E-034). The constructor takes the reader for that
 * and fills all three only where the reader wrote the message (`mine`); on the other side's
 * messages they are null (E-019, E-024). Nothing here says whether or when the other side read
 * anything: there is no read receipt (E-008, invariant 2).
 */
@ObjectType()
export class ChatMessage {
  /**
   * `images`: what is known about the message's pictures (dbSelectChatMessageImageInfos), in
   * their order -- read for a whole page at once by the caller, never one query per message.
   *
   * `group`: for a message written in a group (P5), the group's uuid and who wrote it -- read for
   * a whole page at once as well (chatMessagesOf) -- and with it whether it went out as an
   * announcement (`announcement`). Null in a direct conversation.
   */
  constructor(
    row: ChatMessageSelect,
    reader: ChatMemberRef,
    images: ChatMessageImageInfo[] = [],
    group: { groupUuid: string; senderUser: User | null } | null = null,
    forwardedFrom: User | null = null,
  ) {
    const sender = { communityUuid: row.senderCommunityUuid, gradidoId: row.senderGradidoId }
    this.id = row.id
    this.messageUuid = row.messageUuid
    this.conversationId = row.conversationId
    this.sender = new MemberRef(sender.communityUuid, sender.gradidoId)
    this.mine = isSameChatMember(sender, reader)
    this.subject = row.subject
    this.body = row.body
    this.createdAt = row.createdAt
    this.deliveryState = this.mine ? row.deliveryState : null
    this.notify = this.mine ? row.notify : null
    this.mailState = this.mine ? (row.mailState ?? null) : null
    this.images = images.map((info) => new ChatMessageImage(info))
    this.groupUuid = group?.groupUuid ?? null
    this.senderUser = group?.senderUser ?? null
    this.announcement = group !== null && row.notify === ChatMessageNotify.EMAIL
    this.forwarded = row.forwardedFromGradidoId !== null
    this.forwardedFrom = this.forwarded ? forwardedFrom : null
  }

  /**
   * The order of arrival on this server, and the cursor for the page before it (E-018); the
   * highest one shown is what markChatConversationRead takes (E-017).
   */
  @Field(() => Int)
  id: number

  /** The same on both servers of a message that crossed the border (E-007). */
  @Field(() => String)
  messageUuid: string

  /**
   * The conversation it belongs to -- one per pair, or one per group (P5): what the wallet sorts
   * it into its thread by.
   */
  @Field(() => Int)
  conversationId: number

  /**
   * The group the message was written in (P5), by the uuid the group is known by; null in a
   * direct conversation. ⛔ What keeps a group's message out of the thread with its sender: an
   * empty thread takes its conversation from the first message the other member writes, and
   * without this a message they wrote in a group would be taken for one.
   */
  @Field(() => String, { nullable: true })
  groupUuid: string | null

  @Field(() => MemberRef)
  sender: MemberRef

  /**
   * Who wrote a message in a group (P5), with what the wallet shows beside it -- the same `User`
   * model the contact list carries: alias, colour digit, the date of the picture, and no real
   * name (NU-019). Also for a member who has left the group since, and for one who deleted their
   * account (AS-009 leaves them the name). Null in a direct conversation, where the thread knows
   * the other member already -- and where the sender's users row is gone.
   */
  @Field(() => User, { nullable: true })
  senderUser: User | null

  /**
   * Whether a message written in a group went out as an announcement (E-050 F5): by mail to every
   * member but the sender who has not muted the group. For EVERY member, not only the sender --
   * unlike `notify` in a conversation of two: the members got the mail or could have, so the
   * wallet marks the message in the thread ("Ankündigung", P5b). Nothing here says who was
   * mailed and who had muted (E-024). False in a direct conversation, where the wish stays the
   * sender's (`notify`).
   */
  @Field(() => Boolean)
  announcement: boolean

  /** Whether the member reading wrote it. */
  @Field(() => Boolean)
  mine: boolean

  /** Filled from the form "send an e-mail", empty in the chat (E-013). */
  @Field(() => String, { nullable: true })
  subject: string | null

  /** The raw text, `**…**` included -- the wallet renders it (E-015). */
  @Field(() => String)
  body: string

  /** When it arrived on THIS server; there is no other clock in a conversation (E-018). */
  @Field(() => Date)
  createdAt: Date

  /** Whether the reader's own message reached the other server; null on everybody else's. */
  @Field(() => ChatMessageDeliveryState, { nullable: true })
  deliveryState: ChatMessageDeliveryState | null

  /** Whether the reader asked for their own message to be mailed; null on everybody else's. */
  @Field(() => ChatMessageNotify, { nullable: true })
  notify: ChatMessageNotify | null

  /**
   * What became of the mail about the reader's own message (E-034): MAILED, or MUTED where they
   * asked for one and the recipient has muted the conversation. Null where no mail was asked for,
   * where the delivery failed, where it is not known (a message from before this field, an
   * answer from a server from before it) -- and on everybody else's messages.
   */
  @Field(() => ChatMessageMailState, { nullable: true })
  mailState: ChatMessageMailState | null

  /**
   * The pictures the message carries (P7) -- for both of them, as the text is --, each named
   * with what to fetch it by (chatMessageImage) and its size. Empty for a message without one.
   */
  @Field(() => [ChatMessageImage])
  images: ChatMessageImage[]

  /**
   * A copy a member forwarded from another conversation (E-059): the thread says "Weitergeleitet"
   * over it.
   */
  @Field(() => Boolean)
  forwarded: boolean

  /**
   * Who wrote the words of a forwarded copy first -- through several forwardings, the first
   * writer --, as the thread names them: "Weitergeleitet von [Nutzername]". Null for every other
   * message, and for a copy whose sender forwarded words of their own (the thread names nobody
   * then), or whose first writer is not known here.
   */
  @Field(() => User, { nullable: true })
  forwardedFrom: User | null
}
