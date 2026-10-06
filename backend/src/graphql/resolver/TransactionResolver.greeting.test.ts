// AI-GENERATED — not an architecture reference
import { ApolloServerTestClient, cleanDB, testEnvironment } from '@test/helpers'
import {
  AppDatabase,
  Transaction as DbTransaction,
  dbSelectThankYouGreetingsByLinkIds,
  foreignReceive,
  User,
} from 'database'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { creations } from '@/seeds/creation/index'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import {
  createTransactionLink,
  login,
  redeemTransactionLink,
  sendCoins,
} from '@/seeds/graphql/mutations'
import { transactionsQuery } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

/**
 * A thank-you greeting that was accepted: the booking made from its link carries the greeting
 * in the booking list (`Transaction.greeting`), for the two people it is between -- that is
 * what their conversation shows with it.
 *
 * Bibi writes the greetings, Peter and Bob accept them through the real mutations. The query of
 * the greetings' table is the real one, wrapped so that a test can see how often a page asks
 * and for which links.
 */
jest.mock('database', () => {
  const original = jest.requireActual('database')
  return {
    __esModule: true,
    ...original,
    dbSelectThankYouGreetingsByLinkIds: jest.fn(original.dbSelectThankYouGreetingsByLinkIds),
  }
})
// The two mails of a redeemed link are not this file's matter; nothing is sent.
jest.mock('core', () => {
  const original = jest.requireActual('core')
  return {
    __esModule: true,
    ...original,
    sendTransactionLinkRedeemedEmail: jest.fn(async () => null),
    sendTransactionReceivedEmail: jest.fn(async () => null),
  }
})
jest.mock('@/password/EncryptorUtils')

const selectGreetings = dbSelectThankYouGreetingsByLinkIds as jest.MockedFunction<
  typeof dbSelectThankYouGreetingsByLinkIds
>

CONFIG.DLT_ACTIVE = false

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let bibi: User
let peter: User
let bob: User

const LINE = 'Einfach so — weil es Dich gibt.'
const WORDS = 'Lieber Peter, mit Deinem Werkzeug hat alles angefangen.\nDeine Bibi'
const GREETING = { motif: 'morning-light', line: LINE, recipientName: 'Peter vom Hof' }
const GREETING_MEMO = `${LINE}\n${WORDS}`
const PLAIN_MEMO = 'Danke fürs Reparieren der Gartenbank'
const TRANSFER_MEMO = 'Einfach überwiesen, ohne Link'
const BOBS_MEMO = 'Danke fürs Zuhören, lieber Bob'
const RAEUBERS_MEMO = 'Für die Kaffeemühle, Hotzenplotz'
const BOBS_GREETING = { motif: 'bouquet', line: null, recipientName: null }
const PETERS_MEMO = 'Ein Gruß von Peter, den niemand annimmt'

type Booking = {
  id: number
  typeId: string
  memo: string
  linkId: number | null
  linkedUser: { gradidoID: string } | null
  greeting: { motif: string | null; line: string | null; recipientName: string | null } | null
}

let greetingLink: { id: number; code: string }
let plainLink: { id: number; code: string }
let bobsLink: { id: number; code: string }
// Made by Peter, with a greeting, and never accepted: the link of somebody other than Bibi.
let petersLink: { id: number; code: string }

const loginAs = (email: string) =>
  mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

const created = async (variables: Record<string, unknown>) => {
  const result = await mutate({ mutation: createTransactionLink, variables })
  expect(result.errors).toBeUndefined()
  return result.data.createTransactionLink as { id: number; code: string }
}

const redeemed = async (email: string, code: string) => {
  await loginAs(email)
  const result = await mutate({ mutation: redeemTransactionLink, variables: { code } })
  expect(result.errors).toBeUndefined()
  expect(result.data.redeemTransactionLink).toBe(true)
}

