// AI-GENERATED — not an architecture reference
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import { sendTransactionReceivedEmail } from 'core'
import {
  AppDatabase,
  Transaction as DbTransaction,
  UserContact as DbUserContact,
  foreignReceive,
  transactionReactionsTable,
  User,
} from 'database'
import { eq } from 'drizzle-orm'
import { gql } from 'graphql-tag'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { creations } from '@/seeds/creation/index'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import {
  createTransactionLink,
  login,
  redeemTransactionLink,
  sendCoins,
  setTransactionReaction,
} from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

/**
 * Reacting to a transfer (migration 0159), through the whole server and against a database: the
 * recipient answers a transfer with an emoji, and the two the transfer is between read it with
 * the booking -- each on their own row, nobody else, and on no other booking.
 *
 * Bibi sends, Peter receives, Bob is the third member. What the resolver decides itself is held
 * in TransactionReactionResolver.setTransactionReaction.test.ts, where each answer of the
 * database can be brought about.
 */
// The mails are watched, to see that a reaction sends none. Nothing is sent either way.
jest.mock('core', () => {
  const original = jest.requireActual('core')
  return {
    __esModule: true,
    ...original,
    sendTransactionLinkRedeemedEmail: jest.fn(async () => null),
    sendTransactionReceivedEmail: jest.fn(async () => null),
  }
})

CONFIG.DLT_ACTIVE = false

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let bibi: User
let peter: User
let bob: User

const THUMB = '👍'
const SEEDLING = '🌱'
// With the selector for its coloured drawing, as the list has it.
const HEART = '❤️'

const BREAD = 'Für das Brot'
const JAM = 'Für die Marmelade'
const TO_BOB = 'Für den Zaun'
const BACK = 'Und zurück'
const GREETING = 'Einfach so — weil es Dich gibt.\nLieber Peter, danke!'
const ELSEWHERE = '99999999-9999-4999-8999-999999999999'
const SARAH = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const LOTTE = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'

type Booking = {
  id: number
  typeId: string
  memo: string
  linkedTransactionId: number | null
  reaction: string | null
  canReact: boolean
}

const bookingsWithReactions = gql`
  query ($counterparty: MemberAvatarRefInput = null) {
    transactionList(currentPage: 1, pageSize: 50, order: DESC, counterparty: $counterparty) {
      transactions {
        id
        typeId
        memo
        linkedTransactionId
        reaction
        canReact
      }
    }
  }
`

const loginAs = (email: string) =>
  mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

/** A transfer from whoever is signed in now. */
const send = async (recipientIdentifier: string, memo: string) => {
  const result = await mutate({
    mutation: sendCoins,
    variables: {
      recipientCommunityIdentifier: bibi.communityUuid,
      recipientIdentifier,
      amount: '5',
      memo,
    },
  })
  expect(result.errors).toBeUndefined()
  expect(result.data.sendCoins).toBe(true)
}

/** The booking list of a member, as their wallet asks for it. */
const listOf = async (email: string, counterparty: Record<string, string> | null = null) => {
  await loginAs(email)
  const result = await query({ query: bookingsWithReactions, variables: { counterparty } })
  expect(result.errors).toBeUndefined()
  return result.data.transactionList.transactions as Booking[]
}

const rowOf = (bookings: Booking[], typeId: string, memo: string) => {
  const rows = bookings.filter((booking) => booking.typeId === typeId && booking.memo === memo)
  expect(rows).toHaveLength(1)
  return rows[0]
}

/** Whoever is signed in now reacts to a booking, or takes the reaction back. */
const react = (transactionId: number, emoji?: string | null) =>
  mutate({ mutation: setTransactionReaction, variables: { transactionId, emoji } })

const reacted = async (transactionId: number, emoji?: string | null) => {
  const result = await react(transactionId, emoji)
  expect(result.errors).toBeUndefined()
  return result.data.setTransactionReaction as string | null
}

