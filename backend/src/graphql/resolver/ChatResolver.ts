// AI-GENERATED — not an architecture reference
import { ChatMessagesWithMemberArgs } from '@arg/ChatMessagesWithMemberArgs'
import { MarkChatConversationReadArgs } from '@arg/MarkChatConversationReadArgs'
import { SendChatMessageArgs } from '@arg/SendChatMessageArgs'
import { SetChatConversationMutedArgs } from '@arg/SetChatConversationMutedArgs'
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { ChatMessage } from '@model/ChatMessage'
import { ChatMessagePage } from '@model/ChatMessagePage'
import { ApiVersionType, CommandClientFactory, chatMessageNotify, V1_0_CommandClient } from 'core'
import {
  ChatConversationSelect,
  ChatMemberRef,
  dbFindDirectChatConversation,
  dbSelectChatConversationMember,
  dbSelectChatMessagesPage,
  dbUpdateChatConversationMemberLastRead,
  dbUpdateChatConversationMemberMuted,
  findUserByUuids,
  getCommunityByUuid,
  getCommunityWithFederatedCommunityByIdentifier,
} from 'database'
import { getLogger } from 'log4js'
import { uuidv4Schema } from 'shared'
import { Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  CHAT_MESSAGE_PAGES_MAX_PER_REQUEST,
  CHAT_MESSAGES_PAGE_DEFAULT,
  isSameChatMember,
} from '@/data/ChatConversation.logic'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import {
  deliverChatMessageAcrossBorder,
  deliverChatMessageLocally,
} from './util/chatMessageDelivery'
import { isHomeCommunity, resolveCommunityUuid } from './util/communities'

