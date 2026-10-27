// AI-GENERATED — not an architecture reference
import { ApolloServerTestClient, cleanDB, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import { processXComCompleteTransaction } from 'core'
import {
  AppDatabase,
  Transaction as DbTransaction,
  dbInsertTransactionPassOn,
  dbSelectReceivedTransferOfUser,
  TransactionTypeId,
  transactionPassOnsTable,
  User,
} from 'database'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { creations } from '@/seeds/creation/index'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import { login, sendCoins } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

/**
 * A thank-you passed on, all the way against a database (the trail, migration 0166): Räuber
 * thanks Bibi, and Bibi passes that thank-you on to Peter. Her transfer names her RECEIVE
 * booking of Räuber's thank-you, and the trail notes it for her SEND row. Nothing of the trail
 * may stop a transfer.
 *
 * The two queries of the trail are the real ones, wrapped so that a test can see whether they
 * were asked and make one fail once. What becomes of each id the wallet may name is held on its
 * own in util/transactionPassOn.test.ts, the queries in `database`.
 */
jest.mock('database', () => {
  const original = jest.requireActual('database')
  return {
    __esModule: true,
    ...original,
    dbSelectReceivedTransferOfUser: jest.fn(original.dbSelectReceivedTransferOfUser),
    dbInsertTransactionPassOn: jest.fn(original.dbInsertTransactionPassOn),
  }
})
// The mails are not this file's matter, and the other community is a foreign system: nothing is
// sent anywhere.
jest.mock('core', () => {
  const original = jest.requireActual('core')
  return {
    __esModule: true,
    ...original,
    sendTransactionReceivedEmail: jest.fn(async () => null),
    processXComCompleteTransaction: jest.fn(async () => true),
  }
})

const selectReceived = dbSelectReceivedTransferOfUser as jest.MockedFunction<
  typeof dbSelectReceivedTransferOfUser
>
const insertPassOn = dbInsertTransactionPassOn as jest.MockedFunction<
  typeof dbInsertTransactionPassOn
>
const acrossTheBorder = processXComCompleteTransaction as jest.MockedFunction<
  typeof processXComCompleteTransaction
>

CONFIG.DLT_ACTIVE = false

const resolverLogger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.TransactionResolver`,
)

const THANKS_MEMO = 'Danke fürs Hüten der Hühner'
const PASSED_ON_MEMO = 'Ein Dank, weitergegeben'
const NOT_TRACED_MEMO = 'Weitergegeben, und die Spur bleibt aus'

let mutate: ApolloServerTestClient['mutate']
let db: AppDatabase
let bibi: User
let peter: User
let raeuber: User
/** Räuber's thank-you to Bibi: her RECEIVE booking of it, and his SEND booking. */
let thanks: { receive: number; send: number }

const loginAs = (email: string) =>
  mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

/** A transfer from whoever is signed in now, to a member here unless said otherwise. */
const send = (recipientIdentifier: string, memo: string, rest: Record<string, unknown> = {}) =>
  mutate({
    mutation: sendCoins,
    variables: {
      recipientCommunityIdentifier: bibi.communityUuid,
      recipientIdentifier,
      amount: '5',
      memo,
      ...rest,
    },
  })

/** The one booking of a member with this memo, as the database holds it. */
const bookingOf = async (userId: number, typeId: TransactionTypeId, memo: string) => {
  const rows = await DbTransaction.find({ where: { userId, typeId, memo } })
  expect(rows).toHaveLength(1)
  return rows[0]
}

/** Every row of the trail, read past the wrapped queries. */
const trail = () =>
  AppDatabase.getInstance().getDrizzleDataSource().select().from(transactionPassOnsTable)

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  db = testEnv.db
  await cleanDB()
  // The admin has to exist for creationFactory.
  peter = await userFactory(testEnv, peterLustig)
  bibi = await userFactory(testEnv, bibiBloxberg)
  raeuber = await userFactory(testEnv, raeuberHotzenplotz)
  await creationFactory(testEnv, creations.find((c) => c.email === 'bibi@bloxberg.de')!)
  await creationFactory(testEnv, creations.find((c) => c.email === 'raeuber@hotzenplotz.de')!)

  await loginAs('raeuber@hotzenplotz.de')
  const thanked = await send('bibi@bloxberg.de', THANKS_MEMO)
  expect(thanked.errors).toBeUndefined()
  thanks = {
    receive: (await bookingOf(bibi.id, TransactionTypeId.RECEIVE, THANKS_MEMO)).id,
    send: (await bookingOf(raeuber.id, TransactionTypeId.SEND, THANKS_MEMO)).id,
  }
  await loginAs('bibi@bloxberg.de')
})

// Cleared, not reset: the wrapped queries go on running the real ones.
beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('a thank-you passed on', () => {
  it('is noted for the SEND row of the transfer that passes it on', async () => {
    const result = await send('peter@lustig.de', PASSED_ON_MEMO, { passOnOf: thanks.receive })

    expect(result.errors).toBeUndefined()
    expect(result.data.sendCoins).toBe(true)
    const passedOn = await bookingOf(bibi.id, TransactionTypeId.SEND, PASSED_ON_MEMO)
    expect(await trail()).toEqual([
      {
        transactionId: passedOn.id,
        originTransactionId: thanks.receive,
        createdAt: expect.any(Date),
      },
    ])
    expect(selectReceived).toHaveBeenCalledWith(thanks.receive, bibi.id)
  })

  it('is neither asked for nor noted where a transfer names none', async () => {
    const before = await trail()

    const result = await send('peter@lustig.de', 'Einfach so, ohne Weitergabe')

    expect(result.errors).toBeUndefined()
    expect(result.data.sendCoins).toBe(true)
    expect(await trail()).toEqual(before)
    expect(selectReceived).not.toHaveBeenCalled()
    expect(insertPassOn).not.toHaveBeenCalled()
  })
})

describe('what never stops the thank-you', () => {
  it('an id that is no thank-you she received: the transfer is booked, and no trail kept', async () => {
    const own = await send('peter@lustig.de', 'Eine eigene Überweisung')
    expect(own.errors).toBeUndefined()
    const ownSend = (await bookingOf(bibi.id, TransactionTypeId.SEND, 'Eine eigene Überweisung')).id
    const before = await trail()

    // Her own SEND row, Räuber's SEND row of his thank-you, an id that no booking has.
    for (const [n, passOnOf] of [ownSend, thanks.send, 2_000_000_000].entries()) {
      const memo = `Kein eigener Dank ${n + 1}`
      const result = await send('peter@lustig.de', memo, { passOnOf })

      expect(result.errors).toBeUndefined()
      expect(result.data.sendCoins).toBe(true)
      await bookingOf(bibi.id, TransactionTypeId.SEND, memo)
      await bookingOf(peter.id, TransactionTypeId.RECEIVE, memo)
    }
    expect(selectReceived).toHaveBeenCalledTimes(3)
    expect(insertPassOn).not.toHaveBeenCalled()
    expect(await trail()).toEqual(before)
  })

  it('a trail that cannot be written: the transfer stays booked, and sendCoins answers true', async () => {
    const before = await trail()
    insertPassOn.mockRejectedValueOnce(
      Object.assign(new Error('Failed query: insert into `transaction_pass_ons`'), {
        cause: { code: 'ER_LOCK_WAIT_TIMEOUT' },
      }),
    )

    const result = await send('peter@lustig.de', NOT_TRACED_MEMO, { passOnOf: thanks.receive })

    expect(result.errors).toBeUndefined()
    expect(result.data.sendCoins).toBe(true)
    const booked = await bookingOf(bibi.id, TransactionTypeId.SEND, NOT_TRACED_MEMO)
    await bookingOf(peter.id, TransactionTypeId.RECEIVE, NOT_TRACED_MEMO)
    expect(insertPassOn).toHaveBeenCalledWith(booked.id, thanks.receive)
    expect(await trail()).toEqual(before)
    // The one report of a missing trail, and of the failure only the driver's code.
    expect(resolverLogger.error).toHaveBeenCalledWith(
      'pass-on not traced',
      booked.id,
      'ER_LOCK_WAIT_TIMEOUT',
    )
  })

  it('across the border: the transfer goes out, nothing is asked and no trail kept', async () => {
    const before = await trail()

    const result = await send('peter@lustig.de', 'Über die Grenze weitergegeben', {
      recipientCommunityIdentifier: uuidv4(),
      passOnOf: thanks.receive,
    })

    expect(result.errors).toBeUndefined()
    expect(result.data.sendCoins).toBe(true)
    expect(acrossTheBorder).toHaveBeenCalledTimes(1)
    expect(selectReceived).not.toHaveBeenCalled()
    expect(insertPassOn).not.toHaveBeenCalled()
    expect(await trail()).toEqual(before)
  })
})
