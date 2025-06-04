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

  // insert values from users table with users.is_admin in new user_roles table
  await queryFn(`
    INSERT INTO user_roles
      (user_id, role, created_at, updated_at)
      SELECT u.id, 'ADMIN', u.is_admin, null
      FROM users u
      WHERE u.is_admin IS NOT NULL;`)

  // remove column is_admin from users table
  await queryFn('ALTER TABLE users DROP COLUMN is_admin;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // first add column is_admin in users table
  await queryFn(
    'ALTER TABLE users ADD COLUMN is_admin datetime(3) NULL DEFAULT NULL AFTER language;',
  )
  // reconstruct the previous is_admin back from user_roles to users table
  const roles = await queryFn(
    `SELECT r.user_id, r.role, r.created_at FROM user_roles as r WHERE r.role = "ADMIN"`,
  )
  for (const id in roles) {
    const role = roles[id]
    const isAdminDate = new Date(role.created_at).toISOString().slice(0, 19).replace('T', ' ')
    await queryFn(`UPDATE users SET is_admin = "${isAdminDate}" WHERE id = "${role.user_id}"`)
  }

  await queryFn(`DROP TABLE user_roles;`)
}
