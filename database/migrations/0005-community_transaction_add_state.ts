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
    ALTER TABLE \`transactions\`
    ADD \`transaction_state_id\` int unsigned NOT NULL;`)

  await queryFn(`
      CREATE TABLE \`transaction_states\` (
        \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`text\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  await queryFn(`
          INSERT IGNORE INTO \`transaction_states\` (\`id\`, \`name\`, \`text\`) VALUES
          (1, 'none', 'no state at all, transaction processing is running'),
          (2, 'sended', 'sended to ordering system, for example iota'),
          (3, 'confirmed', 'confirmed ordering');`)

  await queryFn(`UPDATE \`transactions\` set \`transaction_state_id\` = 3`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE \`transaction_states\`;`)
  await queryFn(`ALTER TABLE \`transactions\`
      DROP COLUMN \`transaction_state_id\`;`)
}