const drizzle = () => AppDatabase.getInstance().getDrizzleDataSource()
const reactionRows = () => drizzle().select().from(transactionReactionsTable)
const reactionRowsOf = (transactionId: number) =>
  drizzle()
    .select()
    .from(transactionReactionsTable)
    .where(eq(transactionReactionsTable.transactionId, transactionId))

// Peter's rows and Bibi's, read once the transfers are booked.
let peters: { bread: Booking; jam: Booking; greeting: Booking; sarah: Booking; lotte: Booking }
let bibis: { bread: Booking; jam: Booking; toBob: Booking; back: Booking; creation: Booking }

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  // The admin has to exist for creationFactory.
  peter = await userFactory(testEnv, peterLustig)
  bibi = await userFactory(testEnv, bibiBloxberg)
  // Bob is the third member: of the transfers between Bibi and Peter he is no part.
  bob = await userFactory(testEnv, bobBaumeister)
  await creationFactory(testEnv, creations.find((c) => c.email === 'bibi@bloxberg.de')!)

  // Two transfers from afar for Peter, before everything else: a booking takes its balance from
  // the member's last one. Sarah is named by her pair alone; for Lotte there is a `users` row
  // (`foreign`), and her booking is made to carry its id.
  await foreignReceive(
    peter,
    { communityUuid: ELSEWHERE, gradidoID: SARAH, name: 'Sarah' },
    new Date(Date.now() - 3_600_000),
  )
  const lotte = new User()
  lotte.gradidoID = LOTTE
  lotte.communityUuid = ELSEWHERE
  lotte.alias = 'lotte'
  lotte.foreign = true
  await lotte.save()
  await foreignReceive(
    peter,
    { communityUuid: ELSEWHERE, gradidoID: LOTTE, name: 'Lotte', linkedUserId: lotte.id },
    new Date(Date.now() - 1_800_000),
  )

  await loginAs('bibi@bloxberg.de')
  await send('peter@lustig.de', BREAD)
  await send('peter@lustig.de', JAM)
  await send('bob@baumeister.de', TO_BOB)
  // A booking made from a link with a greeting: a transfer like the others, Bibi its sender.
  const link = await mutate({
    mutation: createTransactionLink,
    variables: { amount: '7', memo: GREETING, greeting: { motif: 'bouquet' } },
  })
  expect(link.errors).toBeUndefined()
  await loginAs('peter@lustig.de')
  const redeemed = await mutate({
    mutation: redeemTransactionLink,
    variables: { code: link.data.createTransactionLink.code },
  })
  expect(redeemed.errors).toBeUndefined()
  await send('bibi@bloxberg.de', BACK)

  const petersList = await listOf('peter@lustig.de')
  const fromAfar = petersList.filter((booking) => booking.memo === 'from afar')
  expect(fromAfar).toHaveLength(2)
  peters = {
    bread: rowOf(petersList, 'RECEIVE', BREAD),
    jam: rowOf(petersList, 'RECEIVE', JAM),
    greeting: rowOf(petersList, 'RECEIVE', GREETING),
    // Newest first: Lotte's came after Sarah's.
    lotte: fromAfar[0],
    sarah: fromAfar[1],
  }
  const bibisList = await listOf('bibi@bloxberg.de')
  bibis = {
    bread: rowOf(bibisList, 'SEND', BREAD),
    jam: rowOf(bibisList, 'SEND', JAM),
    toBob: rowOf(bibisList, 'SEND', TO_BOB),
    back: rowOf(bibisList, 'RECEIVE', BACK),
    creation: bibisList.find((booking) => booking.typeId === 'CREATION') as Booking,
  }
  jest.clearAllMocks()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('before anybody reacted', () => {
  it('says on each booking of the recipient that they may react, and on no other', async () => {
    const petersList = await listOf('peter@lustig.de')
    const bibisList = await listOf('bibi@bloxberg.de')

    // Peter's: the three transfers from Bibi, the one made from her link among them.
    expect(
      petersList
        .filter((booking) => booking.canReact)
        .map((booking) => booking.memo)
        .sort(),
    ).toEqual([BREAD, JAM, GREETING].sort())
    // Bibi's: only what she received -- no SEND row, not the creation, not the decay.
    expect(bibisList.filter((booking) => booking.canReact).map((booking) => booking.memo)).toEqual([
      BACK,
    ])
    expect(bibis.creation.canReact).toBe(false)
    expect([...petersList, ...bibisList].every((booking) => booking.reaction === null)).toBe(true)
    expect(await reactionRows()).toEqual([])
  })

  // A reaction has no way to another community yet -- with or without a stored row of the sender.
  it('lets nobody react to a transfer from another community', () => {
    expect(peters.sarah.canReact).toBe(false)
    expect(peters.lotte.canReact).toBe(false)
  })
})

