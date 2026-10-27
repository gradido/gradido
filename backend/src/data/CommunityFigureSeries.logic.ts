// AI-GENERATED — not an architecture reference
import {
  dbCountAcceptedThankYouGreetingsByWeek,
  dbCountAndSumTransactionsOfTypeByWeek,
  dbCountChatConversationsOfKindByWeek,
  dbCountDistinctUsersOfTypeByWeek,
  dbCountEventsOfTypesByWeek,
  dbCountExpiredThankYouGreetingsByWeek,
  dbCountFirstCreationMembersByWeek,
  dbCountFirstSendersByWeek,
  dbCountMatchingEntriesByTypeByWeek,
  dbCountRegisterEventsWithReferrerByWeek,
  dbCountThankYouGreetingsByWeek,
  dbCountTransactionPassOnsByWeek,
  dbCountTransactionReactionsByWeek,
  dbCountTransactionsWithPictureByWeek,
  dbCountUsersDeletedByWeek,
  EventType,
  TransactionTypeId,
  WeeklyCount,
} from 'database'
import { countInTurns, ENTRY_KINDS } from './FigureCounts.logic'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

/**
 * How far back the weeks reach at most: two years. A day chosen further back -- or a year typed
 * into the date field digit by digit, which asks for 0002, 0020 and 0202 on its way -- begins the
 * series that many weeks before the running one, instead of with a week for every Monday since.
 */
export const WEEKS_AT_MOST = 104

/** One flow of the start page by calendar week: a number for each week, in the order of `weeks`. */
export type CommunityFigureSeriesRow = { key: string; counts: number[] }

/** The weeks -- each the Monday it begins with, 00:00 UTC -- and the rows counted in them. */
export type CommunityFigureSeries = { weeks: Date[]; rows: CommunityFigureSeriesRow[] }

/**
 * The Monday, 00:00 UTC, of the week a moment lies in: the week as the counts group by it
 * (`weekStartOf` in database), Monday to Sunday in UTC.
 */
export function mondayOf(moment: Date): Date {
  // The day of the moment, by setting its clock to midnight: Date.UTC would read the years 0 to
  // 99 as 1900 to 1999.
  const day = new Date(moment.getTime())
  day.setUTCHours(0, 0, 0, 0)
  // getUTCDay counts from Sunday; the days since Monday, as weekday() counts them.
  const daysSinceMonday = (day.getUTCDay() + 6) % 7
  return new Date(day.getTime() - daysSinceMonday * DAY_MS)
}

/**
 * Every Monday from the week `since` lies in to the running week, each at 00:00 UTC -- the last
 * WEEKS_AT_MOST of them.
 */
export function weeksFrom(since: Date, now: Date): Date[] {
  const weeks: Date[] = []
  const running = mondayOf(now).getTime()
  const first = Math.max(mondayOf(since).getTime(), running - (WEEKS_AT_MOST - 1) * WEEK_MS)
  for (let monday = first; monday <= running; monday += WEEK_MS) {
    weeks.push(new Date(monday))
  }
  return weeks
}

/**
 * A count of the series, and the rows it answers: one, or more where a count holds several. Asked
 * from the first Monday of the series, and up to now where a figure counts up to it.
 */
type Series = (from: Date, now: Date) => Promise<[key: string, byWeek: WeeklyCount[]][]>

/** A flow in one count. */
const byWeek =
  (key: string, count: (from: Date) => Promise<WeeklyCount[]>): Series =>
  async (from) => [[key, await count(from)]]

const ofTypes =
  (...types: EventType[]) =>
  (from: Date) =>
    dbCountEventsOfTypesByWeek(types, from)

/** The members an outcome of their first creation concerns, without the function tests. */
const firstCreationMembersOf = (type: EventType) => (from: Date) =>
  dbCountFirstCreationMembersByWeek(type, from)

/** The bookings of one type in one count, on two rows: how many, and the Gradido they moved. */
const bookings =
  (typeId: TransactionTypeId, countKey: string, gddKey: string): Series =>
  async (from) => {
    const weeks = await dbCountAndSumTransactionsOfTypeByWeek(typeId, from)
    return [
      [countKey, weeks.map(({ weekStart, n }) => ({ weekStart, n }))],
      [gddKey, weeks.map(({ weekStart, gdd }) => ({ weekStart, n: gdd }))],
    ]
  }

/** The thank-you greetings sent, in one count and on two rows: all, and those with a photo. */
const greetingsSent: Series = async (from) => {
  const weeks = await dbCountThankYouGreetingsByWeek(from)
  return [
    ['greetingsSent', weeks.map(({ weekStart, n }) => ({ weekStart, n }))],
    [
      'greetingsWithPhoto',
      weeks.map(({ weekStart, withPicture }) => ({ weekStart, n: withPicture })),
    ],
  ]
}

/**
 * The thank-you greetings accepted, in one count and on two rows: all, and those accepted by an
 * account opened through the greeting itself.
 */
const greetingsAccepted: Series = async (from) => {
  const weeks = await dbCountAcceptedThankYouGreetingsByWeek(from)
  return [
    ['greetingsAccepted', weeks.map(({ weekStart, n }) => ({ weekStart, n }))],
    [
      'greetingsWithAccount',
      weeks.map(({ weekStart, withNewAccount }) => ({ weekStart, n: withNewAccount })),
    ],
  ]
}

