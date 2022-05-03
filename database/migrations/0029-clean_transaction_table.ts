/* MIGRATION TO CLEAN THE TRANSACTION TABLE
 *
 * This migration deletes and renames several
 * columns of the `transactions` table.
 *
 * This migration has data loss
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Delete columns

  // delete column `amount`
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `amount`;')
  // delete column `send_sender_final_balance`
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `send_sender_final_balance`;')
  // delete column `balance`
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `balance`;')
  // delete column `temp_dec_send_sender_final_balance`
  await queryFn(
    'ALTER TABLE `transactions` DROP COLUMN IF EXISTS `temp_dec_send_sender_final_balance`;',
  )
  // delete column `temp_dec_diff_send_sender_final_balance`
  await queryFn(
    'ALTER TABLE `transactions` DROP COLUMN IF EXISTS `temp_dec_diff_send_sender_final_balance`;',
  )
  // delete column `temp_dec_old_balance`
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `temp_dec_old_balance`;')
  // delete column `temp_dec_diff_balance`
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `temp_dec_diff_balance`;')

  // Rename columns

  // rename column `dec_amount` to `amount`
  await queryFn('ALTER TABLE `transactions` CHANGE COLUMN `dec_amount` `amount` DECIMAL(40,20);')

  // rename column `dec_balance` to `balance`
  await queryFn('ALTER TABLE `transactions` CHANGE COLUMN `dec_balance` `balance` DECIMAL(40,20);')

  // rename column `dec_decay` to `decay`
  await queryFn('ALTER TABLE `transactions` CHANGE COLUMN `dec_decay` `decay` DECIMAL(40,20);')

  // Drop tables

  // drop `state_balances`
  await queryFn('DROP TABLE IF EXISTS `state_balances`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Not all data is recoverable here, this data is simulated,
  // We lose all incorrect balances and wrongly rounded amounts.

  await queryFn(`
    CREATE TABLE \`state_balances\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`state_user_id\` int(10) unsigned NOT NULL,
      \`modified\` datetime NOT NULL,
      \`record_date\` datetime DEFAULT NULL,
      \`amount\` bigint(20) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=568 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    INSERT INTO \`state_balances\`
    (state_user_id, modified, record_date, amount)
    SELECT user_id as state_user_id, balance_date as modified, balance_date as record_date, amount * 10000 as amount FROM
      (SELECT user_id as uid, MAX(balance_date) AS date FROM transactions GROUP BY uid) AS t
    LEFT JOIN transactions ON t.uid = transactions.user_id AND t.date = transactions.balance_date;
  `)

  await queryFn('ALTER TABLE `transactions` CHANGE COLUMN `decay` `dec_decay` DECIMAL(40,20);')
  await queryFn('ALTER TABLE `transactions` CHANGE COLUMN `balance` `dec_balance` DECIMAL(40,20);')
  await queryFn('ALTER TABLE `transactions` CHANGE COLUMN `amount` `dec_amount` DECIMAL(40,20);')

  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `temp_dec_diff_balance` decimal(40,20) DEFAULT NULL AFTER linked_transaction_id;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `temp_dec_old_balance` decimal(40,20) DEFAULT NULL AFTER linked_transaction_id;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `temp_dec_diff_send_sender_final_balance` decimal(40,20) DEFAULT NULL AFTER linked_transaction_id;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `temp_dec_send_sender_final_balance` decimal(40,20) DEFAULT NULL AFTER linked_transaction_id;',
  )
  await queryFn('ALTER TABLE `transactions` ADD COLUMN `balance` bigint(20) DEFAULT 0 AFTER memo;')
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `send_sender_final_balance` bigint(20) DEFAULT NULL AFTER memo;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `amount` bigint(20) DEFAULT NULL AFTER decay_start;',
  )

  await queryFn(`
    UPDATE transactions SET
      temp_dec_diff_balance = 0,
      temp_dec_old_balance = dec_balance,
      temp_dec_diff_send_sender_final_balance = 0,
      temp_dec_send_sender_final_balance = dec_balance,
      balance = dec_balance * 10000,
      send_sender_final_balance = dec_balance * 10000,
      amount = dec_amount * 10000;
  `)

  await queryFn('ALTER TABLE `transactions` MODIFY COLUMN `amount` bigint(20) NOT NULL;')
}
