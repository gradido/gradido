// AI-GENERATED — not an architecture reference

import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, dbSelectThankYouCardSettings } from 'database'
import { CONFIG } from '@/config'
import { PinDerivation } from '@/data/PinDerivation.enum'
import { userFactory } from '@/seeds/factory/user'
import {
  confirmThankYouCardPayment,
  createThankYouCard,
  createThankYouCardPayment,
  login,
  setThankYouCardSettings,
} from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'

/**
 * The PIN's move off the password KDF (Dario, 20.08.2026): the stored hash is a keyed
 * BLAKE2b that costs microseconds and no worker-queue slot. The row records the
 * derivation so the NEXT change finds every row saying which one made its hash.
 *
 * ⚠️ Proving the PIN rides the LIMIT refusal on purpose: the check sits before the
 * limits, so a correct PIN refused for its amount has still been proved -- and no
 * balance or booking is needed to show any of this.
 */
jest.mock('@/password/EncryptorUtils')

CONFIG.DLT_ACTIVE = false

let mutate: ApolloServerTestClient['mutate']
let db: AppDatabase

const PIN = '407312'
const OVER_LIMIT = '80'

let cardCode: string
let payerId: number

const asPayer = () =>
  mutate({ mutation: login, variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' } })

const asMerchant = () =>
  mutate({ mutation: login, variables: { email: 'bob@baumeister.de', password: 'Aa12345_' } })

const payWith = async (amount: string, pin: string) => {
  const created = await mutate({
    mutation: createThankYouCardPayment,
    variables: { code: cardCode, amount, memo: 'Pizzeria Napoli' },
  })
  const paymentId = created.data.createThankYouCardPayment.id
  const answer = await mutate({
    mutation: confirmThankYouCardPayment,
    variables: { paymentId, pin },
  })
  return answer.data.confirmThankYouCardPayment
}

const settingsRow = async () => {
  const result = await dbSelectThankYouCardSettings(payerId)
  if (!result.success) {
    throw new Error('settings row vanished')
  }
  return result.value
}

describe('thank you card: how the pin is derived', () => {
  beforeAll(async () => {
    const testEnv = await testEnvironment()
    mutate = testEnv.mutate
    db = testEnv.db
    await cleanDB()

    const payer = await userFactory(testEnv, bibiBloxberg)
    payerId = payer.id
    await userFactory(testEnv, bobBaumeister)

    await asPayer()
    await mutate({
      mutation: setThankYouCardSettings,
      variables: { pin: PIN, maxPerPayment: '50', maxPerDay: '100' },
    })
    const card = await mutate({
      mutation: createThankYouCard,
      variables: { label: 'Portemonnaie' },
    })
    cardCode = card.data.createThankYouCard.code

    await asMerchant()
  })

  afterAll(async () => {
    await cleanDB()
    // ⚠️ The pool this suite opened has to be closed here, or its sockets keep the jest
    // worker alive after the last assertion -- the "open handles" every other resolver
    // test avoids by doing the same.
    await db.destroy()
  })

  it('writes new settings with the keyed derivation', async () => {
    const row = await settingsRow()
    expect(row.pinDerivation).toBe(PinDerivation.KEYED_HASH)
  })

  it('proves a pin against the keyed derivation', async () => {
    expect(await payWith(OVER_LIMIT, PIN)).toMatchObject({
      status: 'LIMIT_PER_PAYMENT_EXCEEDED',
    })
  })
})
