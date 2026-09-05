// AI-GENERATED — not an architecture reference
import { and, count, eq } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { FirstCreationStatus } from '../enum/FirstCreationStatus'
import { DBDuplicateEntryError, DBInsertFailed, DBNotFoundError } from '../errorTypes'
import {
  FirstCreationInsert,
  FirstCreationSelect,
  firstCreationsTable,
} from '../schemas/drizzle.schema'

// TODO: replace results with valibot schema after update to typescript 5 is possible

const FirstCreationNotFound = (where: string) => new DBNotFoundError('first_creations', where)
const FirstCreationInsertFailed = (row: FirstCreationInsert) =>
  new DBInsertFailed<FirstCreationInsert>('first_creations', row)

// drizzle wraps the driver's error in a DrizzleQueryError and hands the original on as
// `cause`; the TypeORM-era `driverError` is kept for the day this file is called from a
// path that still runs there.
const isDuplicateEntry = (error: unknown): boolean => {
  const wrapped =
    (error as {
      code?: string
      cause?: { code?: string }
      driverError?: { code?: string }
    } | null) ?? {}
  return (
    wrapped.code === 'ER_DUP_ENTRY' ||
    wrapped.cause?.code === 'ER_DUP_ENTRY' ||
    wrapped.driverError?.code === 'ER_DUP_ENTRY'
  )
}

/**
 * The member's first-creation row, or null. No row is the normal state of every member
 * who has not started — it is a value, not a failure, so this is not wrapped in Result.
 */
export async function dbSelectFirstCreationByUserId(
  userId: number,
): Promise<FirstCreationSelect | null> {
  const rows = await drizzleDb()
    .select()
    .from(firstCreationsTable)
    .where(eq(firstCreationsTable.userId, userId))
    .limit(1)
  return rows.at(0) ?? null
}

/**
 * Opens the process. A second row for the same member is refused by the unique key and
 * comes back as DBDuplicateEntryError — an expected outcome (two tabs, one Save each),
 * which the interaction turns into "already running" instead of a crash.
 */
export async function dbInsertFirstCreation(
  row: FirstCreationInsert,
): Promise<
  Result<FirstCreationSelect, DBInsertFailed<FirstCreationInsert> | DBDuplicateEntryError>
> {
  try {
    const result = await drizzleDb().insert(firstCreationsTable).values(row)
    const firstRow = result[0]
    if (firstRow && firstRow.affectedRows === 1) {
      const inserted = await dbSelectFirstCreationByUserId(row.userId)
      if (inserted) {
        return { success: true, value: inserted }
      }
    }
    return { success: false, error: FirstCreationInsertFailed(row) }
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return {
        success: false,
        error: new DBDuplicateEntryError('first_creations', 'user_id', String(row.userId)),
      }
    }
    throw error
  }
}

/** What an outcome writes onto the row; everything not named keeps its value. */
export interface FirstCreationOutcomeUpdate {
  status: FirstCreationStatus
  reviewReason?: string | null
  message?: string | null
  model?: string | null
  signerUserId?: number | null
  testMode?: string | null
  /** Only the step FORCED → SUBMITTED writes these: the row is reused for a new bundle. */
  contributionIds?: number[]
  entriesCount?: number
}

/**
 * Moves the row from `expectedStatus` to `update.status` — a state-machine step, not a
 * plain update. The WHERE on the current status is what makes a late writer harmless:
 * a model answer that arrives after the deadline has already moved the row to IN_REVIEW
 * finds nothing to update and gets DBNotFoundError, which is the expected outcome there.
 */
export async function dbUpdateFirstCreationOutcome(
  id: number,
  expectedStatus: FirstCreationStatus,
  update: FirstCreationOutcomeUpdate,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(firstCreationsTable)
    .set({ ...update, updatedAt: new Date() })
    .where(and(eq(firstCreationsTable.id, id), eq(firstCreationsTable.status, expectedStatus)))
  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return {
    success: false,
    error: FirstCreationNotFound(`id = ${id} AND status = ${expectedStatus}`),
  }
}

/** How many processes stand in one state — the review quota of the measurement sheet. */
export async function dbCountFirstCreationsByStatus(status: FirstCreationStatus): Promise<number> {
  const rows = await drizzleDb()
    .select({ n: count() })
    .from(firstCreationsTable)
    .where(eq(firstCreationsTable.status, status))
  return rows[0]?.n ?? 0
}
