// AI-GENERATED — not an architecture reference
import {
  dbCountDistinctActingUsersOfType,
  dbCountDistinctAffectedUsersOfType,
  dbCountEventsOfTypes,
  dbCountRegisterEventsWithReferrer,
  dbCountReturningMembers,
  dbCountUsers,
  dbCountUsersDeleted,
  EventType,
} from 'database'

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

type Figure = (moments: Moments) => Promise<CommunityFigureCount>

/** A figure in all three columns -- from the chosen day, the last seven days, all of it -- in one count. */
const inEveryColumn =
  (key: string, count: (froms: (Date | null)[]) => Promise<number[]>): Figure =>
  async ({ since, week }) => {
    const [fromSince, fromWeek, all] = await count([since, week, null])
    return { key, since: fromSince, week: fromWeek, total: all }
  }

const ofTypes =
  (...types: EventType[]) =>
  (froms: (Date | null)[]) =>
    dbCountEventsOfTypes(types, froms)

/** The members events of this type concern, each once: a member who skipped twice skipped. */
const membersOf = (type: EventType) => (froms: (Date | null)[]) =>
  dbCountDistinctAffectedUsersOfType(type, froms)

// The figures of the page, in its order.
const FIGURES: Figure[] = [
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
  async ({ since }) => ({
    key: 'returners',
    since: await dbCountReturningMembers(since),
    week: null,
    total: null,
  }),
  // "All of it" are the last thirty days here, and the label says so: every account that ever
  // signed in is no active account.
  async ({ since, week, month }) => {
    const [fromSince, fromWeek, fromMonth] = await dbCountDistinctAffectedUsersOfType(
      EventType.USER_LOGIN,
      [since, week, month],
    )
    return { key: 'activeAccounts', since: fromSince, week: fromWeek, total: fromMonth }
  },
  inEveryColumn('accountsDeleted', dbCountUsersDeleted),
  // A stock, not a flow: it has nothing to count from a day on.
  async () => ({ key: 'accountsTotal', since: null, week: null, total: await dbCountUsers() }),
  inEveryColumn('firstCreationsDone', membersOf(EventType.FIRST_CREATION_DONE)),
  inEveryColumn('firstCreationsSkipped', membersOf(EventType.FIRST_CREATION_SKIP)),
  // The step into the review, not what is in review today: a review that was settled since
  // still counts.
  inEveryColumn('firstCreationsReview', membersOf(EventType.FIRST_CREATION_REVIEW)),
]

/**
 * The figures of the admin's start page, counted from `since` and back from `now`: sums, never
 * who. One statement per figure, all of its columns in it; the figures are asked at once.
 */
export function countCommunityFigures(since: Date, now: Date): Promise<CommunityFigureCount[]> {
  const moments: Moments = {
    since,
    week: new Date(now.getTime() - 7 * DAY_MS),
    month: new Date(now.getTime() - 30 * DAY_MS),
  }
  return Promise.all(FIGURES.map((figure) => figure(moments)))
}
