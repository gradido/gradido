// AI-GENERATED — not an architecture reference

/**
 * The members a delete in the GMS failed for and is being tried again in the background
 * (`removeUserFromGms` in syncMatchingEntryToGms.ts), each with the mark of that delete.
 *
 * ⛔ Kept so that handing such a member over again ends those tries -- a consent given again,
 * an account the moderation brought back. A try that ran after the hand-over would take off
 * the member who was just handed over, entries and all, and nothing would bring them back:
 * they are noted as held, so later saves send no entries.
 *
 * In memory, as the tries themselves are. Its own file because the delete and the hand-over
 * live in two files of which one imports the other.
 */
const underWay = new Map<number, symbol>()

/**
 * Notes that a delete is being tried again for this member. What comes back is asked before
 * every try -- whether THIS delete is still the one wanted -- and told when the tries are over.
 */
export const noteUserDeleteUnderWay = (userId: number) => {
  const mine = Symbol('a delete of this member, being tried again')
  underWay.set(userId, mine)
  return {
    stillWanted: () => underWay.get(userId) === mine,
    over: () => {
      if (underWay.get(userId) === mine) {
        underWay.delete(userId)
      }
    },
  }
}

/** The member is handed over again: no delete of theirs that is still being tried is wanted. */
export const endUserDeleteUnderWay = (userId: number): void => {
  underWay.delete(userId)
}
