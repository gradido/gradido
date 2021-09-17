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
  // write upgrade logic as parameter of queryFn

  // rename table
  await queryFn(`
      ALTER TABLE state_users
        RENAME TO user;
    `)
  // drop not used columns
  await queryFn(`
      ALTER TABLE user
        DROP COLUMN index_id;
    `)
  // rename from snake case to camel case (cakePHP standard to typeorm standard)
  await queryFn(`
      ALTER TABLE user 
        CHANGE COLUMN group_id groupId int(10) unsigned NOT NULL DEFAULT '0',
        CHANGE COLUMN public_key pubkey binary(32) NOT NULL,
        CHANGE COLUMN first_name firstName varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        CHANGE COLUMN last_name lastName varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
    `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  // rename table
  await queryFn(`
      ALTER TABLE user
        RENAME TO state_users;
    `)
  // put back dropped column
  await queryFn(`
      ALTER TABLE state_users
        ADD index_id smallint(6) NOT NULL DEFAULT '0';
    `)
  // rename from camel case to snake case (typeorm standard to cakePHP standard)
  await queryFn(`
      ALTER TABLE state_users 
        CHANGE COLUMN groupId group_id int(10) unsigned NOT NULL DEFAULT '0',
        CHANGE COLUMN pubkey public_key binary(32) NOT NULL,
        CHANGE COLUMN firstName first_name varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        CHANGE COLUMN lastName last_name varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
    `)
}
