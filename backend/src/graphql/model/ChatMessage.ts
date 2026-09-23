// AI-GENERATED — not an architecture reference
import { ChatMessageDeliveryState } from '@enum/ChatMessageDeliveryState'
import { ChatMessageNotify } from '@enum/ChatMessageNotify'
import { ChatMemberRef, ChatMessageSelect } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'
import { isSameChatMember } from '@/data/ChatConversation.logic'
import { MemberRef } from './MemberRef'

/**
 * One message of a conversation, as the member reading it may see it.
 *
 * ⛔ What the sender knows about their own message, and nobody else: whether it reached the
 * other server and whether they asked for a mail. The constructor takes the reader for that
 * and fills both only where the reader wrote the message (`mine`); on the other side's
 * messages they are null (E-019, E-024). Nothing here says whether or when the other side
 * read anything, or whether a mail went out over there: there is no read receipt (E-008,
 * invariant 2).
 */
@ObjectType()
export class ChatMessage {
  constructor(row: ChatMessageSelect, reader: ChatMemberRef) {
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

  /** The conversation it belongs to -- one per pair, sorted into threads by it later (P4). */
  @Field(() => Int)
  conversationId: number

  @Field(() => MemberRef)
  sender: MemberRef

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
}
