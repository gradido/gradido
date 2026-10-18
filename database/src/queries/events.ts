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

// The figures of the admin's start page (CommunityFiguresResolver): sums, never who.
//
// Each count is asked for several moments at once and answers with one number per moment, in
// the order given; `null` counts everything of its kind. One statement per count, however
// many columns the page shows of it.

/** The fields of one select, one count per moment: `n0`, `n1`, … */
function countFields(
  froms: (Date | null)[],
  countFrom: (from: Date | null) => SQL<number>,
): Record<string, SQL<number>> {
  if (froms.length === 0) {
    throw new Error('a count needs at least one moment to count from')
  }
  return Object.fromEntries(froms.map((from, index) => [`n${index}`, countFrom(from)]))
}

/** The numbers of a select built by countFields, in the order of its moments. */
const countsOfRow = (row: Record<string, number> | undefined, froms: (Date | null)[]): number[] =>
  froms.map((_, index) => row?.[`n${index}`] ?? 0)

/** The matching events, from one moment on. */
const eventsFrom = (from: Date | null): SQL<number> =>
  from === null ? count() : count(sql`case when ${gte(eventsTable.createdAt, from)} then 1 end`)

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
 * How many members an outcome of their first creation concerns (`FIRST_CREATION_DONE`, `_SKIP`,
 * `_REVIEW`), each once, from each moment on -- without an administrator's function tests
 * (ES-014): an outcome written after the member's `FIRST_CREATION_TEST` belongs to a test run.
 * An outcome from before the member's first test counts.
 */
export async function dbCountFirstCreationMembers(
  type: EventType,
  froms: (Date | null)[],
): Promise<number[]> {
  const test = aliasedTable(eventsTable, 'function_test')
  const [row] = await drizzleDb()
    .select(countFields(froms, membersFrom(eventsTable.affectedUserId)))
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.type, type),
        notExists(
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
        ),
      ),
    )
  return countsOfRow(row, froms)
}

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
    .where(and(eq(eventsTable.type, EventType.USER_REGISTER), isNotNull(usersTable.referrerId)))
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
