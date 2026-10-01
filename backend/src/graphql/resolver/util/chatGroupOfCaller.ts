// AI-GENERATED — not an architecture reference
import {
  ChatConversationMemberSelect,
  ChatConversationSelect,
  ChatMemberRef,
  dbFindChatGroupByUuid,
  dbSelectChatConversationMember,
} from 'database'
import { LogError } from '@/server/LogError'

/**
 * The group `groupUuid` names and the caller's own row in it, or null: for a group that does not
 * exist and for one the caller is not in alike. Who is not a member learns nothing about a group,
 * not even that it exists (build plan 4.3). Shared by the group's own resolver and forwarding into
 * a group (E-059).
 */
export const groupOfCaller = async (
  groupUuid: string,
  caller: ChatMemberRef,
): Promise<{ group: ChatConversationSelect; me: ChatConversationMemberSelect } | null> => {
  const group = await dbFindChatGroupByUuid(groupUuid)
  const me = group ? await dbSelectChatConversationMember(group.id, caller) : null
  return group && me ? { group, me } : null
}

/** groupOfCaller, or CHAT_GROUP_NOT_FOUND -- the same answer for both reasons. */
export const groupOfCallerOrFail = async (
  groupUuid: string,
  caller: ChatMemberRef,
): Promise<{ group: ChatConversationSelect; me: ChatConversationMemberSelect }> => {
  const found = await groupOfCaller(groupUuid, caller)
  if (!found) {
    throw new LogError('CHAT_GROUP_NOT_FOUND', groupUuid)
  }
  return found
}
