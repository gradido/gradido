// AI-GENERATED — not an architecture reference
import { and, eq, isNull } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { userRemarksTable, usersTable } from '../schemas/drizzle.schema'

/**
 * The moderation's remark on a member as a moderator reads it (migration 0168): the words, when
 * they were written last, and who wrote them.
 */
export interface UserRemarkRead {
  remark: string
  updatedAt: Date
  // The moderator who wrote it last, by their real name, as the contribution list names a
  // colleague (findUserNamesByIds, and why there); null where that account is deleted.
  updatedByName: string | null
}

/**
 * A moderator's first and last name as one, or null where there is neither: how a remark names who
 * wrote it last -- here, and in the answer to the moderator who just wrote it (setUserRemark).
 */
export const remarkEditorName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string | null => [firstName, lastName].filter(Boolean).join(' ') || null

/**
 * The remark on this member, or null where the moderation keeps none. One query: the name of the
 * moderator who wrote it last comes with it.
 *
 * Plain on purpose: no remark is an answer, not a failure (AGENTS.md, "functions that always
 * succeed on valid input").
 */
export async function dbSelectUserRemark(userId: number): Promise<UserRemarkRead | null> {
  const rows = await drizzleDb()
    .select({
      remark: userRemarksTable.remark,
      updatedAt: userRemarksTable.updatedAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
    })
    .from(userRemarksTable)
    .leftJoin(
      usersTable,
      and(eq(usersTable.id, userRemarksTable.updatedBy), isNull(usersTable.deletedAt)),
    )
    .where(eq(userRemarksTable.userId, userId))
    .limit(1)
  const row = rows[0]
  if (!row) {
    return null
  }
  return {
    remark: row.remark,
    updatedAt: row.updatedAt,
    updatedByName: remarkEditorName(row.firstName, row.lastName),
  }
}

/**
 * Writes the remark, replacing the one before, with who wrote it and when: one statement, and the
 * primary key decides whether the row is new. The time is the caller's, so that it can answer it
 * without reading the row again.
 */
export async function dbUpsertUserRemark(
  userId: number,
  remark: string,
  updatedBy: number,
  updatedAt: Date,
): Promise<void> {
  await drizzleDb()
    .insert(userRemarksTable)
    .values({ userId, remark, updatedBy, updatedAt })
    .onDuplicateKeyUpdate({ set: { remark, updatedBy, updatedAt } })
}

/**
 * Takes the remark away: an emptied remark is no row. Where there was none, nothing happens -- the
 * moderator's wish is met either way.
 */
export async function dbDeleteUserRemark(userId: number): Promise<void> {
  await drizzleDb().delete(userRemarksTable).where(eq(userRemarksTable.userId, userId))
}
