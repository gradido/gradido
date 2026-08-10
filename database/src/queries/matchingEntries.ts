// AI-GENERATED — not an architecture reference
import { and, desc, eq, inArray } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, DBNotFoundError } from '../errorTypes'
import {
  MatchingEntryInsert,
  MatchingEntrySelect,
  matchingEntriesTable,
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
  return drizzleDb()
    .select()
    .from(matchingEntriesTable)
    .where(
      and(inArray(matchingEntriesTable.userId, userIds), eq(matchingEntriesTable.active, true)),
    )
}

/**
 * Overwrites what the member wrote. `updatedAt` is set here rather than left to the
 * column's ON UPDATE clause, which MySQL only fires when a value actually changes —
 * re-saving an unchanged entry would otherwise keep its old position in the list and
 * report zero affected rows, which reads as a failure.
 */
export async function dbUpdateMatchingEntry(
  uuid: string,
  content: MatchingEntryContent,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(matchingEntriesTable)
    .set({ ...content })
    .where(eq(matchingEntriesTable.uuid, uuid))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: MatchingEntryNotFound(`uuid = ${uuid}`) }
}

/**
 * Pauses or resumes an entry. Same reasoning on `updatedAt` as the update above: without
 * it, pausing an already paused entry would change nothing and look like a missing row.
 */
export async function dbSetMatchingEntryActive(
  uuid: string,
  active: boolean,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(matchingEntriesTable)
    .set({ active })
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