describe('the recipient reacts', () => {
  beforeAll(async () => {
    await loginAs('peter@lustig.de')
    jest.clearAllMocks()
  })

  it('answers the emoji, and files one row on the recipient’s booking', async () => {
    expect(await reacted(peters.bread.id, HEART)).toBe(HEART)

    const rows = await reactionRows()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ transactionId: peters.bread.id, emoji: HEART })
  })

  it('is read by the recipient on their row, and by the sender on theirs', async () => {
    expect(rowOf(await listOf('peter@lustig.de'), 'RECEIVE', BREAD).reaction).toBe(HEART)
    expect(rowOf(await listOf('bibi@bloxberg.de'), 'SEND', BREAD).reaction).toBe(HEART)
  })

  it('is on no other booking of either of them, and on nobody else’s', async () => {
    const others = [
      ...(await listOf('peter@lustig.de')).filter((booking) => booking.id !== peters.bread.id),
      ...(await listOf('bibi@bloxberg.de')).filter((booking) => booking.id !== bibis.bread.id),
      ...(await listOf('bob@baumeister.de')),
    ]

    expect(others.length).toBeGreaterThan(5)
    expect(others.filter((booking) => booking.reaction !== null)).toEqual([])
  })

  // The conversation of the two asks the same list, narrowed to the other one.
  it('is read in the list narrowed to the other member as well', async () => {
    const withBibi = await listOf('peter@lustig.de', {
      communityUuid: bibi.communityUuid as string,
      gradidoID: bibi.gradidoID,
    })
    const withPeter = await listOf('bibi@bloxberg.de', {
      communityUuid: peter.communityUuid as string,
      gradidoID: peter.gradidoID,
    })

    expect(rowOf(withBibi, 'RECEIVE', BREAD).reaction).toBe(HEART)
    expect(rowOf(withPeter, 'SEND', BREAD).reaction).toBe(HEART)
  })

  // The mail of a transfer is the one a reaction could be mistaken for: it is not sent again.
  // (That the resolver sends none at all is plain from what it imports.)
  it('sends no mail of a transfer again, and writes no error', () => {
    expect(sendTransactionReceivedEmail).not.toHaveBeenCalled()
    expect(logErrorLogger.error).not.toHaveBeenCalled()
  })

  it('puts another emoji in the place of the first, in the same row', async () => {
    await loginAs('peter@lustig.de')
    const before = await reactionRowsOf(peters.bread.id)

    expect(await reacted(peters.bread.id, SEEDLING)).toBe(SEEDLING)

    const rows = await reactionRowsOf(peters.bread.id)
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(before[0].id)
    expect(rows[0].emoji).toBe(SEEDLING)
    expect(rowOf(await listOf('bibi@bloxberg.de'), 'SEND', BREAD).reaction).toBe(SEEDLING)
  })

  it('reacts to a transfer made from a link with a greeting as to any other', async () => {
    await loginAs('peter@lustig.de')

    expect(await reacted(peters.greeting.id, THUMB)).toBe(THUMB)

    expect(rowOf(await listOf('bibi@bloxberg.de'), 'SEND', GREETING).reaction).toBe(THUMB)
    expect(rowOf(await listOf('bibi@bloxberg.de'), 'SEND', BREAD).reaction).toBe(SEEDLING)
  })

  it('takes the reaction back, for both of them', async () => {
    await loginAs('peter@lustig.de')

    expect(await reacted(peters.greeting.id, null)).toBeNull()

    expect(await reactionRowsOf(peters.greeting.id)).toEqual([])
    expect(rowOf(await listOf('peter@lustig.de'), 'RECEIVE', GREETING).reaction).toBeNull()
    expect(rowOf(await listOf('bibi@bloxberg.de'), 'SEND', GREETING).reaction).toBeNull()
    // Once more: none to take back is an answer.
    await loginAs('peter@lustig.de')
    expect(await reacted(peters.greeting.id)).toBeNull()
  })

  it('goes both ways: whoever sent may react to what they received', async () => {
    await loginAs('bibi@bloxberg.de')

    expect(await reacted(bibis.back.id, HEART)).toBe(HEART)

    expect(rowOf(await listOf('peter@lustig.de'), 'SEND', BACK).reaction).toBe(HEART)
    // And the transfers the other way keep their own.
    expect(rowOf(await listOf('peter@lustig.de'), 'RECEIVE', BREAD).reaction).toBe(SEEDLING)
  })
})

