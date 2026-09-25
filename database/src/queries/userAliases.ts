// AI-GENERATED — not an architecture reference

import { asc, eq, inArray, like, or, sql } from 'drizzle-orm'
import { union } from 'drizzle-orm/mysql-core'
import { MySqlRawQueryResult } from 'drizzle-orm/mysql2'
import { Order, Result } from 'shared'
import { EntityManager, FindOptionsWhere, MoreThan, Not } from 'typeorm'
import { drizzleDb } from '../AppDatabase'
import {
  ALIAS_ORIGIN_ADOPTED,
  ALIAS_ORIGIN_CHOSEN,
  AliasOrigin,
  UserAlias as DbUserAlias,
} from '../entity'
import { DBInsertFailed } from '../errorTypes'
import { UserAliasInsert, userAliasesTable } from '../schemas'

/**
 * Every name a member owns lives here; `users.alias` marks the current one. Taking a
 * name inserts a row, reclaiming an earlier one only moves that marker, and leaving a
 * name writes nothing - so the number of rows is how many names somebody holds, and
 * the number of `chosen` rows in a window is how often they picked one.
 *
 * Several of these take an optional `EntityManager`. The caller that changes a name
 * already runs inside a REPEATABLE READ transaction that saves `users`, and the row
 * here has to share it: a row written outside would survive a rollback and leave the
 * member holding a name their account never got - counted against their quota and
 * blocked for everyone else.
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
 * Is this name spoken for by somebody else? `userId` exempts the member's own names,
 * which is what lets them reclaim one they held before. With a manager, over the caller's
 * transaction: registerAccount picks a name while it holds its connection, and must not take
 * a second one from the pool meanwhile.
 */
export async function dbAliasHeldByOther(
  alias: string,
  userId?: number,
  manager?: EntityManager,
): Promise<boolean> {
  const where = userId === undefined ? { alias } : { alias, userId: Not(userId) }
  const row = manager
    ? await manager.findOne(DbUserAlias, { where })
    : await DbUserAlias.findOne({ where })
  return row !== null
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
): Promise<Result<number, DBInsertFailed<UserAliasInsert>>> {
  const rows = await drizzleDb().insert(userAliasesTable).values(userAlias)
  const firstRow = rows[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true, value: firstRow.insertId }
  }
  return { success: false, error: userAliasInsertFailed(userAlias) }
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

export async function dbFindUserAliasesWithRegex(regexes: string[]): Promise<string[]> {
  const queries = regexes.map((regex) =>
    drizzleDb()
      .select({ a: userAliasesTable.alias })
      .from(userAliasesTable)
      .where(like(userAliasesTable.alias, regex))
      .orderBy(asc(userAliasesTable.alias)),
  )

  const res: MySqlRawQueryResult = await drizzleDb().execute(
    sql.join(queries, ' UNION ').mapWith(userAliasesTable.alias),
  )
  console.log(JSON.stringify(res, null, 2))
  throw new Error('not finished yet')
  // return []
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
