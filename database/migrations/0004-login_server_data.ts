/* MIGRATION TO COPY LOGIN_SERVER DATA
 *
 * This migration copies all existing data from the `login_server` database (`gradido_login`)
 * to the `community_server` database (`gradido_community`) in case the login_server database
 * is present.
 *
 * NOTE: This will fail if the two databases are located on different servers.
 *       Manual export and import of the database will be required then.
 * NOTE: This migration does not delete the data when downgrading!
 */

const LOGIN_SERVER_DB = 'gradido_login'

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  const loginDatabaseExists = await queryFn(`
    SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${LOGIN_SERVER_DB}'
    `)
  if (loginDatabaseExists.length === 0) {
    // biome-ignore lint/suspicious/noConsole: no logger present
    console.log(`Skipping Login Server Database migration - Database ${LOGIN_SERVER_DB} not found`)
    return
  }

  await queryFn(`
    INSERT IGNORE INTO \`login_app_access_tokens\` SELECT * FROM ${LOGIN_SERVER_DB}.\`app_access_tokens\`;
  `)
  await queryFn(`
    INSERT IGNORE INTO \`login_elopage_buys\` SELECT * FROM ${LOGIN_SERVER_DB}.\`elopage_buys\`;
  `)
  await queryFn(`
    INSERT IGNORE INTO \`login_email_opt_in_types\` SELECT * FROM ${LOGIN_SERVER_DB}.\`email_opt_in_types\`;
  `)
  await queryFn(`
    INSERT IGNORE INTO \`login_email_opt_in\` SELECT * FROM ${LOGIN_SERVER_DB}.\`email_opt_in\`;
  `)
  await queryFn(`
    INSERT IGNORE INTO \`login_groups\` SELECT * FROM ${LOGIN_SERVER_DB}.\`groups\`;
  `)
  await queryFn(`
    INSERT IGNORE INTO \`login_pending_tasks\` SELECT * FROM ${LOGIN_SERVER_DB}.\`pending_tasks\`;
  `)
  await queryFn(`
    INSERT IGNORE INTO \`login_roles\` SELECT * FROM ${LOGIN_SERVER_DB}.\`roles\`;
  `)
  await queryFn(`
    INSERT IGNORE INTO \`login_user_backups\` SELECT * FROM ${LOGIN_SERVER_DB}.\`user_backups\`;
  `)
  await queryFn(`
    INSERT IGNORE INTO \`login_user_roles\` SELECT * FROM ${LOGIN_SERVER_DB}.\`user_roles\`;
  `)
  await queryFn(`
    INSERT IGNORE INTO \`login_users\` SELECT * FROM ${LOGIN_SERVER_DB}.\`users\`;
  `)

  // TODO clarify if we need this on non docker environment?
  await queryFn(`
    INSERT IGNORE INTO \`login_groups\` (\`id\`, \`alias\`, \`name\`, \`url\`, \`host\`, \`home\`, \`description\`) VALUES
      (1, 'docker', 'docker gradido group', 'localhost', 'nginx', '/', 'gradido test group for docker and stage2 with blockchain db');
  `)
}

export async function downgrade(
  /* queryFn: (query: string, values?: any[]) => Promise<Array<any>> */
) {
  // EMPTY FUNCTION
}
