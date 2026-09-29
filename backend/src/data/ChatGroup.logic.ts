// AI-GENERATED — not an architecture reference
import { ChatConversationMemberRole, ChatConversationMemberSelect, ChatMemberRef } from 'database'
import { isSameChatMember } from './ChatConversation.logic'

/*
 * The rules of a chat group (P5): how large, how it is named, and who may do what in it
 * (E-008, E-050). The resolver asks these; the database knows nothing of them.
 */

/**
 * The most members a group has, its founder included (E-008): a constant of the software, the
 * same on every server and kept by the group's home server -- no switch per community.
 */
export const CHAT_GROUP_MAX_MEMBERS = 100

/** The most moderators beside the owner (E-008, E-050 F4). */
export const CHAT_GROUP_MAX_MODERATORS = 2

/** The longest name of a group, in characters: what chat_conversations.title holds. */
export const CHAT_GROUP_TITLE_MAX = 100

/**
 * The longest name the API takes as typed, in UTF-16 units -- a guard against a heavy argument,
 * not the rule: an emoji is two units, and runs of white space go (chatGroupTitle).
 */
export const CHAT_GROUP_TITLE_INPUT_MAX = 4 * CHAT_GROUP_TITLE_MAX

/**
 * How many lists of groups and of their members one HTTP request may ask for (chatGroups,
 * chatGroupMembers): the wallet asks for one of each at most. Counted in the request's budget,
 * because a document may repeat a field under any number of aliases (RequestBudget).
 */
export const CHAT_GROUP_LISTS_MAX_PER_REQUEST = 5

/**
 * A group's name as it is kept: every run of white space one space -- a name is one line, in the
 * list and in a mail's subject --, trimmed, not empty and at most CHAT_GROUP_TITLE_MAX characters,
 * counted as the column counts them (code points, not UTF-16 units: an emoji is one). Null where
 * nothing is left or it is too long; the caller refuses it.
 */
export const chatGroupTitle = (raw: string): string | null => {
  const title = raw.replace(/\s+/g, ' ').trim()
  return title.length > 0 && [...title].length <= CHAT_GROUP_TITLE_MAX ? title : null
}

/**
 * Who takes members in and renames the group (E-050 F4): its owner and its moderators. Taking
 * members out has its own rule (mayRemoveFromChatGroup).
 */
export const mayManageChatGroup = (role: ChatConversationMemberRole): boolean =>
  role === 'owner' || role === 'moderator'

/**
 * Who may send a message as an announcement, mailed to every member who has not muted the group
 * (E-050 F5): the owner and the moderators. The mail goes to up to 99 people.
 */
export const mayAnnounceInChatGroup = (role: ChatConversationMemberRole): boolean =>
  role === 'owner' || role === 'moderator'

/**
 * Whether a member in the role `actor` may take a member in the role `target` out of the group
 * (E-050 F4): the owner anybody else, a moderator plain members only. Nobody takes themselves
 * out -- that is leaving, which every member may.
 */
export const mayRemoveFromChatGroup = (
  actor: ChatConversationMemberRole,
  target: ChatConversationMemberRole,
): boolean =>
  actor === 'owner' ? target !== 'owner' : actor === 'moderator' && target === 'member'

/** Only the owner names moderators and takes the role back (E-050 F4). */
export const mayAppointChatGroupModerators = (role: ChatConversationMemberRole): boolean =>
  role === 'owner'

/**
 * Who takes over when the owner leaves (E-050 F4): the longest-standing moderator, otherwise the
 * longest-standing member; null where nobody else is left. `members` in the order
 * dbSelectChatConversationMembers hands them out -- longest-standing first, members of the same
 * moment by their pair --, so every server and every call would pick the same one.
 */
export const chatGroupSuccessor = (
  members: ChatConversationMemberSelect[],
  leaving: ChatMemberRef,
): ChatConversationMemberSelect | null => {
  const others = members.filter(
    (member) =>
      !isSameChatMember(
        { communityUuid: member.communityUuid, gradidoId: member.gradidoId },
        leaving,
      ),
  )
  return others.find((member) => member.role === 'moderator') ?? others[0] ?? null
}
