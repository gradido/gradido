// AI-GENERATED — not an architecture reference

import { and, asc, count, eq, gt, inArray, isNull } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { Result } from 'shared'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { DBDuplicateEntryError, DBInsertFailed, isDuplicateEntry } from '../errorTypes'
import {
  UserAliasInsert,
  UserAliasSelect,
  UserSelect,
  userAliasesTable,
  usersTable,
} from '../schemas'

/**
 * Every name a member owns lives here; `users.alias` marks the current one. Taking a
 * name inserts a row, reclaiming an earlier one only moves that marker, and leaving a
 * name writes nothing - so the number of rows is how many names somebody holds, and
 * the number of `chosen` rows in a window is how often they picked one.
 *
 * Taking a name writes here and to `users.alias`, and both writes share one Drizzle
 * transaction (`tx` on `dbInsertUserAlias`): a row written outside would survive a
 * rollback and leave the member holding a name their account never got - counted
 * against their quota and blocked for everyone else. The reads take the same optional
 * `tx`, so a check inside that transaction sees what it has written.
 */

const userAliasInsertFailed = (row: UserAliasInsert) =>
  new DBInsertFailed<UserAliasInsert>('user_aliases', row)

/** The name this member already owns, whatever its origin - null if it was never theirs. */
export async function dbFindOwnAlias(
  userId: number,
  alias: string,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<UserAliasSelect | null> {
  const rows = await tx
    .select()
    .from(userAliasesTable)
    .where(and(eq(userAliasesTable.userId, userId), eq(userAliasesTable.alias, alias)))
    .limit(1)
  return rows[0] ?? null
}

/** Whoever owns this name, or null. */
export async function dbFindAliasOwner(
  alias: string,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<UserAliasSelect | null> {
  const rows = await tx
    .select()
    .from(userAliasesTable)
    .where(eq(userAliasesTable.alias, alias))
    .limit(1)
  return rows[0] ?? null
}

/** The picks of this member made after the given moment. */
const chosenSince = (userId: number, since: Date) =>
  and(
    eq(userAliasesTable.userId, userId),
    eq(userAliasesTable.origin, 'chosen'),
    gt(userAliasesTable.createdAt, since),
  )

/**
 * How often this member picked a name since the given moment. Names the system handed
 * out are not counted - they are a proposal until the member adopts one.
 */
export async function dbCountChosenAliasesSince(
  userId: number,
  since: Date,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<number> {
  const rows = await tx
    .select({ n: count() })
    .from(userAliasesTable)
    .where(chosenSince(userId, since))
  return rows[0]?.n ?? 0
}

/**
 * The earliest pick still inside the window. Its age is what decides when the next
 * change becomes possible again, so the caller can name a date instead of "in a year".
 */
export async function dbFindOldestChosenAliasSince(
  userId: number,
  since: Date,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<UserAliasSelect | null> {
  const rows = await tx
    .select()
    .from(userAliasesTable)
    .where(chosenSince(userId, since))
    .orderBy(asc(userAliasesTable.createdAt))
    .limit(1)
  return rows[0] ?? null
}

/** Record that this name now belongs to the member. */
export async function dbInsertUserAlias(
  userAlias: UserAliasInsert,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<Result<number, DBInsertFailed<UserAliasInsert> | DBDuplicateEntryError>> {
  try {
    const rows = await tx.insert(userAliasesTable).values(userAlias)
    const firstRow = rows[0]
    if (firstRow && firstRow.affectedRows === 1) {
      return { success: true, value: firstRow.insertId }
    }
    return { success: false, error: userAliasInsertFailed(userAlias) }
  } catch (error) {
    // A taken name is an expected outcome: registration then walks on to the next candidate.
    if (isDuplicateEntry(error)) {
      return {
        success: false,
        error: new DBDuplicateEntryError('user_aliases', 'alias', userAlias.alias),
      }
    }
    throw error
  }
}

/**
 * The member of this community who owns this name - their current alias or one they held
 * before, since a name stays its owner's. Null for a name nobody here owns, and for a deleted
 * member. `alias` is unique in user_aliases, so there is at most one.
 */
export async function dbFindLocalUserByAlias(
  alias: string,
  tx?: DrizzleTransaction | MySql2Database,
): Promise<UserSelect | null> {
  if (!tx) {
    tx = drizzleDb()
  }
  const rows = await tx
    .select({ user: usersTable })
    .from(userAliasesTable)
    .innerJoin(usersTable, eq(userAliasesTable.userId, usersTable.id))
    .where(
      and(
        eq(userAliasesTable.alias, alias),
        eq(usersTable.foreign, false),
        isNull(usersTable.deletedAt),
      ),
    )
    .limit(1)
  return rows[0]?.user ?? null
}

/** Every name this member owns, current one included. */
export async function dbFindAliasesByUser(
  userId: number,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<UserAliasSelect[]> {
  return tx
    .select()
    .from(userAliasesTable)
    .where(eq(userAliasesTable.userId, userId))
    .orderBy(asc(userAliasesTable.createdAt))
}

/**
 * The names out of these that somebody holds, in the spelling they are stored in. The unique
 * key on `alias` answers each one - no scan, however large the table. The column compares
 * case-insensitively, so `berndh` finds `BerndH`.
 */
export async function dbFindUserAliasesExisting(
  userAliases: string[],
  tx?: DrizzleTransaction | MySql2Database,
): Promise<string[]> {
  if (!tx) {
    tx = drizzleDb()
  }
  const rows = await tx
    .select({ a: userAliasesTable.alias })
    .from(userAliasesTable)
    .where(inArray(userAliasesTable.alias, userAliases))

  return rows.map((row) => row.a)
}

/**
 * The member kept the name they were handed. That answers the question the window at
 * first login asks, so the window stops - but it is not a pick and costs none of the
 * four (NU-010/011), which is exactly why `adopted` is its own origin and not `chosen`.
 * Nothing else about the row changes; `created_at` still records when they got it.
 */
export async function dbMarkAliasAdopted(
  id: number,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<void> {
  await tx.update(userAliasesTable).set({ origin: 'adopted' }).where(eq(userAliasesTable.id, id))
}

// One statement for all the rows it is given
export async function dbInsertUserAliases(
  userAliases: UserAliasInsert[],
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<void> {
  if (userAliases.length === 0) {
    return
  }
  await tx.insert(userAliasesTable).values(userAliases)
}
