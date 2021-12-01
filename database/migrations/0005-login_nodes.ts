/* FIRST MIGRATION
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
    CREATE TABLE \`login_node_servers\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`url\` VARCHAR(255) NOT NULL,
        \`port\` INT UNSIGNED NOT NULL,
        \`group_id\` INT UNSIGNED NULL DEFAULT '0',
        \`server_type\` INT UNSIGNED NOT NULL DEFAULT '0',
        \`last_live_sign\` DATETIME NOT NULL DEFAULT '2000-01-01 00:00:00',
        PRIMARY KEY (\`id\`)
       ) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;
    `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE \`login_node_servers\`;`)
}
