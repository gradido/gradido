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

const LOGIN_SERVER_DB = '`gradido_login`'

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    INSERT INTO \`login_app_access_tokens\` SELECT * FROM ${LOGIN_SERVER_DB}.\`app_access_tokens\`;
  `)
  await queryFn(`
    INSERT INTO \`login_elopage_buys\` SELECT * FROM ${LOGIN_SERVER_DB}.\`elopage_buys\`;
  `)
  await queryFn(`
    INSERT INTO \`login_email_opt_in_types\` SELECT * FROM ${LOGIN_SERVER_DB}.\`email_opt_in_types\`;
  `)
  await queryFn(`
    INSERT INTO \`login_email_opt_in\` SELECT * FROM ${LOGIN_SERVER_DB}.\`email_opt_in\`;
  `)
  await queryFn(`
    INSERT INTO \`login_groups\` SELECT * FROM ${LOGIN_SERVER_DB}.\`groups\`;
  `)
  await queryFn(`
    INSERT INTO \`login_pending_tasks\` SELECT * FROM ${LOGIN_SERVER_DB}.\`pending_tasks\`;
  `)
  await queryFn(`
    INSERT INTO \`login_roles\` SELECT * FROM ${LOGIN_SERVER_DB}.\`roles\`;
  `)
  await queryFn(`
    INSERT INTO \`login_user_backups\` SELECT * FROM ${LOGIN_SERVER_DB}.\`user_backups\`;
  `)
  await queryFn(`
    INSERT INTO \`login_user_roles\` SELECT * FROM ${LOGIN_SERVER_DB}.\`user_roles\`;
  `)
  await queryFn(`
    INSERT INTO \`login_users\` SELECT * FROM ${LOGIN_SERVER_DB}.\`users\`;
  `)

  // TODO clarify if we need this on non docker environment?
  await queryFn(`
    INSERT IGNORE INTO \`login_groups\` (\`id\`, \`alias\`, \`name\`, \`url\`, \`host\`, \`home\`, \`description\`) VALUES
      (1, 'docker', 'docker gradido group', 'localhost', 'nginx', '/', 'gradido test group for docker and stage2 with blockchain db');
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DELETE FROM \`login_app_access_tokens\`;`)
  await queryFn(`DELETE FROM \`login_elopage_buys\`;`)
  await queryFn(`DELETE FROM \`login_email_opt_in_types\`;`)
  await queryFn(`DELETE FROM \`login_email_opt_in\`;`)
  await queryFn(`DELETE FROM \`login_groups\`;`)
  await queryFn(`DELETE FROM \`login_pending_tasks\`;`)
  await queryFn(`DELETE FROM \`login_roles\`;`)
  await queryFn(`DELETE FROM \`login_user_backups\`;`)
  await queryFn(`DELETE FROM \`login_user_roles\`;`)
  await queryFn(`DELETE FROM \`login_users\`;`)
}
