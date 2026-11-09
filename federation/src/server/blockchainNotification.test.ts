// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as core from 'core'
import * as database from 'database'
import { Elysia } from 'elysia'
import { CompleteTransaction } from 'shared'
import { blockchainNotificationRoutes } from './blockchainNotification'

// The routes as the GradidoNode reaches them, mounted in an app. The transaction, the comparison
// and the database are faked: what they decide is their own tests'.

const HOME = '56a55482-909e-46a4-bfa2-cd025e894eba'
const OTHER = '3e1f0a9b-8c7d-4e6f-a5b4-c3d2e1f0a9b8'
const CONFIRMED_AT = new Date('2026-11-09T10:00:00.000Z')
const app = new Elysia().use(blockchainNotificationRoutes)

const post = (path: string, body: object) =>
  app.handle(
    new Request(`http://localhost/blockchain-notification/v1/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
const confirm = (communityUuid = HOME) =>
  post(`confirmedTransaction/${communityUuid}`, { transactionBase64: 'AAAA' })

const ok = { success: true } as never
const failed = (message: string) => ({ success: false, error: new Error(message) }) as never

let spies: { mockRestore: () => void }[] = []
let decode: ReturnType<typeof spyOn<CompleteTransaction, 'initFromProtobuf'>>
let validate: ReturnType<typeof spyOn<CompleteTransaction, 'validate'>>
let resolve: ReturnType<typeof spyOn<typeof database, 'resolveDltTransactionByLedgerAnchor'>>
let compare: ReturnType<typeof spyOn<typeof core, 'compareConfirmedTransaction'>>
let confirmed: ReturnType<typeof spyOn<typeof database, 'dbUpdateConfirmedDltTransaction'>>
let withError: ReturnType<typeof spyOn<typeof database, 'dbUpdateWithErrorDltTransaction'>>
let rejected: ReturnType<
  typeof spyOn<typeof database, 'dbUpdateWithErrorDltTransactionByHieroTransactionId'>
>

beforeEach(() => {
  decode = spyOn(CompleteTransaction.prototype, 'initFromProtobuf').mockReturnValue(ok)
  validate = spyOn(CompleteTransaction.prototype, 'validate').mockReturnValue(ok)
  resolve = spyOn(database, 'resolveDltTransactionByLedgerAnchor').mockResolvedValue({
    success: true,
    value: { dltTransaction: { id: 7 } },
  } as never)
  compare = spyOn(core, 'compareConfirmedTransaction').mockResolvedValue(ok)
  confirmed = spyOn(database, 'dbUpdateConfirmedDltTransaction').mockResolvedValue(ok)
  withError = spyOn(database, 'dbUpdateWithErrorDltTransaction').mockResolvedValue(ok)
  rejected = spyOn(
    database,
    'dbUpdateWithErrorDltTransactionByHieroTransactionId',
  ).mockResolvedValue(ok)
  spies = [
    decode,
    validate,
    resolve,
    compare,
    confirmed,
    withError,
    rejected,
    spyOn(database, 'getHomeCommunityDrizzle').mockResolvedValue({ communityUuid: HOME } as never),
    spyOn(CompleteTransaction.prototype, 'getLedgerAnchor').mockReturnValue({} as never),
    spyOn(CompleteTransaction.prototype, 'getTransactionType').mockReturnValue(0 as never),
    spyOn(CompleteTransaction.prototype, 'getConfirmedAt').mockReturnValue(CONFIRMED_AT),
  ]
})
afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
})

describe('POST blockchain-notification/v1/confirmedTransaction/:communityUuid', () => {
  it('marks the dlt transaction as confirmed where it matches what was sent', async () => {
    const response = await confirm()
    expect(response.status).toBe(200)
    expect(decode).toHaveBeenCalledWith('AAAA', HOME)
    expect(confirmed).toHaveBeenCalledWith(7, CONFIRMED_AT)
    expect(withError).not.toHaveBeenCalled()
  })

  it('marks it with the error where it does not match', async () => {
    compare.mockResolvedValue(failed('amount differs'))
    expect((await confirm()).status).toBe(200)
    expect(withError).toHaveBeenCalledWith(7, 'amount differs')
    expect(confirmed).not.toHaveBeenCalled()
  })

  it('refuses a notification for another community', async () => {
    expect((await confirm(OTHER)).status).toBe(404)
    expect(decode).not.toHaveBeenCalled()
  })

  it('refuses a transaction that does not decode or does not validate', async () => {
    decode.mockReturnValue(failed('no protobuf'))
    expect((await confirm()).status).toBe(400)
    decode.mockReturnValue(ok)
    validate.mockReturnValue(failed('bad signature'))
    expect((await confirm()).status).toBe(400)
    expect(resolve).not.toHaveBeenCalled()
  })

  // most likely this side's mistake: the node is told all is well, nothing is written
  it('writes nothing for a transaction it has no row of', async () => {
    resolve.mockResolvedValue(failed('no row'))
    expect((await confirm()).status).toBe(200)
    expect(compare).not.toHaveBeenCalled()
    expect(confirmed).not.toHaveBeenCalled()
  })

  it('refuses a community that is no uuid', async () => {
    expect((await confirm('not-a-uuid')).status).toBe(422)
  })
})

describe('POST blockchain-notification/v1/rejectedTransaction', () => {
  const body = { error: 'INVALID_SIGNATURE', hieroTransactionId: '0.0.123@1700000000.000000001' }

  it('marks the dlt transaction of the hiero transaction with the error', async () => {
    expect((await post('rejectedTransaction', body)).status).toBe(200)
    expect(rejected).toHaveBeenCalledWith(body.hieroTransactionId, body.error)
  })

  it('answers 404 where there is no such dlt transaction', async () => {
    rejected.mockResolvedValue(failed('not found'))
    expect((await post('rejectedTransaction', body)).status).toBe(404)
  })
})
