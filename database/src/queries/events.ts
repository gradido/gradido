import {
  and,
  count,
  countDistinct,
  eq,
  exists,
  gte,
  inArray,
  isNotNull,
  lt,
  lte,
  notExists,
  SQL,
  sql,
} from 'drizzle-orm'
import { alias as aliasedTable, MySqlColumn } from 'drizzle-orm/mysql-core'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { Order } from 'shared'
import { EntityManager } from 'typeorm'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { ContributionLink as DbContributionLink, Event as DbEvent, User as DbUser } from '../entity'
import { EventType } from '../enum/EventType'
import { EventInsert, eventsTable, usersTable } from '../schemas'
import { countFields, countsOfRow, rowsFrom, WeeklyCount, weekStartOf } from './figureCounts'

export async function findModeratorCreatingContributionLink(
  contributionLink: DbContributionLink,
): Promise<DbUser | undefined> {
  const event = await DbEvent.findOne({
    where: {
      involvedContributionLinkId: contributionLink.id,
      // todo: move event types into db
      type: 'ADMIN_CONTRIBUTION_LINK_CREATE',
    },
    relations: { actingUser: true },
  })
  return event?.actingUser
}

/**
 * The most recent event of one type that concerns this member, or null.
 *
 * Used as a rate limit that survives the disappearance of the thing it guards: a pending
 * e-mail change is a row that gets deleted on cancel, so "when was the last mail sent"
 * cannot be read from it - the event stays.
 */
export async function dbFindLatestEventForAffectedUser(
  type: string,
  affectedUserId: number,
  manager?: EntityManager,
): Promise<DbEvent | null> {
  const options = {
    // todo: move event types into db
    where: { type, affectedUserId },
    order: { createdAt: Order.DESC },
  }
  return manager ? manager.findOne(DbEvent, options) : DbEvent.findOne(options)
}

/**
 * Was this member's account created by redeeming this very link?
 *
 * `USER_REGISTER_REDEEM` is written once, during registration, and only when a redeem
 * code was used; it carries the link that code belonged to
 * (`backend/src/interactions/registerUser/RegisterUserFromTransactionLink.role.ts`). Asking for the
 * pair is what separates "redeemed my link and is new here" from "somebody I brought
 * along once" - `users.referrer_id` cannot tell those apart, because it stays set for
 * every later link between the same two people.
 *
 * The index added in migration 0122 (`type`, `affected_user_id`, `created_at`) covers the
 * first two of the three conditions, so the lookup goes straight to that member's events
 * of that type.
 */
export async function dbHasRegisterRedeemEvent(
  affectedUserId: number,
  transactionLinkId: number,
): Promise<boolean> {
  const rows = await drizzleDb()
    .select({ id: eventsTable.id })
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.type, EventType.USER_REGISTER_REDEEM),
        eq(eventsTable.affectedUserId, affectedUserId),
        eq(eventsTable.involvedTransactionLinkId, transactionLinkId),
      ),
    )
  return rows.length !== 0
}

// With `tx` the event is part of the caller's Drizzle transaction: it commits or rolls back
// with what that transaction stores, and a later reader under the same lock finds it.
export async function dbInsertEvent(
  event: EventInsert,
  tx?: DrizzleTransaction | MySql2Database,
): Promise<void> {
  if (!tx) {
    tx = drizzleDb()
  }
  await tx.insert(eventsTable).values(event)
}

/**
 * `dbInsertEvent` inside the caller's TypeORM transaction. Drizzle writes over a pool of its
 * own, so an event that has to commit or roll back together with TypeORM writes - or that is
 * read and written under the same lock - cannot go through `dbInsertEvent` yet.
 * TODO: remove once those transactions have moved to Drizzle.
 */
export async function dbInsertEventInTransaction(
  manager: EntityManager,
  event: Omit<EventInsert, 'amountLegacy'>,
): Promise<void> {
  const { amountGdd4, ...columns } = event
  await manager.insert(DbEvent, { ...columns, amount: amountGdd4 ?? null })
}

// The figures of the admin's start page (CommunityFiguresResolver): sums, never who. How a count
// answers for several moments at once: figureCounts.ts.

/** The matching events, from one moment on. */
const eventsFrom = rowsFrom(eventsTable.createdAt)

