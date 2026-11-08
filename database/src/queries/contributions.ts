// AI-GENERATED — not an architecture reference
import { and, count, eq, inArray, isNull } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { ContributionStatus } from '../enum/ContributionStatus'
import { ContributionType } from '../enum/ContributionType'
import { ContributionsInsert, contributionsTable } from '../schemas/drizzle.schema'

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

/**
 * How many of this member's contributions are still OPEN — waiting for the moderation
 * (PENDING or IN_PROGRESS) and not deleted. Whoever filed them counts: an ADMIN-filed one
 * is as open as a USER-filed one.
 *
 * Its caller is the switch to a project account (ES-021): an account that may not create
 * must not leave the moderation with open contributions to judge, so the switch is refused
 * while any is standing.
 */
export async function dbCountOpenContributionsByUserId(userId: number): Promise<number> {
  const rows = await drizzleDb()
    .select({ n: count() })
    .from(contributionsTable)
    .where(
      and(
        eq(contributionsTable.userId, userId),
        inArray(contributionsTable.status, [
          ContributionStatus.PENDING,
          ContributionStatus.IN_PROGRESS,
        ]),
        isNull(contributionsTable.deletedAt),
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
 * The contributions of one member's first creation -- the rows marked `first_creation` --
 * in the order they were filed, which is the order the member wrote them. Deleted rows
 * come back too, with their `deletedAt` set, so the caller decides what a tick means for a
 * row moderation removed. The index on (user_id, created_at) keeps this to the member's
 * own rows.
 */
export async function dbSelectFirstCreationEntriesByUserId(
  userId: number,
): Promise<FirstCreationEntryRow[]> {
  return drizzleDb()
    .select({
      id: contributionsTable.id,
      memo: contributionsTable.memo,
      confirmedAt: contributionsTable.confirmedAt,
      deletedAt: contributionsTable.deletedAt,
      status: contributionsTable.status,
    })
    .from(contributionsTable)
    .where(and(eq(contributionsTable.userId, userId), eq(contributionsTable.firstCreation, true)))
    .orderBy(contributionsTable.id)
}

/**
 * Takes the mark off a member's first-creation bundle: the function test (ES-014) reopens
 * the window, and the bundle it files next is the one the window shows from then on. The
 * rows stay what they are -- booked or open contributions; only the window forgets them.
 * Plain `void`: no mark to take off is a valid outcome, not a failure.
 */
export async function dbUnmarkFirstCreationContributions(userId: number): Promise<void> {
  await drizzleDb()
    .update(contributionsTable)
    .set({ firstCreation: false })
    .where(and(eq(contributionsTable.userId, userId), eq(contributionsTable.firstCreation, true)))
}

/**
 * Whose contribution this is -- `null` when there is no such row.
 *
 * ⛔ The one thing a member-facing reader of a contribution's thread needs, and it exists
 * because that reader had nothing: `listContributionMessages` took a contribution id and
 * filtered by it alone, so any signed-in member could read any contribution's dialogue by
 * counting up from one.
 *
 * ⚠️ Deleted rows answer with their owner, deliberately: a member who removed a
 * contribution still owns its thread, and the endpoint showed it to them before this. The
 * guard is about WHOSE it is, nothing else.
 */
export async function dbSelectContributionUserId(contributionId: number): Promise<number | null> {
  const rows = await drizzleDb()
    .select({ userId: contributionsTable.userId })
    .from(contributionsTable)
    .where(eq(contributionsTable.id, contributionId))
  return rows[0]?.userId ?? null
}

// One statement for all the rows it is given. Returns their ids, in the order of the rows.
export async function dbInsertContributions(
  contributions: ContributionsInsert[],
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<number[]> {
  if (contributions.length === 0) {
    return []
  }
  const inserted = await tx.insert(contributionsTable).values(contributions).$returningId()
  return inserted.map(({ id }) => id)
}
