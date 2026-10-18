// AI-GENERATED — not an architecture reference
// The use case end to end, once: a member asks for the figures of the start page and gets every
// row from the database, in the order of the page -- and a request without a login gets none.
// What each count counts is tested in `database`, which count each figure asks in
// CommunityFigures.logic.test.ts.
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import {
  AppDatabase,
  dbInsertEvent,
  dbInsertForeignUser,
  dbUserUpdateField,
  EventType,
} from 'database'
import { GraphQLError } from 'graphql'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { communityFiguresQuery } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'
import { stephenHawking } from '@/seeds/users/stephen-hawking'

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase

const now = Date.now()
const daysAgo = (days: number): Date => new Date(now - days * 24 * 60 * 60 * 1000)
// The chosen day: fifteen days back. The quiet days of a return end there.
const since = daysAgo(15)

const note = (type: EventType, affectedUserId: number, days: number, actingUserId?: number) =>
  dbInsertEvent({
    type,
    affectedUserId,
    actingUserId: actingUserId ?? affectedUserId,
    createdAt: daysAgo(days),
  })

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
  const garrick = await userFactory(testEnv, garrickOllivander)
  const stephen = await userFactory(testEnv, stephenHawking) // deleted in 2018, says the seed

  // Bob registered on his own, Räuber over Peter's address, Garrick at Peter's table (he deleted
  // his account yesterday), Stephen with a redeem link, long ago.
  await dbUserUpdateField(raeuber.id, 'referrerId', peter.id)
  await dbUserUpdateField(garrick.id, 'referrerId', peter.id)
  await dbUserUpdateField(garrick.id, 'deletedAt', daysAgo(1))
  await note(EventType.USER_REGISTER, bob.id, 2)
  await note(EventType.USER_REGISTER, raeuber.id, 10, peter.id)
  await note(EventType.USER_REGISTER_GUARANTOR, garrick.id, 3, peter.id)
  await note(EventType.USER_REGISTER_REDEEM, stephen.id, 40)
  // Bob came over an event link.
  await note(EventType.EVENT_MATCHING_ENTRY_NOTE, bob.id, 2)
  // Peter showed his table code yesterday and three weeks ago.
  await note(EventType.GUARANTOR_CODE_SHOW, peter.id, 1)
  await note(EventType.GUARANTOR_CODE_SHOW, peter.id, 20)
  // Bibi was quiet since long before the chosen day and signs in below: she comes back. Peter
  // kept signing in; Bob signed in for the first time.
  await note(EventType.USER_LOGIN, bibi.id, 200)
  await note(EventType.USER_LOGIN, peter.id, 200)
  await note(EventType.USER_LOGIN, peter.id, 50)
  await note(EventType.USER_LOGIN, peter.id, 1)
  await note(EventType.USER_LOGIN, bob.id, 10)
  await note(EventType.FIRST_CREATION_DONE, bob.id, 2, peter.id)
  await note(EventType.FIRST_CREATION_SKIP, raeuber.id, 9)
  await note(EventType.FIRST_CREATION_SKIP, raeuber.id, 9)
  await note(EventType.FIRST_CREATION_REVIEW, garrick.id, 20, peter.id)
  // A member of another community the federation stored: nobody's account here.
  await dbInsertForeignUser({
    communityUuid: '66666666-6666-4666-8666-666666666666',
    gradidoId: '66666666-6666-4666-8666-000000000001',
  })
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('communityFigures', () => {
  it('answers nobody who is not signed in', async () => {
    resetToken()

    const { errors } = await query({
      query: communityFiguresQuery,
      variables: { since: since.toISOString() },
    })

    expect(errors).toEqual([new GraphQLError('401 Unauthorized')])
  })

  it('answers a member with every figure of the start page, counted from the chosen day', async () => {
    await mutate({
      mutation: login,
      variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
    })

    const { data, errors } = await query({
      query: communityFiguresQuery,
      variables: { since: since.toISOString() },
    })

    expect(errors).toBeUndefined()
    expect(data.communityFigures).toEqual({
      since: since.toISOString(),
      rows: [
        { key: 'accountsNew', since: 3, week: 2, total: 4 },
        { key: 'accountsViaTableCode', since: 1, week: 1, total: 1 },
        { key: 'accountsViaLink', since: 0, week: 0, total: 1 },
        { key: 'accountsViaAddress', since: 1, week: 0, total: 1 },
        { key: 'accountsViaEvent', since: 1, week: 1, total: 1 },
        { key: 'hostsWithGuest', since: 1, week: 1, total: 1 },
        { key: 'codesShown', since: 1, week: 1, total: 2 },
        { key: 'returners', since: 1, week: null, total: null },
        // Bibi's login of just now counts: she, Peter and Bob; over seven days not Bob.
        { key: 'activeAccounts', since: 3, week: 2, total: 3 },
        { key: 'accountsDeleted', since: 1, week: 1, total: 2 },
        { key: 'accountsTotal', since: null, week: null, total: 4 },
        { key: 'firstCreationsDone', since: 1, week: 1, total: 1 },
        { key: 'firstCreationsSkipped', since: 1, week: 0, total: 1 },
        { key: 'firstCreationsReview', since: 0, week: 0, total: 1 },
      ],
    })
  })
})
