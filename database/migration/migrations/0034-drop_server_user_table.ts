/* MIGRATION DROP server_users TABLE
add isAdmin COLUMN to users TABLE */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` ADD COLUMN `is_admin` datetime DEFAULT NULL AFTER `language`;')

  await queryFn(
    'UPDATE users AS users INNER JOIN server_users AS server_users ON users.email = server_users.email  SET users.is_admin = server_users.modified WHERE users.email IN (SELECT email from server_users);',
  )

  await queryFn('DROP TABLE `server_users`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`server_users\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`username\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`password\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`email\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`role\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
      \`activated\` tinyint(4) NOT NULL DEFAULT '0',
      \`last_login\` datetime DEFAULT NULL,
      \`created\` datetime NOT NULL,
      \`modified\` datetime NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(
    'INSERT INTO `server_users` (`email`, `username`, `password`, `created`, `modified`) SELECT `email`, `first_name`, `password`, `is_admin`, `is_admin` FROM `users` WHERE `is_admin` IS NOT NULL;',
  )

  await queryFn('ALTER TABLE `users` DROP COLUMN `is_admin`;')
}
