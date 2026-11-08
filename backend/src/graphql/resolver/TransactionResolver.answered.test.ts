// AI-GENERATED — not an architecture reference
import { ApolloServerTestClient, cleanDB, testEnvironment } from '@test/helpers'
import {
  AppDatabase,
  chatConversationMembersTable,
  chatConversationsTable,
  createTransaction,
  dbEnsureDirectChatConversation,
  dbInsertChatMessage,
  TransactionTypeId,
  transferGradidos,
  User,
} from 'database'
import { eq } from 'drizzle-orm'
import { gql } from 'graphql-tag'
import { GradidoUnit } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { userFactory } from '@/seeds/factory/user'
import { login, sendChatMessage, sendCoins } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

/**
 * Whether a thank-you was answered (F E-046), through the whole server and against a database:
 * Peter thanks Bibi, and her booking list says she answered it once she wrote him a message or
 * sent him Gradido after it came -- on her row, and on nobody's other row. Bob is the third member.
 *
 * The bookings and the messages are written by the fixture at times of its own, in date order, so
 * that "after" is exact. The last test takes the ways a member really answers, sendCoins and
 * sendChatMessage, at the time they run: the booking's time from the server's clock, the message's
 * from the database's.
 *
 * What each case decides is held in data/ThanksAnswer.logic.test.ts, the two queries in `database`.
 */
CONFIG.DLT_ACTIVE = false

const BIBI = 'bibi@bloxberg.de'
const PETER = 'peter@lustig.de'
const BREAD = 'Für das Brot'
const JAM = 'Für die Marmelade'
const BACK = 'Und zurück'
const TEA = 'Für den Tee'

const day = (n: number): Date => new Date(Date.UTC(2026, 7, n, 12, 0, 0))

type Booking = { id: number; typeId: string; memo: string; canReact: boolean; answered: boolean }

const bookingsAnswered = gql`
  query {
    transactionList(currentPage: 1, pageSize: 50, order: DESC) {
      transactions {
        id
        typeId
        memo
        canReact
        answered
      }
    }
  }
`

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let bibi: User
let peter: User
let bob: User

const loginAs = (email: string) =>
  mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

/** The booking list of a member, as their wallet asks for it. */
const listOf = async (email: string) => {
  await loginAs(email)
  const result = await query({ query: bookingsAnswered })
  expect(result.errors).toBeUndefined()
  return result.data.transactionList.transactions as Booking[]
}

const rowOf = (bookings: Booking[], typeId: string, memo: string) => {
  const rows = bookings.filter((booking) => booking.typeId === typeId && booking.memo === memo)
  expect(rows).toHaveLength(1)
  return rows[0]
}

const pairOf = (member: User) => ({
  communityUuid: member.communityUuid,
  gradidoId: member.gradidoID,
})

/** A message straight into the chat's tables, at the fixture's time. */
const write = async (conversationId: number, from: User, at: Date) => {
  const filed = await dbInsertChatMessage({
    messageUuid: uuidv4(),
    conversationId,
    senderCommunityUuid: from.communityUuid,
    senderGradidoId: from.gradidoID,
    subject: null,
    body: `written ${at.toISOString()}`,
    notify: 'none',
    deliveryState: 'delivered',
    createdAt: at,
  })
  expect(filed.success).toBe(true)
}

const writeTo = async (from: User, to: User, at: Date) =>
  write((await dbEnsureDirectChatConversation(pairOf(from), pairOf(to))).id, from, at)

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  bibi = await userFactory(testEnv, bibiBloxberg)
  peter = await userFactory(testEnv, peterLustig)
  bob = await userFactory(testEnv, bobBaumeister)
  // ⚠️ In date order: a seeded booking takes its balance from the member's last one and computes
  // the decay between the two dates, which does not run backwards. A creation first, booked with
  // nobody: Peter sends more than he receives.
  await createTransaction(
    GradidoUnit.fromNumber(1000),
    'to send from',
    peter,
    bibi,
    TransactionTypeId.CREATION,
    day(0),
    day(0),
  )
  await transferGradidos(peter, bibi, new GradidoUnit(10000n), BREAD, day(2))
})

