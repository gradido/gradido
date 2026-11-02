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

/**
 * Empties every table of the current database except `migrations` and lets their ids count from
 * 1 again, in one round trip. For the seed, which wants the same ids on every run.
 *
 * TRUNCATE costs per table, empty or not (see dbDeleteAllRowsExceptMigrations), so it runs only
 * where the counter has moved: a table with `auto_increment` at 1 never held a row. Seven tables
 * have no counter (`auto_increment` is NULL) and so nothing that shows whether they held rows or
 * needs a reset - they get the DELETE, which costs next to nothing when empty.
 *
 * Foreign key checks are off meanwhile, as everything gets emptied anyway and TRUNCATE refuses a
 * referenced table otherwise. They are a setting of the connection, which goes back to the pool,
 * so they are switched on again on failure too.
 *
 * ⚠️ TRUNCATE commits an open transaction implicitly - call this before one is opened, never
 * inside it.
 */
export async function dbTruncateAllRowsExceptMigrations(): Promise<void> {
  await drizzleDb().execute(
    sql.raw(`
      BEGIN NOT ATOMIC
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          SET FOREIGN_KEY_CHECKS = 1;
          RESIGNAL;
        END;
        SET FOREIGN_KEY_CHECKS = 0;
        FOR t IN (
          SELECT table_name AS name, IF(auto_increment IS NULL, 'DELETE FROM', 'TRUNCATE TABLE') AS emptying
          FROM information_schema.tables
          WHERE table_schema = DATABASE()
            AND table_type = 'BASE TABLE'
            AND table_name <> '${MIGRATIONS_TABLE}'
            AND (auto_increment IS NULL OR auto_increment > 1)
        ) DO
          EXECUTE IMMEDIATE CONCAT(t.emptying, ' \`', t.name, '\`');
        END FOR;
        SET FOREIGN_KEY_CHECKS = 1;
      END
    `),
  )
}
