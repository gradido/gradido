// AI-GENERATED — not an architecture reference
// The use case end to end, once: a moderator asks for the figures of the start page and gets every
// row from the database, in the order of the page -- and nobody else gets any: no request without
// a login, no ordinary member, no unconfirmed guest (RIGHTS.COMMUNITY_FIGURES).
// What each count counts is tested in `database`, which count each figure asks in
// CommunityFigures.logic.test.ts.
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import {
  AppDatabase,
  chatConversationsTable,
  User as DbUser,
  UserContact as DbUserContact,
  dbEnsureDirectChatConversation,
  dbInsertChatGroup,
  dbInsertEvent,
  dbInsertForeignUser,
  dbInsertMatchingEntry,
  dbUserUpdateField,
  EventType,
  TransactionTypeId,
  thankYouGreetingPicturesTable,
  thankYouGreetingsTable,
  transactionLinksTable,
  transactionPassOnsTable,
  transactionReactionsTable,
  transactionsTable,
} from 'database'
import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { GradidoUnit } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { mapMemberCount } from '@/apis/gms/mapMemberCount'
import { RIGHTS } from '@/auth/RIGHTS'
import { ROLE_ADMIN, ROLE_MODERATOR, ROLE_MODERATOR_AI, ROLE_USER } from '@/auth/ROLES'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { communityFiguresQuery as communityFigures } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'
import { stephenHawking } from '@/seeds/users/stephen-hawking'

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
// The maker of the links below.
let bibiId: number

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

/**
 * One booking row as the server writes it: a SEND row carries the amount negative. A transfer with
 * a picture names it on both rows. Answers the id of the row.
 */
const book = async (
  typeId: TransactionTypeId,
  user: DbUser,
  gddCent: bigint,
  days: number,
  transactionPictureId: number | null = null,
): Promise<number> => {
  const [written] = await db
    .getDrizzleDataSource()
    .insert(transactionsTable)
    .values({
      typeId,
      userId: user.id,
      userGradidoId: user.gradidoID,
      userCommunityUuid: user.communityUuid,
      amount: new GradidoUnit(gddCent),
      memo: 'Danke',
      balanceDate: daysAgo(days),
      transactionPictureId,
    })
  return written.insertId
}

let linksMade = 0
/**
 * A transaction link of Bibi's, made days ago and valid for fourteen days -- a plain one, or a
 * thank-you greeting with a motif or with a photo of her own (two renditions) --, redeemed days
 * ago by an account, or not. Answers the id of the link.
 */
const makeLink = async (
  kind: 'plain' | 'motif' | 'photo',
  days: number,
  redeemed?: { days: number; by: DbUser },
): Promise<number> => {
  const code = `f12a${++linksMade}`.padEnd(24, '0')
  const drizzle = db.getDrizzleDataSource()
  const [written] = await drizzle.insert(transactionLinksTable).values({
    userId: bibiId,
    memo: 'Danke für Deine Hilfe!',
    code,
    createdAt: daysAgo(days),
    validUntil: daysAgo(days - 14),
    redeemedAt: redeemed ? daysAgo(redeemed.days) : null,
    redeemedBy: redeemed?.by.id ?? null,
  })
  if (kind !== 'plain') {
    await drizzle.insert(thankYouGreetingsTable).values({
      transactionLinkCode: code,
      motif: kind === 'motif' ? 'bouquet' : null,
      createdAt: daysAgo(days),
    })
  }
  if (kind === 'photo') {
    for (const rendition of ['small', 'large'] as const) {
      await drizzle.insert(thankYouGreetingPicturesTable).values({
        transactionLinkCode: code,
        rendition,
        width: 831,
        height: 577,
        image: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]),
        mimeType: 'image/jpeg',
      })
    }
  }
  return written.insertId
}

/** An entry on the map, written days ago. */
const write = async (user: DbUser, matchingType: string, days: number, active = true) => {
  const written = await dbInsertMatchingEntry({
    uuid: uuidv4(),
    userId: user.id,
    matchingType,
    summary: `Eintrag von ${user.alias}`,
    details: null,
    remote: false,
    active,
    createdAt: daysAgo(days),
  })
  expect(written.success).toBe(true)
}

