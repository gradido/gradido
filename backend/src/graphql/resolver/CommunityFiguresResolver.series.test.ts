// AI-GENERATED — not an architecture reference
// The series end to end, once: a moderator asks for the flows of the start page by calendar week
// and gets every week from the one the chosen day lies in to the running one, a 0 for a week
// without -- and nobody else gets any (RIGHTS.COMMUNITY_FIGURES). Every moment here is placed in
// a week counted back from the running one, so the weeks are the same on whatever day this runs.
// What each count counts is tested in `database`, which count each row asks in
// CommunityFigureSeries.logic.test.ts, with the branches of the weeks (a day chosen in the running
// week, a Sunday, the turn of a year).
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { AppDatabase, dbInsertEvent, EventType } from 'database'
import { GraphQLError } from 'graphql'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { communityFigureSeriesQuery as communityFigureSeries } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS

// The Monday of the running week, 00:00 UTC: today, back by the days since Monday.
const today = new Date()
const runningMonday =
  Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) -
  ((today.getUTCDay() + 6) % 7) * DAY_MS
/** The Monday some weeks before the running one. */
const mondayBack = (weeks: number): Date => new Date(runningMonday - weeks * WEEK_MS)
/** A Wednesday some weeks back, at an hour of the day. */
const wednesdayBack = (weeks: number, hour: number): Date =>
  new Date(runningMonday - weeks * WEEK_MS + 2 * DAY_MS + hour * HOUR_MS)

// The chosen day: a Wednesday afternoon three weeks back. Its week, two weeks before the
// running one -- the one in between has nothing --, and the running week.
const since = wednesdayBack(3, 15)
const WEEKS = [3, 2, 1, 0].map((weeks) => mondayBack(weeks).toISOString())

const note = (type: EventType, affectedUserId: number, createdAt: Date, actingUserId?: number) =>
  dbInsertEvent({ type, affectedUserId, actingUserId: actingUserId ?? affectedUserId, createdAt })

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()

  const bibi = await userFactory(testEnv, bibiBloxberg)
  const peter = await userFactory(testEnv, peterLustig)
  const bob = await userFactory(testEnv, bobBaumeister)
  const raeuber = await userFactory(testEnv, raeuberHotzenplotz)

  // Bob registered on his own and Räuber at Peter's table in the week of the chosen day -- Bob
  // before the chosen day, in its week all the same --, Bibi on her own a week ago. Nobody the
  // week before last, nor in the running week.
  await note(EventType.USER_REGISTER, bob.id, wednesdayBack(3, 9))
  await note(EventType.USER_REGISTER_GUARANTOR, raeuber.id, wednesdayBack(3, 18), peter.id)
  await note(EventType.USER_REGISTER, bibi.id, wednesdayBack(1, 9))
  // Before the week of the chosen day: not counted.
  await note(EventType.USER_REGISTER, raeuber.id, wednesdayBack(5, 9))
  // Bibi signed in twice in the week of the chosen day, Bob a week ago; Peter signs in below,
  // in the running week, to ask.
  await note(EventType.USER_LOGIN, bibi.id, wednesdayBack(3, 10))
  await note(EventType.USER_LOGIN, bibi.id, wednesdayBack(3, 11))
  await note(EventType.USER_LOGIN, bob.id, wednesdayBack(1, 10))
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  // A login that failed leaves the token empty, and an empty token is refused with the very words
  // the refusals below assert: without this line they would pass with nobody logged in.
  expect(errors).toBeUndefined()
}

const askSeries = (from: Date) =>
  query({ query: communityFigureSeries, variables: { since: from.toISOString() } })

type Row = { key: string; counts: number[] }
const rowOf = (rows: Row[], key: string): Row | undefined => rows.find((row) => row.key === key)

describe('communityFigureSeries', () => {
  it('answers nobody who is not signed in', async () => {
    resetToken()

    const { errors } = await askSeries(since)

    expect(errors).toEqual([new GraphQLError('401 Unauthorized')])
  })

  it('answers a moderator with every week from the Monday of the chosen day on, 0 for a week without', async () => {
    await loginAs('peter@lustig.de')

    const { data, errors } = await askSeries(since)

    expect(errors).toBeUndefined()
    const series = data.communityFigureSeries
    expect(series.since).toBe(since.toISOString())
    expect(series.weeks).toEqual(WEEKS)
    expect(rowOf(series.rows, 'accountsNew')).toEqual({ key: 'accountsNew', counts: [2, 0, 1, 0] })
    expect(rowOf(series.rows, 'accountsViaTableCode')?.counts).toEqual([1, 0, 0, 0])
    expect(rowOf(series.rows, 'hostsWithGuest')?.counts).toEqual([1, 0, 0, 0])
    // Each account once in a week: Bibi, then Bob, then Peter, who asks.
    expect(rowOf(series.rows, 'activeAccounts')?.counts).toEqual([1, 0, 1, 1])
    // The flows of the page, in its order -- no stocks, no returners.
    expect(series.rows.map((row: Row) => row.key)).toEqual([
      'accountsNew',
      'accountsViaTableCode',
      'accountsViaLink',
      'accountsViaAddress',
      'accountsViaEvent',
      'hostsWithGuest',
      'codesShown',
      'activeAccounts',
      'accountsDeleted',
      'firstCreationsDone',
      'firstCreationsSkipped',
      'firstCreationsReview',
      'transfersSent',
      'gddSent',
      'creationsBooked',
      'gddCreated',
      'entriesInterest',
      'entriesOffer',
      'entriesNeed',
      'conversationsNew',
      'groupsNew',
      'hellosFromMap',
      'videoRoomsCreated',
    ])
    for (const row of series.rows) {
      expect(row.counts).toHaveLength(WEEKS.length)
    }
  })

  // Last in the file: the login comes after the weeks above were counted.
  it('answers no ordinary member', async () => {
    await loginAs('bibi@bloxberg.de')

    expect((await askSeries(since)).errors).toEqual([new GraphQLError('401 Unauthorized')])
  })
})
