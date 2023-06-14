/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE user_roles (
      id int unsigned NOT NULL AUTO_INCREMENT,
      user_id int(10) unsigned NOT NULL,
      role varchar(40) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  // merge values from login_email_opt_in table with users.email in new user_contacts table
  await queryFn(`
    INSERT INTO user_roles
      (user_id, role, created_at, updated_at)
      SELECT u.id, 'admin', u.is_admin, null
      FROM users u
      WHERE u.is_admin IS NOT NULL;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE user_roles;`)
}
