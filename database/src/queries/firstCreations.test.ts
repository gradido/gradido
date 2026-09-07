// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import {
  FirstCreationReviewReason,
  FirstCreationStatus,
  FirstCreationTestMode,
} from '../enum/FirstCreationStatus'
import { firstCreationsTable } from '../schemas'
import {
  dbCountFirstCreationsByStatus,
  dbInsertFirstCreation,
  dbSelectFirstCreationByUserId,
  dbUpdateFirstCreationOutcome,
} from './firstCreations'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// No users rows are needed: the table carries no foreign key on purpose, and the
// state machine is about the row itself.
const ALICE = 101
const CARLA = 102

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(firstCreationsTable)
})
afterAll(async () => {
  await db.delete(firstCreationsTable)
  await appDB.destroy()
})

describe('firstCreations query test', () => {
  it('has no row for a member who never started', async () => {
    expect(await dbSelectFirstCreationByUserId(ALICE)).toBeNull()
  })

  it('opens the process and reads it back with its contribution ids', async () => {
    const opened = await dbInsertFirstCreation({
      userId: ALICE,
      status: FirstCreationStatus.SUBMITTED,
      entriesCount: 3,
      contributionIds: [11, 12, 13],
    })
    expect(opened.success).toBe(true)
    if (opened.success) {
      expect(opened.value).toMatchObject({
        userId: ALICE,
        status: FirstCreationStatus.SUBMITTED,
        entriesCount: 3,
        contributionIds: [11, 12, 13],
        reviewReason: null,
        message: null,
        signerUserId: null,
        testMode: null,
      })
      expect(opened.value.createdAt).toBeInstanceOf(Date)
    }
  })

  it('refuses a second process for the same member as a duplicate, not a crash', async () => {
    const again = await dbInsertFirstCreation({
      userId: ALICE,
      status: FirstCreationStatus.SUBMITTED,
      entriesCount: 1,
      contributionIds: [99],
    })
    expect(again.success).toBe(false)
    if (!again.success) {
      expect(again.error.name).toBe('DBDuplicateEntryError')
    }
    // The first row is untouched.
    const row = await dbSelectFirstCreationByUserId(ALICE)
    expect(row?.contributionIds).toEqual([11, 12, 13])
  })

  it('moves the row forward only from the state it is expected to be in', async () => {
    const row = await dbSelectFirstCreationByUserId(ALICE)
    if (!row) {
      throw new Error('fixture missing')
    }
    // A late writer that still believes the row is SUBMITTED after it has moved on
    // finds nothing — that is the whole protection against a model answer arriving
    // after the deadline.
    const done = await dbUpdateFirstCreationOutcome(row.id, FirstCreationStatus.SUBMITTED, {
      status: FirstCreationStatus.DONE,
      message: 'Liebe Alice, willkommen!',
      model: 'claude-sonnet-5',
      signerUserId: 7,
    })
    expect(done.success).toBe(true)
    const late = await dbUpdateFirstCreationOutcome(row.id, FirstCreationStatus.SUBMITTED, {
      status: FirstCreationStatus.IN_REVIEW,
      reviewReason: FirstCreationReviewReason.MODEL_TIMEOUT,
    })
    expect(late.success).toBe(false)
    if (!late.success) {
      expect(late.error.name).toBe('DBNotFoundError')
    }
    const after = await dbSelectFirstCreationByUserId(ALICE)
    expect(after).toMatchObject({
      status: FirstCreationStatus.DONE,
      message: 'Liebe Alice, willkommen!',
      model: 'claude-sonnet-5',
      signerUserId: 7,
      reviewReason: null,
    })
    expect(after?.updatedAt.getTime()).toBeGreaterThanOrEqual(row.updatedAt.getTime())
  })

  it('counts processes per state, and another member does not see the first one', async () => {
    await dbInsertFirstCreation({
      userId: CARLA,
      status: FirstCreationStatus.SUBMITTED,
      entriesCount: 1,
      contributionIds: [21],
    })
    expect(await dbCountFirstCreationsByStatus(FirstCreationStatus.DONE)).toBe(1)
    expect(await dbCountFirstCreationsByStatus(FirstCreationStatus.SUBMITTED)).toBe(1)
    expect(await dbCountFirstCreationsByStatus(FirstCreationStatus.IN_REVIEW)).toBe(0)
    expect((await dbSelectFirstCreationByUserId(CARLA))?.contributionIds).toEqual([21])
  })

  /**
   * ⛔ `status`, `review_reason` and `test_mode` are all `varchar(16)`, and nothing between
   * a new enum member and that column would complain: MySQL either truncates the value or
   * refuses the write, and either way it surfaces as a broken process long after the enum
   * looked fine in review.
   *
   * `CONTRADICTORY_CHECKS` was the obvious name for the newest reason and is twenty
   * characters — it became `CHECK_CONFLICT` because of this test.
   */
  it('keeps every enum value inside the column that stores it', () => {
    const COLUMN_LENGTH = 16
    const columns = {
      status: Object.values(FirstCreationStatus),
      review_reason: Object.values(FirstCreationReviewReason),
      test_mode: Object.values(FirstCreationTestMode),
    }
    Object.entries(columns).forEach(([column, values]) => {
      values.forEach((value) => {
        expect(`${column}: ${value} (${value.length})`).toBe(
          `${column}: ${value} (${Math.min(value.length, COLUMN_LENGTH)})`,
        )
      })
    })
  })
})
