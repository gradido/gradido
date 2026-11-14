// AI-GENERATED — not an architecture reference
import {
  and,
  count,
  desc,
  eq,
  exists,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  lte,
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
 * each of which turns up in the request somewhere, in any order; a group -- some group, none, the
 * one of this tag (a tag that names no group finds nothing), or any (null); and, given a moment,
 * none of the requests that wait for a resubmission after it ("Wiedervorlage verbergen").
 */
export interface SupportTicketFilter {
  words: string[]
  group: 'GROUPED' | 'UNGROUPED' | { tag: string } | null
  hideResubmissionsAfter: Date | null
}

/**
 * Whether a request waits for its resubmission (K4): a moment set, still to come. One that is due
 * waits no more -- it stands in the list again, and counts. "Now" is the caller's.
 */
const waitsBeyond = (now: Date) => gt(supportTicketsTable.resubmissionAt, now)
const waitsNoMore = (now: Date) =>
  or(isNull(supportTicketsTable.resubmissionAt), lte(supportTicketsTable.resubmissionAt, now))

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
  resubmissionAt: Date | null
}

/**
 * A page of the requests in one of these states that the scope reaches and the filter leaves, the
 * newest first, and how many there are in all.
 */
export async function dbSelectSupportTicketsInScope(
  statuses: SupportTicketStatus[],
  scope: SupportTicketScope,
  { words, group, hideResubmissionsAfter }: SupportTicketFilter,
  offset: number,
  limit: number,
): Promise<{ count: number; tickets: SupportTicketOfModeration[] }> {
  const where = and(
    inArray(supportTicketsTable.status, statuses),
    supportTicketsInScope(scope),
    ...words.map(requestHasWord),
    inFilterGroup(group),
    hideResubmissionsAfter ? waitsNoMore(hideResubmissionsAfter) : undefined,
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
        resubmissionAt: supportTicketsTable.resubmissionAt,
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

/** The member and the group of a request, as the moderation hands it on (K4). */
export interface SupportTicketGroupOfModeration {
  userId: number
  status: SupportTicketStatus
  creationGroupId: number | null
  creationGroupTag: string | null
  creationGroupName: string | null
}

/**
 * The member who owns this request, its state and the group it stands in, where the scope reaches
 * it, in any state. Null where it does not, and where there is no such request: the two answer
 * alike.
 */
export async function dbSelectSupportTicketGroupInScope(
  id: number,
  scope: SupportTicketScope,
): Promise<SupportTicketGroupOfModeration | null> {
  const [row] = await drizzleDb()
    .select({
      userId: supportTicketsTable.userId,
      status: supportTicketsTable.status,
      creationGroupId: supportTicketsTable.creationGroupId,
      creationGroupTag: creationGroupsTable.tag,
      creationGroupName: creationGroupsTable.name,
    })
    .from(supportTicketsTable)
    .leftJoin(creationGroupsTable, eq(creationGroupsTable.id, supportTicketsTable.creationGroupId))
    .where(and(eq(supportTicketsTable.id, id), supportTicketsInScope(scope)))
  return row ?? null
}

/**
 * How many requests the open tab of a moderator holds, as its two halves: waiting for the
 * moderation (OPEN) and waiting for the member (IN_PROGRESS) -- what the badges and the start
 * page count -- and apart from them those that wait for a resubmission still to come (K4), which
 * the tab opens without: the start page names them in a line of their own, as for contributions.
 * Within the scope, and as the tab lists them: the moderator's own requests counted too. One
 * query; "now" is the caller's.
 */
export async function dbCountOpenSupportTicketsInScope(
  scope: SupportTicketScope,
  now: Date,
): Promise<{ forModeration: number; forMember: number; onResubmission: number }> {
  const [row] = await drizzleDb()
    .select({
      forModeration: count(
        sql`case when ${and(eq(supportTicketsTable.status, SupportTicketStatus.OPEN), waitsNoMore(now))} then 1 end`,
      ),
      forMember: count(
        sql`case when ${and(eq(supportTicketsTable.status, SupportTicketStatus.IN_PROGRESS), waitsNoMore(now))} then 1 end`,
      ),
      onResubmission: count(sql`case when ${waitsBeyond(now)} then 1 end`),
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
 * What a write of the moderation does to a request's resubmission (K4): sets it to a moment,
 * takes it away (null), or keeps what is there -- 'keep' where the form's box was not touched, so
 * that what the member or a colleague changed meanwhile stays.
 */
export type SupportTicketResubmission = Date | null | 'keep'

/**
 * Changes a request as the moderation does (answering, noting, closing, deleting it), where it is
 * the moderator's to act on (supportTicketOfModerator), and answers whether it did. The values are
 * fixed ones: nothing of the row is read and written back. A note sets no state, only what becomes
 * of the resubmission.
 *
 * The resubmission is no choice: every write says what becomes of it (K4), and a write that
 * forgets it does not compile. 'keep' sets the column to itself: the row is still found.
 *
 * ⚠️ True also where nothing changes -- an answer to a question back leaves it one: the driver
 * counts the rows found (FOUND_ROWS), as for the member's write below.
 */
export async function dbUpdateSupportTicketOfModerator(
  where: SupportTicketOfModerator,
  {
    resubmissionAt,
    ...set
  }: Pick<SupportTicketInsert, 'status' | 'closedAt' | 'closedBy' | 'deletedAt' | 'deletedBy'> & {
    resubmissionAt: SupportTicketResubmission
  },
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<boolean> {
  const [result] = await tx
    .update(supportTicketsTable)
    .set({
      ...set,
      resubmissionAt:
        resubmissionAt === 'keep' ? sql`${supportTicketsTable.resubmissionAt}` : resubmissionAt,
    })
    .where(supportTicketOfModerator(where))
  return result.affectedRows === 1
}

/**
 * Hands a request on from group `from` to group `to` (K4, null: no group), where it is the
 * moderator's to act on (supportTicketOfModerator) and still stands in `from` -- the group it was
 * read in before, so that a line in its thread never names a group it was not in --, and answers
 * whether it did. A resubmission goes with it: the moderators of the new group see the request at
 * once. Its state stays. The caller makes sure `to` is another group than `from`.
 */
export async function dbReassignSupportTicketOfModerator(
  where: SupportTicketOfModerator,
  from: number | null,
  to: number | null,
  tx: DrizzleTransaction,
): Promise<boolean> {
  const [result] = await tx
    .update(supportTicketsTable)
    .set({ creationGroupId: to, resubmissionAt: null })
    .where(
      and(
        supportTicketOfModerator(where),
        from === null
          ? isNull(supportTicketsTable.creationGroupId)
          : eq(supportTicketsTable.creationGroupId, from),
      ),
    )
  return result.affectedRows === 1
}

/**
 * Sets the state of a request the member owns, where it stands in one of the given states, and
 * answers whether it did: the owner and the state from which it may change are the condition of
 * the write, not of a row read before it. Another member's request answers false, as a missing
 * one does. What becomes of a resubmission is said with every write (K4): a member's word takes
 * it away.
 *
 * ⚠️ True also where nothing changes -- an open request written into stays open: the pool's
 * driver counts the rows the condition found, not the rows it changed (mysql2 connects with
 * FOUND_ROWS; supportTickets.test.ts holds it).
 */
export async function dbUpdateSupportTicketOfOwner(
  where: { id: number; userId: number; statusIn: SupportTicketStatus[] },
  set: {
    status: SupportTicketStatus
    closedAt: Date | null
    closedBy: number | null
    resubmissionAt: Date | null
  },
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
