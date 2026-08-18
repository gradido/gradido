// AI-GENERATED — not an architecture reference
import { EntityManager, FindOptionsWhere, MoreThan, Not } from 'typeorm'
import { ALIAS_ORIGIN_CHOSEN, AliasOrigin, UserAlias as DbUserAlias } from '../entity'

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

/** The name this member already owns, whatever its origin - null if it was never theirs. */
export async function dbFindOwnAlias(
  userId: number,
  alias: string,
  communityUuid: string,
  manager?: EntityManager,
): Promise<DbUserAlias | null> {
  const where = { userId, alias, communityUuid }
  return manager ? manager.findOne(DbUserAlias, { where }) : DbUserAlias.findOne({ where })
}

/** Whoever owns this name in this community, or null. */
export async function dbFindAliasOwner(alias: string): Promise<DbUserAlias | null> {
  return DbUserAlias.findOne({ where: { alias } })
}

/**
 * Is this name spoken for by somebody else? `userId` exempts the member's own names,
 * which is what lets them reclaim one they held before.
 */
export async function dbAliasHeldByOther(alias: string, userId?: number): Promise<boolean> {
  const where = userId === undefined ? { alias } : { alias, userId: Not(userId) }
  return (await DbUserAlias.findOne({ where })) !== null
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
    order: { createdAt: 'ASC' },
  })
}

/** Record that this name now belongs to the member. */
export async function dbInsertUserAlias(
  userId: number,
  alias: string,
  communityUuid: string,
  origin: AliasOrigin,
  manager?: EntityManager,
): Promise<DbUserAlias> {
  const row = DbUserAlias.create({ userId, alias, communityUuid, origin })
  return manager ? manager.save(row) : DbUserAlias.save(row)
}
