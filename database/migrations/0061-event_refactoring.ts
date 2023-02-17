/* MIGRATION TO REFACTOR THE EVENT_PROTOCOL TABLE
 *
 * This migration refactors the `event_protocol` table.
 * It renames the table to `event`, introduces new fields and renames others.
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('RENAME TABLE `event_protocol` TO `events`;')
  await queryFn('ALTER TABLE `events` RENAME COLUMN `user_id` TO `affected_user_id`;')

  await queryFn(
    'ALTER TABLE `events` ADD COLUMN `acting_user_id` int(10) unsigned DEFAULT NULL AFTER `affected_user_id`;',
  )
  await queryFn('UPDATE `events` SET `acting_user_id` = `affected_user_id`;')
  await queryFn(
    'ALTER TABLE `events` MODIFY COLUMN `acting_user_id` int(10) unsigned NOT NULL AFTER `affected_user_id`;',
  )

  await queryFn('ALTER TABLE `events` RENAME COLUMN `x_user_id` TO `involved_user_id`;')
  await queryFn('ALTER TABLE `events` DROP COLUMN `x_community_id`;')
  await queryFn('ALTER TABLE `events` RENAME COLUMN `transaction_id` TO `involved_transaction_id`;')
  await queryFn(
    'ALTER TABLE `events` RENAME COLUMN `contribution_id` TO `involved_contribution_id`;',
  )
  await queryFn(
    'ALTER TABLE `events` MODIFY COLUMN `message_id` int(10) unsigned DEFAULT NULL AFTER `involved_contribution_id`;',
  )
  await queryFn(
    'ALTER TABLE `events` RENAME COLUMN `message_id` TO `involved_contribution_message_id`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `events` RENAME COLUMN `involved_contribution_message_id` TO `message_id`;',
  )
  await queryFn(
    'ALTER TABLE `events` MODIFY COLUMN `message_id` int(10) unsigned DEFAULT NULL AFTER `amount`;',
  )
  await queryFn(
    'ALTER TABLE `events` RENAME COLUMN `involved_contribution_id` TO `contribution_id`;',
  )
  await queryFn('ALTER TABLE `events` RENAME COLUMN `involved_transaction_id` TO `transaction_id`;')
  await queryFn(
    'ALTER TABLE `events` ADD COLUMN `x_community_id` int(10) unsigned DEFAULT NULL AFTER `involved_user_id`;',
  )
  await queryFn('ALTER TABLE `events` RENAME COLUMN `involved_user_id` TO `x_user_id`;')
  await queryFn('ALTER TABLE `events` DROP COLUMN `acting_user_id`;')
  await queryFn('ALTER TABLE `events` RENAME COLUMN `affected_user_id` TO `user_id`;')
  await queryFn('RENAME TABLE `events` TO `event_protocol`;')
}
