// AI-GENERATED — not an architecture reference
import { and, desc, eq, lt } from 'drizzle-orm'
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
 * All threads of one moderator, newest first. An empty list is a legitimate answer, not
 * a failure — a moderator who has never opened the chat simply has none.
 */
export async function dbSelectCreachatThreadsByUserId(
  userId: number,
): Promise<CreachatThreadSelect[]> {
  return drizzleDb()
    .select()
    .from(creachatThreadsTable)
    .where(eq(creachatThreadsTable.userId, userId))
    .orderBy(desc(creachatThreadsTable.createdAt))
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

/** Replaces the stored transcript and marks the thread as used. */
export async function dbUpdateCreachatThreadMessages(
  id: string,
  messages: string,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(creachatThreadsTable)
    .set({ messages, updatedAt: new Date() })
    .where(eq(creachatThreadsTable.id, id))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: CreachatThreadNotFound(`id = ${id}`) }
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
 * Deletes every thread of this moderator last used before `usedBefore`, and answers how
 * many that was. The cutoff is a parameter rather than a constant here: how long a chat
 * may lie idle is a rule about Crea, not about the table.
 */
export async function dbDeleteCreachatThreadsUnusedSince(
  userId: number,
  usedBefore: Date,
): Promise<number> {
  const result = await drizzleDb()
    .delete(creachatThreadsTable)
    .where(
      and(eq(creachatThreadsTable.userId, userId), lt(creachatThreadsTable.updatedAt, usedBefore)),
    )
  return result[0]?.affectedRows ?? 0
}
