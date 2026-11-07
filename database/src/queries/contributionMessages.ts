// AI-GENERATED — not an architecture reference
import { and, eq, isNull } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { contributionMessagesTable, contributionsTable } from '../schemas/drizzle.schema'

/**
 * The message of thanks a member's first creation ended with (ES-009): the one DIALOG
 * message the signer put on the bundle, read back off the thread it was written to. The
 * first by id, because the thanks is the first thing the signer says; a review note that
 * follows a failed confirm sits behind it. Null for a member whose bundle carries no note --
 * a process that was handed to a human without a signer to write one.
 */
export async function dbSelectFirstCreationMessage(userId: number): Promise<string | null> {
  const rows = await drizzleDb()
    .select({ message: contributionMessagesTable.message })
    .from(contributionMessagesTable)
    .innerJoin(
      contributionsTable,
      eq(contributionsTable.id, contributionMessagesTable.contributionId),
    )
    .where(
      and(
        eq(contributionsTable.userId, userId),
        eq(contributionsTable.firstCreation, true),
        eq(contributionMessagesTable.type, 'DIALOG'),
        eq(contributionMessagesTable.isModerator, true),
        isNull(contributionMessagesTable.deletedAt),
      ),
    )
    .orderBy(contributionMessagesTable.id)
    .limit(1)
  return rows[0]?.message ?? null
}
