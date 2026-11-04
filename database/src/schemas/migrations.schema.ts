// AI-GENERATED — not an architecture reference
import { datetime, int, mysqlTable, varchar } from 'drizzle-orm/mysql-core'
import { MIGRATIONS_TABLE } from '../config/const'

// Not in drizzle.schema.ts: createDatabaseFromSchema creates every table of that file, and this
// one's DDL stays with ts-mysql-migrate, which has created it by then.
export const migrationsTable = mysqlTable(MIGRATIONS_TABLE, {
  version: int().primaryKey(),
  fileName: varchar({ length: 256 }),
  date: datetime(),
})
