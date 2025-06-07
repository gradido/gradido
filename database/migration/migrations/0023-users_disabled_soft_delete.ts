/* MIGRATION TO IMPLEMENT SOFT DELETE ON THE USERS TABLE
 *
 * Replace the `disabled` column with `deletedAt` containing
 * a date as it is standard for soft delete fields
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Create new `deletedAt` column
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `deletedAt` datetime DEFAULT NULL AFTER `disabled`;',
  )

  // Insert a 1.1.2022 as date for those users with `disabled=1`
  await queryFn('UPDATE `users` SET `deletedAt` = "2022-01-01 00:00:00" WHERE `disabled` = 1;')

  // Delete `disabled` column
  await queryFn('ALTER TABLE `users` DROP COLUMN `disabled`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `disabled` tinyint(4) NOT NULL DEFAULT 0 AFTER `deletedAt`;',
  )
  await queryFn('UPDATE `users` SET `disabled` = 1 WHERE `deletedAt` IS NOT NULL;')
  await queryFn('ALTER TABLE `users` DROP COLUMN `deletedAt`;')
}
