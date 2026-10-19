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
 * How many counts are asked at once, in the whole process. They share the pool of the Drizzle
 * connections (20, AppDatabase) with every member's request, and one look at the page asks about
 * four dozen -- the table and its weeks at the same time --, a second moderator as many again:
 * all at once, they would hold every connection while the bookings are counted.
 */
export const COUNTS_AT_ONCE = 4

// The counts being asked right now, over every call, and the ones waiting for a turn.
let asking = 0
const waiting: (() => void)[] = []

/**
 * One count, in its turn. A count that ends hands its turn straight to the next one waiting,
 * rather than freeing it: a count asked in that moment could otherwise take it as well, and five
 * would run.
 */
async function inTurn<T>(count: () => Promise<T>): Promise<T> {
  if (asking < COUNTS_AT_ONCE) {
    asking++
  } else {
    await new Promise<void>((takeTurn) => waiting.push(takeTurn))
  }
  try {
    return await count()
  } finally {
    const next = waiting.shift()
    if (next) {
      next()
    } else {
      asking--
    }
  }
}

/**
 * Asks the counts in turns, at most COUNTS_AT_ONCE of them at a time over every call in the
 * process, each as soon as a count before it has answered, and gives their answers in the order
 * of the counts, whichever came first.
 */
export async function countInTurns<T>(counts: (() => Promise<T>)[]): Promise<T[]> {
  return Promise.all(counts.map((count) => inTurn(count)))
}
