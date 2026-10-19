// AI-GENERATED — not an architecture reference
// What the figures of the admin's start page -- the table (CommunityFigures.logic.ts) and its
// weeks (CommunityFigureSeries.logic.ts) -- share: how their counts are asked, and the kinds of
// entry on the map with their rows.

/** The kinds of entry on the map, in the wallet's order -- love, offer, need -- and their rows. */
export const ENTRY_KINDS: [kind: string, key: string][] = [
  ['interest', 'entriesInterest'],
  ['offer', 'entriesOffer'],
  ['need', 'entriesNeed'],
]

/**
 * How many counts are asked at once. They share the pool of the Drizzle connections (20,
 * AppDatabase) with every member's request, and the page asks about two dozen: all at once, one
 * look at the page would hold every connection while the bookings are counted.
 */
export const COUNTS_AT_ONCE = 4

/**
 * Asks the counts COUNTS_AT_ONCE at a time, each as soon as one before it has answered, and gives
 * their answers in the order of the counts, whichever came first.
 */
export async function countInTurns<T>(counts: (() => Promise<T>)[]): Promise<T[]> {
  const answers: T[] = new Array(counts.length)
  let next = 0
  const countOneAfterAnother = async (): Promise<void> => {
    while (next < counts.length) {
      const index = next++
      answers[index] = await counts[index]()
    }
  }
  await Promise.all(Array.from({ length: COUNTS_AT_ONCE }, () => countOneAfterAnother()))
  return answers
}
