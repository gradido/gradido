// AI-GENERATED — not an architecture reference
import { and, asc, desc, eq, inArray, isNull, ne, notInArray, or } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, DBNotFoundError } from '../errorTypes'
import {
  MatchingEntryInsert,
  MatchingEntrySelect,
  matchingEntriesTable,
  usersTable,
} from '../schemas/drizzle.schema'

// TODO: replace results with valibot schema after update to typescript 5 is possible

const MatchingEntryNotFound = (where: string) => new DBNotFoundError('matching_entries', where)
const MatchingEntryInsertFailed = (row: MatchingEntryInsert) =>
  new DBInsertFailed<MatchingEntryInsert>('matching_entries', row)

/** The fields a member may set. `active` is not among them — pausing has its own call. */
export interface MatchingEntryContent {
  matchingType: string
  summary: string
  details: string | null
  remote: boolean
}

/**
 * What a language model made of an entry's sentence, as it is stored.
 *
 * Written as a block, never field by field: half a keying describes a sentence
 * half-way and there is nothing sensible to do with it.
 */
export interface MatchingEntryKeying {
  keyWords: string[]
  keySubject: string | null
  keyActivity: string | null
  keyCategory: string | null
  keyArea: string | null
  keyActor: string | null
  keySoughtActor: string | null
  keyTraits: string[]
  instructionVersion: string
}

/** Every keyed column back to NULL - the state an entry that was never keyed is in. */
const NO_KEYING = {
  keyWords: null,
  keySubject: null,
  keyActivity: null,
  keyCategory: null,
  keyArea: null,
  keyActor: null,
  keySoughtActor: null,
  keyTraits: null,
  instructionVersion: null,
  keyedAt: null,
} as const

export async function dbInsertMatchingEntry(
  row: MatchingEntryInsert,
): Promise<VoidResult<DBInsertFailed<MatchingEntryInsert>>> {
  const result = await drizzleDb().insert(matchingEntriesTable).values(row)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: MatchingEntryInsertFailed(row) }
}

/**
 * One entry by its uuid, deliberately not scoped to an owner.
 *
 * The caller has to compare `userId` itself, because it must tell the two failures
 * apart: an entry that does not exist and an entry that belongs to someone else are
 * different answers, and the resolver logs and reports them differently. Folding them
 * into one condition here would make that impossible.
 */
export async function dbSelectMatchingEntryByUuid(
  uuid: string,
): Promise<Result<MatchingEntrySelect, DBNotFoundError>> {
  const result = await drizzleDb()
    .select()
    .from(matchingEntriesTable)
    .where(eq(matchingEntriesTable.uuid, uuid))
    .limit(1)

  const entry = result.at(0)
  return entry
    ? { success: true, value: entry }
    : { success: false, error: MatchingEntryNotFound(`uuid = ${uuid}`) }
}

/**
 * A member's own entries, paused ones included — this is the list they manage, not the
 * list others can find. Newest change first, so an entry just edited is at the top.
 */
export async function dbSelectMatchingEntriesByUserId(
  userId: number,
): Promise<MatchingEntrySelect[]> {
  return drizzleDb()
    .select()
    .from(matchingEntriesTable)
    .where(eq(matchingEntriesTable.userId, userId))
    .orderBy(desc(matchingEntriesTable.updatedAt))
}

/**
 * The live entries of several members at once, for the run that brings the GMS back in
 * line. Paused entries are left out: the GMS only holds what may actually turn up in
 * someone's search.
 *
 * An empty list of ids returns an empty result rather than reaching the database —
 * `inArray` with no values has no meaningful SQL form.
 */
export async function dbSelectActiveMatchingEntriesByUserIds(
  userIds: number[],
): Promise<MatchingEntrySelect[]> {
  if (userIds.length === 0) {
    return []
  }
  // Deliberately about the ENTRIES and not about the members: it answers "the live
  // entries of these people", and who those people may be is the caller's question -
  // which is also what its test asserts. The member-level guard for this path sits in
  // `sendUsersToGms`, where the members are already in hand.
  return drizzleDb()
    .select()
    .from(matchingEntriesTable)
    .where(
      and(inArray(matchingEntriesTable.userId, userIds), eq(matchingEntriesTable.active, true)),
    )
}

/**
 * Overwrites what the member wrote.
 *
 * `updatedAt` is set here rather than left to the column's ON UPDATE clause, which MySQL
 * only fires when a value actually changes: saving without editing anything would
 * otherwise leave the entry where it was in the member's list, and this column is what
 * orders that list. TypeORM's UpdateDateColumn did the same thing before this moved to
 * drizzle, so the behaviour is unchanged.
 *
 * It has no bearing on the success check below. mysql2 connects with FOUND_ROWS, so
 * `affectedRows` counts the rows the WHERE clause matched, not the ones that changed —
 * an update that writes the same values still reports 1. (Measured, after the opposite
 * was assumed here: removing the stamp fails no test.)
 */
