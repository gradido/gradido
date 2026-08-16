// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { GradidoUnit } from 'shared'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { thankYouCardPaymentsTable, thankYouCardsTable } from '../schemas'
import {
  dbConsumeThankYouCardPayment,
  dbCountExpiredOpenPayments,
  dbInsertThankYouCardPayment,
  dbSelectOpenPaymentsByUserId,
  dbSelectThankYouCardPayment,
  dbSumConsumedThankYouCardPayments,
  PAYMENT_STATE_CONSUMED,
  PAYMENT_STATE_OPEN,
} from './thankYouCardPayments'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

const USER_ID = 4711
const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000)
const anHourAgo = () => new Date(Date.now() - 60 * 60 * 1000)

const stateOf = async (id: number) => {
  const rows = await db
    .select()
    .from(thankYouCardPaymentsTable)
    .where(eq(thankYouCardPaymentsTable.id, id))
  return rows.at(0)?.state
}

const insertCard = async (code: string, userId = USER_ID) => {
  await db.insert(thankYouCardsTable).values({ userId, code, label: 'wallet' })
  const rows = await db.select().from(thankYouCardsTable).where(eq(thankYouCardsTable.code, code))
  return rows[0].id
}

const openPayment = async (cardId: number, amount: number, validUntil = inAnHour()) => {
  const result = await dbInsertThankYouCardPayment({
    cardId,
    recipientId: 1,
    amount: GradidoUnit.fromNumber(amount),
    memo: 'Pizzeria Napoli',
    validUntil,
  })
  if (!result.success) {
    throw new Error('fixture insert failed')
  }
  return result.value
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(thankYouCardPaymentsTable)
  await db.delete(thankYouCardsTable)
})
afterAll(async () => {
  await appDB.destroy()
})

describe('thankYouCardPayments query test', () => {
  it('inserts a request and reports its id', async () => {
    const cardId = await insertCard('DK-insert')
    const id = await openPayment(cardId, 12.5)

    expect(id).toBeGreaterThan(0)
    const found = await dbSelectThankYouCardPayment(id)
    expect(found.success).toBe(true)
    if (found.success) {
      expect(found.value.state).toBe(PAYMENT_STATE_OPEN)
      expect(found.value.amount.toString()).toBe(GradidoUnit.fromNumber(12.5).toString())
      expect(found.value.memo).toBe('Pizzeria Napoli')
    }
  })

  it('reports a missing request instead of returning nothing', async () => {
    const result = await dbSelectThankYouCardPayment(999999)
    expect(result.success).toBe(false)
  })

  // ⛔ This is the one that matters. It is the whole protection against a double booking:
  // the money moves only after consuming succeeded, so consuming twice must not.
  it('consumes a request exactly once', async () => {
    const cardId = await insertCard('DK-once')
    const id = await openPayment(cardId, 5)

    const first = await dbConsumeThankYouCardPayment(id, new Date())
    const second = await dbConsumeThankYouCardPayment(id, new Date())

    expect(first.success).toBe(true)
    expect(second.success).toBe(false)
    expect(await stateOf(id)).toBe(PAYMENT_STATE_CONSUMED)
  })

  it('refuses to consume an expired request', async () => {
    const cardId = await insertCard('DK-expired')
    const id = await openPayment(cardId, 5, anHourAgo())

    const result = await dbConsumeThankYouCardPayment(id, new Date())

    expect(result.success).toBe(false)
    expect(await stateOf(id)).toBe(PAYMENT_STATE_OPEN)
  })

  it('sums only the consumed requests of this card since the given moment', async () => {
    const cardId = await insertCard('DK-sum')
    const otherCardId = await insertCard('DK-sum-other')

    const consumed = await openPayment(cardId, 10)
    await dbConsumeThankYouCardPayment(consumed, new Date())
    await openPayment(cardId, 100) // stays open, must not count
    const foreign = await openPayment(otherCardId, 1000)
    await dbConsumeThankYouCardPayment(foreign, new Date()) // other card, must not count

    const sum = await dbSumConsumedThankYouCardPayments(cardId, anHourAgo())

    expect(sum.toString()).toBe(GradidoUnit.fromNumber(10).toString())
  })

  it('sums to zero when the card has spent nothing', async () => {
    const cardId = await insertCard('DK-sum-empty')
    const sum = await dbSumConsumedThankYouCardPayments(cardId, anHourAgo())
    expect(sum.toString()).toBe(GradidoUnit.fromNumber(0).toString())
  })

  it('finds the open requests of a member across their cards', async () => {
    const cardId = await insertCard('DK-open-a', 5000)
    const secondCardId = await insertCard('DK-open-b', 5000)
    const strangerCardId = await insertCard('DK-open-c', 5001)

    await openPayment(cardId, 1)
    await openPayment(secondCardId, 2)
    const consumed = await openPayment(secondCardId, 3)
    await dbConsumeThankYouCardPayment(consumed, new Date())
    await openPayment(strangerCardId, 4)

    const open = await dbSelectOpenPaymentsByUserId(5000, new Date())

    expect(open).toHaveLength(2)
    expect(open.every((payment) => payment.state === PAYMENT_STATE_OPEN)).toBe(true)
  })

  it('counts expired open requests', async () => {
    const cardId = await insertCard('DK-count-expired')
    await openPayment(cardId, 1, anHourAgo())

    expect(await dbCountExpiredOpenPayments(new Date())).toBeGreaterThan(0)
  })
})
