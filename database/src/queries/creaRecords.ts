// AI-GENERATED — not an architecture reference
import { drizzleDb } from '../AppDatabase'
import { CreaRecordInsert, creaRecordsTable } from '../schemas/drizzle.schema'

/** Stores the records of one evaluation (one per activity) in a single statement. */
export async function dbInsertCreaRecords(rows: CreaRecordInsert[]): Promise<void> {
  if (rows.length === 0) {
    return
  }
  await drizzleDb().insert(creaRecordsTable).values(rows)
}
