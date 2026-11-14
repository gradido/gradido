// AI-GENERATED — not an architecture reference
import { and, count, desc, eq, gte, inArray, isNull, or, SQL, sql } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import {
  creationGroupsTable,
  SupportTicketStatus,
  supportTicketsTable,
} from '../schemas/drizzle.schema'

/**
 * A member's own request as the member reads it (migration 0173): its number, its words, its
 * state, its group and when it was filed -- nothing of who closed or deleted it.
 */
export interface SupportTicketOfMember {
  id: number
  text: string
  status: SupportTicketStatus
  createdAt: Date
  creationGroupTag: string | null
  creationGroupName: string | null
}

/** Files a request and answers its number. The time is the caller's, so that it can answer it. */
export async function dbInsertSupportTicket(
  row: { userId: number; creationGroupId: number | null; text: string; createdAt: Date },
  tx: DrizzleTransaction,
): Promise<number> {
  const [result] = await tx.insert(supportTicketsTable).values(row)
  return result.insertId
}

/** How many requests the member filed since then, every one of them -- a deleted one as well. */
export async function dbCountSupportTicketsOfUserSince(
  userId: number,
  since: Date,
  tx: DrizzleTransaction,
): Promise<number> {
  const [row] = await tx
    .select({ filed: count() })
    .from(supportTicketsTable)
    .where(and(eq(supportTicketsTable.userId, userId), gte(supportTicketsTable.createdAt, since)))
  return row.filed
}

/** A page of the member's own requests, the newest first, and how many they have in all. */
export async function dbSelectSupportTicketsOfUser(
  userId: number,
  offset: number,
  limit: number,
): Promise<{ count: number; tickets: SupportTicketOfMember[] }> {
  const [[total], tickets] = await Promise.all([
    drizzleDb()
      .select({ count: count() })
      .from(supportTicketsTable)
      .where(eq(supportTicketsTable.userId, userId)),
    drizzleDb()
      .select({
        id: supportTicketsTable.id,
        text: supportTicketsTable.text,
        status: supportTicketsTable.status,
        createdAt: supportTicketsTable.createdAt,
        creationGroupTag: creationGroupsTable.tag,
        creationGroupName: creationGroupsTable.name,
      })
      .from(supportTicketsTable)
      .leftJoin(
        creationGroupsTable,
        eq(creationGroupsTable.id, supportTicketsTable.creationGroupId),
      )
      .where(eq(supportTicketsTable.userId, userId))
      .orderBy(desc(supportTicketsTable.id))
      .limit(limit)
      .offset(offset),
  ])
  return { count: total.count, tickets }
}

/**
 * Which requests a moderator reaches, as the backend reads it off their role
 * (describeModeratorCreationGroups): all of them, or those of these groups -- with or without
 * the ones of no group.
 */
export interface SupportTicketScope {
  tags: string[]
  seesAllCreationGroups: boolean
  seesUntagged: boolean
}

/**
 * The condition that keeps a moderator to their scope (SUA-005), one for the list, its count and
 * the check of a single request, so that what a moderator sees and what they reach cannot differ.
 * None where they see everything; else the requests of a group with one of their tags, and with
 * `seesUntagged` those of no group besides.
 *
 * ⛔ A scope of no tag and no "untagged" reaches nothing -- stricter on purpose than the
 * contributions' list, which reads such a scope as no filter (findContributions.ts).
 *
 * Closed in itself, a subquery on the groups: it leans on no join of the query it stands in.
 */
export const supportTicketsInScope = ({
  tags,
  seesAllCreationGroups,
  seesUntagged,
}: SupportTicketScope): SQL | undefined => {
  if (seesAllCreationGroups) {
    return undefined
  }
  const inGroups =
    tags.length > 0
      ? sql`${supportTicketsTable.creationGroupId} in (select ${creationGroupsTable.id} from ${creationGroupsTable} where ${inArray(creationGroupsTable.tag, tags)})`
      : undefined
  const untagged = seesUntagged ? isNull(supportTicketsTable.creationGroupId) : undefined
  return or(inGroups, untagged) ?? sql`false`
}

/**
 * A request as the moderation lists it: whose it is by number, its words, its state, its group,
 * when it was filed, and when and by whom it was closed and deleted.
 */
export interface SupportTicketOfModeration {
  id: number
  userId: number
  text: string
  status: SupportTicketStatus
  createdAt: Date
  creationGroupTag: string | null
  creationGroupName: string | null
  closedAt: Date | null
  closedBy: number | null
  deletedAt: Date | null
  deletedBy: number | null
}

/**
 * A page of the requests in one of these states that the scope reaches, the newest first, and how
 * many there are in all.
 */
export async function dbSelectSupportTicketsInScope(
  statuses: SupportTicketStatus[],
  scope: SupportTicketScope,
  offset: number,
  limit: number,
): Promise<{ count: number; tickets: SupportTicketOfModeration[] }> {
  const where = and(inArray(supportTicketsTable.status, statuses), supportTicketsInScope(scope))
  const [[total], tickets] = await Promise.all([
    drizzleDb().select({ count: count() }).from(supportTicketsTable).where(where),
    drizzleDb()
      .select({
        id: supportTicketsTable.id,
        userId: supportTicketsTable.userId,
        text: supportTicketsTable.text,
        status: supportTicketsTable.status,
        createdAt: supportTicketsTable.createdAt,
        creationGroupTag: creationGroupsTable.tag,
        creationGroupName: creationGroupsTable.name,
        closedAt: supportTicketsTable.closedAt,
        closedBy: supportTicketsTable.closedBy,
        deletedAt: supportTicketsTable.deletedAt,
        deletedBy: supportTicketsTable.deletedBy,
      })
      .from(supportTicketsTable)
      .leftJoin(
        creationGroupsTable,
        eq(creationGroupsTable.id, supportTicketsTable.creationGroupId),
      )
      .where(where)
      .orderBy(desc(supportTicketsTable.id))
      .limit(limit)
      .offset(offset),
  ])
  return { count: total.count, tickets }
}

/**
 * The member who owns this request, where the scope reaches it, in any state -- a deleted one as
 * well. Null where it does not, and where there is no such request: the two answer alike.
 */
export async function dbSelectSupportTicketOwnerInScope(
  id: number,
  scope: SupportTicketScope,
): Promise<number | null> {
  const [row] = await drizzleDb()
    .select({ userId: supportTicketsTable.userId })
    .from(supportTicketsTable)
    .where(and(eq(supportTicketsTable.id, id), supportTicketsInScope(scope)))
  return row?.userId ?? null
}

/**
 * Sets the state of a request the member owns, where it stands in one of the given states, and
 * answers whether it did: the owner and the state from which it may change are the condition of
 * the write, not of a row read before it. Another member's request answers false, as a missing
 * one does.
 *
 * ⚠️ True also where nothing changes -- an open request written into stays open: the pool's
 * driver counts the rows the condition found, not the rows it changed (mysql2 connects with
 * FOUND_ROWS; supportTickets.test.ts holds it).
 */
export async function dbUpdateSupportTicketOfOwner(
  where: { id: number; userId: number; statusIn: SupportTicketStatus[] },
  set: { status: SupportTicketStatus; closedAt: Date | null; closedBy: number | null },
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<boolean> {
  const [result] = await tx
    .update(supportTicketsTable)
    .set(set)
    .where(
      and(
        eq(supportTicketsTable.id, where.id),
        eq(supportTicketsTable.userId, where.userId),
        inArray(supportTicketsTable.status, where.statusIn),
      ),
    )
  return result.affectedRows === 1
}