export async function dbUpdateMatchingEntry(
  stored: MatchingEntrySelect,
  content: MatchingEntryContent,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(matchingEntriesTable)
    .set({
      ...content,
      // A keying describes one sentence on one channel. Change either and what is
      // stored describes something the member no longer wrote, so it goes - and the
      // NULL is at the same time what puts the entry back on the keying run's list.
      // No dirty flag and no second table: the absence of a keying IS the to-do.
      //
      // It takes the stored row rather than the uuid so that it can see this at all.
      // Doing it in SQL against the incoming values would work too, but only as long
      // as the assignments below stay in the right order, and nothing in the file
      // would say so.
      ...(keyingDescribes(stored, content) ? {} : NO_KEYING),
      updatedAt: new Date(),
    })
    .where(eq(matchingEntriesTable.uuid, stored.uuid))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: MatchingEntryNotFound(`uuid = ${stored.uuid}`) }
}

/** Whether a stored keying still describes what the member is now saving. */
function keyingDescribes(stored: MatchingEntrySelect, content: MatchingEntryContent): boolean {
  return stored.summary === content.summary && stored.matchingType === content.matchingType
}

/**
 * Store what the model worked out for one entry.
 *
 * `keyedAt` is set here rather than passed in: it is the moment this server learned
 * the answer, and it is read as such on both sides. Together with the instruction
 * version it is the witness that an entry has a keying at all.
 *
 * The uuid is checked against BOTH the sentence and the channel the keying was
 * computed from, and that is not belt and braces. Between reading an entry for the
 * keying run and writing the answer, the member may have changed either - and that
 * change already cleared the keying to schedule a fresh one. Writing anyway would pin
 * words about the old entry onto the new one, and nothing would ever notice: the row
 * would look keyed and would drop off the list for good.
 *
 * Both, because both change the answer. The channel is given to the model, and the
 * instruction fills `gesuchter_beruf` only on "sucht" - so an offer flipped to a need
 * without touching the sentence gets a different keying, and `keyingDescribes` above
 * treats it as invalidating for exactly that reason. Guarding on the sentence alone
 * would let the two disagree.
 *
 * (The same guard, for the same reason, as `writeEmbedding` in the GMS.)
 */
export async function dbWriteMatchingEntryKeying(
  uuid: string,
  summary: string,
  matchingType: string,
  keying: MatchingEntryKeying,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(matchingEntriesTable)
    .set({ ...keying, keyedAt: new Date() })
    .where(
      and(
        eq(matchingEntriesTable.uuid, uuid),
        eq(matchingEntriesTable.summary, summary),
        eq(matchingEntriesTable.matchingType, matchingType),
      ),
    )

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: MatchingEntryNotFound(`uuid = ${uuid} with this summary`) }
}

/**
 * Whose entries may be published to the GMS at all.
 *
 * Four conditions, and every one of them is a rule somebody could otherwise break by
 * writing a second query: the member takes part, the member still exists, the member
 * is ours rather than a federated row from another community, and the entry is live.
 *
 * ⚠️ `syncMatchingEntryToGms` - the path a member's own save takes - checks only two
 * of the four (`!user.gmsAllowed || !entry.active`). So the two already disagree:
 * that one will publish an entry of a soft-deleted member, this one will not key it.
 * Widening it is a change to the everyday save path and belongs in its own delivery.
 * What must not happen is a reader adding a fifth condition here in the belief that
 * the two are kept in step.
 */
const mayReachTheGms = () =>
  and(
    eq(matchingEntriesTable.active, true),
    eq(usersTable.gmsAllowed, 1),
    isNull(usersTable.deletedAt),
    eq(usersTable.foreign, 0),
  )

/** An entry waiting to be keyed, with the two things about its owner the run needs. */
export interface MatchingEntryToKey {
  entry: MatchingEntrySelect
  userGradidoId: string
  /** The member's language - the only evidence the GMS gets of where a word came from. */
  userLanguage: string
}

