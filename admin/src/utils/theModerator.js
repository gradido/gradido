// AI-GENERATED — not an architecture reference

import { memberKey } from '@/composables/useMemberAvatars'

/**
 * The signed-in moderator named by their pair (`communityUuid/gradidoID`, lowercased), or null
 * where no moderator with a pair is signed in. Named by the pair, as every member is, and not
 * by the database's row number, which is not sent to this side.
 */
export const moderatorKey = (moderator) =>
  moderator?.gradidoID ? memberKey(moderator).toLowerCase() : null

/** Whether `member` -- a row naming somebody by their pair -- is the signed-in moderator. */
export const isTheModerator = (moderator, member) => {
  const mine = moderatorKey(moderator)
  return mine !== null && Boolean(member?.gradidoID) && memberKey(member).toLowerCase() === mine
}
