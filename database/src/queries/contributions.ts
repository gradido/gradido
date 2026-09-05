// AI-GENERATED — not an architecture reference
import { and, count, eq, inArray } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { ContributionType } from '../enum/ContributionType'
import { contributionsTable } from '../schemas/drizzle.schema'

/**
 * How many contributions this member has filed THEMSELVES (type USER).
 *
 * Deleted rows count on purpose (no `deleted_at` filter): a contribution the member later
 * removed was still a manual creation, and ES-011 asks whether the member has ever found
 * the regular path — not whether something is still standing.
 */
export async function dbCountUserTypedContributionsByUserId(userId: number): Promise<number> {
  const rows = await drizzleDb()
    .select({ n: count() })
    .from(contributionsTable)
    .where(
      and(
        eq(contributionsTable.userId, userId),
        eq(contributionsTable.type, ContributionType.USER),
      ),
    )
  return rows[0]?.n ?? 0
}

/** The slice of a contribution the first-creation window shows: the sentence and its tick. */
export interface FirstCreationEntryRow {
  id: number
  memo: string
  confirmedAt: Date | null
  deletedAt: Date | null
  status: string
}

/**
 * The contributions of one first creation, in the order the ids are handed over —
 * which is the order the member wrote them. Deleted rows come back too, with their
 * `deletedAt` set, so the caller decides what a tick means for a row moderation removed.
 */
export async function dbSelectFirstCreationEntriesByIds(
  ids: number[],
): Promise<FirstCreationEntryRow[]> {
  if (ids.length === 0) {
    return []
  }
  const rows = await drizzleDb()
    .select({
      id: contributionsTable.id,
      memo: contributionsTable.memo,
      confirmedAt: contributionsTable.confirmedAt,
      deletedAt: contributionsTable.deletedAt,
      status: contributionsTable.status,
    })
    .from(contributionsTable)
    .where(inArray(contributionsTable.id, ids))
  const byId = new Map(rows.map((row) => [row.id, row]))
  return ids.flatMap((id) => {
    const row = byId.get(id)
    return row ? [row] : []
  })
}