afterAll(async () => {
  for (const table of ['chat_messages', 'chat_conversation_members', 'chat_conversations']) {
    await db.getDataSource().query(`DELETE FROM \`${table}\``)
  }
  await cleanDB()
  await db.destroy()
})

describe('transactionList, whether a thank-you was answered', () => {
  it('says nothing is answered while nothing was written or sent', async () => {
    expect(rowOf(await listOf(BIBI), 'RECEIVE', BREAD)).toMatchObject({
      canReact: true,
      answered: false,
    })
    expect(rowOf(await listOf(PETER), 'SEND', BREAD).answered).toBe(false)
  })

  it('takes her message to him after the thank-you as her answer, on her row alone', async () => {
    await writeTo(bibi, peter, day(3))

    expect(rowOf(await listOf(BIBI), 'RECEIVE', BREAD).answered).toBe(true)
    expect(rowOf(await listOf(PETER), 'SEND', BREAD).answered).toBe(false)
  })

  it('takes that message for no thank-you that came after it', async () => {
    await transferGradidos(peter, bibi, new GradidoUnit(10000n), JAM, day(4))

    const bibis = await listOf(BIBI)
    expect(rowOf(bibis, 'RECEIVE', JAM).answered).toBe(false)
    expect(rowOf(bibis, 'RECEIVE', BREAD).answered).toBe(true)
  })

  it('takes no message of his, none of hers to somebody else and none in a group as her answer', async () => {
    await writeTo(peter, bibi, day(5))
    await writeTo(bibi, bob, day(6))
    // A group with the two of them in it, Bibi wrote there.
    const drizzle = db.getDrizzleDataSource()
    const groupUuid = uuidv4()
    await drizzle.insert(chatConversationsTable).values({
      conversationUuid: groupUuid,
      kind: 'group',
      homeCommunityUuid: bibi.communityUuid,
      title: 'Hühner',
      createdByCommunityUuid: bibi.communityUuid,
      createdByGradidoId: bibi.gradidoID,
    })
    const [group] = await drizzle
      .select()
      .from(chatConversationsTable)
      .where(eq(chatConversationsTable.conversationUuid, groupUuid))
    await drizzle.insert(chatConversationMembersTable).values([
      { conversationId: group.id, ...pairOf(bibi) },
      { conversationId: group.id, ...pairOf(peter) },
    ])
    await write(group.id, bibi, day(7))

    expect(rowOf(await listOf(BIBI), 'RECEIVE', JAM).answered).toBe(false)
  })

  it('takes Gradido she sends him back as her answer to every thank-you before it', async () => {
    await transferGradidos(bibi, peter, new GradidoUnit(10000n), BACK, day(8))

    const bibis = await listOf(BIBI)
    expect(rowOf(bibis, 'RECEIVE', BREAD).answered).toBe(true)
    expect(rowOf(bibis, 'RECEIVE', JAM).answered).toBe(true)
    // Her own sending is no thank-you she received.
    expect(rowOf(bibis, 'SEND', BACK).answered).toBe(false)

    const peters = await listOf(PETER)
    expect(rowOf(peters, 'SEND', BREAD).answered).toBe(false)
    expect(rowOf(peters, 'SEND', JAM).answered).toBe(false)
    // Her Gradido is a thank-you to him, and his message (day 5) and sendings came before it.
    expect(rowOf(peters, 'RECEIVE', BACK)).toMatchObject({ canReact: true, answered: false })
  })

  it('takes the ways a member really answers, at the time they run', async () => {
    await loginAs(PETER)
    const sent = await mutate({
      mutation: sendCoins,
      variables: {
        recipientCommunityIdentifier: bibi.communityUuid,
        recipientIdentifier: BIBI,
        amount: '5',
        memo: TEA,
      },
    })
    expect(sent.errors).toBeUndefined()
    expect(rowOf(await listOf(BIBI), 'RECEIVE', TEA).answered).toBe(false)

    await loginAs(BIBI)
    const message = await mutate({
      mutation: sendChatMessage,
      variables: {
        ref: { communityUuid: peter.communityUuid, gradidoID: peter.gradidoID },
        body: 'Danke, Peter!',
        notify: 'NONE',
      },
    })
    expect(message.errors).toBeUndefined()
    expect(rowOf(await listOf(BIBI), 'RECEIVE', TEA).answered).toBe(true)
  })
})
