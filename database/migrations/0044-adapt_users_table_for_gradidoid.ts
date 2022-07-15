/* MIGRATION TO ADD GRADIDO_ID
 *
 * This migration adds new columns to the table `users` and creates the 
 * new table `user_contacts`
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
      CREATE TABLE IF NOT EXISTS \`user_contacts\` (
        \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
        \`type\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`users_id\` int(10) unsigned NOT NULL,
        \`email\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
        \`email_hash\` binary(32) NULL,
        \`email_checked\` tinyint(4) NOT NULL DEFAULT 0,
        \`phone\` varchar(255) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NULL DEFAULT NULL,
        \`deleted_at\` datetime NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  await queryFn('ALTER TABLE `users` ADD COLUMN `gradido_id` varchar(36) NULL AFTER `id`;')
  await queryFn('ALTER TABLE `users` ADD COLUMN `alias` varchar(20) NULL AFTER `gradido_id`;')
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `passphrase_encrypt_type` varchar(36) NULL AFTER `privkey`;',
  )
  await queryFn('ALTER TABLE `users` ADD COLUMN `email_id` int(10) NULL AFTER `email`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS \`user_contacts\`;`)

  await queryFn('ALTER TABLE `users` DROP COLUMN `gradido_id`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN `alias`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN `passphrase_encrypt_type`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN `email_id`;')
}
