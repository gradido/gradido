import { desc, eq } from 'drizzle-orm'
import { openaiThreadsTable } from '../schemas/drizzle.schema'
import { drizzleDb } from '.'

// TODO: replace results with valibot schema after update to typescript 5 is possible

export async function dbInsertOpenaiThread(id: string, userId: number): Promise<void> {
  await drizzleDb()
   .insert(openaiThreadsTable)
   .values({ id, userId })
}

export async function dbUpdateOpenaiThread(id: string): Promise<void> {
  await drizzleDb()
    .update(openaiThreadsTable)
    .set({ updatedAt: new Date() })
    .where(eq(openaiThreadsTable.id, id))
}

export async function dbFindNewestCreatedOpenaiThreadByUserId(userId: number): Promise<typeof openaiThreadsTable.$inferSelect | undefined> {
  const result = await drizzleDb()
    .select()
    .from(openaiThreadsTable)
    .where(eq(openaiThreadsTable.userId, userId))
    .orderBy(desc(openaiThreadsTable.createdAt))
    .limit(1)
  return result.at(0)
}

export async function dbDeleteOpenaiThread(id: string): Promise<void> {
  await drizzleDb()
    .delete(openaiThreadsTable)
    .where(eq(openaiThreadsTable.id, id))
}
