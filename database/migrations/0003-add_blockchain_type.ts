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
        INSERT IGNORE INTO \`blockchain_types\` (\`id\`, \`name\`, \`text\`, \`symbol\`) VALUES
        (3, 'iota', 'use iota for transactions', 'IOTA');`)
  }
  
  export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
    // write downgrade logic as parameter of queryFn
    await queryFn(`DELETE FROM \`blockchain_types\` where id = 3;`)
  }
  