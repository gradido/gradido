// AI-GENERATED — not an architecture reference
import { ChatMessagesWithMemberArgs } from '@arg/ChatMessagesWithMemberArgs'
import { MarkChatConversationReadArgs } from '@arg/MarkChatConversationReadArgs'
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { ChatMessage } from '@model/ChatMessage'
import { ChatMessagePage } from '@model/ChatMessagePage'
import {
  ChatConversationSelect,
  ChatMemberRef,
  dbFindDirectChatConversation,
  dbSelectChatMessagesPage,
  dbUpdateChatConversationMemberLastRead,
} from 'database'
import { Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { CHAT_MESSAGES_PAGE_DEFAULT, isSameChatMember } from '@/data/ChatConversation.logic'
import { Context, getUser } from '@/server/context'
import { resolveCommunityUuid } from './util/communities'

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
 * The chat, read side (P2a): the thread with one contact, and the caller's read pointer in
 * it. Writing still goes through sendEmail (P1 files every message it sends).
 *
 * Neither logs a subject or a text; nothing here logs at all.
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
    const caller = callerOf(context)
    const conversation = await directChatConversationWith(caller, ref)
    if (!conversation) {
      return new ChatMessagePage([], false)
    }
    const page = await dbSelectChatMessagesPage(conversation.id, {
      before: before ?? undefined,
      limit: limit ?? CHAT_MESSAGES_PAGE_DEFAULT,
    })
    return new ChatMessagePage(
      page.messages.map((row) => new ChatMessage(row, caller)),
      page.hasMore,
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
}
