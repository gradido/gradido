// AI-GENERATED — not an architecture reference
import { ChatMessagesWithMemberArgs } from '@arg/ChatMessagesWithMemberArgs'
import { ChatVideoRoomArgs } from '@arg/ChatVideoRoomArgs'
import { MarkChatConversationReadArgs } from '@arg/MarkChatConversationReadArgs'
import { NewChatMessagesSinceArgs } from '@arg/NewChatMessagesSinceArgs'
import { SendChatMessageArgs } from '@arg/SendChatMessageArgs'
import { SetChatConversationMutedArgs } from '@arg/SetChatConversationMutedArgs'
import { ChatImageInput } from '@input/ChatImageInput'
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { ChatMessage } from '@model/ChatMessage'
import { ChatMessagePage } from '@model/ChatMessagePage'
import { ChatUpdate } from '@model/ChatUpdate'
import { ChatVideoRoom } from '@model/ChatVideoRoom'
import { ChatVideoServerChoice } from '@model/ChatVideoServerChoice'
import {
  ApiVersionType,
  acceptChatMessageImage,
  ChatMessageImageAccepted,
  CommandClientFactory,
  chatMessageNotify,
  V1_0_CommandClient,
} from 'core'
import {
  ChatConversationSelect,
  ChatMemberRef,
  ChatMessageImageInfo,
  ChatMessageSelect,
  dbFindDirectChatConversation,
  dbSelectChatConversationMember,
  dbSelectChatMessageImageForMember,
  dbSelectChatMessageImageInfos,
  dbSelectChatMessagesPage,
  dbSelectChatMessagesSince,
  dbSelectChatUnreadSummary,
  dbUpdateChatConversationMemberLastRead,
  dbUpdateChatConversationMemberMuted,
  findUserByUuids,
  getCommunityByUuid,
  getCommunityWithFederatedCommunityByIdentifier,
} from 'database'
import { getLogger } from 'log4js'
import { uuidv4Schema } from 'shared'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { chatVideoServerPool } from '@/apis/jitsi/chatVideoServerPool'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  CHAT_IMAGES_MAX_PER_REQUEST,
  CHAT_MESSAGE_PAGES_MAX_PER_REQUEST,
  CHAT_MESSAGES_PAGE_DEFAULT,
  CHAT_UPDATE_MESSAGES_DEFAULT,
  CHAT_UPDATES_MAX_PER_REQUEST,
  isSameChatMember,
} from '@/data/ChatConversation.logic'
import {
  CHAT_VIDEO_ROOMS_MAX_PER_REQUEST,
  ChatVideoServer,
  chatVideoRoomName,
} from '@/data/ChatVideoServer.logic'
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
 * The messages of these rows as `caller` reads them, each with what is known about its pictures
 * (P7) -- read in ONE query for all of them, never one per message. A picture is matched to its
 * message by the message's uuid the way the columns compare it, without regard to case.
 */
const chatMessagesOf = async (
  rows: ChatMessageSelect[],
  caller: ChatMemberRef,
): Promise<ChatMessage[]> => {
  const infos = await dbSelectChatMessageImageInfos(rows.map((row) => row.messageUuid))
  const byMessage = new Map<string, ChatMessageImageInfo[]>()
  for (const info of infos) {
    const key = info.messageUuid.toLowerCase()
    byMessage.set(key, [...(byMessage.get(key) ?? []), info])
  }
  return rows.map(
    (row) => new ChatMessage(row, caller, byMessage.get(row.messageUuid.toLowerCase()) ?? []),
  )
}

/**
 * The picture of a message as it came in (acceptChatMessageImage), or the refusal:
 * CHAT_IMAGE_NOT_ACCEPTED with the reason -- EMPTY, TOO_LARGE, NOT_JPEG or SIZE. The log gets
 * the numbers, never the picture.
 */
const acceptedPicture = (image: ChatImageInput): ChatMessageImageAccepted => {
  const accepted = acceptChatMessageImage(image)
  if (!accepted.success) {
    const { reason, bytes, width, height } = accepted.error
    throw new LogError(`CHAT_IMAGE_NOT_ACCEPTED: ${reason}`, { bytes, width, height })
  }
  return accepted.value
}

/** A fresh room on `server`; the log gets the host, never the room name. */
const roomOn = ({ baseUrl, host, operator, prefix }: ChatVideoServer): ChatVideoRoom => {
  createLogger().trace(`chat video room handed out on ${host}`)
  return new ChatVideoRoom(`${baseUrl}${chatVideoRoomName(prefix)}`, host, operator)
}

