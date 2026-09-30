// AI-GENERATED — not an architecture reference
import { ForwardChatMessageArgs } from '@arg/ForwardChatMessageArgs'
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { ChatMessage } from '@model/ChatMessage'
import { ChatMessageImageAccepted, chatMessageNotify } from 'core'
import {
  ChatConversationSelect,
  ChatMemberRef,
  ChatMessageNotify,
  ChatMessageSelect,
  User as DbUser,
  dbFindDirectChatConversation,
  dbSelectChatMessageForMember,
  dbSelectChatMessageImageForMember,
  dbSelectChatMessageImageInfos,
  dbSelectUsersByUuids,
  findUserByUuids,
} from 'database'
import { getLogger } from 'log4js'
import { publicAlias } from 'shared'
import { Args, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { CHAT_FORWARD_MAX_TARGETS, isSameChatMember } from '@/data/ChatConversation.logic'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { storeChatGroupMessage } from './util/chatGroupDelivery'
import { groupOfCaller } from './util/chatGroupOfCaller'
import { chatMemberKey } from './util/chatMemberUsers'
import { deliverChatMessageLocally } from './util/chatMessageDelivery'
import { chatMessagesOf } from './util/chatMessagesOf'
import { callerOf } from './util/chatRequest'
import { isHomeCommunity, resolveCommunityUuid } from './util/communities'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ChatForwardResolver`)

/** The members named, each once, by their pair -- a null community is this one's. */
const membersOf = async (refs: MemberAvatarRefInput[]): Promise<ChatMemberRef[]> => {
  const unique = new Map<string, ChatMemberRef>()
  for (const ref of refs) {
    const member = {
      communityUuid: await resolveCommunityUuid(ref.communityUuid),
      gradidoId: ref.gradidoID,
    }
    unique.set(chatMemberKey(member), member)
  }
  return [...unique.values()]
}

/**
 * Who wrote the words of a message first (E-059): the first writer a forwarded copy carries --
 * through several forwardings the one who wrote them --, else its sender.
 */
const firstWriterOf = (message: ChatMessageSelect): ChatMemberRef =>
  message.forwardedFromCommunityUuid !== null && message.forwardedFromGradidoId !== null
    ? {
        communityUuid: message.forwardedFromCommunityUuid,
        gradidoId: message.forwardedFromGradidoId,
      }
    : { communityUuid: message.senderCommunityUuid, gradidoId: message.senderGradidoId }

/**
 * The name the mail gives the first writer -- the name every mail gives a member (publicAlias) --,
 * or null where nobody by that pair is known here: the mail says "forwarded" then, and the thread
 * names nobody either (chatMessagesOf).
 */
const nameOf = async (writer: ChatMemberRef): Promise<string | null> => {
  const [row] = await dbSelectUsersByUuids([writer])
  return row && row.deletedAt === null ? publicAlias(row.alias, row.gradidoId) : null
}

/**
 * The pictures of a message, as the copy files them again -- read for the caller, who is in the
 * message's conversation, the way the thread hands them out. Null where one of them could not be
 * read: a caption is not forwarded without its picture.
 */
const picturesOf = async (
  message: ChatMessageSelect,
  caller: ChatMemberRef,
): Promise<ChatMessageImageAccepted[] | null> => {
  const infos = await dbSelectChatMessageImageInfos([message.messageUuid])
  const pictures: ChatMessageImageAccepted[] = []
  for (const info of [...infos].sort((a, b) => a.position - b.position)) {
    const read = await dbSelectChatMessageImageForMember(info.imageUuid, caller)
    if (!read.success) {
      return null
    }
    pictures.push({ image: read.value, width: info.width, height: info.height })
  }
  return pictures
}

/**
 * Forwarding a message (Bernd, 30.09.2026, E-059): a member passes a message of one of their
 * conversations on into others -- groups they are in, and members of this community.
 */
@Resolver()
export class ChatForwardResolver {
  /**
   * Files a copy of the message in every conversation named -- its subject, its text and its
   * picture, the picture filed again on this server rather than sent up once more -- and hands
   * back the caller's copies. Each copy is the caller's message and carries who wrote the words
   * first; the thread says "Weitergeleitet von [Nutzername]" over it (E-059 F2), and nobody's name
   * where the caller forwards words of their own. The caller's own words, where there are any
   * (F4), follow every copy as a message of their own.
   *
   * What the caller may forward is what they can read in a thread of theirs: a message of a
   * conversation they are in, not marked deleted (dbSelectChatMessageForMember). A transfer has
   * no row to forward. Into a group the caller is in, a copy goes without an announcement; to a
   * member, the rule of every message: the first of a pair by mail in any case (E-024), later
   * ones where the box is ticked -- the mail says it was forwarded, from whom, and carries the
   * words under it (one mail, not two).
   *
   * Refused as CHAT_MESSAGE_NOT_FORWARDED with the reason, before anything is filed: TARGETS
   * (none, or more than CHAT_FORWARD_MAX_TARGETS together, F3), UNKNOWN_MESSAGE, UNKNOWN_GROUP
   * (none, or one the caller is not in -- the same answer for both, as for the group's own
   * questions), TO_ONESELF, OTHER_COMMUNITY (across the border with P6, F5), UNKNOWN_RECIPIENT.
   * ⚠️ A copy that could not be filed in one conversation does not hold up the others: the caller
   * gets the copies that were filed, and the wallet counts them.
   *
   * The log gets the message's uuid and the number of copies, never a text or a name.
   */
  @Authorized([RIGHTS.SEND_CHAT_MESSAGE])
  @Mutation(() => [ChatMessage])
  async forwardChatMessage(
    @Args() { messageUuid, groupUuids, members, words, alsoByEmail }: ForwardChatMessageArgs,
    @Ctx() context: Context,
  ): Promise<ChatMessage[]> {
    const senderUser = getUser(context)
    const caller = callerOf(context)
    const groupKeys = [...new Set(groupUuids.map((groupUuid) => groupUuid.toLowerCase()))]
    const others = await membersOf(members)
    const count = groupKeys.length + others.length
    if (count === 0 || count > CHAT_FORWARD_MAX_TARGETS) {
      throw new LogError('CHAT_MESSAGE_NOT_FORWARDED: TARGETS', count)
    }
    const source = await dbSelectChatMessageForMember(messageUuid, caller)
    if (!source.success) {
      throw new LogError('CHAT_MESSAGE_NOT_FORWARDED: UNKNOWN_MESSAGE', messageUuid)
    }
    const message = source.value

    // Every conversation is checked before a copy is filed in any of them.
    const groups: ChatConversationSelect[] = []
    for (const groupUuid of groupKeys) {
      const found = await groupOfCaller(groupUuid, caller)
      if (!found) {
        throw new LogError('CHAT_MESSAGE_NOT_FORWARDED: UNKNOWN_GROUP', groupUuid)
      }
      groups.push(found.group)
    }
    const recipients: { other: ChatMemberRef; user: DbUser }[] = []
    for (const other of others) {
      if (isSameChatMember(caller, other)) {
        throw new LogError('CHAT_MESSAGE_NOT_FORWARDED: TO_ONESELF')
      }
      if (!(await isHomeCommunity(other.communityUuid))) {
        throw new LogError('CHAT_MESSAGE_NOT_FORWARDED: OTHER_COMMUNITY', other.communityUuid)
      }
      const user = await findUserByUuids(other.communityUuid, other.gradidoId)
      if (!user) {
        throw new LogError('CHAT_MESSAGE_NOT_FORWARDED: UNKNOWN_RECIPIENT', other.gradidoId)
      }
      recipients.push({ other, user })
    }
    const images = await picturesOf(message, caller)
    if (images === null) {
      throw new LogError('CHAT_MESSAGE_NOT_FORWARDED: UNKNOWN_MESSAGE', messageUuid)
    }

    const from = firstWriterOf(message)
    const fromAlias = isSameChatMember(from, caller) ? null : await nameOf(from)
    const said = words && words.trim() !== '' ? words : null
    const copies: ChatMessageSelect[] = []
    for (const group of groups) {
      const copy = await storeChatGroupMessage({
        group,
        sender: caller,
        subject: message.subject,
        body: message.body,
        announce: false,
        images,
        forwardedFrom: from,
      })
      if (!copy) {
        continue
      }
      copies.push(copy)
      if (said) {
        await storeChatGroupMessage({
          group,
          sender: caller,
          body: said,
          announce: false,
          images: [],
        })
      }
    }
    for (const { other, user } of recipients) {
      const notify = chatMessageNotify(
        alsoByEmail ? ChatMessageNotify.EMAIL : ChatMessageNotify.NONE,
        (await dbFindDirectChatConversation(caller, other)) !== null,
      )
      const copy = await deliverChatMessageLocally({
        senderUser,
        recipientUser: user,
        subject: message.subject,
        body: message.body,
        notify,
        requireStored: true,
        letter: false,
        images,
        forwarded: { from, fromAlias, words: said },
      })
      if (!copy) {
        continue
      }
      copies.push(copy)
      if (said) {
        // In the mail about the copy already: no second one.
        await deliverChatMessageLocally({
          senderUser,
          recipientUser: user,
          subject: null,
          body: said,
          notify: ChatMessageNotify.NONE,
          requireStored: true,
          letter: false,
        })
      }
    }
    createLogger().info(
      `chat message forwarded: message_uuid=${message.messageUuid} copies=${copies.length} of ${count}`,
    )
    return chatMessagesOf(copies, caller)
  }
}