const sent = async (recipientIdentifier: string, amount: string, memo: string) => {
  const result = await mutate({
    mutation: sendCoins,
    variables: {
      recipientCommunityIdentifier: bibi.communityUuid,
      recipientIdentifier,
      amount,
      memo,
    },
  })
  expect(result.errors).toBeUndefined()
}

/** The booking list of a member, as their wallet asks for it; only this call is counted. */
const listOf = async (email: string, variables: Record<string, unknown> = {}) => {
  await loginAs(email)
  jest.clearAllMocks()
  const result = await query({ query: transactionsQuery, variables })
  expect(result.errors).toBeUndefined()
  return result.data.transactionList.transactions as Booking[]
}

const rowOf = (bookings: Booking[], typeId: string, memo: string) => {
  const rows = bookings.filter((booking) => booking.typeId === typeId && booking.memo === memo)
  expect(rows).toHaveLength(1)
  return rows[0]
}

const pairOf = (member: User) => ({
  gradidoID: member.gradidoID,
  communityUuid: member.communityUuid,
})

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  // The admin has to exist for creationFactory.
  peter = await userFactory(testEnv, peterLustig)
  bibi = await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
  await userFactory(testEnv, raeuberHotzenplotz)
  await creationFactory(testEnv, creations.find((c) => c.email === 'bibi@bloxberg.de')!)

  await loginAs('bibi@bloxberg.de')
  greetingLink = await created({ amount: '20', memo: GREETING_MEMO, greeting: GREETING })
  plainLink = await created({ amount: '5', memo: PLAIN_MEMO })
  bobsLink = await created({ amount: '7', memo: BOBS_MEMO, greeting: { motif: 'bouquet' } })
  await sent('peter@lustig.de', '3', TRANSFER_MEMO)
  await sent('raeuber@hotzenplotz.de', '2', RAEUBERS_MEMO)

  await redeemed('peter@lustig.de', greetingLink.code)
  await redeemed('peter@lustig.de', plainLink.code)
  await redeemed('bob@baumeister.de', bobsLink.code)

  await loginAs('peter@lustig.de')
  petersLink = await created({
    amount: '2',
    memo: PETERS_MEMO,
    greeting: { motif: 'giving-hands' },
  })
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('the booking of an accepted thank-you greeting', () => {
  it('carries the greeting on the sender’s list', async () => {
    const row = rowOf(await listOf('bibi@bloxberg.de'), 'SEND', GREETING_MEMO)

    expect(row.greeting).toEqual(GREETING)
    expect(row.linkId).toBe(greetingLink.id)
    expect(row.linkedUser?.gradidoID).toBe(peter.gradidoID)
  })

  it('carries the same greeting on the recipient’s list', async () => {
    const row = rowOf(await listOf('peter@lustig.de'), 'RECEIVE', GREETING_MEMO)

    expect(row.greeting).toEqual(GREETING)
    expect(row.linkId).toBe(greetingLink.id)
    expect(row.linkedUser?.gradidoID).toBe(bibi.gradidoID)
  })

  it('carries a greeting of a motif alone as that', async () => {
    expect(rowOf(await listOf('bibi@bloxberg.de'), 'SEND', BOBS_MEMO).greeting).toEqual(
      BOBS_GREETING,
    )
    expect(rowOf(await listOf('bob@baumeister.de'), 'RECEIVE', BOBS_MEMO).greeting).toEqual(
      BOBS_GREETING,
    )
  })
})

