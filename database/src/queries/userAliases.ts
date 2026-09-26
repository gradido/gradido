// AI-GENERATED — not an architecture reference

import { asc, eq, inArray, like, or, sql } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { Order, Result } from 'shared'
import { EntityManager, FindOptionsWhere, MoreThan } from 'typeorm'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import {
  ALIAS_ORIGIN_ADOPTED,
  ALIAS_ORIGIN_CHOSEN,
  AliasOrigin,
  UserAlias as DbUserAlias,
} from '../entity'
import { DBDuplicateEntryError, DBInsertFailed, isDuplicateEntry } from '../errorTypes'
import { UserAliasInsert, userAliasesTable } from '../schemas'

/**
 * Every name a member owns lives here; `users.alias` marks the current one. Taking a
 * name inserts a row, reclaiming an earlier one only moves that marker, and leaving a
 * name writes nothing - so the number of rows is how many names somebody holds, and
 * the number of `chosen` rows in a window is how often they picked one.
 *
 * Taking a name writes here and to `users.alias`, and both writes share one Drizzle
 * transaction (`tx` on `dbInsertUserAlias`): a row written outside would survive a
 * rollback and leave the member holding a name their account never got - counted
 * against their quota and blocked for everyone else. The reads still on TypeORM take
 * an optional `EntityManager`.
 */

const userAliasInsertFailed = (row: UserAliasInsert) =>
  new DBInsertFailed<UserAliasInsert>('user_aliases', row)

/** The name this member already owns, whatever its origin - null if it was never theirs. */
export async function dbFindOwnAlias(
  userId: number,
  alias: string,
  manager?: EntityManager,
): Promise<DbUserAlias | null> {
  const where = { userId, alias }
  return manager ? manager.findOne(DbUserAlias, { where }) : DbUserAlias.findOne({ where })
}

/** Whoever owns this name, or null. */
export async function dbFindAliasOwner(alias: string): Promise<DbUserAlias | null> {
  return DbUserAlias.findOne({ where: { alias } })
}

/**
 * How often this member picked a name since the given moment. Names the system handed
 * out are not counted - they are a proposal until the member adopts one.
 */
export async function dbCountChosenAliasesSince(
  userId: number,
  since: Date,
  manager?: EntityManager,
): Promise<number> {
  const where: FindOptionsWhere<DbUserAlias> = {
    userId,
    origin: ALIAS_ORIGIN_CHOSEN,
    createdAt: MoreThan(since),
  }
  return manager ? manager.count(DbUserAlias, { where }) : DbUserAlias.count({ where })
}

/**
 * The earliest pick still inside the window. Its age is what decides when the next
 * change becomes possible again, so the caller can name a date instead of "in a year".
 */
export async function dbFindOldestChosenAliasSince(
  userId: number,
  since: Date,
): Promise<DbUserAlias | null> {
  return DbUserAlias.findOne({
    where: {
      userId,
      origin: ALIAS_ORIGIN_CHOSEN,
      createdAt: MoreThan(since),
    } as FindOptionsWhere<DbUserAlias>,
    order: { createdAt: Order.ASC },
  })
}

/** Record that this name now belongs to the member. */
export async function dbInsertUserAlias(
  userAlias: UserAliasInsert,
  tx?: DrizzleTransaction | MySql2Database,
): Promise<Result<number, DBInsertFailed<UserAliasInsert> | DBDuplicateEntryError>> {
  if (!tx) {
    tx = drizzleDb()
  }
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

// Not a soft delete, really remove the user and his user contact from db, used in RegisterUser if something after creating user failed
export async function dbRemoveUserAlias(userAliasId: number): Promise<number> {
  if (userAliasId) {
    const rows = await drizzleDb()
      .delete(userAliasesTable)
      .where(eq(userAliasesTable.id, userAliasId))
    return rows[0] ? rows[0].affectedRows : 0
  }
  return 0
}

/** Removes every name these members own. For seeding only, see `dbRemoveUserRoles`. */
export async function dbRemoveUserAliasesOfUsers(userIds: number[]): Promise<void> {
  if (userIds.length === 0) {
    return
  }
  await drizzleDb().delete(userAliasesTable).where(inArray(userAliasesTable.userId, userIds))
}

/** Every name this member owns, current one included. */
export async function dbFindAliasesByUser(userId: number): Promise<DbUserAlias[]> {
  return DbUserAlias.find({ where: { userId }, order: { createdAt: Order.ASC } })
}

export async function dbFindUserAliasesWithPrefix(
  prefix: string,
  limit: number,
): Promise<string[]> {
  const rows = await drizzleDb()
    .select({ a: userAliasesTable.alias })
    .from(userAliasesTable)
    .where(like(userAliasesTable.alias, `${prefix}%`))
    .orderBy(asc(userAliasesTable.alias))
    .limit(limit)

  return rows.map((row) => row.a)
}

// Every alias matching at least one of the patterns, in one round trip. REGEXP follows the
// column's collation (utf8mb4_unicode_ci), so the match is case-insensitive - as the unique
// key is. The patterns go in as bound parameters, never spliced into the statement.
// REGEXP cannot use the index, so this scans user_aliases once, however many patterns.
export async function dbFindUserAliasesWithRegex(regexes: string[]): Promise<string[]> {
  if (!regexes.length) {
    return []
  }
  const rows = await drizzleDb()
    .select({ alias: userAliasesTable.alias })
    .from(userAliasesTable)
    .where(or(...regexes.map((regex) => sql`${userAliasesTable.alias} REGEXP ${regex}`)))
  return rows.map((row) => row.alias)
}

export async function dbFindUserAliasesExisting(userAliases: string[]): Promise<string[]> {
  const rows = await drizzleDb()
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
export async function dbMarkAliasAdopted(id: number): Promise<void> {
  await DbUserAlias.update({ id }, { origin: ALIAS_ORIGIN_ADOPTED })
}
