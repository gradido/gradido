// AI-GENERATED — not an architecture reference
import {
  dbCountActiveMatchingEntries,
  dbCountAndSumTransactionsOfType,
  dbCountChatConversationsOfKind,
  dbCountDistinctActingUsersOfType,
  dbCountDistinctAffectedUsersOfType,
  dbCountEventsOfTypes,
  dbCountFirstCreationMembers,
  dbCountMatchingEntriesByType,
  dbCountMembersWithActiveEntry,
  dbCountRegisterEventsWithReferrer,
  dbCountReturningMembers,
  dbCountUsers,
  dbCountUsersDeleted,
  dbCountUsersFindable,
  dbCountUsersWithHome,
  EventType,
  TransactionTypeId,
} from 'database'
import { mapMemberCount } from '@/apis/gms/mapMemberCount'

const DAY_MS = 24 * 60 * 60 * 1000

/** One figure in the three columns of the page; null in a column the figure does not have. */
export type CommunityFigureCount = {
  key: string
  since: number | null
  week: number | null
  total: number | null
}

/**
 * What the columns count from: the chosen day, seven days back from now -- and thirty days back,
 * for the one figure whose "all of it" would mean something else (the active accounts).
 */
type Moments = { since: Date; week: Date; month: Date }

/** One count, and the rows of the page it answers: one, or more where a count holds several. */
type Figures = (moments: Moments) => Promise<CommunityFigureCount[]>

/** The numbers of a count asked from the chosen day, seven days back and over all of it, as a row. */
const inColumns = (key: string, [since, week, total]: number[]): CommunityFigureCount => ({
  key,
  since,
  week,
  total,
})

/** The three moments of a figure that has all three columns, in their order. */
const everyColumn = ({ since, week }: Moments): (Date | null)[] => [since, week, null]

/** A figure in all three columns -- from the chosen day, the last seven days, all of it -- in one count. */
const inEveryColumn =
  (key: string, count: (froms: (Date | null)[]) => Promise<number[]>): Figures =>
  async (moments) => [inColumns(key, await count(everyColumn(moments)))]

/** A stock, not a flow: what stands now, with nothing to count from a day on. */
const asStock =
  (key: string, count: () => Promise<number | null>): Figures =>
  async () => [{ key, since: null, week: null, total: await count() }]

const ofTypes =
  (...types: EventType[]) =>
  (froms: (Date | null)[]) =>
    dbCountEventsOfTypes(types, froms)

/**
 * The members an outcome of their first creation concerns, each once (a member who skipped twice
 * skipped), without the function tests of administrators.
 */
const firstCreationMembersOf = (type: EventType) => (froms: (Date | null)[]) =>
  dbCountFirstCreationMembers(type, froms)

/**
 * The bookings of one type, in one count and on two rows: how many, and how many Gradido they
 * moved, in whole ones -- by the moment they were booked.
 */
const bookings =
  (typeId: TransactionTypeId, countKey: string, gddKey: string): Figures =>
  async (moments) => {
    const { counts, gdd } = await dbCountAndSumTransactionsOfType(typeId, everyColumn(moments))
    return [inColumns(countKey, counts), inColumns(gddKey, gdd)]
  }

/** The kinds of entry on the map, in the wallet's order -- love, offer, need -- and their rows. */
const ENTRY_KINDS: [kind: string, key: string][] = [
  ['interest', 'entriesInterest'],
  ['offer', 'entriesOffer'],
  ['need', 'entriesNeed'],
]

/** The entries written of each kind, in one count and on a row each. */
const entriesByKind: Figures = async (moments) => {
  const froms = everyColumn(moments)
  const byKind = await dbCountMatchingEntriesByType(froms)
  // A kind nobody wrote is not in the answer: none of it.
  return ENTRY_KINDS.map(([kind, key]) => inColumns(key, byKind[kind] ?? froms.map(() => 0)))
}

