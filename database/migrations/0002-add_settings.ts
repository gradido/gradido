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
      CREATE TABLE IF NOT EXISTS \`userSetting\` (
        \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
        \`userId\` int(11) NOT NULL,
        \`key\` varchar(255) NOT NULL,
        \`value\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)    
  }
  
  export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
    // write downgrade logic as parameter of queryFn
    await queryFn(`DROP TABLE IF EXISTS \`userSettings\`;`)
  }
  