/** The thank-you greetings whose time ran out unaccepted, the running week up to now. */
const greetingsExpired: Series = async (from, now) => [
  ['greetingsExpired', await dbCountExpiredThankYouGreetingsByWeek(from, now)],
]

/** The entries written of each kind, in one count and on a row each. */
const entriesByKind: Series = async (from) => {
  const weeks = await dbCountMatchingEntriesByTypeByWeek(from)
  return ENTRY_KINDS.map(([kind, key]) => [key, weeks.filter((week) => week.matchingType === kind)])
}

// The flows of the start page, in its order and with its keys (CommunityFigures.logic.ts) -- the
// page finds a row's label by its key. No stocks (accounts in total, homes, findable, entries
// active, members with an entry, on the map): they have no week. No returners either: a return is
// measured against the chosen day.
const SERIES: Series[] = [
  byWeek(
    'accountsNew',
    ofTypes(
      EventType.USER_REGISTER,
      EventType.USER_REGISTER_GUARANTOR,
      EventType.USER_REGISTER_REDEEM,
    ),
  ),
  byWeek('accountsViaTableCode', ofTypes(EventType.USER_REGISTER_GUARANTOR)),
  byWeek('accountsViaLink', ofTypes(EventType.USER_REGISTER_REDEEM)),
  byWeek('accountsViaAddress', dbCountRegisterEventsWithReferrerByWeek),
  byWeek('accountsViaEvent', ofTypes(EventType.EVENT_MATCHING_ENTRY_NOTE)),
  // The members who wrote the registration of a guest (RegisterUserGuarantorRole), each once in a
  // week.
  byWeek('hostsWithGuest', (from) =>
    dbCountDistinctUsersOfTypeByWeek(EventType.USER_REGISTER_GUARANTOR, 'acting', from),
  ),
  byWeek('codesShown', ofTypes(EventType.GUARANTOR_CODE_SHOW)),
  // The accounts with a sign-in in the week, each once -- a login, the event of the login
  // mutation: a session that runs on over a Monday counts in the week it began. The page says so;
  // the active accounts of the table count thirty days.
  byWeek('activeAccounts', (from) =>
    dbCountDistinctUsersOfTypeByWeek(EventType.USER_LOGIN, 'affected', from),
  ),
  byWeek('accountsDeleted', dbCountUsersDeletedByWeek),
  byWeek('firstCreationsDone', firstCreationMembersOf(EventType.FIRST_CREATION_DONE)),
  byWeek('firstCreationsSkipped', firstCreationMembersOf(EventType.FIRST_CREATION_SKIP)),
  byWeek('firstCreationsReview', firstCreationMembersOf(EventType.FIRST_CREATION_REVIEW)),
  bookings(TransactionTypeId.SEND, 'transfersSent', 'gddSent'),
  // Each account once, in the week of its first SEND row.
  byWeek('firstSenders', dbCountFirstSendersByWeek),
  byWeek('transfersWithPicture', (from) =>
    dbCountTransactionsWithPictureByWeek(TransactionTypeId.SEND, from),
  ),
  byWeek('thanksAnswered', dbCountTransactionReactionsByWeek),
  byWeek('thanksPassedOn', dbCountTransactionPassOnsByWeek),
  bookings(TransactionTypeId.CREATION, 'creationsBooked', 'gddCreated'),
  greetingsSent,
  greetingsAccepted,
  greetingsExpired,
  entriesByKind,
  byWeek('conversationsNew', (from) => dbCountChatConversationsOfKindByWeek('direct', from)),
  byWeek('groupsNew', (from) => dbCountChatConversationsOfKindByWeek('group', from)),
  byWeek('hellosFromMap', ofTypes(EventType.CHAT_HELLO_SEND)),
  byWeek('videoRoomsCreated', ofTypes(EventType.CHAT_VIDEO_ROOM_CREATE)),
]

/**
 * The flows of the admin's start page by calendar week: every week from the one `since` lies in to
 * the running one, which is not over yet -- WEEKS_AT_MOST at most. Sums, never who. One statement
 * per count, grouped by the week and asked from the first Monday of the series, in turns like the
 * figures of the table (countInTurns); a week a count has no row for is a 0.
 */
export async function countCommunityFigureSeries(
  since: Date,
  now: Date,
): Promise<CommunityFigureSeries> {
  const weeks = weeksFrom(since, now)
  // The day of each Monday, as the counts name their weeks.
  const days = weeks.map((monday) => monday.toISOString().slice(0, 10))
  // A day still to come in another week has no week: nothing to count, from its Monday on.
  const from = weeks[0] ?? mondayOf(since)
  const answers = await countInTurns(SERIES.map((series) => () => series(from, now)))
  const rows = answers.flat().map(([key, counted]) => {
    const byDay = new Map(counted.map(({ weekStart, n }) => [weekStart, n]))
    return { key, counts: days.map((day) => byDay.get(day) ?? 0) }
  })
  return { weeks, rows }
}