describe('a booking without a greeting', () => {
  it('made from a plain link has none, on either side', async () => {
    const sendersRow = rowOf(await listOf('bibi@bloxberg.de'), 'SEND', PLAIN_MEMO)
    const recipientsRow = rowOf(await listOf('peter@lustig.de'), 'RECEIVE', PLAIN_MEMO)

    expect(sendersRow.linkId).toBe(plainLink.id)
    expect(sendersRow.greeting).toBeNull()
    expect(recipientsRow.linkId).toBe(plainLink.id)
    expect(recipientsRow.greeting).toBeNull()
  })

  it('that is a plain transfer has none, on either side', async () => {
    expect(rowOf(await listOf('bibi@bloxberg.de'), 'SEND', TRANSFER_MEMO).greeting).toBeNull()
    expect(rowOf(await listOf('peter@lustig.de'), 'RECEIVE', TRANSFER_MEMO).greeting).toBeNull()
  })

  it('that is a creation has none', async () => {
    const creationRows = (await listOf('bibi@bloxberg.de')).filter(
      (booking) => booking.typeId === 'CREATION',
    )

    expect(creationRows.length).toBeGreaterThan(0)
    for (const creation of creationRows) {
      expect(creation.greeting).toBeNull()
    }
  })

  /**
   * ⛔ Two ranges of numbers meet in a booking's link: the id of a transaction link and, for a
   * creation, the id of its contribution link (the model's `linkId`). No code writes a
   * transaction link onto a creation's row; the row here is given the number of the link with
   * the greeting all the same, so the test holds the day the two get mixed up.
   */
  it('that is a creation has none even where its row carries the number of that link', async () => {
    const creation = (await listOf('bibi@bloxberg.de')).find(
      (booking) => booking.typeId === 'CREATION',
    )!
    await DbTransaction.update({ id: creation.id }, { transactionLinkId: greetingLink.id })
    try {
      const bookings = await listOf('bibi@bloxberg.de')
      const row = bookings.find((booking) => booking.id === creation.id)!

      // The number is there, and it is the greeting's link's ...
      expect(row.linkId).toBe(greetingLink.id)
      // ... and the creation shows none of it, while the booking of the link still does.
      expect(row.greeting).toBeNull()
      expect(rowOf(bookings, 'SEND', GREETING_MEMO).greeting).toEqual(GREETING)
    } finally {
      await DbTransaction.update({ id: creation.id }, { transactionLinkId: null })
    }
  })

  /**
   * ⛔ A booking received from another community carries the id the SENDER's server gave its
   * link (federation, settlePendingReceiveTransaction). On this server the same number is the
   * link of Bibi's greeting to Peter -- which Bob has nothing to do with.
   *
   * And the community such a row names as its sender's is what that server's request named:
   * a row that names this very community is a row from afar all the same. What tells is that
   * no member of this server is linked to it -- a column no other server can fill.
   */
  it.each([
    ['another community', () => uuidv4()],
    ['a server that calls itself this community', () => bob.communityUuid as string],
  ])('received from %s has none, and its number is not even asked for', async (_, sayingItIs) => {
    const fromAfar = await foreignReceive(
      bob,
      { communityUuid: sayingItIs(), gradidoID: uuidv4(), name: 'fremde-freundin' },
      new Date(),
    )
    try {
      await DbTransaction.update({ id: fromAfar.id }, { transactionLinkId: greetingLink.id })

      const bookings = await listOf('bob@baumeister.de')
      const row = bookings.find((booking) => booking.id === fromAfar.id)!

      expect(row.typeId).toBe('RECEIVE')
      expect(row.linkId).toBe(greetingLink.id)
      expect(row.greeting).toBeNull()
      // Bob's own greeting from Bibi is untouched by it, and the only link the page names.
      expect(rowOf(bookings, 'RECEIVE', BOBS_MEMO).greeting).toEqual(BOBS_GREETING)
      expect(selectGreetings).toHaveBeenCalledTimes(1)
      expect(selectGreetings).toHaveBeenCalledWith([bobsLink.id])

      // ⚠️ Above, the row has none because its number was never asked for. Here it carries a
      // number the page DOES ask for -- the link of Bob's own greeting -- and still has none:
      // whether a row gets a greeting is decided for the row, not by what the page holds.
      await DbTransaction.update({ id: fromAfar.id }, { transactionLinkId: bobsLink.id })
      const again = await listOf('bob@baumeister.de')

      expect(again.find((booking) => booking.id === fromAfar.id)!.greeting).toBeNull()
      expect(rowOf(again, 'RECEIVE', BOBS_MEMO).greeting).toEqual(BOBS_GREETING)
      expect(selectGreetings).toHaveBeenCalledWith([bobsLink.id])
    } finally {
      await DbTransaction.update({ id: fromAfar.id }, { transactionLinkId: null })
    }
  })

  /**
   * ⛔ Across the border the sender and the link's code come from another server's request
   * (federation, the disbursement of a link); the booking list holds the two against each
   * other itself. Bibi's plain transfer is given the number of PETER's link here. The page
   * asks for it and the table answers -- and his greeting is still not hers to read: a
   * greeting is shown only where the link is the sender's own.
   */
  it('sent with the number of somebody else’s link has none', async () => {
    const transfer = rowOf(await listOf('bibi@bloxberg.de'), 'SEND', TRANSFER_MEMO)
    await DbTransaction.update({ id: transfer.id }, { transactionLinkId: petersLink.id })
    try {
      const bookings = await listOf('bibi@bloxberg.de')
      const row = bookings.find((booking) => booking.id === transfer.id)!

      expect(row.linkId).toBe(petersLink.id)
      expect(row.greeting).toBeNull()
      // Not for want of a greeting: the link was asked for, and has one, of Peter's making.
      const answered = await selectGreetings.mock.results[0].value
      expect(answered.get(petersLink.id)).toMatchObject({
        linkUserId: peter.id,
        greeting: { motif: 'giving-hands' },
      })
      // Her own greeting, two rows on, is hers.
      expect(rowOf(bookings, 'SEND', GREETING_MEMO).greeting).toEqual(GREETING)
    } finally {
      await DbTransaction.update({ id: transfer.id }, { transactionLinkId: null })
    }
  })
})

