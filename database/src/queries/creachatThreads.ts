// AI-GENERATED — not an architecture reference
import { and, desc, eq, gte, lt } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, DBNotFoundError } from '../errorTypes'
import {
  CreachatThreadInsert,
  CreachatThreadSelect,
  creachatThreadsTable,
} from '../schemas/drizzle.schema'

// TODO: replace results with valibot schema after update to typescript 5 is possible

const CreachatThreadNotFound = (where: string) => new DBNotFoundError('creachat_threads', where)
const CreachatThreadInsertFailed = (row: CreachatThreadInsert) =>
  new DBInsertFailed<CreachatThreadInsert>('creachat_threads', row)

export async function dbInsertCreachatThread(
  row: CreachatThreadInsert,
): Promise<VoidResult<DBInsertFailed<CreachatThreadInsert>>> {
  const result = await drizzleDb().insert(creachatThreadsTable).values(row)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: CreachatThreadInsertFailed(row) }
}

/**
 * The moderator's most recently used thread, provided it was used at or after
 * `usedSince`. Ordered and filtered by `updated_at`, because that is what "the chat he
 * is in" means — ordering by `created_at` would let a thread he opened later but never
 * used win over the one he actually works in. Not finding one is an expected outcome:
 * a moderator who has never opened the chat has none.
 */
export async function dbSelectNewestLiveCreachatThread(
  userId: number,
  usedSince: Date,
): Promise<Result<CreachatThreadSelect, DBNotFoundError>> {
  const result = await drizzleDb()
    .select()
    .from(creachatThreadsTable)
    .where(
      and(eq(creachatThreadsTable.userId, userId), gte(creachatThreadsTable.updatedAt, usedSince)),
    )
    .orderBy(desc(creachatThreadsTable.updatedAt))
    .limit(1)

  const thread = result.at(0)
  return thread
    ? { success: true, value: thread }
    : {
        success: false,
        error: CreachatThreadNotFound(
          `userId = ${userId} and updatedAt >= ${usedSince.toISOString()}`,
        ),
      }
}

/**
 * One thread, scoped to its owner. The user id is part of the condition on purpose: a
 * thread id is an identifier, not an authorisation.
 */
export async function dbSelectCreachatThreadByIdAndUserId(
  id: string,
  userId: number,
): Promise<Result<CreachatThreadSelect, DBNotFoundError>> {
  const result = await drizzleDb()
    .select()
    .from(creachatThreadsTable)
    .where(and(eq(creachatThreadsTable.id, id), eq(creachatThreadsTable.userId, userId)))
    .limit(1)

  const thread = result.at(0)
  return thread
    ? { success: true, value: thread }
    : { success: false, error: CreachatThreadNotFound(`id = ${id} and userId = ${userId}`) }
}

/**
 * Replaces the stored transcript and marks the thread as used. Scoped to its owner for
 * the same reason the reads are: a thread id is an identifier, not an authorisation —
 * and a write is the one where getting that wrong overwrites someone else's conversation.
 */
export async function dbUpdateCreachatThreadMessages(
  id: string,
  userId: number,
  messages: string,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(creachatThreadsTable)
    .set({ messages, updatedAt: new Date() })
    .where(and(eq(creachatThreadsTable.id, id), eq(creachatThreadsTable.userId, userId)))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: CreachatThreadNotFound(`id = ${id} and userId = ${userId}`) }
}

/** Deletes the moderator's own thread. Not finding one is an expected outcome. */
export async function dbDeleteCreachatThreadByIdAndUserId(
  id: string,
  userId: number,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .delete(creachatThreadsTable)
    .where(and(eq(creachatThreadsTable.id, id), eq(creachatThreadsTable.userId, userId)))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return {
    success: false,
    error: CreachatThreadNotFound(`id = ${id} and userId = ${userId}`),
  }
}

/**
 * Deletes every thread last used before `usedBefore`, and answers how many that was.
 *
 * Deliberately not scoped to one moderator. Scoped, the retention rule would only ever
 * reach the moderator who happens to open the chat — a moderator who leaves the team
 * would keep his transcripts forever, which is exactly the case the rule exists for.
 * `updated_at` is indexed for it.
 *
 * The cutoff is a parameter rather than a constant here: how long a chat may lie idle
 * is a rule about Crea, not about the table.
 */
export async function dbDeleteCreachatThreadsUnusedSince(usedBefore: Date): Promise<number> {
  const result = await drizzleDb()
    .delete(creachatThreadsTable)
    .where(lt(creachatThreadsTable.updatedAt, usedBefore))
  return result[0]?.affectedRows ?? 0
}