/**
 * The entries waiting to be keyed: never done, or done by an instruction we have
 * replaced.
 *
 * One list, two jobs, and the second is the one worth having. A new entry has no
 * instruction version; an entry from an older instruction has the wrong one. Both are
 * work for the same run, which is what turns "improve the instruction on real
 * entries" from a one-way street into a routine - the same trick as the GMS's
 * `embedding_model` column, and the reason that column exists.
 *
 * ⚠️ A re-keying changes who matches whom. Somebody who saw twelve people light up
 * yesterday may see nine today. Deliberate and rare, not by the way.
 *
 * What is left out, and none of it is an optimisation:
 *
 *  - ⛔ entries of members who have not agreed to take part in the GMS. Keying sends
 *    words derived from what they wrote into a table every community reads, and a
 *    member who declined publication has declined that too. Their entry stays in
 *    their own list, unkeyed, and the day they agree it joins this one.
 *  - ⛔ entries of members who deleted their account. The account is gone and the GMS
 *    copy with it; coining words out of what they wrote would be the one trace of
 *    them that outlives the deletion, and it would land in a global table. The row
 *    is only soft-deleted, so nothing else stops this.
 *  - entries owned by a federated row from another community. No local path creates
 *    one, and if one ever appeared it would be another community's member and
 *    another community's model call.
 *  - paused entries, which are not in the GMS and cannot be found by anybody, so a
 *    model call for them would buy nothing. Resuming does not give them a keying, so
 *    they rejoin the list by themselves.
 *
 * The first three are the same set `mayBeShownToMembers` guards in queries/userAvatars,
 * for the same reason: what may be published about a member.
 *
 * `skipUuids` are entries the caller has already given up on for now - the model
 * answered nothing usable for them, or the whole batch failed. They are excluded in
 * SQL, because the ordering and the limit make a caller-side filter useless: drop one
 * from the answer and the next call hands back the same row.
 *
 * Oldest first, so a backlog drains in the order it built up.
 */
export async function dbSelectMatchingEntriesNeedingKeying(
  instructionVersion: string,
  limit: number,
  skipUuids: readonly string[] = [],
): Promise<MatchingEntryToKey[]> {
  const rows = await drizzleDb()
    .select({
      entry: matchingEntriesTable,
      userGradidoId: usersTable.gradidoId,
      userLanguage: usersTable.language,
    })
    .from(matchingEntriesTable)
    .innerJoin(usersTable, eq(usersTable.id, matchingEntriesTable.userId))
    .where(
      and(
        mayReachTheGms(),
        or(
          isNull(matchingEntriesTable.instructionVersion),
          ne(matchingEntriesTable.instructionVersion, instructionVersion),
        ),
        // Left out here rather than filtered by the caller afterwards, and that is
        // the difference between working and not: this is `ORDER BY id LIMIT n`, so
        // an entry the caller drops from the answer is simply the same entry the next
        // call returns. Nothing behind it would ever be reached.
        skipUuids.length ? notInArray(matchingEntriesTable.uuid, [...skipUuids]) : undefined,
      ),
    )
    .orderBy(asc(matchingEntriesTable.id))
    .limit(limit)
  return rows
}

/**
 * One entry as it stands right now, if it may still be published to the GMS.
 *
 * Read again just before publishing, and that is the whole point of the function. A
 * model call takes seconds, and in those seconds the member may have paused the entry
 * (which deleted it from the GMS - publishing the stale row would put it back into
 * everyone's search), corrected a price (publishing the stale row would roll their
 * correction back over there), withdrawn from the GMS, or deleted their account.
 *
 * Nothing here says the answer is worthless: the keying is stored locally either way
 * and travels with the next edit or repair run. It says only that this particular
 * moment is not the one to send it.
 */
export async function dbSelectPublishableMatchingEntry(
  uuid: string,
): Promise<{ entry: MatchingEntrySelect; userGradidoId: string } | undefined> {
  const rows = await drizzleDb()
    .select({ entry: matchingEntriesTable, userGradidoId: usersTable.gradidoId })
    .from(matchingEntriesTable)
    .innerJoin(usersTable, eq(usersTable.id, matchingEntriesTable.userId))
    .where(and(eq(matchingEntriesTable.uuid, uuid), mayReachTheGms()))
    .limit(1)
  return rows.at(0)
}

/**
 * Pauses or resumes an entry. Same reasoning on `updatedAt` as the update above: it keeps
 * the list order honest when the value written is the one already there.
 */
export async function dbSetMatchingEntryActive(
  uuid: string,
  active: boolean,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(matchingEntriesTable)
    .set({ active, updatedAt: new Date() })
    .where(eq(matchingEntriesTable.uuid, uuid))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: MatchingEntryNotFound(`uuid = ${uuid}`) }
}

/** Removes one entry for good. The GMS copy is the caller's business, not the table's. */
export async function dbDeleteMatchingEntryByUuid(
  uuid: string,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .delete(matchingEntriesTable)
    .where(eq(matchingEntriesTable.uuid, uuid))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: MatchingEntryNotFound(`uuid = ${uuid}`) }
}
