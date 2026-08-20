// AI-GENERATED — not an architecture reference

import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { dbSelectThankYouCardSettings, dbUpsertThankYouCardSettings } from 'database'
import { CONFIG } from '@/config'
import { PinDerivation } from '@/data/PinDerivation.enum'
import { SecretKeyCryptographyCreateKey } from '@/password/EncryptorUtils'
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
 * The PIN's move off the password KDF (Dario, 20.08.2026): new rows carry a keyed hash
 * that costs microseconds and no worker-queue slot; rows from before keep saying how their
 * hash was made and are upgraded in place the moment their PIN proves right.
 *
 * ⚠️ The upgrade is tested through the LIMIT refusal on purpose: it sits after the PIN is
 * proved and before the limits, so a correct PIN that is then refused for its amount has
 * already upgraded the row. That is also the cheapest sequence to build -- no balance and
 * no booking are needed to prove any of this.
 */
jest.mock('@/password/EncryptorUtils')

CONFIG.DLT_ACTIVE = false

let mutate: ApolloServerTestClient['mutate']

const PIN = '407312'
const WRONG_PIN = '111111'
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

/** Puts the row back the way the old code wrote it: password KDF, its hash, its marker. */
const makeRowLegacy = async () => {
  const legacySalt = 'legacy-salt'
  const legacyHash = await SecretKeyCryptographyCreateKey(legacySalt, PIN)
  const current = await settingsRow()
  await dbUpsertThankYouCardSettings({
    userId: payerId,
    pin: legacyHash,
    pinSalt: legacySalt,
    pinDerivation: PinDerivation.PASSWORD_KDF,
    maxPerPayment: current.maxPerPayment,
    maxPerDay: current.maxPerDay,
  })
  return legacyHash
}

describe('thank you card: how the pin is derived', () => {
  beforeAll(async () => {
    const testEnv = await testEnvironment()
    mutate = testEnv.mutate
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

  describe('a row from before the change', () => {
    let legacyHash: bigint

    beforeAll(async () => {
      legacyHash = await makeRowLegacy()
    })

    it('still counts a wrong pin, without touching the derivation', async () => {
      expect(await payWith('10', WRONG_PIN)).toMatchObject({ status: 'WRONG_PIN' })
      const row = await settingsRow()
      expect(row.pinDerivation).toBe(PinDerivation.PASSWORD_KDF)
      expect(row.pin).toBe(legacyHash)
    })

    /**
     * ⛔ The upgrade itself: the correct pin proves against the OLD derivation, and in the
     * same request the row is rewritten -- new hash, fresh salt, new marker. The refusal
     * that follows is about the amount, never about the pin.
     */
    it('upgrades the row the moment its pin proves right', async () => {
      expect(await payWith(OVER_LIMIT, PIN)).toMatchObject({
        status: 'LIMIT_PER_PAYMENT_EXCEEDED',
      })

      const row = await settingsRow()
      expect(row.pinDerivation).toBe(PinDerivation.KEYED_HASH)
      expect(row.pin).not.toBe(legacyHash)
      expect(row.pinSalt).not.toBe('legacy-salt')
    })

    /** And the upgraded row keeps working: the same pin proves against the new hash. */
    it('proves the same pin against the upgraded row', async () => {
      expect(await payWith(OVER_LIMIT, PIN)).toMatchObject({
        status: 'LIMIT_PER_PAYMENT_EXCEEDED',
      })
      expect((await settingsRow()).pinDerivation).toBe(PinDerivation.KEYED_HASH)
    })
  })
})
