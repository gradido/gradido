// AI-GENERATED — not an architecture reference
import { ChatGroupArgs } from '@arg/ChatGroupArgs'
import { ChatGroupMemberArgs } from '@arg/ChatGroupMemberArgs'
import { ChatGroupMembersArgs } from '@arg/ChatGroupMembersArgs'
import { ChatGroupMessagesArgs } from '@arg/ChatGroupMessagesArgs'
import { CreateChatGroupArgs } from '@arg/CreateChatGroupArgs'
import { MarkChatGroupReadArgs } from '@arg/MarkChatGroupReadArgs'
import { RenameChatGroupArgs } from '@arg/RenameChatGroupArgs'
import { SendChatGroupMessageArgs } from '@arg/SendChatGroupMessageArgs'
import { SetChatGroupModeratorArgs } from '@arg/SetChatGroupModeratorArgs'
import { SetChatGroupMutedArgs } from '@arg/SetChatGroupMutedArgs'
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { ChatGroup, ChatGroupOfMember } from '@model/ChatGroup'
import { ChatGroupMember } from '@model/ChatGroupMember'
import { ChatMessage } from '@model/ChatMessage'
import { ChatMessagePage } from '@model/ChatMessagePage'
import {
  ChatMemberRef,
  User as DbUser,
  dbDeleteChatConversationMember,
  dbInsertChatConversationMembers,
  dbInsertChatGroup,
  dbSelectChatConversationMember,
  dbSelectChatConversationMembers,
  dbSelectChatGroupsByMember,
  dbSelectChatMessagesPage,
  dbSelectContactsByUserId,
  dbSelectUsersByUuids,
  dbUpdateChatConversationMemberLastRead,
  dbUpdateChatConversationMemberMuted,
  dbUpdateChatConversationMemberRole,
  dbUpdateChatGroupTitle,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import { Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { v4 as uuidv4 } from 'uuid'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  CHAT_MESSAGE_PAGES_MAX_PER_REQUEST,
  CHAT_MESSAGES_PAGE_DEFAULT,
  isSameChatMember,
} from '@/data/ChatConversation.logic'
import {
  CHAT_GROUP_LISTS_MAX_PER_REQUEST,
  CHAT_GROUP_MAX_MEMBERS,
  CHAT_GROUP_MAX_MODERATORS,
  chatGroupSuccessor,
  chatGroupTitle,
  mayAnnounceInChatGroup,
  mayAppointChatGroupModerators,
  mayManageChatGroup,
  mayRemoveFromChatGroup,
} from '@/data/ChatGroup.logic'
import { isSameCommunity } from '@/data/Community.logic'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import {
  chatGroupAnnouncementRecipients,
  mailableChatMembers,
  mailChatGroupAdded,
  mailChatGroupAnnouncement,
  storeChatGroupMessage,
} from './util/chatGroupDelivery'
import { groupOfCaller, groupOfCallerOrFail } from './util/chatGroupOfCaller'
import { chatMemberKey, chatMemberUsers } from './util/chatMemberUsers'
import { chatMessagesOf } from './util/chatMessagesOf'
import { checkedReplyTo } from './util/chatReply'
import { acceptedPicture, callerOf } from './util/chatRequest'
import { resolveCommunityUuid } from './util/communities'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ChatGroupResolver`)

/**
 * The whole contact list, not a page of it: the check below needs every contact. The busiest
 * account had 713 when the list was measured (dbSelectContactsByUserId).
 */
const ALL_CONTACTS = Number.MAX_SAFE_INTEGER

/** One list of groups or of members more in the request's budget, or the refusal. */
const countGroupList = (context: Context): void => {
  // ⛔ Counted before anything is looked up: a document may repeat a field under any number of
  // aliases (RequestBudget in server/context.ts).
  context.requestBudget.chatGroupListsServed += 1
  const served = context.requestBudget.chatGroupListsServed
  if (served > CHAT_GROUP_LISTS_MAX_PER_REQUEST) {
    throw new LogError('Too many chat group lists requested at once', served)
  }
}

/**
 * The groups as ChatGroup models: the name of the community each lives in, and who opened each --
 * the users of all of them in one go (chatMemberUsers), never one query per group.
 */
const chatGroupsOf = async (groups: ChatGroupOfMember[]): Promise<ChatGroup[]> => {
  if (groups.length === 0) {
    return []
  }
  const founderOf = (group: ChatGroupOfMember): ChatMemberRef => ({
    communityUuid: group.createdByCommunityUuid,
    gradidoId: group.createdByGradidoId,
  })
  const [founders, home] = await Promise.all([
    chatMemberUsers(groups.map(founderOf)),
    getHomeCommunity(),
  ])
  return groups.map(
    (group) =>
      new ChatGroup(
        group,
        isSameCommunity(group.homeCommunityUuid, home?.communityUuid) ? (home?.name ?? null) : null,
        founders.get(chatMemberKey(founderOf(group))) ?? null,
      ),
  )
}

/** The caller's group with this id, as the list shows it. */
const chatGroupOfCaller = async (
  caller: ChatMemberRef,
  conversationId: number,
): Promise<ChatGroup> => {
  const group = (await dbSelectChatGroupsByMember(caller)).find(
    (candidate) => candidate.id === conversationId,
  )
  if (!group) {
    // The caller is in it -- put in or found there a moment ago: without their row, a bug.
    throw new LogError('CHAT_GROUP_NOT_FOUND right after writing it', conversationId)
  }
  const [model] = await chatGroupsOf([group])
  return model
}

/**
 * Hands a group whose members are left without an owner to its successor (chatGroupSuccessor,
 * E-050 F4): the longest-standing moderator, otherwise the longest-standing member. Nothing where
 * the group has an owner, or nobody left. `left` is who has just left it.
 *
 * ⛔ The repair for two members leaving at the same moment -- the owner, and the one it hands the
 * group to: that one can be gone by the time it is made owner, or leave right after it was, and
 * the group would keep its members and lose its owner for good -- nobody could name moderators
 * again. There is no lock to prevent it (nothing in the house runs a Drizzle transaction yet), so
 * every leave looks once more when it is done; whichever finishes last sees the group as it stays
 * (coderabbit on #4012).
 */
const handOwnerlessChatGroupOn = async (conversationId: number, left: ChatMemberRef) => {
  const members = await dbSelectChatConversationMembers(conversationId)
  if (members.some((member) => member.role === 'owner')) {
    return
  }
  const successor = chatGroupSuccessor(members, left)
  if (!successor) {
    return
  }
  // The successor can be gone by now too; its own leave looks again. Logged only where it happened.
  const handed = await dbUpdateChatConversationMemberRole(conversationId, successor, 'owner')
  if (handed.success) {
    createLogger().warn(
      `chat group without an owner handed on: conversation_id=${conversationId} to=${successor.gradidoId}`,
    )
  }
}

/**
 * The members `refs` name, checked for a group of this community (P5, E-049), each once and as
 * their users row spells their pair: a member of this community -- OTHER_COMMUNITY --, a contact
 * of the caller -- NOT_A_CONTACT: somebody they share an event with (KF-012), the whole contact
 * list read in one call, never one per member --, with an account that is not deleted --
 * UNKNOWN_MEMBER. The caller themselves is left out, and so is whoever is `alreadyIn` the group
 * (keys of chatMemberKey): nothing is asked about them, and nothing changes for them. Refused
 * with `refusal` and the reason; the log gets the member's gradido id.
 *
 * ⛔ Checked here, not only in the wallet: a call that goes round the wallet would otherwise take
 * strangers in, and each of them would get a mail (build plan, Falle 5).
 */
const checkedNewMembers = async (
  callerUser: DbUser,
  refs: MemberAvatarRefInput[],
  homeCommunityUuid: string,
  refusal: string,
  alreadyIn: Set<string> = new Set(),
): Promise<ChatMemberRef[]> => {
  const caller = { communityUuid: callerUser.communityUuid, gradidoId: callerUser.gradidoID }
  const wanted = new Map<string, ChatMemberRef>()
  for (const ref of refs) {
    // A null community is this one (resolveCommunityUuid, MemberAvatarRefInput).
    const member = {
      communityUuid: ref.communityUuid || homeCommunityUuid,
      gradidoId: ref.gradidoID,
    }
    if (!isSameCommunity(member.communityUuid.toLowerCase(), homeCommunityUuid.toLowerCase())) {
      throw new LogError(`${refusal}: OTHER_COMMUNITY`, member.gradidoId)
    }
    const key = chatMemberKey(member)
    if (key !== chatMemberKey(caller) && !alreadyIn.has(key)) {
      wanted.set(key, member)
    }
  }
  if (wanted.size === 0) {
    return []
  }

  const contacts = await dbSelectContactsByUserId(callerUser.id, {
    member: caller,
    limit: ALL_CONTACTS,
    offset: 0,
  })
  const contactKeys = new Set(
    contacts.contacts.flatMap((row) =>
      row.communityUuid
        ? [chatMemberKey({ communityUuid: row.communityUuid, gradidoId: row.gradidoId })]
        : [],
    ),
  )
  for (const [key, member] of wanted) {
    if (!contactKeys.has(key)) {
      throw new LogError(`${refusal}: NOT_A_CONTACT`, member.gradidoId)
    }
  }

  const rows = new Map(
    (await dbSelectUsersByUuids([...wanted.values()])).map((row) => [chatMemberKey(row), row]),
  )
  const members: ChatMemberRef[] = []
  for (const [key, member] of wanted) {
    const row = rows.get(key)
    if (!row || row.deletedAt !== null) {
      throw new LogError(`${refusal}: UNKNOWN_MEMBER`, member.gradidoId)
    }
    members.push({ communityUuid: row.communityUuid, gradidoId: row.gradidoId })
  }
  return members
}

/** The member a ref names, as the chat tables name members: a null community is this one. */
const memberOf = async (ref: MemberAvatarRefInput): Promise<ChatMemberRef> => ({
  communityUuid: await resolveCommunityUuid(ref.communityUuid),
  gradidoId: ref.gradidoID,
})

/**
 * The chat groups of a community (P5): opening one, taking members in and out, naming
 * moderators, renaming it, leaving it, the list of the caller's groups, their members, reading
 * and writing in them, and the caller's marks in them -- the read pointer and the mute mark
 * (E-024). A group lives within one community in P5; members of other communities
 * come with P6 (E-026).
 *
 * Who may do what in a group, their role there decides (ChatGroup.logic.ts). Who is not a member
 * of a group gets CHAT_GROUP_NOT_FOUND for it, as for a group that does not exist.
 *
 * What this resolver writes to the log carries no message text and no group name: a refusal with
 * its reason and a uuid or gradido id, a refused budget with its count.
 */
@Resolver()
export class ChatGroupResolver {
  /**
   * The caller's groups, newest activity first -- the latest message, or the opening of a group
   * without one --, each with the caller's own part in it and what waits unread for them.
   */
  @Authorized([RIGHTS.READ_OWN_CHAT])
  @Query(() => [ChatGroup])
  async chatGroups(@Ctx() context: Context): Promise<ChatGroup[]> {
    countGroupList(context)
    return chatGroupsOf(await dbSelectChatGroupsByMember(callerOf(context)))
  }

  /**
   * The members of a group the caller is in, longest-standing first, each with their part in it:
   * the same `User` model the contact list carries, for the names and the faces.
   */
  @Authorized([RIGHTS.READ_OWN_CHAT])
  @Query(() => [ChatGroupMember])
  async chatGroupMembers(
    @Args() { groupUuid }: ChatGroupArgs,
    @Ctx() context: Context,
  ): Promise<ChatGroupMember[]> {
    countGroupList(context)
    const { group } = await groupOfCallerOrFail(groupUuid, callerOf(context))
    const members = await dbSelectChatConversationMembers(group.id)
    const users = await chatMemberUsers(members)
    return members.flatMap((member) => {
      const user = users.get(chatMemberKey(member))
      if (!user) {
        // A member without a users row: none in P5, where every member is one of this community
        // -- a guard, so that one broken row does not cost the others the list.
        createLogger().warn(`chat group member ${member.gradidoId} has no users row, left out`)
        return []
      }
      return [new ChatGroupMember(user, member.role, member.joinedAt)]
    })
  }

  /**
   * The messages of a group the caller is in, a page at a time, oldest first -- as the thread with
   * one member (chatMessagesWithMember), and in the same budget. Each carries who wrote it
   * (`senderUser`), also somebody who has left since.
   */
  @Authorized([RIGHTS.READ_OWN_CHAT])
  @Query(() => ChatMessagePage)
  async chatGroupMessages(
    @Args() { groupUuid, before, limit }: ChatGroupMessagesArgs,
    @Ctx() context: Context,
  ): Promise<ChatMessagePage> {
    // ⛔ Counted before anything is looked up, together with the pages of the threads.
    context.requestBudget.chatMessagePagesServed += 1
    const served = context.requestBudget.chatMessagePagesServed
    if (served > CHAT_MESSAGE_PAGES_MAX_PER_REQUEST) {
      throw new LogError('Too many chat pages requested at once', served)
    }
    const caller = callerOf(context)
    const { group, me } = await groupOfCallerOrFail(groupUuid, caller)
    const page = await dbSelectChatMessagesPage(group.id, {
      before: before ?? undefined,
      limit: limit ?? CHAT_MESSAGES_PAGE_DEFAULT,
    })
    return new ChatMessagePage(
      await chatMessagesOf(page.messages, caller),
      page.hasMore,
      me.mutedAt !== null,
    )
  }

  /**
   * Opens a group (P5): the caller is its owner, the members they name go in as members -- from
   * their own contacts, within this community (E-049) -- and each of them gets the mail "you are
   * in the group now". Hands back the group as the caller's list shows it.
   *
   * Refused as CHAT_GROUP_NOT_CREATED with the reason, before anything is filed: TITLE (nothing
   * left of the name, or longer than CHAT_GROUP_TITLE_MAX), OTHER_COMMUNITY, NOT_A_CONTACT,
   * UNKNOWN_MEMBER (checkedNewMembers), FULL (more than CHAT_GROUP_MAX_MEMBERS with the owner).
   * A group of the owner alone is a group: they take the others in later.
   *
   * ⚠️ The group, the owner and the members are three writes, not one transaction: nothing in
   * the house runs a Drizzle transaction yet. Where the members fail, the group stands with its
   * owner, who can take them in again.
   *
   * The mails are not waited for (build plan 4.4).
   */
  @Authorized([RIGHTS.MANAGE_CHAT_GROUPS])
  @Mutation(() => ChatGroup)
  async createChatGroup(
    @Args() { title: typed, members: refs }: CreateChatGroupArgs,
    @Ctx() context: Context,
  ): Promise<ChatGroup> {
    const title = chatGroupTitle(typed)
    if (title === null) {
      throw new LogError('CHAT_GROUP_NOT_CREATED: TITLE')
    }
    const home = await getHomeCommunity()
    if (!home?.communityUuid) {
      throw new LogError('Home community has no uuid, cannot open a chat group')
    }
    const callerUser = getUser(context)
    const caller = callerOf(context)
    const members = await checkedNewMembers(
      callerUser,
      refs,
      home.communityUuid,
      'CHAT_GROUP_NOT_CREATED',
    )
    if (members.length + 1 > CHAT_GROUP_MAX_MEMBERS) {
      throw new LogError('CHAT_GROUP_NOT_CREATED: FULL', members.length + 1)
    }
    // Read before anything is filed, as the recipients of an announcement are.
    const added = await mailableChatMembers(members)

    const group = await dbInsertChatGroup({
      groupUuid: uuidv4(),
      title,
      homeCommunityUuid: home.communityUuid,
      createdBy: caller,
    })
    await dbInsertChatConversationMembers(group.id, [caller], 'owner')
    await dbInsertChatConversationMembers(group.id, members)
    createLogger().info(
      `chat group opened: group=${group.conversationUuid} conversation_id=${group.id} members=${members.length + 1}`,
    )

    // biome-ignore lint/complexity/noVoid: the mails follow, the request does not wait for them
    void mailChatGroupAdded({ group, adder: callerUser, added, memberCount: members.length + 1 })
    return chatGroupOfCaller(caller, group.id)
  }

  /**
   * Writes a message to a group the caller is in (P5) and hands back the sender's own copy. Every
   * member may write; an announcement -- mailed to every member but the sender who has not muted
   * the group -- only its owner and its moderators (E-050 F5): from anybody else it is refused,
   * CHAT_MESSAGE_NOT_SENT: NOT_ALLOWED, and nothing is filed.
   *
   * A message may carry a picture (P7), checked before anything else happens, as in the chat with
   * one member. ⛔ The row IS the message: what could not be filed was not sent
   * (CHAT_MESSAGE_NOT_SENT: NOT_STORED), and no mail goes out for it.
   *
   * The copy says what the sender asked for (`notify`), never who got a mail: the mails are not
   * waited for, and who muted the group is each member's own business (E-024).
   *
   * `replyTo`: the message of this group the message answers (checkedReplyTo); anything else is
   * refused, CHAT_MESSAGE_NOT_SENT: UNKNOWN_REPLY, before anything is filed.
   */
  @Authorized([RIGHTS.SEND_CHAT_MESSAGE])
  @Mutation(() => ChatMessage)
  async sendChatGroupMessage(
    @Args() { groupUuid, body, announce, image, replyTo }: SendChatGroupMessageArgs,
    @Ctx() context: Context,
  ): Promise<ChatMessage> {
    const images = image ? [await acceptedPicture(image, context)] : []
    const senderUser = getUser(context)
    const caller = callerOf(context)
    const { group, me } = await groupOfCallerOrFail(groupUuid, caller)
    if (announce && !mayAnnounceInChatGroup(me.role)) {
      throw new LogError('CHAT_MESSAGE_NOT_SENT: NOT_ALLOWED', groupUuid)
    }
    // Read before the message is filed: a failure here files nothing, rather than a message
    // whose sender is told it was not sent.
    const recipients = announce ? await chatGroupAnnouncementRecipients(group, caller) : []
    const replyToMessageUuid = await checkedReplyTo(replyTo, caller, group.id)
    const stored = await storeChatGroupMessage({
      group,
      sender: caller,
      body,
      announce,
      images,
      replyToMessageUuid,
    })
    if (!stored) {
      throw new LogError('CHAT_MESSAGE_NOT_SENT: NOT_STORED')
    }
    if (announce) {
      // biome-ignore lint/complexity/noVoid: the mails follow, the request does not wait for them
      void mailChatGroupAnnouncement({
        group,
        senderUser,
        recipients,
        body,
        hasImage: images.length > 0,
      })
    }
    const [copy] = await chatMessagesOf([stored], caller)
    return copy
  }

  /**
   * Takes members into a group (P5): for its owner and its moderators (E-050 F4), from the
   * caller's own contacts within this community (E-049), checked as for opening one
   * (checkedNewMembers). Whoever is in the group already is left as they are, and gets no mail;
   * the others get "you are in the group now". They read what was written before they came, and
   * none of it counts as unread for them: their read pointer starts at the latest message.
   * Hands back the group as the caller's list shows it.
   *
   * Refused as CHAT_GROUP_NOT_CHANGED with the reason, before anything is written: NOT_ALLOWED
   * (a plain member), OTHER_COMMUNITY, NOT_A_CONTACT, UNKNOWN_MEMBER, FULL (more than
   * CHAT_GROUP_MAX_MEMBERS together). ⚠️ Counted before the new members are filed: two takings-in
   * at the same moment can pass the cap by a few -- accepted, as the merker limit of P4a is.
   *
   * The mails are not waited for (build plan 4.4).
   */
  @Authorized([RIGHTS.MANAGE_CHAT_GROUPS])
  @Mutation(() => ChatGroup)
  async addChatGroupMembers(
    @Args() { groupUuid, members: refs }: ChatGroupMembersArgs,
    @Ctx() context: Context,
  ): Promise<ChatGroup> {
    const callerUser = getUser(context)
    const caller = callerOf(context)
    const { group, me } = await groupOfCallerOrFail(groupUuid, caller)
    if (!mayManageChatGroup(me.role)) {
      throw new LogError('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED', groupUuid)
    }
    const home = await getHomeCommunity()
    if (!home?.communityUuid) {
      throw new LogError('Home community has no uuid, cannot take members into a chat group')
    }
    const current = await dbSelectChatConversationMembers(group.id)
    const members = await checkedNewMembers(
      callerUser,
      refs,
      home.communityUuid,
      'CHAT_GROUP_NOT_CHANGED',
      new Set(current.map(chatMemberKey)),
    )
    if (members.length === 0) {
      return chatGroupOfCaller(caller, group.id)
    }
    const memberCount = current.length + members.length
    if (memberCount > CHAT_GROUP_MAX_MEMBERS) {
      throw new LogError('CHAT_GROUP_NOT_CHANGED: FULL', memberCount)
    }
    // Read before anything is written, as the recipients of an announcement are.
    const added = await mailableChatMembers(members)
    const [latest] = (await dbSelectChatMessagesPage(group.id, { limit: 1 })).messages

    await dbInsertChatConversationMembers(group.id, members)
    if (latest) {
      for (const member of members) {
        await dbUpdateChatConversationMemberLastRead(group.id, member, latest.id)
      }
    }
    createLogger().info(
      `chat group members taken in: group=${group.conversationUuid} added=${members.length} members=${memberCount}`,
    )
    // biome-ignore lint/complexity/noVoid: the mails follow, the request does not wait for them
    void mailChatGroupAdded({ group, adder: callerUser, added, memberCount })
    return chatGroupOfCaller(caller, group.id)
  }

  /**
   * Takes a member out of a group (E-050 F4): the owner anybody else, a moderator plain members
   * only (mayRemoveFromChatGroup). Their messages stay in the group, under their name; the group
   * and its pictures are closed to them from then on. No mail.
   *
   * Refused as CHAT_GROUP_NOT_CHANGED with the reason: NOT_A_MEMBER, NOT_ALLOWED -- also for the
   * caller themselves, by the same rule: nobody takes out somebody of their own part. They leave
   * instead (leaveChatGroup), the owner with a successor.
   */
  @Authorized([RIGHTS.MANAGE_CHAT_GROUPS])
  @Mutation(() => Boolean)
  async removeChatGroupMember(
    @Args() { groupUuid, member: ref }: ChatGroupMemberArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const caller = callerOf(context)
    const { group, me } = await groupOfCallerOrFail(groupUuid, caller)
    const target = await memberOf(ref)
    if (!mayManageChatGroup(me.role)) {
      throw new LogError('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED', groupUuid)
    }
    const row = await dbSelectChatConversationMember(group.id, target)
    if (!row) {
      throw new LogError('CHAT_GROUP_NOT_CHANGED: NOT_A_MEMBER', target.gradidoId)
    }
    if (!mayRemoveFromChatGroup(me.role, row.role)) {
      throw new LogError('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED', groupUuid)
    }
    return (
      await dbDeleteChatConversationMember(group.id, {
        communityUuid: row.communityUuid,
        gradidoId: row.gradidoId,
      })
    ).success
  }

  /**
   * The caller leaves a group -- every member may (E-049). Where the owner leaves, the group goes
   * to the longest-standing moderator, otherwise to the longest-standing member
   * (chatGroupSuccessor, E-050 F4), and that before the owner's row is taken out. Where the owner
   * was the last one, the group stays behind without anybody, seen by nobody. False where the
   * caller is not in the group; nothing is written then.
   *
   * Every leave, the owner's or not, then looks whether the group still has an owner and hands it
   * on where it has none (handOwnerlessChatGroupOn): two leaves at the same moment can otherwise
   * take the owner and the successor out together.
   *
   * Behind READ_OWN_CHAT, not MANAGE_CHAT_GROUPS: it takes out the caller's own row and mails
   * nobody -- an account with an unconfirmed address may leave, as it may mute.
   */
  @Authorized([RIGHTS.READ_OWN_CHAT])
  @Mutation(() => Boolean)
  async leaveChatGroup(
    @Args() { groupUuid }: ChatGroupArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const caller = callerOf(context)
    const found = await groupOfCaller(groupUuid, caller)
    if (!found) {
      return false
    }
    if (found.me.role === 'owner') {
      const successor = chatGroupSuccessor(
        await dbSelectChatConversationMembers(found.group.id),
        caller,
      )
      if (successor) {
        await dbUpdateChatConversationMemberRole(found.group.id, successor, 'owner')
      }
    }
    const left = await dbDeleteChatConversationMember(found.group.id, caller)
    await handOwnerlessChatGroupOn(found.group.id, caller)
    return left.success
  }

  /**
   * Makes a member of a group a moderator, or a plain member again (E-050 F4): only the owner,
   * and never more than CHAT_GROUP_MAX_MODERATORS beside them. A member who has that part already
   * keeps it, and nothing is written.
   *
   * Refused as CHAT_GROUP_NOT_CHANGED with the reason: NOT_ALLOWED (anybody but the owner, and
   * the owner's own part), NOT_A_MEMBER, TOO_MANY_MODERATORS.
   */
  @Authorized([RIGHTS.MANAGE_CHAT_GROUPS])
  @Mutation(() => Boolean)
  async setChatGroupModerator(
    @Args() { groupUuid, member: ref, moderator }: SetChatGroupModeratorArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const caller = callerOf(context)
    const { group, me } = await groupOfCallerOrFail(groupUuid, caller)
    if (!mayAppointChatGroupModerators(me.role)) {
      throw new LogError('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED', groupUuid)
    }
    const target = await memberOf(ref)
    const members = await dbSelectChatConversationMembers(group.id)
    const row = members.find((member) => isSameChatMember(member, target))
    if (!row) {
      throw new LogError('CHAT_GROUP_NOT_CHANGED: NOT_A_MEMBER', target.gradidoId)
    }
    if (row.role === 'owner') {
      throw new LogError('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED', groupUuid)
    }
    const role = moderator ? 'moderator' : 'member'
    if (row.role === role) {
      return true
    }
    const moderators = members.filter((member) => member.role === 'moderator').length
    if (moderator && moderators >= CHAT_GROUP_MAX_MODERATORS) {
      throw new LogError('CHAT_GROUP_NOT_CHANGED: TOO_MANY_MODERATORS', moderators)
    }
    return (await dbUpdateChatConversationMemberRole(group.id, row, role)).success
  }

  /**
   * Gives a group another name (E-050 F4): its owner and its moderators. The name is kept as
   * chatGroupTitle keeps it; refused as CHAT_GROUP_NOT_CHANGED: TITLE where nothing is left of it
   * or it is too long, NOT_ALLOWED for a plain member. Hands back the group as the caller's list
   * shows it. Nobody is mailed.
   */
  @Authorized([RIGHTS.MANAGE_CHAT_GROUPS])
  @Mutation(() => ChatGroup)
  async renameChatGroup(
    @Args() { groupUuid, title: typed }: RenameChatGroupArgs,
    @Ctx() context: Context,
  ): Promise<ChatGroup> {
    const caller = callerOf(context)
    const { group, me } = await groupOfCallerOrFail(groupUuid, caller)
    if (!mayManageChatGroup(me.role)) {
      throw new LogError('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED', groupUuid)
    }
    const title = chatGroupTitle(typed)
    if (title === null) {
      throw new LogError('CHAT_GROUP_NOT_CHANGED: TITLE', groupUuid)
    }
    const renamed = await dbUpdateChatGroupTitle(group.id, title)
    if (!renamed.success) {
      // Found a moment ago as a group: without it now, a bug.
      throw new LogError('CHAT_GROUP_NOT_FOUND right after finding it', group.id)
    }
    return chatGroupOfCaller(caller, group.id)
  }

  /**
   * Moves the caller's read pointer in a group up to `upToMessageId`, never down -- as in a
   * thread. False where the caller is not in the group, or there is no such group; nothing is
   * written then.
   */
  @Authorized([RIGHTS.READ_OWN_CHAT])
  @Mutation(() => Boolean)
  async markChatGroupRead(
    @Args() { groupUuid, upToMessageId }: MarkChatGroupReadArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const caller = callerOf(context)
    const found = await groupOfCaller(groupUuid, caller)
    if (!found) {
      return false
    }
    return (await dbUpdateChatConversationMemberLastRead(found.group.id, caller, upToMessageId))
      .success
  }

  /**
   * Mutes a group for the caller, or lifts it (E-024): while it is muted, no announcement reaches
   * the caller by mail. The caller's own mark, and nobody else's: the others do not learn of it.
   * False where the caller is not in the group; nothing is written then.
   */
  @Authorized([RIGHTS.READ_OWN_CHAT])
  @Mutation(() => Boolean)
  async setChatGroupMuted(
    @Args() { groupUuid, muted }: SetChatGroupMutedArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const caller = callerOf(context)
    const found = await groupOfCaller(groupUuid, caller)
    if (!found) {
      return false
    }
    return (
      await dbUpdateChatConversationMemberMuted(found.group.id, caller, muted ? new Date() : null)
    ).success
  }
}
