// AI-GENERATED — not an architecture reference
import {
  and,
  count,
  desc,
  eq,
  exists,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  ne,
  or,
  SQL,
  sql,
} from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import {
  creationGroupsTable,
  SupportTicketInsert,
  SupportTicketStatus,
  supportTicketsTable,
  usersTable,
} from '../schemas/drizzle.schema'
import { memberHasWord } from './user'

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
 * What the moderation's list is narrowed to (K4), beside the scope and never in its place: words,
 * each of which turns up in the request somewhere, in any order, and a group -- some group, none,
 * the one of this tag (a tag that names no group finds nothing), or any (null).
 */
export interface SupportTicketFilter {
  words: string[]
  group: 'GROUPED' | 'UNGROUPED' | { tag: string } | null
}

/**
 * Whether a word turns up in a request: in its words; in its member as the admin's member search
 * finds them (memberHasWord), a deleted account not, the server names no deleted member; or, a
 * word of digits, as the request's number, which the member and the mail call it by. `%` and `_`
 * act as wildcards, as in the member search.
 */
const requestHasWord = (word: string) =>
  or(
    like(supportTicketsTable.text, `%${word}%`),
    exists(
      drizzleDb()
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(
          and(
            eq(usersTable.id, supportTicketsTable.userId),
            isNull(usersTable.deletedAt),
            memberHasWord(word),
          ),
        ),
    ),
    /^\d{1,9}$/.test(word) ? eq(supportTicketsTable.id, Number(word)) : undefined,
  )

/** The group of the filter, at the column; a tag in a subquery closed in itself, as the scope. */
const inFilterGroup = (group: SupportTicketFilter['group']) => {
  if (group === 'GROUPED') {
    return isNotNull(supportTicketsTable.creationGroupId)
  }
  if (group === 'UNGROUPED') {
    return isNull(supportTicketsTable.creationGroupId)
  }
  return group
    ? sql`${supportTicketsTable.creationGroupId} in (select ${creationGroupsTable.id} from ${creationGroupsTable} where ${eq(creationGroupsTable.tag, group.tag)})`
    : undefined
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
 * A page of the requests in one of these states that the scope reaches and the filter leaves, the
 * newest first, and how many there are in all.
 */
export async function dbSelectSupportTicketsInScope(
  statuses: SupportTicketStatus[],
  scope: SupportTicketScope,
  { words, group }: SupportTicketFilter,
  offset: number,
  limit: number,
): Promise<{ count: number; tickets: SupportTicketOfModeration[] }> {
  const where = and(
    inArray(supportTicketsTable.status, statuses),
    supportTicketsInScope(scope),
    ...words.map(requestHasWord),
    inFilterGroup(group),
  )
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
 * How many requests the open tab of a moderator holds, as its two halves: waiting for the
 * moderation (OPEN) and waiting for the member (IN_PROGRESS) -- what the badges and the start
 * page count. Within the scope, and as the tab lists them: the moderator's own requests counted
 * too. One query.
 */
export async function dbCountOpenSupportTicketsInScope(
  scope: SupportTicketScope,
): Promise<{ forModeration: number; forMember: number }> {
  const [row] = await drizzleDb()
    .select({
      forModeration: count(
        sql`case when ${supportTicketsTable.status} = ${SupportTicketStatus.OPEN} then 1 end`,
      ),
      forMember: count(
        sql`case when ${supportTicketsTable.status} = ${SupportTicketStatus.IN_PROGRESS} then 1 end`,
      ),
    })
    .from(supportTicketsTable)
    .where(
      and(
        inArray(supportTicketsTable.status, [
          SupportTicketStatus.OPEN,
          SupportTicketStatus.IN_PROGRESS,
        ]),
        supportTicketsInScope(scope),
      ),
    )
  return row
}

/**
 * A request as the moderation may act on it (K3): this one, standing in one of the states the
 * act starts from, within the moderator's scope, and not the moderator's own (SUA-018).
 */
export interface SupportTicketOfModerator {
  id: number
  statusIn: SupportTicketStatus[]
  scope: SupportTicketScope
  moderatorId: number
}

/**
 * The one condition of every act of the moderation on a request -- the count of its thread, the
 * write, the check before a note -- so that what decides cannot differ between them. A request
 * outside the scope, of another state, the moderator's own and a missing one answer alike. In the
 * statement that writes, not in a read before it: a request that left the scope or changed its
 * state in between is not written.
 */
export const supportTicketOfModerator = ({
  id,
  statusIn,
  scope,
  moderatorId,
}: SupportTicketOfModerator): SQL =>
  // never undefined: the id is in it
  and(
    eq(supportTicketsTable.id, id),
    inArray(supportTicketsTable.status, statusIn),
    ne(supportTicketsTable.userId, moderatorId),
    supportTicketsInScope(scope),
  ) as SQL

/**
 * Changes a request as the moderation does (answering, closing, deleting it), where it is the
 * moderator's to act on (supportTicketOfModerator), and answers whether it did. The values are
 * fixed ones: nothing of the row is read and written back.
 *
 * ⚠️ True also where nothing changes -- an answer to a question back leaves it one: the driver
 * counts the rows found (FOUND_ROWS), as for the member's write below.
 */
export async function dbUpdateSupportTicketOfModerator(
  where: SupportTicketOfModerator,
  set: Pick<SupportTicketInsert, 'closedAt' | 'closedBy' | 'deletedAt' | 'deletedBy'> & {
    status: SupportTicketStatus
  },
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<boolean> {
  const [result] = await tx
    .update(supportTicketsTable)
    .set(set)
    .where(supportTicketOfModerator(where))
  return result.affectedRows === 1
}

/**
 * Holds a request where it is the moderator's to act on (supportTicketOfModerator), and answers
 * whether it is: for a write into its thread that changes nothing of the request (a note). A
 * locking read holds the condition of the row as it is now, not as the transaction first read
 * it, and keeps the row as it is until the transaction ends.
 */
export async function dbLockSupportTicketOfModerator(
  where: SupportTicketOfModerator,
  tx: DrizzleTransaction,
): Promise<boolean> {
  const rows = await tx
    .select({ id: supportTicketsTable.id })
    .from(supportTicketsTable)
    .where(supportTicketOfModerator(where))
    .for('update')
  return rows.length === 1
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
