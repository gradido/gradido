// AI-GENERATED — not an architecture reference
import { User } from '@model/User'
import {
  ChatMemberRef,
  dbFindMemberAvatarTimestamps,
  dbFindUsersByIds,
  dbSelectUsersByUuids,
  getHomeCommunity,
} from 'database'

/** A member's pair as one key, the way the chat tables compare it: without regard to case. */
export const chatMemberKey = (member: ChatMemberRef): string =>
  `${member.communityUuid.toLowerCase()}/${member.gradidoId.toLowerCase()}`

/**
 * The members named by these pairs, as the `User` model the contact list carries -- alias,
 * colour digit, the date of the picture, the community's name, and by the same rule no real name
 * (NU-019) --, keyed by chatMemberKey: the members of a group and the senders of its messages
 * (P5).
 *
 * From their users rows, deleted members included: a member who deleted their account keeps the
 * name on what they wrote, as a booking keeps naming them (AS-009 leaves them the name and takes
 * the picture). A pair without a users row is not in the answer.
 *
 * Four queries for the whole list, never one per member: the rows by their pairs, the users, the
 * dates of the pictures, the home community.
 */
export async function chatMemberUsers(pairs: ChatMemberRef[]): Promise<Map<string, User>> {
  const unique = new Map(pairs.map((pair) => [chatMemberKey(pair), pair]))
  if (unique.size === 0) {
    return new Map()
  }
  const ids = (await dbSelectUsersByUuids([...unique.values()])).map((row) => row.id)
  const [rows, avatarDates, home] = await Promise.all([
    dbFindUsersByIds(ids, { withDeleted: true }),
    dbFindMemberAvatarTimestamps(ids),
    getHomeCommunity(),
  ])
  const users = new Map<string, User>()
  for (const row of rows) {
    const model = new User(row)
    model.avatarUpdatedAt = avatarDates.get(row.id) ?? null
    // A group lives within this community in P5, and so do its members. A row the federation
    // filed for a member of another one (P6) is left without a name rather than given ours.
    model.communityName = row.foreign ? null : (home?.name ?? null)
    users.set(chatMemberKey({ communityUuid: row.communityUuid, gradidoId: row.gradidoID }), model)
  }
  return users
}
