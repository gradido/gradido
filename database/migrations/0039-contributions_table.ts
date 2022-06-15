/* MIGRATION to rename ADMIN_PENDING_CREATION table and add columns
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('RENAME TABLE `admin_pending_creations` TO `contributions`;')

  await queryFn('ALTER TABLE `contributions` CHANGE COLUMN `userId` `user_id` int(10);')

  await queryFn('ALTER TABLE `contributions` CHANGE COLUMN `created` `created_at` datetime;')

  await queryFn('ALTER TABLE `contributions` CHANGE COLUMN `date` `contribution_date` datetime;')

  await queryFn('ALTER TABLE `contributions` CHANGE COLUMN `moderator` `moderator_id` int(10);')

  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN `contribution_link_id` int(10) unsigned DEFAULT NULL AFTER `moderator_id`;',
  )

  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN `confirmed_by` int(10) unsigned DEFAULT NULL AFTER `contribution_link_id`;',
  )

  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN `confirmed_at` datetime DEFAULT NULL AFTER `confirmed_by`;',
  )

  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN `transaction_id` int(10) unsigned DEFAULT NULL AFTER `confirmed_at`;',
  )

  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN `deleted_at` datetime DEFAULT NULL AFTER `confirmed_at`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `contributions` DROP COLUMN IF EXISTS `deleted_at`;')

  await queryFn('ALTER TABLE `contributions` DROP COLUMN IF EXISTS `transaction_id`;')

  await queryFn('ALTER TABLE `contributions` DROP COLUMN IF EXISTS `confirmed_at`;')

  await queryFn('ALTER TABLE `contributions` DROP COLUMN IF EXISTS `confirmed_by`;')

  await queryFn('ALTER TABLE `contributions` DROP COLUMN IF EXISTS `contribution_link_id`;')

  await queryFn('ALTER TABLE `contributions` CHANGE COLUMN `moderator_id` `moderator` int(10);')

  await queryFn('ALTER TABLE `contributions` CHANGE COLUMN `created_at` `created` datetime;')

  await queryFn('ALTER TABLE `contributions` CHANGE COLUMN `contribution_date` `date` datetime;')

  await queryFn('ALTER TABLE `contributions` CHANGE COLUMN `user_id` `userId` int(10);')

  await queryFn('RENAME TABLE `contributions` TO `admin_pending_creations`;')
}
