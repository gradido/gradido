// AI-GENERATED — not an architecture reference
import { ChatMemberRef, ChatMessageSelect } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'
import { chatQuoteExcerpt, isSameChatMember } from '@/data/ChatConversation.logic'
import { MemberRef } from './MemberRef'
import { User } from './User'

/**
 * The message an answer quotes, as the thread shows it over the answer: who wrote it, the
 * beginning of its text as it stands now, and where it is in the conversation.
 *
 * Read from the quoted message itself whenever the answer is handed out -- nothing of it is filed
 * with the answer --, so a message changed after it was answered is quoted with its new text.
 */
@ObjectType()
export class ChatMessageQuote {
  constructor(
    row: ChatMessageSelect,
    reader: ChatMemberRef,
    hasImage: boolean,
    senderUser: User | null = null,
  ) {
    const sender = { communityUuid: row.senderCommunityUuid, gradidoId: row.senderGradidoId }
    this.id = row.id
    this.messageUuid = row.messageUuid
    this.sender = new MemberRef(sender.communityUuid, sender.gradidoId)
    this.senderUser = senderUser
    this.mine = isSameChatMember(sender, reader)
    this.excerpt = chatQuoteExcerpt(row.body)
    this.hasImage = hasImage
  }

  /**
   * The quoted message's place in the order of the conversation (ChatMessage.id): what the wallet
   * pages back to when the message is not on screen yet.
   */
  @Field(() => Int)
  id: number

  @Field(() => String)
  messageUuid: string

  @Field(() => MemberRef)
  sender: MemberRef

  /**
   * Who wrote the quoted message, in a group -- as ChatMessage.senderUser names the writer of a
   * group's message. Null in a direct conversation, where the thread knows both members.
   */
  @Field(() => User, { nullable: true })
  senderUser: User | null

  /** Whether the member reading wrote the quoted message. */
  @Field(() => Boolean)
  mine: boolean

  /**
   * The beginning of the quoted message's text, raw as ChatMessage.body is -- CHAT_QUOTE_MAX_CHARS
   * at most: a quotation is one line in the thread, and a page of answers should not carry every
   * quoted message whole. Empty for a picture without words.
   */
  @Field(() => String)
  excerpt: string

  /** Whether the quoted message carries a picture: the quotation says so, and shows none. */
  @Field(() => Boolean)
  hasImage: boolean
}
