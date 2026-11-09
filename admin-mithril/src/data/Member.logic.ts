// AI-GENERATED — not an architecture reference

/** A member named by the pair that names them across communities. */
export type MemberRef = { communityUuid?: string | null; gradidoID?: string | null }

/**
 * The pair as one string, lowercased: a uuid is the same in upper and lower case, and the two
 * sides compared come from different rows of the server.
 */
export const memberKey = ({ communityUuid, gradidoID }: MemberRef) =>
  `${communityUuid ?? ''}/${gradidoID}`.toLowerCase()

/** The signed-in moderator by their pair, or null where nobody with a pair is signed in. */
export const moderatorKey = (moderator: MemberRef | null | undefined) =>
  moderator?.gradidoID ? memberKey(moderator) : null

/** Whether `member` is the signed-in moderator. */
export const isTheModerator = (moderator: MemberRef | null | undefined, member: MemberRef) => {
  const mine = moderatorKey(moderator)
  return mine !== null && Boolean(member.gradidoID) && memberKey(member) === mine
}
