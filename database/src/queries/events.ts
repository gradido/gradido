import { and, eq } from 'drizzle-orm'
import { Order } from 'shared'
import { EntityManager } from 'typeorm'
import { drizzleDb } from '../AppDatabase'
import { ContributionLink as DbContributionLink, Event as DbEvent, User as DbUser } from '../entity'
import { EventType } from '../enum/EventType'
import { EventInsert, eventsTable } from '../schemas'

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
 * (`backend/src/interactions/registerAccount/RegisterAccount.context.ts`). Asking for the
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

export async function dbInsertEvent(event: EventInsert): Promise<void> {
  await drizzleDb().insert(eventsTable).values(event)
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
