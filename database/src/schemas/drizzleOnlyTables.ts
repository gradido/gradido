// AI-GENERATED — not an architecture reference
import { getTableName } from 'drizzle-orm'
import {
  assistedRegistrationsTable,
  creachatThreadsTable,
  firstCreationsTable,
  matchingEntriesTable,
  projectBrandingsTable,
  thankYouCardPaymentsTable,
  thankYouCardSettingsTable,
  thankYouCardsTable,
  userAvatarsTable,
  userFavoritesTable,
} from './drizzle.schema'

/**
 * The tables that exist only in the Drizzle schema - no TypeORM entity, so they are not in
 * `entities`. `cleanDB` in the test helpers (backend, federation, dht-node) empties both
 * lists; a table on neither keeps its rows from one test file to the next, and a test that
 * writes a fixed key into it then fails on the next run - or not, depending on which files
 * happened to run in between.
 *
 * ⚠️ A new table without a TypeORM entity goes here. A table whose entity is removed moves
 * here, too. See AGENTS.md.
 */
export const drizzleOnlyTables = [
  assistedRegistrationsTable,
  creachatThreadsTable,
  firstCreationsTable,
  matchingEntriesTable,
  projectBrandingsTable,
  thankYouCardPaymentsTable,
  thankYouCardSettingsTable,
  thankYouCardsTable,
  userAvatarsTable,
  userFavoritesTable,
]

/** Their names in the database, for `cleanDB`, which deletes over the TypeORM connection. */
export const drizzleOnlyTableNames = drizzleOnlyTables.map((table) => getTableName(table))
