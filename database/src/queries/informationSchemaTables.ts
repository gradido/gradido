// AI-GENERATED — not an architecture reference
import { sql } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { MIGRATIONS_TABLE } from '../config/const'

/**
 * Empties every table of the current database except `migrations`, in one round trip: the
 * table list is read inside the statement itself, from `information_schema.tables`, so a new
 * table is covered without being registered anywhere. For the test helpers' `cleanDB`.
 *
 * A MariaDB compound statement (`BEGIN NOT ATOMIC`, MariaDB 10.1+), which the server takes as
 * ONE statement - mysql2 does not need `multipleStatements` for it.
 *
 * `DELETE`, not `TRUNCATE`: measured on MariaDB 10.11 with the 35 tables of 26.09.2026,
 * TRUNCATE costs ~19 ms per table (InnoDB drops and recreates the table file) - 0.65 s per
 * call, empty or not. DELETE took 5 ms for all tables when empty and 95 ms with 50 rows each.
 * DELETE also leaves AUTO_INCREMENT where it is, as the entity-by-entity cleanup did.
 */
export async function dbDeleteAllRowsExceptMigrations(): Promise<void> {
  await drizzleDb().execute(
    sql.raw(`
      BEGIN NOT ATOMIC
        FOR t IN (
          SELECT table_name AS name FROM information_schema.tables
          WHERE table_schema = DATABASE()
            AND table_type = 'BASE TABLE'
            AND table_name <> '${MIGRATIONS_TABLE}'
        ) DO
          EXECUTE IMMEDIATE CONCAT('DELETE FROM \`', t.name, '\`');
        END FOR;
      END
    `),
  )
}
