// AI-GENERATED — not an architecture reference

import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { CONFIG } from '@/config'
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
 * The counter that blocks a thank you card after three wrong PINs.
 *
 * ⛔ Written for one finding, and it is the kind that only shows itself in a SEQUENCE: the
 * counter was reset after the money moved, so every answer between a correct PIN and the
 * booking — over a limit, no cover, request ran out — left an earlier mistype standing. Two
 * typos on Monday plus a correct PIN refused for being over the limit plus one typo, and the
 * card is dead. Its owner can then only revive it by signing into their wallet, which is not
 * something anybody does at a counter with a queue behind them.
 *
 * Every single step of that sequence answers correctly on its own. That is why no test
 * caught it and a reading of the file did not either: the comment at the reset named the
 * rule ("this counter counts WRONG PINS") and the code applied it four steps too late.
 */

jest.mock('@/password/EncryptorUtils')

CONFIG.DLT_ACTIVE = false

let mutate: ApolloServerTestClient['mutate']

const PIN = '407312'
const WRONG_PIN = '111111'
const MAX_PER_PAYMENT = '50'
const MAX_PER_DAY = '100'

let cardCode: string

const asPayer = () =>
  mutate({ mutation: login, variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' } })

const asMerchant = () =>
  mutate({ mutation: login, variables: { email: 'bob@baumeister.de', password: 'Aa12345_' } })

/** A request the merchant opens, and the answer to one PIN typed into it. */
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

describe('thank you card: the wrong-pin counter', () => {
  beforeAll(async () => {
    const testEnv = await testEnvironment()
    mutate = testEnv.mutate
    await cleanDB()

    await userFactory(testEnv, bibiBloxberg)
    await userFactory(testEnv, bobBaumeister)

    // The card and its PIN belong to the payer.
    await asPayer()
    await mutate({
      mutation: setThankYouCardSettings,
      variables: { pin: PIN, maxPerPayment: MAX_PER_PAYMENT, maxPerDay: MAX_PER_DAY },
    })
    const card = await mutate({
      mutation: createThankYouCard,
      variables: { label: 'Portemonnaie' },
    })
    cardCode = card.data.createThankYouCard.code

    // Everything below happens at the till, i.e. signed in as somebody else.
    await asMerchant()
  })

  afterAll(async () => {
    await cleanDB()
  })

  it('counts a wrong pin down towards the block', async () => {
    expect(await payWith('10', WRONG_PIN)).toMatchObject({
      status: 'WRONG_PIN',
      attemptsLeft: 2,
    })
    expect(await payWith('10', WRONG_PIN)).toMatchObject({
      status: 'WRONG_PIN',
      attemptsLeft: 1,
    })
  })

  it('refuses a correct pin that asks for more than the card allows', async () => {
    expect(await payWith('80', PIN)).toMatchObject({
      status: 'LIMIT_PER_PAYMENT_EXCEEDED',
    })
  })

  /**
   * ⛔ The finding itself. Two wrong pins stand on the card, then the CORRECT one is refused
   * for being over the limit — and the next typo must be the FIRST again, not the third.
   *
   * Before the fix this returned BLOCKED_NOW and the card was dead: the refusal above
   * returned before the reset, so the two earlier typos survived a pin that was right.
   */
  it('forgets earlier typos as soon as the right pin is typed, even if the payment is refused', async () => {
    expect(await payWith('10', WRONG_PIN)).toMatchObject({
      status: 'WRONG_PIN',
      attemptsLeft: 2,
    })
  })

  // And the counter still does its job: three in a row with nothing correct between them.
  it('still blocks the card on the third wrong pin in a row', async () => {
    expect(await payWith('10', WRONG_PIN)).toMatchObject({
      status: 'WRONG_PIN',
      attemptsLeft: 1,
    })
    expect(await payWith('10', WRONG_PIN)).toMatchObject({ status: 'BLOCKED_NOW' })
    expect(await payWith('10', PIN)).toMatchObject({ status: 'CARD_BLOCKED' })
  })
})
