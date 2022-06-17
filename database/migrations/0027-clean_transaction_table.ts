/* MIGRATION TO CLEAN THE TRANSACTION TABLE
 *
 * Remove several unused fields or those with duplicate data
 * and rename fields to a proper name in `transactions` .
 *
 * This migration has data loss
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // drop column `transaction_id`, it is not needed
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `transaction_id`;')
  // drop column `received`, it is a duplicate of balance_date
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `received`;')
  // drop column `tx_hash`, it is not needed
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `tx_hash`;')
  // drop column `signature`, it is not needed
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `signature`;')
  // drop column `pubkey`, it is not needed
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `pubkey`;')
  // drop column `creation_ident_hash`, it is not needed
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `creation_ident_hash`;')

  // rename `transaction_type_id` to `type_id`
  await queryFn('ALTER TABLE `transactions` CHANGE COLUMN transaction_type_id type_id int(10);')
  // rename `linked_state_user_transaction_id` to `linked_transaction_id`
  await queryFn(
    'ALTER TABLE `transactions` CHANGE COLUMN linked_state_user_transaction_id linked_transaction_id int(10);',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Not all data is recoverable here, some data is simulated,
  // but we have data loss on:
  // - transaction_id (we have data here, but its not the same as before)
  // - tx_hash (null)
  // - signature (null)
  // - pubkey (null)
  // - creation_ident_hash (null)

  await queryFn(
    'ALTER TABLE `transactions` CHANGE COLUMN linked_transaction_id linked_state_user_transaction_id int(10);',
  )
  await queryFn('ALTER TABLE `transactions` CHANGE COLUMN type_id transaction_type_id int(10);')
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `creation_ident_hash` binary(32) DEFAULT NULL AFTER `linked_state_user_transaction_id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `pubkey` binary(32) DEFAULT NULL AFTER `linked_state_user_transaction_id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `signature` binary(64) DEFAULT NULL AFTER `linked_state_user_transaction_id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `tx_hash` binary(48) DEFAULT NULL AFTER `linked_state_user_transaction_id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `received` timestamp NULL DEFAULT NULL AFTER `balance_date`;',
  )
  await queryFn('UPDATE `transactions` SET `received` = `balance_date`;')
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `received` timestamp NOT NULL DEFAULT current_timestamp();',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `transaction_id` int(10) unsigned DEFAULT NULL AFTER `user_id`;',
  )
  await queryFn('UPDATE `transactions` SET `transaction_id` = `id`;')
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `transaction_id` int(10) unsigned NOT NULL;',
  )
}
