// AI-GENERATED — not an architecture reference
import { desc } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { migrationsTable } from '../schemas/migrations.schema'

/** The file name of the migration applied last, null if none has been recorded. */
export async function dbSelectLatestMigrationFileName(): Promise<string | null> {
  const rows = await drizzleDb()
    .select({ fileName: migrationsTable.fileName })
    .from(migrationsTable)
    .orderBy(desc(migrationsTable.version))
    .limit(1)
  return rows[0]?.fileName ?? null
}
