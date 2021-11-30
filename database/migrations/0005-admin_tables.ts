/* MIGRATION FOR ADMIN INTERFACE
 *
 * This migration is special since it takes into account that
 * the database can be setup already but also may not be.
 * Therefore you will find all `CREATE TABLE` statements with
 * a `IF NOT EXISTS`, all `INSERT` with an `IGNORE` and in the
 * downgrade function all `DROP TABLE` with a `IF EXISTS`.
 * This ensures compatibility for existing or non-existing
 * databases.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
  CREATE TABLE \`login_pending_tasks_admin\` (
    \`id\` int UNSIGNED NOT NULL AUTO_INCREMENT,
    \`userId\` int UNSIGNED DEFAULT 0,
    \`created\` datetime NOT NULL,
    \`date\` datetime NOT NULL,
    \`memo\` text DEFAULT NULL,
    \`amount\` bigint(20) NOT NULL,
    \`moderator\` int UNSIGNED DEFAULT 0,
    PRIMARY KEY (\`id\`)
  ) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE \`login_pending_tasks_admin\`;`)
}
