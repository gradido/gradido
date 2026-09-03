// AI-GENERATED — not an architecture reference

/**
 * Whether two community uuids name the same community.
 *
 * ⛔ Named `isSameCommunity`, not `isHomeCommunity`: `graphql/resolver/util/communities.ts`
 * already exports an `isHomeCommunity`, it resolves an identifier against the database, and
 * `TransactionResolver` calls it twice before money moves. Two functions of one name
 * answering one question by two mechanisms is how a caller ends up with the wrong one.
 *
 * Missing on either side is "cannot say", and that answers false. Every caller uses this to
 * decide whether it may speak for a community -- name it, build an address in it -- and a
 * wrong yes is worse than a missing answer.
 */
export const isSameCommunity = (
  left: string | null | undefined,
  right: string | null | undefined,
): boolean => Boolean(left && right && left === right)