/** A conversation opened days ago: the moment it was written with is moved back. */
const openedDaysAgo = (conversationId: number, days: number) =>
  db
    .getDrizzleDataSource()
    .update(chatConversationsTable)
    .set({ createdAt: daysAgo(days) })
    .where(eq(chatConversationsTable.id, conversationId))

const memberOf = (user: DbUser) => ({
  communityUuid: user.communityUuid as string,
  gradidoId: user.gradidoID,
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
  bibiId = bibi.id

  // Bob registered on his own, Räuber over Peter's address, Garrick at Peter's table (he deleted
  // his account yesterday), Stephen with a redeem link, long ago: a thank-you greeting of Bibi's,
  // with a motif, which he accepted with the account he opened through it.
  await dbUserUpdateField(raeuber.id, 'referrerId', peter.id)
  await dbUserUpdateField(garrick.id, 'referrerId', peter.id)
  await dbUserUpdateField(garrick.id, 'deletedAt', daysAgo(1))
  await note(EventType.USER_REGISTER, bob.id, 2)
  await note(EventType.USER_REGISTER, raeuber.id, 10, peter.id)
  await note(EventType.USER_REGISTER_GUARANTOR, garrick.id, 3, peter.id)
  const greetingOfStephen = await makeLink('motif', 41, { days: 40, by: stephen })
  await dbInsertEvent({
    type: EventType.USER_REGISTER_REDEEM,
    affectedUserId: stephen.id,
    actingUserId: stephen.id,
    involvedTransactionLinkId: greetingOfStephen,
    createdAt: daysAgo(40),
  })
  // Bob came over an event link.
  await note(EventType.EVENT_MATCHING_ENTRY_NOTE, bob.id, 2)
  // Peter showed his table code yesterday and three weeks ago.
  await note(EventType.GUARANTOR_CODE_SHOW, peter.id, 1)
  await note(EventType.GUARANTOR_CODE_SHOW, peter.id, 20)
  // Bibi was quiet since long before the chosen day and signed in again today: she comes back.
  // Peter kept signing in (and signs in below to ask); Bob signed in for the first time.
  await note(EventType.USER_LOGIN, bibi.id, 200)
  await note(EventType.USER_LOGIN, bibi.id, 0)
  await note(EventType.USER_LOGIN, peter.id, 200)
  await note(EventType.USER_LOGIN, peter.id, 50)
  await note(EventType.USER_LOGIN, peter.id, 1)
  await note(EventType.USER_LOGIN, bob.id, 10)
  await note(EventType.FIRST_CREATION_DONE, bob.id, 2, peter.id)
  await note(EventType.FIRST_CREATION_SKIP, raeuber.id, 9)
  await note(EventType.FIRST_CREATION_SKIP, raeuber.id, 9)
  await note(EventType.FIRST_CREATION_REVIEW, garrick.id, 20, peter.id)
  // Peter, an admin, tests the first creation on his own account: not counted.
  await note(EventType.FIRST_CREATION_TEST, peter.id, 3)
  await note(EventType.FIRST_CREATION_DONE, peter.id, 3, peter.id)
  // A member of another community the federation stored: nobody's account here.
  await dbInsertForeignUser({
    communityUuid: '66666666-6666-4666-8666-666666666666',
    gradidoId: '66666666-6666-4666-8666-000000000001',
    alias: 'farAway',
  })

  // Thanks: Bibi sent Peter 20 GDD yesterday, with a picture, and 5.5 GDD forty days ago -- a
  // SEND and a RECEIVE row each -- and Bob's creation of 100 GDD was booked three days ago. Peter
  // thanked Bibi with 4.5 GDD two days ago, his first transfer; she passed that thank-you on to
  // him with hers yesterday. Peter answered both of Bibi's transfers with an emoji.
  const picture = 1
  const bibiSentYesterday = await book(TransactionTypeId.SEND, bibi, -200000n, 1, picture)
  const peterGotYesterday = await book(TransactionTypeId.RECEIVE, peter, 200000n, 1, picture)
  await book(TransactionTypeId.SEND, bibi, -55000n, 40)
  const peterGotLongAgo = await book(TransactionTypeId.RECEIVE, peter, 55000n, 40)
  await book(TransactionTypeId.CREATION, bob, 1000000n, 3)
  await book(TransactionTypeId.SEND, peter, -45000n, 2)
  const bibiGotFromPeter = await book(TransactionTypeId.RECEIVE, bibi, 45000n, 2)
  const drizzle = db.getDrizzleDataSource()
  await drizzle.insert(transactionReactionsTable).values([
    { transactionId: peterGotYesterday, emoji: '👍', createdAt: daysAgo(1) },
    { transactionId: peterGotLongAgo, emoji: '🌱', createdAt: daysAgo(39) },
  ])
  await drizzle.insert(transactionPassOnsTable).values({
    transactionId: bibiSentYesterday,
    originTransactionId: bibiGotFromPeter,
    createdAt: daysAgo(1),
  })
  // Thank-you greetings of Bibi's besides Stephen's: one with a photo of her own three days ago,
  // which Räuber accepted yesterday with the account he had, and one with a motif twenty days ago,
  // whose time ran out six days ago. A plain link Bob redeemed yesterday, and one that ran out:
  // no greetings.
  await makeLink('photo', 3, { days: 1, by: raeuber })
  await makeLink('motif', 20)
  await makeLink('plain', 2, { days: 1, by: bob })
  await makeLink('plain', 20)
  // The map: Bibi lives in Berlin and can be found, Peter lives in Hamburg and cannot.
  await dbUserUpdateField(bibi.id, 'location', { type: 'Point', coordinates: [13.405, 52.52] })
  await dbUserUpdateField(bibi.id, 'gmsAllowed', true)
  await dbUserUpdateField(peter.id, 'location', { type: 'Point', coordinates: [9.9937, 53.5511] })
  // An entry of each kind -- a love two days ago, an offer twenty, a need forty, paused.
  await write(bibi, 'interest', 2)
  await write(peter, 'offer', 20)
  await write(bob, 'need', 40, false)
  // Conversations: Bibi wrote to Peter for the first time yesterday; Peter founded a group
  // forty days ago. Bibi said hello from the map yesterday, Peter took a video room twenty days
  // ago.
  const direct = await dbEnsureDirectChatConversation(memberOf(bibi), memberOf(peter))
  await openedDaysAgo(direct.id, 1)
  const group = await dbInsertChatGroup({
    groupUuid: uuidv4(),
    title: 'Gartenfreunde',
    homeCommunityUuid: peter.communityUuid as string,
    createdBy: memberOf(peter),
  })
  await openedDaysAgo(group.id, 40)
  await note(EventType.CHAT_HELLO_SEND, peter.id, 1, bibi.id)
  await note(EventType.CHAT_VIDEO_ROOM_CREATE, peter.id, 20)
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

const askFigures = () =>
  query({ query: communityFigures, variables: { since: since.toISOString() } })

describe('communityFigures', () => {
  it('answers nobody who is not signed in', async () => {
    resetToken()

    const { errors } = await askFigures()

    expect(errors).toEqual([new GraphQLError('401 Unauthorized')])
  })

  it('answers a moderator with every figure of the start page, counted from the chosen day', async () => {
    await loginAs('peter@lustig.de')

    const { data, errors } = await askFigures()

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
        // Bibi, Peter and Bob; over seven days not Bob.
        { key: 'activeAccounts', since: 3, week: 2, total: 3 },
        { key: 'accountsDeleted', since: 1, week: 1, total: 2 },
        { key: 'accountsTotal', since: null, week: null, total: 4 },
        { key: 'firstCreationsDone', since: 1, week: 1, total: 1 },
        { key: 'firstCreationsSkipped', since: 1, week: 0, total: 1 },
        { key: 'firstCreationsReview', since: 0, week: 0, total: 1 },
        { key: 'transfersSent', since: 2, week: 2, total: 3 },
        // 24.5 from the chosen day and over seven days, 30 over all of it, in whole Gradido.
        { key: 'gddSent', since: 25, week: 25, total: 30 },
        // Peter for the first time; Bibi sent first forty days ago.
        { key: 'firstSenders', since: 1, week: 1, total: 2 },
        { key: 'transfersWithPicture', since: 1, week: 1, total: 1 },
        { key: 'thanksAnswered', since: 1, week: 1, total: 2 },
        { key: 'thanksPassedOn', since: 1, week: 1, total: 1 },
        { key: 'creationsBooked', since: 1, week: 1, total: 1 },
        { key: 'gddCreated', since: 100, week: 100, total: 100 },
        // No plain link anywhere: Bibi's greetings of three, twenty and forty-one days ago.
        { key: 'greetingsSent', since: 1, week: 1, total: 3 },
        { key: 'greetingsWithPhoto', since: 1, week: 1, total: 1 },
        // Räuber's yesterday, Stephen's forty days ago.
        { key: 'greetingsAccepted', since: 1, week: 1, total: 2 },
        // Stephen opened his account through the greeting he accepted; Räuber had his.
        { key: 'greetingsWithAccount', since: 0, week: 0, total: 1 },
        // Ran out six days ago.
        { key: 'greetingsExpired', since: 1, week: 1, total: 1 },
        { key: 'homesSet', since: null, week: null, total: 2 },
        { key: 'findableOnMap', since: null, week: null, total: 1 },
        { key: 'entriesInterest', since: 1, week: 1, total: 1 },
        { key: 'entriesOffer', since: 0, week: 0, total: 1 },
        { key: 'entriesNeed', since: 0, week: 0, total: 1 },
        // Bob's need is paused.
        { key: 'entriesActive', since: null, week: null, total: 2 },
        { key: 'membersWithEntry', since: null, week: null, total: 2 },
        // The GMS was never asked in this process.
        { key: 'membersOnMap', since: null, week: null, total: null },
        { key: 'conversationsNew', since: 1, week: 1, total: 1 },
        { key: 'groupsNew', since: 0, week: 0, total: 1 },
        { key: 'hellosFromMap', since: 1, week: 1, total: 1 },
        { key: 'videoRoomsCreated', since: 0, week: 0, total: 1 },
      ],
    })
  })

  it('shows the members on the map as the GMS last said them', async () => {
    const known = jest.spyOn(mapMemberCount, 'known').mockReturnValue(773)
    try {
      await loginAs('peter@lustig.de')

      const { data, errors } = await askFigures()

      expect(errors).toBeUndefined()
      expect(data.communityFigures.rows).toContainEqual({
        key: 'membersOnMap',
        since: null,
        week: null,
        total: 773,
      })
    } finally {
      known.mockRestore()
    }
  })

  // Last in the file: their logins come after the figures above were counted.
  it('answers no ordinary member', async () => {
    await loginAs('bibi@bloxberg.de')

    expect((await askFigures()).errors).toEqual([new GraphQLError('401 Unauthorized')])
  })

  it('answers no unconfirmed guest either', async () => {
    // Bob, unconfirmed and two days old: past the grace period, as a guest from a table is.
    const bob = await DbUserContact.findOneByOrFail({ email: 'bob@baumeister.de' })
    await DbUserContact.update({ id: bob.id }, { emailChecked: false })
    await dbUserUpdateField(bob.userId, 'createdAt', daysAgo(2))
    await loginAs('bob@baumeister.de')

    expect((await askFigures()).errors).toEqual([new GraphQLError('401 Unauthorized')])
  })

  it('is a right of the moderation, held by no ordinary member', () => {
    for (const role of [ROLE_MODERATOR, ROLE_MODERATOR_AI, ROLE_ADMIN]) {
      expect(role.hasRight(RIGHTS.COMMUNITY_FIGURES)).toBe(true)
    }
    expect(ROLE_USER.hasRight(RIGHTS.COMMUNITY_FIGURES)).toBe(false)
  })
})
