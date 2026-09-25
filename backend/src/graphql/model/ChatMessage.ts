// AI-GENERATED — not an architecture reference
import { ChatMessageDeliveryState } from '@enum/ChatMessageDeliveryState'
import { ChatMessageMailState } from '@enum/ChatMessageMailState'
import { ChatMessageNotify } from '@enum/ChatMessageNotify'
import { ChatMemberRef, ChatMessageSelect } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'
import { isSameChatMember } from '@/data/ChatConversation.logic'
import { MemberRef } from './MemberRef'

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
    this.mailState = this.mine ? (row.mailState ?? null) : null
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

  /**
   * What became of the mail about the reader's own message (E-034): MAILED, or MUTED where they
   * asked for one and the recipient has muted the conversation. Null where no mail was asked for,
   * where the delivery failed, where it is not known (a message from before this field, an
   * answer from a server from before it) -- and on everybody else's messages.
   */
  @Field(() => ChatMessageMailState, { nullable: true })
  mailState: ChatMessageMailState | null
}