describe('the list narrowed to one member', () => {
  it('carries the greeting of the bookings shared with that member, and no other', async () => {
    const bookings = await listOf('bibi@bloxberg.de', { counterparty: pairOf(peter) })

    expect(rowOf(bookings, 'SEND', GREETING_MEMO).greeting).toEqual(GREETING)
    expect(rowOf(bookings, 'SEND', PLAIN_MEMO).greeting).toBeNull()
    expect(rowOf(bookings, 'SEND', TRANSFER_MEMO).greeting).toBeNull()
    // Nothing of Bob on this page: neither his booking nor the link it came from.
    expect(bookings.filter((booking) => booking.memo === BOBS_MEMO)).toEqual([])
    expect(selectGreetings).toHaveBeenCalledTimes(1)
    expect([...selectGreetings.mock.calls[0][0]].sort((a, b) => a - b)).toEqual(
      [greetingLink.id, plainLink.id].sort((a, b) => a - b),
    )
  })

  it('is the recipient’s side of the same', async () => {
    const bookings = await listOf('peter@lustig.de', { counterparty: pairOf(bibi) })

    expect(rowOf(bookings, 'RECEIVE', GREETING_MEMO).greeting).toEqual(GREETING)
    expect(rowOf(bookings, 'RECEIVE', PLAIN_MEMO).greeting).toBeNull()
  })
})

describe('how often a page asks the greetings’ table', () => {
  it('once for the whole page, naming every link of the page once', async () => {
    const bookings = await listOf('bibi@bloxberg.de')

    expect(bookings.filter((booking) => booking.linkId !== null)).toHaveLength(3)
    expect(selectGreetings).toHaveBeenCalledTimes(1)
    expect([...selectGreetings.mock.calls[0][0]].sort((a, b) => a - b)).toEqual(
      [greetingLink.id, plainLink.id, bobsLink.id].sort((a, b) => a - b),
    )
  })

  // The call is made with no link at all, and that asks the database nothing
  // (dbSelectThankYouGreetingsByLinkIds).
  it('names no link for a page without a booking made from a link', async () => {
    const bookings = await listOf('raeuber@hotzenplotz.de')

    expect(rowOf(bookings, 'RECEIVE', RAEUBERS_MEMO).greeting).toBeNull()
    expect(selectGreetings).toHaveBeenCalledTimes(1)
    expect(selectGreetings).toHaveBeenCalledWith([])
  })
})