const createLogger = () => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ChatResolver`)

/** The caller as a conversation member knows them: the pair, never users.id. */
const callerOf = (context: Context): ChatMemberRef => {
  const user = getUser(context)
  return { communityUuid: user.communityUuid, gradidoId: user.gradidoID }
}

/**
 * The direct conversation of the caller with the member `ref` names, or null -- also for
 * `ref` naming the caller, who has no conversation with themselves.
 *
 * ⛔ Found by the PAIR of the two -- what `direct_pair_key` holds, and what
 * dbFindDirectChatConversation looks up -- never by the other member alone: a conversation
 * between two other people has another key, so it is not found for somebody asking about one
 * of them.
 */
const directChatConversationWith = async (
  caller: ChatMemberRef,
  ref: MemberAvatarRefInput,
): Promise<ChatConversationSelect | null> => {
  const other = {
    communityUuid: await resolveCommunityUuid(ref.communityUuid),
    gradidoId: ref.gradidoID,
  }
  if (isSameChatMember(caller, other)) {
    return null
  }
  return dbFindDirectChatConversation(caller, other)
}

/**
 * The chat: the thread with one contact and the caller's marks in it -- the read pointer and
 * the mute mark (P2a, P3a) -- and writing to that contact (P3a). The form "send an e-mail"
 * still writes through sendEmail, into the same conversation (P1).
 *
 * No subject and no text reaches a log: what is written here is a refused page budget with its
 * count, a refused message with its reason, and a failed delivery with the other side's answer.
 */
@Resolver()
export class ChatResolver {
  /**
   * The messages the caller and one other member wrote each other, a page at a time, oldest
   * first (E-018). The other member is named by their pair, as the contact window knows them
   * (KF-004). No conversation, or the caller asking about themselves: an empty page.
   */
  @Authorized([RIGHTS.READ_OWN_CHAT])
  @Query(() => ChatMessagePage)
  async chatMessagesWithMember(
    @Args() { ref, before, limit }: ChatMessagesWithMemberArgs,
    @Ctx() context: Context,
  ): Promise<ChatMessagePage> {
    // ⛔ Counted in the HTTP request's budget before anything is looked up: a document may
    // repeat this field under any number of aliases, and `limit` caps one page, not how many
    // (RequestBudget in server/context.ts).
    context.requestBudget.chatMessagePagesServed += 1
    const served = context.requestBudget.chatMessagePagesServed
    if (served > CHAT_MESSAGE_PAGES_MAX_PER_REQUEST) {
      throw new LogError('Too many chat pages requested at once', served)
    }
    const caller = callerOf(context)
    const conversation = await directChatConversationWith(caller, ref)
    if (!conversation) {
      return new ChatMessagePage([], false, false)
    }
    const page = await dbSelectChatMessagesPage(conversation.id, {
      before: before ?? undefined,
      limit: limit ?? CHAT_MESSAGES_PAGE_DEFAULT,
    })
    // The caller's own mark, read from the caller's own row: whether the OTHER member muted the
    // conversation is nobody's business but theirs (E-024).
    const me = await dbSelectChatConversationMember(conversation.id, caller)
    return new ChatMessagePage(
      page.messages.map((row) => new ChatMessage(row, caller)),
      page.hasMore,
      Boolean(me?.mutedAt),
    )
  }

  /**
   * Moves the caller's read pointer in the conversation with `ref` up to `upToMessageId`,
   * never down. False where there is no such conversation, or the caller is not in it;
   * nothing is written then.
   */
  @Authorized([RIGHTS.READ_OWN_CHAT])
  @Mutation(() => Boolean)
  async markChatConversationRead(
    @Args() { ref, upToMessageId }: MarkChatConversationReadArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const caller = callerOf(context)
    const conversation = await directChatConversationWith(caller, ref)
    if (!conversation) {
      return false
    }
    const result = await dbUpdateChatConversationMemberLastRead(
      conversation.id,
      caller,
      upToMessageId,
    )
    return result.success
  }

  /**
   * Writes a message to one member (P3a) and hands back the sender's own copy, as the sender
   * reads it. For a member of this community the copy is the one row both of them read; for a
   * member of another community it goes out as a command, and the copy says how that went.
   *
   * Whether it goes out as a mail as well: the first message between the two always does
   * (E-024, decided here against this server's own table, before anything is filed); after it,
   * what the sender asked for -- unless the recipient muted the conversation. The sender is
   * never told that: the copy carries the wish, and nothing else is different.
   *
   * ⛔ The row IS the message. What could not be filed was not sent, and no mail goes out for
   * it -- unlike the form "send an e-mail", where the mail is the message and the row an extra.
   *
   * A delivery to another community that failed is not an error for the sender: the copy comes
   * back FAILED (E-019: written first, then delivered), and the wallet says so under it. An error
   * is that there is no way to deliver at all -- no V1_0 entry, no client for it, no keys
   * exchanged to seal the command with, no uuid to name the recipient by -- and then nothing is
   * filed. No silent true (D V03, section 1).
   */
  @Authorized([RIGHTS.SEND_CHAT_MESSAGE])
  @Mutation(() => ChatMessage)
  async sendChatMessage(
    @Args() { ref, body, notify: requested }: SendChatMessageArgs,
    @Ctx() context: Context,
  ): Promise<ChatMessage> {
    const senderUser = getUser(context)
    const caller = callerOf(context)
    const other = {
      communityUuid: await resolveCommunityUuid(ref.communityUuid),
      gradidoId: ref.gradidoID,
    }
    if (isSameChatMember(caller, other)) {
      throw new LogError('CHAT_MESSAGE_NOT_SENT: TO_ONESELF')
    }
    const notify = chatMessageNotify(
      requested,
      (await dbFindDirectChatConversation(caller, other)) !== null,
    )

    if (await isHomeCommunity(other.communityUuid)) {
      const recipientUser = await findUserByUuids(other.communityUuid, other.gradidoId)
      if (!recipientUser) {
        throw new LogError('CHAT_MESSAGE_NOT_SENT: UNKNOWN_RECIPIENT', other.gradidoId)
      }
      const stored = await deliverChatMessageLocally({
        senderUser,
        recipientUser,
        subject: null,
        body,
        notify,
        requireStored: true,
      })
      if (!stored) {
        throw new LogError('CHAT_MESSAGE_NOT_SENT: NOT_STORED')
      }
      return new ChatMessage(stored, caller)
    }

    const senderCom = await getCommunityByUuid(caller.communityUuid)
    const receiverCom = await getCommunityWithFederatedCommunityByIdentifier(other.communityUuid)
    const receiverFCom = receiverCom?.federatedCommunities?.find(
      (fcom) => fcom.apiVersion === ApiVersionType.V1_0,
    )
    const cmdClient = receiverFCom ? CommandClientFactory.getInstance(receiverFCom) : null
    if (
      !senderCom ||
      !senderCom.privateJwtKey ||
      !receiverCom?.communityUuid ||
      !receiverCom.publicJwtKey ||
      !uuidv4Schema.safeParse(receiverCom.communityUuid).success ||
      !uuidv4Schema.safeParse(other.gradidoId).success ||
      !(cmdClient instanceof V1_0_CommandClient)
    ) {
      throw new LogError('CHAT_MESSAGE_NOT_SENT: NO_WAY_TO_DELIVER', other.communityUuid)
    }
    const { stored, error } = await deliverChatMessageAcrossBorder({
      senderUser,
      senderCom,
      receiverCom,
      receiverComIdentifier: other.communityUuid,
      cmdClient,
      recipientGradidoId: other.gradidoId,
      subject: null,
      body,
      notify,
      requireStored: true,
    })
    if (!stored) {
      throw new LogError('CHAT_MESSAGE_NOT_SENT: NOT_STORED')
    }
    if (error !== null) {
      createLogger().warn(
        `chat message not delivered: message_uuid=${stored.messageUuid} (${error})`,
      )
    }
    return new ChatMessage(stored, caller)
  }

  /**
   * Mutes the conversation with `ref` for the caller, or lifts it (E-024): while it is muted, no
   * mail about it reaches the caller, whatever the other member asks for. The caller's own mark
   * and nobody else's; the other member is not told.
   *
   * False where there is no conversation yet, and nothing is written: before the first message
   * there is nothing to mute -- and the first message goes out as a mail anyway.
   */
  @Authorized([RIGHTS.READ_OWN_CHAT])
  @Mutation(() => Boolean)
  async setChatConversationMuted(
    @Args() { ref, muted }: SetChatConversationMutedArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const caller = callerOf(context)
    const conversation = await directChatConversationWith(caller, ref)
    if (!conversation) {
      return false
    }
    const result = await dbUpdateChatConversationMemberMuted(
      conversation.id,
      caller,
      muted ? new Date() : null,
    )
    return result.success
  }
}