describe('only the recipient reacts', () => {
  const refused = async (email: string, transactionId: number, emoji: string | null = THUMB) => {
    await loginAs(email)
    const before = await reactionRows()
    const result: any = await react(transactionId, emoji)
    expect(await reactionRows()).toEqual(before)
    return result.errors?.[0]?.message as string | undefined
  }

  it('refuses the sender, by their own row and by the recipient’s', async () => {
    expect(await refused('bibi@bloxberg.de', bibis.jam.id)).toBe(
      'TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER',
    )
    expect(await refused('bibi@bloxberg.de', peters.jam.id)).toBe(
      'TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER',
    )
  })

  it('refuses the sender who wants to take the recipient’s reaction back', async () => {
    expect(await refused('bibi@bloxberg.de', peters.bread.id, null)).toBe(
      'TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER',
    )
    expect(await refused('bibi@bloxberg.de', bibis.bread.id, null)).toBe(
      'TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER',
    )
  })

  it('refuses a member the transfer is not between', async () => {
    expect(await refused('bob@baumeister.de', peters.jam.id)).toBe(
      'TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER',
    )
    expect(await refused('bob@baumeister.de', bibis.jam.id)).toBe(
      'TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER',
    )
  })

  it('refuses a creation, and an id without a booking', async () => {
    expect(await refused('bibi@bloxberg.de', bibis.creation.id)).toBe(
      'TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER',
    )
    expect(await refused('bibi@bloxberg.de', 2_000_000_000)).toBe(
      'TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER',
    )
  })

  it('refuses a transfer from another community, with or without a stored row of its sender', async () => {
    expect(await refused('peter@lustig.de', peters.sarah.id)).toBe(
      'TRANSACTION_REACTION_NOT_SET: OTHER_COMMUNITY',
    )
    expect(await refused('peter@lustig.de', peters.lotte.id)).toBe(
      'TRANSACTION_REACTION_NOT_SET: OTHER_COMMUNITY',
    )
  })

  it('refuses what is none of the forty-eight, and what is no id', async () => {
    expect(await refused('peter@lustig.de', peters.jam.id, '🦄')).toBe(
      'TRANSACTION_REACTION_NOT_SET: UNKNOWN_EMOJI',
    )
    expect(await refused('peter@lustig.de', peters.jam.id, 'danke')).toBe(
      'TRANSACTION_REACTION_NOT_SET: UNKNOWN_EMOJI',
    )
    // The column takes sixteen characters: seventeen never reach the resolver.
    expect(await refused('peter@lustig.de', peters.jam.id, THUMB.repeat(17))).toContain(
      'Argument Validation Error',
    )
    expect(await refused('peter@lustig.de', 0)).toContain('Argument Validation Error')
    expect(await refused('peter@lustig.de', -5)).toContain('Argument Validation Error')
  })

  it('refuses whoever is not signed in', async () => {
    resetToken()
    const result: any = await react(peters.jam.id, THUMB)

    expect(result.errors?.[0]?.message).toBe('401 Unauthorized')
    expect(await reactionRowsOf(peters.jam.id)).toEqual([])
  })
})

