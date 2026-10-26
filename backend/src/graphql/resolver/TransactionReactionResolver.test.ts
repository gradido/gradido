// AI-GENERATED — not an architecture reference
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import { sendTransactionReactionReceivedEmail, sendTransactionReceivedEmail } from 'core'
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
import { GradidoUnit } from 'shared'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { creations } from '@/seeds/creation/index'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import {
  createTransactionLink,
  login,
  redeemTransactionLink,
  sendChatMessage,
  sendCoins,
  setChatConversationMuted,
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
// The mails are watched, not sent: the ones about a transfer, which a reaction must not send
// again, and the one about a first reaction (W1), which it does -- answered as a mail that went
// out, as the transport would. The chat's mail is watched too: a test opens a conversation to
// mute it. Nothing is sent either way.
jest.mock('core', () => {
  const original = jest.requireActual('core')
  return {
    __esModule: true,
    ...original,
    sendTransactionLinkRedeemedEmail: jest.fn(async () => null),
    sendTransactionReceivedEmail: jest.fn(async () => null),
    sendTransactionReactionReceivedEmail: jest.fn(async () => ({ accepted: ['watched'] })),
    sendCustomEmail: jest.fn(async () => null),
  }
})

CONFIG.DLT_ACTIVE = false

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
const mailLogger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.transactionReactionMail`,
)

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
// Four more from Bibi to Peter, for the mail about a first reaction (W1).
const CAKE = 'Für den Kuchen'
const FLOWERS = 'Für die Blumen'
const TEA = 'Für den Tee'
const WINE = 'Für den Wein'
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

/** The mails about a first reaction handed to core since the last clear, one entry a mail. */
const mailed = () =>
  (sendTransactionReactionReceivedEmail as jest.Mock).mock.calls.map(([data]) => data)
const clearMails = () => (sendTransactionReactionReceivedEmail as jest.Mock).mockClear()

/** Bibi mutes the conversation with Peter, or lifts it. */
const bibiMutesPeter = async (muted: boolean) => {
  await loginAs('bibi@bloxberg.de')
  const result = await mutate({
    mutation: setChatConversationMuted,
    variables: { ref: { communityUuid: peter.communityUuid, gradidoID: peter.gradidoID }, muted },
  })
  expect(result.errors).toBeUndefined()
  expect(result.data.setChatConversationMuted).toBe(true)
}

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
  // The mail a first reaction does send (W1) is held in the block below.
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

/**
 * W1, the first wave back: the first reaction to a transfer mails whoever sent it -- the giver of
 * the thank-you -- that it arrived; another emoji in its place and a reaction taken back stay
 * silent; a giver who muted the conversation with the recipient gets nothing (E-024); taken back
 * and set anew mails again. Measured at what the mail function is handed, with a database.
 */
describe('the giver is mailed about the first reaction', () => {
  // The jam stands without a reaction afterwards, as the blocks below expect it.
  afterAll(async () => {
    await loginAs('peter@lustig.de')
    await reacted(peters.jam.id, null)
    clearMails()
  })

  // Of everything above: three transfers got their first reaction, one of them after another
  // emoji had replaced the first -- and nothing else went out.
  it('mailed the first reaction to each of three transfers above, and nothing else', () => {
    expect(mailed().map((mail) => [mail.email, mail.transactionMemo, mail.emoji])).toEqual([
      ['bibi@bloxberg.de', BREAD, HEART],
      ['bibi@bloxberg.de', GREETING, THUMB],
      ['peter@lustig.de', BACK, HEART],
    ])
  })

  it('mails the giver once, with the recipient’s alias and community, the emoji, the amount, the memo and the way into the conversation', async () => {
    clearMails()
    await loginAs('peter@lustig.de')

    expect(await reacted(peters.jam.id, HEART)).toBe(HEART)

    expect(mailed()).toEqual([
      {
        firstName: 'Bibi',
        lastName: 'Bloxberg',
        email: 'bibi@bloxberg.de',
        language: 'de',
        recipientAlias: 'PeterL',
        recipientCommunity: CONFIG.COMMUNITY_NAME,
        emoji: HEART,
        transactionAmount: GradidoUnit.fromNumber(5),
        transactionMemo: JAM,
        recipientUuid: peter.gradidoID,
        recipientCommunityUuid: peter.communityUuid,
      },
    ])
    expect(mailLogger.info).toHaveBeenCalledWith(
      `transaction reaction mail sent: transaction_id=${peters.jam.id}`,
    )
  })

  it('mails nothing for another emoji in its place, nor for the reaction taken back', async () => {
    clearMails()

    expect(await reacted(peters.jam.id, SEEDLING)).toBe(SEEDLING)
    expect(await reacted(peters.jam.id, null)).toBeNull()

    expect(mailed()).toEqual([])
    expect(await reactionRowsOf(peters.jam.id)).toEqual([])
  })

  // The row was gone in between: a first reaction once more (W1, decision 3).
  it('mails again where the reaction was taken back and set anew', async () => {
    clearMails()

    expect(await reacted(peters.jam.id, THUMB)).toBe(THUMB)

    expect(mailed().map((mail) => [mail.email, mail.transactionMemo, mail.emoji])).toEqual([
      ['bibi@bloxberg.de', JAM, THUMB],
    ])
  })

  it('mails nothing while the giver has the conversation with the recipient muted, and again once it is lifted', async () => {
    // There is no conversation of the two yet: Bibi's first chat message opens it, then she
    // mutes it, and sends two more thank-yous.
    await loginAs('bibi@bloxberg.de')
    const hello = await mutate({
      mutation: sendChatMessage,
      variables: {
        ref: { communityUuid: peter.communityUuid, gradidoID: peter.gradidoID },
        body: 'Hallo Peter!',
        notify: 'NONE',
      },
    })
    expect(hello.errors).toBeUndefined()
    await bibiMutesPeter(true)
    await send('peter@lustig.de', CAKE)
    await send('peter@lustig.de', FLOWERS)
    const cake = rowOf(await listOf('peter@lustig.de'), 'RECEIVE', CAKE)
    const flowers = rowOf(await listOf('peter@lustig.de'), 'RECEIVE', FLOWERS)
    clearMails()

    expect(await reacted(cake.id, HEART)).toBe(HEART)

    expect(mailed()).toEqual([])
    expect(await reactionRowsOf(cake.id)).toHaveLength(1)
    expect(mailLogger.info).toHaveBeenCalledWith(
      `transaction reaction mail not sent: transaction_id=${cake.id} MUTED`,
    )

    await bibiMutesPeter(false)
    await loginAs('peter@lustig.de')
    expect(await reacted(flowers.id, HEART)).toBe(HEART)

    expect(mailed().map((mail) => [mail.email, mail.transactionMemo])).toEqual([
      ['bibi@bloxberg.de', FLOWERS],
    ])
  })

  it('mails nothing where the giver has no address, and says so in the log', async () => {
    await loginAs('bibi@bloxberg.de')
    await send('peter@lustig.de', TEA)
    const tea = rowOf(await listOf('peter@lustig.de'), 'RECEIVE', TEA)
    // Bibi loses her address row for a moment -- nobody to mail.
    await User.update({ id: bibi.id }, { emailId: null })
    clearMails()

    try {
      expect(await reacted(tea.id, HEART)).toBe(HEART)

      expect(mailed()).toEqual([])
      expect(await reactionRowsOf(tea.id)).toHaveLength(1)
      expect(mailLogger.info).toHaveBeenCalledWith(
        `transaction reaction mail not sent: transaction_id=${tea.id} NO_ADDRESS`,
      )
    } finally {
      await User.update({ id: bibi.id }, { emailId: bibi.emailId })
    }
  })

  // ⛔ The reaction is stored before the mail, and the answer is the same whatever the mail did.
  it('answers the emoji, with the reaction stored, where the mail throws', async () => {
    await loginAs('bibi@bloxberg.de')
    await send('peter@lustig.de', WINE)
    const wine = rowOf(await listOf('peter@lustig.de'), 'RECEIVE', WINE)
    clearMails()
    ;(sendTransactionReactionReceivedEmail as jest.Mock).mockRejectedValueOnce(
      new Error('smtp down'),
    )

    expect(await reacted(wine.id, HEART)).toBe(HEART)

    expect(mailed()).toHaveLength(1)
    expect(await reactionRowsOf(wine.id)).toMatchObject([{ transactionId: wine.id, emoji: HEART }])
    expect(mailLogger.error).toHaveBeenCalledWith(
      `transaction reaction mail failed: transaction_id=${wine.id} (Error)`,
    )
    expect(logErrorLogger.error).not.toHaveBeenCalled()
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
