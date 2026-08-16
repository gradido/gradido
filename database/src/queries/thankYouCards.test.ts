// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { thankYouCardsTable } from '../schemas'
import {
  dbBlockThankYouCard,
  dbIncrementFailedAttempts,
  dbInsertThankYouCard,
  dbResetFailedAttempts,
  dbSelectActiveThankYouCard,
  dbSelectThankYouCardByCode,
  dbSelectThankYouCardsByUserId,
  dbUnblockThankYouCard,
  MAX_FAILED_ATTEMPTS,
} from './thankYouCards'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

const rowOf = async (code: string) => {
  const rows = await db.select().from(thankYouCardsTable).where(eq(thankYouCardsTable.code, code))
  return rows.at(0)
}

const insertCard = async (code: string, userId: number, label = 'wallet') => {
  const result = await dbInsertThankYouCard({ userId, code, label })
  if (!result.success) {
    throw new Error('fixture insert failed')
  }
  const row = await rowOf(code)
  if (!row) {
    throw new Error('fixture not found after insert')
  }
  return row.id
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(thankYouCardsTable)
})
afterAll(async () => {
  await appDB.destroy()
})

describe('thankYouCards query test', () => {
  it('inserts a card with an unused counter and no block', async () => {
    await insertCard('DK-fresh', 1)

    const row = await rowOf('DK-fresh')
    expect(row?.failedAttempts).toBe(0)
    expect(row?.blockedAt).toBeNull()
    expect(row?.label).toBe('wallet')
  })

  it('finds a card by its printed code', async () => {
    await insertCard('DK-bycode', 2)

    const result = await dbSelectThankYouCardByCode('DK-bycode')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.userId).toBe(2)
    }
  })

  // ⛔ The payment path has to tell "no such card" from "blocked card" apart, so this
  // query must NOT filter blocked cards away. If it did, a merchant scanning a blocked
  // card would be told the card does not exist, and would keep trying.
  it('still finds a card after it was blocked', async () => {
    const id = await insertCard('DK-blocked-found', 3)
    await dbBlockThankYouCard(id, new Date())

    const result = await dbSelectThankYouCardByCode('DK-blocked-found')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.blockedAt).not.toBeNull()
    }
  })

  it('reports an unknown code instead of returning nothing', async () => {
    const result = await dbSelectThankYouCardByCode('DK-does-not-exist')
    expect(result.success).toBe(false)
  })

  it('lists every card a member ever had, blocked ones included', async () => {
    const id = await insertCard('DK-hist-1', 10)
    await insertCard('DK-hist-2', 10)
    await dbBlockThankYouCard(id, new Date())

    const cards = await dbSelectThankYouCardsByUserId(10)

    expect(cards).toHaveLength(2)
    expect(cards.filter((card) => card.blockedAt !== null)).toHaveLength(1)
  })

  it('returns only the unblocked card as the active one', async () => {
    const oldId = await insertCard('DK-active-old', 11)
    await dbBlockThankYouCard(oldId, new Date())
    await insertCard('DK-active-new', 11)

    const result = await dbSelectActiveThankYouCard(11)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.code).toBe('DK-active-new')
    }
  })

  it('reports that a member has no active card once all of them are blocked', async () => {
    const id = await insertCard('DK-all-blocked', 12)
    await dbBlockThankYouCard(id, new Date())

    const result = await dbSelectActiveThankYouCard(12)

    expect(result.success).toBe(false)
  })

  it('keeps the moment a card died when it is blocked twice', async () => {
    const id = await insertCard('DK-twice', 13)
    // Milliseconds zeroed here, once, rather than in the assertion: the column keeps
    // them (datetime(3)), so an expectation that rounds them away can only ever compare
    // a different instant than the one that was written.
    const firstMoment = new Date(Date.now() - 60 * 60 * 1000)
    firstMoment.setMilliseconds(0)

    await dbBlockThankYouCard(id, firstMoment)
    const second = await dbBlockThankYouCard(id, new Date())

    expect(second.success).toBe(false)
    const row = await rowOf('DK-twice')
    expect(row?.blockedAt?.getTime()).toBe(firstMoment.getTime())
  })

  it('counts wrong PINs up to the limit and reports the running total', async () => {
    const id = await insertCard('DK-counting', 14)

    const first = await dbIncrementFailedAttempts(id)
    const second = await dbIncrementFailedAttempts(id)
    const third = await dbIncrementFailedAttempts(id)

    expect(first.success && first.value).toBe(1)
    expect(second.success && second.value).toBe(2)
    expect(third.success && third.value).toBe(MAX_FAILED_ATTEMPTS)
  })

  it('wipes the counter when the PIN was right', async () => {
    const id = await insertCard('DK-reset', 15)
    await dbIncrementFailedAttempts(id)
    await dbIncrementFailedAttempts(id)

    await dbResetFailedAttempts(id)

    expect((await rowOf('DK-reset'))?.failedAttempts).toBe(0)
  })

  it('unblocks a card and clears its counter in one go', async () => {
    const id = await insertCard('DK-unblock', 16)
    await dbIncrementFailedAttempts(id)
    await dbIncrementFailedAttempts(id)
    await dbIncrementFailedAttempts(id)
    await dbBlockThankYouCard(id, new Date())

    const result = await dbUnblockThankYouCard(id)

    expect(result.success).toBe(true)
    const row = await rowOf('DK-unblock')
    expect(row?.blockedAt).toBeNull()
    expect(row?.failedAttempts).toBe(0)
  })

  it('reports a missing card when counting against one that is not there', async () => {
    const result = await dbIncrementFailedAttempts(999999)
    expect(result.success).toBe(false)
  })
})
