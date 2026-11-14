// AI-GENERATED — not an architecture reference
import { and, count, desc, eq, gte, inArray } from 'drizzle-orm'
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