/** The members one column of the matching events names, each once, from one moment on. */
const membersFrom =
  (column: MySqlColumn) =>
  (from: Date | null): SQL<number> =>
    from === null
      ? countDistinct(column)
      : countDistinct(sql`case when ${gte(eventsTable.createdAt, from)} then ${column} end`)

/** How many events of these types were written, from each moment on. */
export async function dbCountEventsOfTypes(
  types: EventType[],
  froms: (Date | null)[],
): Promise<number[]> {
  if (types.length === 0) {
    throw new Error('dbCountEventsOfTypes needs at least one event type')
  }
  const [row] = await drizzleDb()
    .select(countFields(froms, eventsFrom))
    .from(eventsTable)
    .where(inArray(eventsTable.type, types))
  return countsOfRow(row, froms)
}

/** How many members events of this type concern (affected), each once, from each moment on. */
export async function dbCountDistinctAffectedUsersOfType(
  type: EventType,
  froms: (Date | null)[],
): Promise<number[]> {
  const [row] = await drizzleDb()
    .select(countFields(froms, membersFrom(eventsTable.affectedUserId)))
    .from(eventsTable)
    .where(eq(eventsTable.type, type))
  return countsOfRow(row, froms)
}

/** How many members wrote events of this type (acting), each once, from each moment on. */
export async function dbCountDistinctActingUsersOfType(
  type: EventType,
  froms: (Date | null)[],
): Promise<number[]> {
  const [row] = await drizzleDb()
    .select(countFields(froms, membersFrom(eventsTable.actingUserId)))
    .from(eventsTable)
    .where(eq(eventsTable.type, type))
  return countsOfRow(row, froms)
}

/**
 * The event is no outcome of an administrator's function test (ES-014): no `FIRST_CREATION_TEST`
 * of the same member was written before it, or at its moment.
 */
function outsideFunctionTests(): SQL {
  const test = aliasedTable(eventsTable, 'function_test')
  return notExists(
    drizzleDb()
      .select({ id: test.id })
      .from(test)
      .where(
        and(
          eq(test.type, EventType.FIRST_CREATION_TEST),
          eq(test.affectedUserId, eventsTable.affectedUserId),
          lte(test.createdAt, eventsTable.createdAt),
        ),
      ),
  )
}

/**
 * How many members an outcome of their first creation concerns (`FIRST_CREATION_DONE`, `_SKIP`,
 * `_REVIEW`), each once, from each moment on -- without an administrator's function tests
 * (ES-014): an outcome written after the member's `FIRST_CREATION_TEST` belongs to a test run.
 * An outcome from before the member's first test counts.
 */
export async function dbCountFirstCreationMembers(
  type: EventType,
  froms: (Date | null)[],
): Promise<number[]> {
  const [row] = await drizzleDb()
    .select(countFields(froms, membersFrom(eventsTable.affectedUserId)))
    .from(eventsTable)
    .where(and(eq(eventsTable.type, type), outsideFunctionTests()))
  return countsOfRow(row, froms)
}

/** A plain registration of an account that names a referrer -- with the account joined. */
const registeredWithReferrer = and(
  eq(eventsTable.type, EventType.USER_REGISTER),
  isNotNull(usersTable.referrerId),
)

/**
 * How many accounts were registered the plain way by somebody who brought them along: the
 * `USER_REGISTER` events whose account names a referrer -- an address `/u/…`, a business card
 * and its QR code (RegisterUserReferrerRole). The other registrations that note a referrer
 * write their own type -- a table code `USER_REGISTER_GUARANTOR`, a redeem link
 * `USER_REGISTER_REDEEM` -- and are counted with it, not here. A deleted account still counts:
 * its registration happened.
 */
export async function dbCountRegisterEventsWithReferrer(froms: (Date | null)[]): Promise<number[]> {
  const [row] = await drizzleDb()
    .select(countFields(froms, eventsFrom))
    .from(eventsTable)
    .innerJoin(usersTable, eq(usersTable.id, eventsTable.affectedUserId))
    .where(registeredWithReferrer)
  return countsOfRow(row, froms)
}

/**
 * How many members came back from `since` on after a quiet time: they signed in from `since` on,
 * and before that login lay `quietDays` without one -- with a login before them. The quiet time
 * is measured back from the login that ends it, so it may reach over `since`: somebody last seen
 * 60 days before `since` who returns 40 days after it was quiet for 100 days. A member who kept
 * signing in is not counted, nor one who never signed in before. Only the logins the event
 * protocol holds count: a member whose last login is older than its first entries is not
 * counted either.
 */
