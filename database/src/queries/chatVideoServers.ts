// AI-GENERATED — not an architecture reference
import { asc, count, eq } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBDuplicateEntryError, DBNotFoundError, isDuplicateEntry } from '../errorTypes'
import {
  ChatVideoServerInsert,
  ChatVideoServerSelect,
  chatVideoServersTable,
} from '../schemas/drizzle.schema'

const ChatVideoServerNotFound = (id: number) =>
  new DBNotFoundError('chat_video_servers', `id = ${id}`)
const ChatVideoServerDuplicate = (baseUrl: string) =>
  new DBDuplicateEntryError('chat_video_servers', 'base_url', baseUrl)

/** What makes an entry: everything but its id and its two dates. */
export type ChatVideoServerValues = Pick<
  ChatVideoServerInsert,
  'baseUrl' | 'operator' | 'roomPrefix' | 'note' | 'active'
>

/** Every entry, oldest first: the order the admin page shows them and the check goes through. */
export async function dbSelectChatVideoServers(): Promise<ChatVideoServerSelect[]> {
  return drizzleDb().select().from(chatVideoServersTable).orderBy(asc(chatVideoServersTable.id))
}

/** How many entries there are -- whether the backend's start still has to fill the list. */
export async function dbCountChatVideoServers(): Promise<number> {
  const rows = await drizzleDb().select({ n: count() }).from(chatVideoServersTable)
  return rows[0]?.n ?? 0
}

async function dbSelectChatVideoServerById(id: number): Promise<ChatVideoServerSelect | null> {
  const rows = await drizzleDb()
    .select()
    .from(chatVideoServersTable)
    .where(eq(chatVideoServersTable.id, id))
    .limit(1)
  return rows.at(0) ?? null
}

/**
 * Adds an entry and returns it as stored. The same base address a second time is refused by the
 * unique key and comes back as DBDuplicateEntryError -- an expected outcome that the admin page
 * names, not a crash.
 */
export async function dbInsertChatVideoServer(
  values: ChatVideoServerValues,
): Promise<Result<ChatVideoServerSelect, DBDuplicateEntryError>> {
  let id: number
  try {
    const result = await drizzleDb().insert(chatVideoServersTable).values(values)
    id = result[0].insertId
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return { success: false, error: ChatVideoServerDuplicate(values.baseUrl) }
    }
    throw error
  }
  const row = await dbSelectChatVideoServerById(id)
  if (!row) {
    throw new Error(`chat_video_servers: no row ${id} right after writing it`)
  }
  return { success: true, value: row }
}

/**
 * Changes an entry and returns it as stored; what `change` does not name keeps its value.
 * Refused where no entry has this id (deleted in the meantime, on another tab) and where the new
 * base address is another entry's.
 *
 * `affectedRows` counts the rows FOUND, not the rows changed: mysql2 connects with FOUND_ROWS.
 * So 0 means no such entry, also for a change that changes nothing -- and `updatedAt` changes
 * with every call anyway.
 */
export async function dbUpdateChatVideoServer(
  id: number,
  change: Partial<ChatVideoServerValues>,
): Promise<Result<ChatVideoServerSelect, DBNotFoundError | DBDuplicateEntryError>> {
  try {
    const result = await drizzleDb()
      .update(chatVideoServersTable)
      .set({ ...change, updatedAt: new Date() })
      .where(eq(chatVideoServersTable.id, id))
    if (result[0].affectedRows === 0) {
      return { success: false, error: ChatVideoServerNotFound(id) }
    }
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return { success: false, error: ChatVideoServerDuplicate(change.baseUrl ?? '') }
    }
    throw error
  }
  // Read back rather than assembled from `change`: the caller gets the row as it is now.
  const row = await dbSelectChatVideoServerById(id)
  if (!row) {
    return { success: false, error: ChatVideoServerNotFound(id) }
  }
  return { success: true, value: row }
}

/** Removes an entry. No entry with this id is an expected outcome: deleted on another tab. */
export async function dbDeleteChatVideoServer(id: number): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .delete(chatVideoServersTable)
    .where(eq(chatVideoServersTable.id, id))
  if (result[0].affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: ChatVideoServerNotFound(id) }
}