/**
 * The chat: the thread with one contact and the caller's marks in it -- the read pointer and
 * the mute mark (P2a, P3a) --, writing to that contact (P3a), what is new across all the
 * caller's conversations (P4a), and a video room to send (V1), on a server the member may
 * choose (V5). The form "send an e-mail" still writes through sendEmail, into the same
 * conversation (P1).
 *
 * What this resolver writes to the log carries no subject, no text, no room name and no picture:
 * a refused page, update or room budget with its count, a refused message with its reason, a
 * refused picture with its reason and its numbers, a failed delivery with the other side's
 * answer, and the host a room was handed out on.
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
      await chatMessagesOf(page.messages, caller),
      page.hasMore,
      Boolean(me?.mutedAt),
    )
  }

  /**
   * What is new in the chat for the caller since `afterId` -- the one query the wallet asks on
   * its beat (E-017): the new messages of all the caller's conversations, oldest first and the
   * caller's own among them, the id to go on from, and in how many conversations something
   * waits unread, for the mark in the menu.
   *
   * Without `afterId` the caller stands nowhere yet: the answer says where they stand and hands
   * out no messages -- the threads come with the contact window, as before.
   *
   * ⛔ First where the caller stands, then what is new: one read after the other, not side by
   * side. Without messages `latestId` is the highest id the first read saw, and the wallet goes on
   * from there. Side by side, the first read could see a message that arrived after the second
   * one had looked, and the wallet would move past it without ever getting it. One after the
   * other, the second read starts later and sees what the first one saw.
   *
   * ⚠️ What `latestId` does not promise: that nothing with a lower id comes later. InnoDB hands
   * out the id when a row is inserted and shows the row when it is committed, and two messages
   * written at the same moment can be committed in the other order. A call that runs in between
   * hands out the higher one; the lower one lies below the cursor from then on and this query
   * never hands it out. It is in the thread all the same (chatMessagesWithMember) and shows the
   * next time the thread loads. Accepted as a known limit (#3977): measured, 1 message in 6,000
   * with ten writers at once and a reader asking without pause -- the wallet asks every few
   * seconds. Should groups (P5) make writing at the same moment common, `latestId` can be held
   * back over messages younger than a minute. The wallet is to drop what comes twice by its id
   * (P4b); then it needs no change for that.
   */
  @Authorized([RIGHTS.READ_OWN_CHAT])
  @Query(() => ChatUpdate)
  async newChatMessagesSince(
    @Args() { afterId, limit }: NewChatMessagesSinceArgs,
    @Ctx() context: Context,
  ): Promise<ChatUpdate> {
    // ⛔ Counted in the HTTP request's budget before anything is looked up, as the pages are: a
    // document may repeat this field under any number of aliases (RequestBudget).
    context.requestBudget.chatUpdatesServed += 1
    const served = context.requestBudget.chatUpdatesServed
    if (served > CHAT_UPDATES_MAX_PER_REQUEST) {
      throw new LogError('Too many chat updates requested at once', served)
    }
    const caller = callerOf(context)
    const summary = await dbSelectChatUnreadSummary(caller)
    if (afterId === null || afterId === undefined) {
      return new ChatUpdate(summary.latestId, summary.unreadConversations, [], false)
    }
    const news = await dbSelectChatMessagesSince(caller, {
      afterId,
      limit: limit ?? CHAT_UPDATE_MESSAGES_DEFAULT,
    })
    const last = news.messages[news.messages.length - 1]
    return new ChatUpdate(
      // The last one handed out -- under hasMore not the highest there is, so that the next call
      // goes on right after it.
      last ? last.id : summary.latestId,
      summary.unreadConversations,
      await chatMessagesOf(news.messages, caller),
      news.hasMore,
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
   * A message may carry a picture (P7), checked before anything else happens -- the way the
   * avatar is checked -- and refused as CHAT_IMAGE_NOT_ACCEPTED with the reason, nothing filed.
   * Within this community only, until the next step (P7b): to a member of another one, a message
   * with a picture is refused, IMAGE_ACROSS_BORDER, before anything is filed or sent.
   *
   * Whether it goes out as a mail as well: the first message between the two always does
   * (E-024, decided here against this server's own table, before anything is filed); after it,
   * what the sender asked for -- unless the recipient muted the conversation. The copy carries
   * the wish and what became of it (E-034, `mailState`): MAILED, or MUTED where the recipient's
   * quiet held the mail back.
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
    @Args() { ref, body, notify: requested, image }: SendChatMessageArgs,
    @Ctx() context: Context,
  ): Promise<ChatMessage> {
    const images = image ? [acceptedPicture(image)] : []
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
        letter: false,
        images,
      })
      if (!stored) {
        throw new LogError('CHAT_MESSAGE_NOT_SENT: NOT_STORED')
      }
      const [copy] = await chatMessagesOf([stored], caller)
      return copy
    }

    // ⛔ A picture does not cross the border yet: the command carries none, and how one gets to
    // the other server is the next step (P7b). Until then refused here, before anything is filed
    // or sent.
    if (images.length > 0) {
      throw new LogError('CHAT_MESSAGE_NOT_SENT: IMAGE_ACROSS_BORDER', other.communityUuid)
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
      letter: false,
    })
    if (!stored) {
      throw new LogError('CHAT_MESSAGE_NOT_SENT: NOT_STORED')
    }
    if (error !== null) {
      createLogger().warn(
        `chat message not delivered: message_uuid=${stored.messageUuid} (${error})`,
      )
    }
    const [copy] = await chatMessagesOf([stored], caller)
    return copy
  }

  /**
   * A picture of a chat message (P7), as base64: for a member of the conversation of its
   * message, while the message is not marked deleted (dbSelectChatMessageImageForMember). Null
   * for everything else -- no such picture, somebody who is not in the conversation, a deleted
   * message, something that is no uuid --, with nothing that tells these apart.
   *
   * The way the avatar's picture comes (memberAvatarFull; E-041, point 5): GraphQL, base64, one
   * picture per call. An address of its own with a cache header belongs to Gradido 2.
   *
   * Nothing of the picture is written to the log; the request log leaves the answer out
   * (plugins.ts).
   */
  @Authorized([RIGHTS.READ_OWN_CHAT])
  @Query(() => String, { nullable: true })
  async chatMessageImage(
    @Arg('imageUuid', () => String) imageUuid: string,
    @Ctx() context: Context,
  ): Promise<string | null> {
    // ⛔ Counted in the HTTP request's budget before anything is read: a document may repeat this
    // field under any number of aliases, some 55 KB a picture (RequestBudget).
    context.requestBudget.chatImagesServed += 1
    const served = context.requestBudget.chatImagesServed
    if (served > CHAT_IMAGES_MAX_PER_REQUEST) {
      throw new LogError('Too many chat pictures requested at once', served)
    }
    if (!uuidv4Schema.safeParse(imageUuid).success) {
      return null
    }
    const found = await dbSelectChatMessageImageForMember(imageUuid, callerOf(context))
    return found.success ? found.value.toString('base64') : null
  }

  /**
   * Mutes the conversation with `ref` for the caller, or lifts it (E-024): while it is muted, no
   * mail about a chat message in it reaches the caller, whatever the other member asks for. A
   * letter from the form "send an e-mail" still does -- the quiet is about chat messages
   * (E-034). The caller's own mark and nobody else's. The other member learns of it only where
   * it held back a mail they asked for: their copy says MUTED (E-034).
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

  /**
   * A fresh video room for a call (V1): on one of the servers that passed the last check,
   * each of them equally likely, named with the server's prefix and 12 random characters. The
   * check runs in the process every ten minutes (chatVideoServerPool), never in this request.
   * Nothing is stored and nobody is named: the wallet sends the address as an ordinary chat
   * message (V2), and the room is open to whoever has it.
   *
   * Behind SEND_CHAT_MESSAGE, because the room is asked for to be sent: an account that may not
   * write may not start a call either (RESTRICTED_WHILE_UNCONFIRMED).
   *
   * No server passed the last check, or the first check after a start is not through yet:
   * CHAT_VIDEO_NO_SERVER. The log gets the host, never the room name -- whoever knows it can
   * join the call.
   *
   * With `serverId` (V5): on the server the member chose -- one of chatVideoServerChoices -- and
   * on no other. Where that one is no longer to be had (switched off, not answering since the
   * choice was shown, gone from the list): CHAT_VIDEO_SERVER_UNAVAILABLE, and the wallet says so.
   */
  @Authorized([RIGHTS.SEND_CHAT_MESSAGE])
  @Query(() => ChatVideoRoom)
  chatVideoRoom(@Args() { serverId }: ChatVideoRoomArgs, @Ctx() context: Context): ChatVideoRoom {
    // ⛔ Counted in the HTTP request's budget, as the pages are: a document may repeat this field
    // under any number of aliases (RequestBudget).
    context.requestBudget.chatVideoRoomsServed += 1
    const served = context.requestBudget.chatVideoRoomsServed
    if (served > CHAT_VIDEO_ROOMS_MAX_PER_REQUEST) {
      throw new LogError('Too many chat video rooms requested at once', served)
    }
    if (serverId != null) {
      const wanted = chatVideoServerPool.pickServer(serverId)
      if (!wanted) {
        throw new LogError('CHAT_VIDEO_SERVER_UNAVAILABLE', serverId)
      }
      return roomOn(wanted.server)
    }
    const chosen = chatVideoServerPool.pick()
    if (!chosen) {
      throw new LogError('CHAT_VIDEO_NO_SERVER')
    }
    return roomOn(chosen.server)
  }

  /**
   * The servers a member may choose for a call (V5): those chatVideoRoom hands rooms out on
   * right now -- ticked in the admin page's list and passed the last check --, in the list's
   * order. Empty where there is none, as before the first check is through. Asked afresh
   * whenever the choice is shown: a check every ten minutes may take a server out or bring it
   * back.
   *
   * Behind SEND_CHAT_MESSAGE, as the room is: the choice is for a call to be started.
   */
  @Authorized([RIGHTS.SEND_CHAT_MESSAGE])
  @Query(() => [ChatVideoServerChoice])
  chatVideoServerChoices(): ChatVideoServerChoice[] {
    return chatVideoServerPool
      .choices()
      .map(({ id, server }) => new ChatVideoServerChoice(id, server.host, server.operator))
  }
}