export async function dbCountReturningMembers(since: Date, quietDays = 90): Promise<number> {
  const before = aliasedTable(eventsTable, 'login_before')
  const within = aliasedTable(eventsTable, 'login_within')
  // The first moment of the quiet time before the login of the outer row.
  const quietFrom = sql`${eventsTable.createdAt} - interval ${quietDays} day`
  const [row] = await drizzleDb()
    .select({ members: countDistinct(eventsTable.affectedUserId) })
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.type, EventType.USER_LOGIN),
        gte(eventsTable.createdAt, since),
        exists(
          drizzleDb()
            .select({ id: before.id })
            .from(before)
            .where(
              and(
                eq(before.type, EventType.USER_LOGIN),
                eq(before.affectedUserId, eventsTable.affectedUserId),
                lt(before.createdAt, quietFrom),
              ),
            ),
        ),
        notExists(
          drizzleDb()
            .select({ id: within.id })
            .from(within)
            .where(
              and(
                eq(within.type, EventType.USER_LOGIN),
                eq(within.affectedUserId, eventsTable.affectedUserId),
                gte(within.createdAt, quietFrom),
                lt(within.createdAt, eventsTable.createdAt),
              ),
            ),
        ),
      ),
    )
  return row?.members ?? 0
}

// The same counts by calendar week, for the series below the table (figureCounts.ts): one
// statement each, grouped by the Monday of the week an event was written in, from `from` on --
// the Monday of the first week, so that it counts whole. A week without an event is not in the
// answer.

/** The Monday of the week an event was written in. */
const eventWeek = weekStartOf(eventsTable.createdAt)

/** How many events of these types were written, in each week from `from` on. */
export async function dbCountEventsOfTypesByWeek(
  types: EventType[],
  from: Date,
): Promise<WeeklyCount[]> {
  if (types.length === 0) {
    throw new Error('dbCountEventsOfTypesByWeek needs at least one event type')
  }
  return drizzleDb()
    .select({ weekStart: eventWeek, n: count() })
    .from(eventsTable)
    .where(and(inArray(eventsTable.type, types), gte(eventsTable.createdAt, from)))
    .groupBy(eventWeek)
    .orderBy(eventWeek)
}

/**
 * How many members events of this type concern (`affected`) or were written by (`acting`), each
 * once in a week, in each week from `from` on. A member of two weeks counts in both.
 */
export async function dbCountDistinctUsersOfTypeByWeek(
  type: EventType,
  column: 'affected' | 'acting',
  from: Date,
): Promise<WeeklyCount[]> {
  const member = column === 'affected' ? eventsTable.affectedUserId : eventsTable.actingUserId
  return drizzleDb()
    .select({ weekStart: eventWeek, n: countDistinct(member) })
    .from(eventsTable)
    .where(and(eq(eventsTable.type, type), gte(eventsTable.createdAt, from)))
    .groupBy(eventWeek)
    .orderBy(eventWeek)
}

/** dbCountRegisterEventsWithReferrer by week: in each week from `from` on. */
export async function dbCountRegisterEventsWithReferrerByWeek(from: Date): Promise<WeeklyCount[]> {
  return drizzleDb()
    .select({ weekStart: eventWeek, n: count() })
    .from(eventsTable)
    .innerJoin(usersTable, eq(usersTable.id, eventsTable.affectedUserId))
    .where(and(registeredWithReferrer, gte(eventsTable.createdAt, from)))
    .groupBy(eventWeek)
    .orderBy(eventWeek)
}

/**
 * dbCountFirstCreationMembers by week: the members an outcome of their first creation concerns,
 * each once in a week, in each week from `from` on -- without the function tests of
 * administrators. A member who skipped in two weeks counts in both.
 */
export async function dbCountFirstCreationMembersByWeek(
  type: EventType,
  from: Date,
): Promise<WeeklyCount[]> {
  return drizzleDb()
    .select({ weekStart: eventWeek, n: countDistinct(eventsTable.affectedUserId) })
    .from(eventsTable)
    .where(
      and(eq(eventsTable.type, type), gte(eventsTable.createdAt, from), outsideFunctionTests()),
    )
    .groupBy(eventWeek)
    .orderBy(eventWeek)
}