// The figures of the page, in its order.
const FIGURES: Figures[] = [
  inEveryColumn(
    'accountsNew',
    ofTypes(
      EventType.USER_REGISTER,
      EventType.USER_REGISTER_GUARANTOR,
      EventType.USER_REGISTER_REDEEM,
    ),
  ),
  inEveryColumn('accountsViaTableCode', ofTypes(EventType.USER_REGISTER_GUARANTOR)),
  // A redeem link of either kind: a Gradido link or thank-you greeting, and a contribution link.
  inEveryColumn('accountsViaLink', ofTypes(EventType.USER_REGISTER_REDEEM)),
  inEveryColumn('accountsViaAddress', dbCountRegisterEventsWithReferrer),
  // Written from the release that brought EVENT_MATCHING_ENTRY_NOTE on: an event link before it
  // left no trace. An event link comes with any of the ways above, so the rows can overlap.
  inEveryColumn('accountsViaEvent', ofTypes(EventType.EVENT_MATCHING_ENTRY_NOTE)),
  // The host is the member who wrote the registration of the guest (RegisterUserGuarantorRole).
  inEveryColumn('hostsWithGuest', (froms) =>
    dbCountDistinctActingUsersOfType(EventType.USER_REGISTER_GUARANTOR, froms),
  ),
  // Every table code that was made, not every table (`GUARANTOR_CODE_SHOW`).
  inEveryColumn('codesShown', ofTypes(EventType.GUARANTOR_CODE_SHOW)),
  // Asked from the chosen day on only: a return is measured against that day.
  async ({ since }) => [
    { key: 'returners', since: await dbCountReturningMembers(since), week: null, total: null },
  ],
  // "All of it" are the last thirty days here, and the label says so: every account that ever
  // signed in is no active account.
  async ({ since, week, month }) => [
    inColumns(
      'activeAccounts',
      await dbCountDistinctAffectedUsersOfType(EventType.USER_LOGIN, [since, week, month]),
    ),
  ],
  inEveryColumn('accountsDeleted', dbCountUsersDeleted),
  asStock('accountsTotal', dbCountUsers),
  inEveryColumn('firstCreationsDone', firstCreationMembersOf(EventType.FIRST_CREATION_DONE)),
  inEveryColumn('firstCreationsSkipped', firstCreationMembersOf(EventType.FIRST_CREATION_SKIP)),
  // The step into the review, not what is in review today: a review that was settled since
  // still counts.
  inEveryColumn('firstCreationsReview', firstCreationMembersOf(EventType.FIRST_CREATION_REVIEW)),
  // Thanks: the SEND rows of this community's members -- also across the border and through a
  // link, which books its SEND row when it is redeemed. A transfer within the community has a
  // RECEIVE row as well, not counted.
  bookings(TransactionTypeId.SEND, 'transfersSent', 'gddSent'),
  bookings(TransactionTypeId.CREATION, 'creationsBooked', 'gddCreated'),
  // The map: homes and who can be found, as they stand now.
  asStock('homesSet', dbCountUsersWithHome),
  asStock('findableOnMap', dbCountUsersFindable),
  entriesByKind,
  asStock('entriesActive', dbCountActiveMatchingEntries),
  asStock('membersWithEntry', dbCountMembersWithActiveEntry),
  // The GMS's own number, over every community on its map, as it last said it: null until it has
  // (and on a server without the GMS), and the page shows a dash.
  asStock('membersOnMap', async () => mapMemberCount.known()),
  // Conversations: the direct ones open with the first message two members exchange.
  inEveryColumn('conversationsNew', (froms) => dbCountChatConversationsOfKind('direct', froms)),
  inEveryColumn('groupsNew', (froms) => dbCountChatConversationsOfKind('group', froms)),
  // The first message of two members, written from the hello bar of a profile on the map.
  inEveryColumn('hellosFromMap', ofTypes(EventType.CHAT_HELLO_SEND)),
  // Rooms handed out, not calls: the cog of the video dialog fetches a room ahead, and again for
  // every other server chosen.
  inEveryColumn('videoRoomsCreated', ofTypes(EventType.CHAT_VIDEO_ROOM_CREATE)),
]

/**
 * How many counts are asked at once. They share the pool of the Drizzle connections (20,
 * AppDatabase) with every member's request, and the page asks about two dozen: all at once, one
 * look at the page would hold every connection while the bookings are counted.
 */
const COUNTS_AT_ONCE = 4

/**
 * The figures of the admin's start page, counted from `since` and back from `now`: sums, never
 * who. One statement per count, all of its columns in it; COUNTS_AT_ONCE of them at a time,
 * the rows in the order of the page.
 */
export async function countCommunityFigures(
  since: Date,
  now: Date,
): Promise<CommunityFigureCount[]> {
  const moments: Moments = {
    since,
    week: new Date(now.getTime() - 7 * DAY_MS),
    month: new Date(now.getTime() - 30 * DAY_MS),
  }
  const rows: CommunityFigureCount[][] = new Array(FIGURES.length)
  let next = 0
  const countOneAfterAnother = async (): Promise<void> => {
    while (next < FIGURES.length) {
      const index = next++
      rows[index] = await FIGURES[index](moments)
    }
  }
  await Promise.all(Array.from({ length: COUNTS_AT_ONCE }, () => countOneAfterAnother()))
  return rows.flat()
}