/**
 * ⛔ The two rows of a transfer name EACH OTHER, and only such a pair is one transfer. A number
 * on a sender's row alone shows nothing -- across the border there is no second row here at all.
 */
describe('a sender is shown a reaction only where the reacted booking names their row back', () => {
  it('shows none on a SEND row that names a booking with a reaction which is not its other half', async () => {
    // Bibi's transfer to Bob is made to name Peter's RECEIVE row of the bread, which carries a
    // reaction and names Bibi's bread row back -- not this one.
    const stranger = await DbTransaction.findOneOrFail({ where: { id: bibis.toBob.id } })
    const itsOwn = stranger.linkedTransactionId
    stranger.linkedTransactionId = peters.bread.id
    await stranger.save()

    const bibisList = await listOf('bibi@bloxberg.de')

    expect(rowOf(bibisList, 'SEND', TO_BOB).reaction).toBeNull()
    expect(rowOf(bibisList, 'SEND', BREAD).reaction).toBe(SEEDLING)
    stranger.linkedTransactionId = itsOwn
    await stranger.save()
  })

  // What a transfer to another community looks like: no member here on the other side. That
  // its number is the id of a booking here, which even names this row back, shows nothing.
  it('shows none on a booking whose counterparty is no member here, whatever it names', async () => {
    const lottesRow = await User.findOneOrFail({ where: { gradidoID: LOTTE } })
    const sent = await DbTransaction.findOneOrFail({ where: { id: bibis.bread.id } })
    const itsRecipient = sent.linkedUserId
    sent.linkedUserId = lottesRow.id
    await sent.save()

    expect(rowOf(await listOf('bibi@bloxberg.de'), 'SEND', BREAD).reaction).toBeNull()

    sent.linkedUserId = itsRecipient
    await sent.save()
    expect(rowOf(await listOf('bibi@bloxberg.de'), 'SEND', BREAD).reaction).toBe(SEEDLING)
  })
})

/**
 * Behind REACT_TO_TRANSACTION, which is on RESTRICTED_WHILE_UNCONFIRMED: the sender sees a
 * reaction, as the conversation sees one to a message. Last in this file: Bob stays as he is
 * made here.
 */
describe('an unconfirmed account past its grace period', () => {
  let bobs: Booking

  beforeAll(async () => {
    bobs = rowOf(await listOf('bob@baumeister.de'), 'RECEIVE', TO_BOB)
    // He could react a moment ago; now unconfirmed, and two days old.
    await User.update({ id: bob.id }, { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) })
    await DbUserContact.update({ id: bob.emailId ?? 0 }, { emailChecked: false })
    await loginAs('bob@baumeister.de')
  })
  afterAll(() => resetToken())

  it('was offered the reaction while it was confirmed', () => {
    expect(bobs.canReact).toBe(true)
  })

  it('may not react to what it received, and nothing is written', async () => {
    const result: any = await react(bobs.id, THUMB)

    expect(result.errors?.[0]?.message).toBe('401 Unauthorized')
    expect(await reactionRowsOf(bobs.id)).toEqual([])
  })

  // Taking back is behind the same right: the mutation is one.
  it('may not take a reaction back either', async () => {
    const result: any = await react(bobs.id, null)

    expect(result.errors?.[0]?.message).toBe('401 Unauthorized')
  })

  // Reading is not behind it: the reaction comes with the booking list.
  it('still reads its booking list', async () => {
    const result = await query({ query: bookingsWithReactions, variables: { counterparty: null } })

    expect(result.errors).toBeUndefined()
    expect(rowOf(result.data.transactionList.transactions, 'RECEIVE', TO_BOB).reaction).toBeNull()
  })
})
