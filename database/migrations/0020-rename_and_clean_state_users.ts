/* MIGRATION TO CLEAN UP AND RENAME STATE_USERS
 *
 * This migration renames 'state_users` to `users`
 * and removes columns with no meaningful value
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // rename `state_users` table to `users`
  await queryFn('RENAME TABLE `state_users` TO `users`;')

  // Remove the column `index_id` from `users`, it only contains 0 as value
  await queryFn('ALTER TABLE `users` DROP COLUMN `index_id`;')

  // Remove the column `username` from `users`, it contains only '' or NULL
  await queryFn('ALTER TABLE `users` DROP COLUMN `username`;')

  // Remove the column `description` from `users`, it contains only '' or NULL
  await queryFn('ALTER TABLE `users` DROP COLUMN `description`;')

  // Remove the column `passphrase_shown` from `users`, it contains only 0 as value
  await queryFn('ALTER TABLE `users` DROP COLUMN `passphrase_shown`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `passphrase_shown` tinyint(4) NOT NULL DEFAULT 0 AFTER `email_checked`;',
  )
  await queryFn(
    "ALTER TABLE `users` ADD COLUMN `description` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT '' AFTER `disabled`;",
  )
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `last_name`;',
  )
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `index_id` smallint(6) NOT NULL DEFAULT 0 AFTER `id`;',
  )

  await queryFn('RENAME TABLE `users` TO `state_users`;')
}
