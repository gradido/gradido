// AI-GENERATED — not an architecture reference

import { ContributionMessage } from '@model/ContributionMessage'
import { dbFindMemberAvatarTimestamps } from 'database'

/**
 * Fills in, for a whole list of messages at once, when each author last changed the picture
 * other members may see.
 *
 * ⛔ ONE query for the list, never a field resolver per message: a thread of twenty messages
 * would otherwise be twenty round trips, and the contributions page carries several threads.
 * Same shape, and the same query, as the booking list and the contact list use.
 *
 * ⚠️ It does NOT decide who may be seen. `dbFindMemberAvatarTimestamps` answers only for
 * members who are local, not deleted, and have the switch on -- everybody else is simply
 * absent from its map and stays at `null` here. One rule, in one place, and this is not it.
 *
 * `null` therefore carries one meaning: there is nothing to show. No picture, switch off,
 * deleted, another community, or an author row that is gone.
 */
export const attachMessageAvatarDates = async (messages: ContributionMessage[]): Promise<void> => {
  // One entry per AUTHOR, not per message: a moderator who wrote twelve of them would
  // otherwise be named twelve times in one `IN` list.
  const authorIds = [
    ...new Set(
      messages
        .map((message) => message.userId)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  ]
  const dates = await dbFindMemberAvatarTimestamps(authorIds)
  for (const message of messages) {
    message.userAvatarUpdatedAt =
      message.userId === null ? null : (dates.get(message.userId) ?? null)
  }
}
