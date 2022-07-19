/* MIGRATION TO COMBINE AND REFACTOR SOME TRANSACTION TABLES
 *
 * Combine `state_user_transactions` and `transactions` tables.
 * This changes the structure of transactions from 1 transaction for
 * each send-coins to two transactions per send-coin
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  /*
   * This migration has a possible incompatibility
   * due to the construction of the tables.
   * For our production data it works well.
   * With this migration we decide for int instead of bigint
   * to handle things more easily
   *
   * CREATE TABLE `transactions` (
   *   `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
   *   ...
   * )
   * CREATE TABLE `state_user_transactions` (
   *   ...
   *   `transaction_id` int(10) unsigned NOT NULL,
   *   ...
   * )
   */

  // rename `state_user_id` to `user_id`
  await queryFn(
    'ALTER TABLE `state_user_transactions` CHANGE COLUMN state_user_id user_id int(10);',
  )
  // Create new `amount` column, with a temporary default of null
  await queryFn(
    'ALTER TABLE `state_user_transactions` ADD COLUMN `amount` bigint(20) DEFAULT NULL AFTER `transaction_type_id`;',
  )
  // Create new `send_sender_final_balance`
  await queryFn(
    'ALTER TABLE `state_user_transactions` ADD COLUMN `send_sender_final_balance` bigint(20) DEFAULT NULL AFTER `amount`;',
  )
  // Create new `memo` column, with a temporary default of null
  await queryFn(
    'ALTER TABLE `state_user_transactions` ADD COLUMN `memo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `amount`;',
  )
  // Create new `received` column, with a temporary default of null
  await queryFn(
    'ALTER TABLE `state_user_transactions` ADD COLUMN `received` timestamp NULL DEFAULT NULL AFTER `balance_date`;',
  )
  // Create new `creation_date` column
  await queryFn(
    'ALTER TABLE `state_user_transactions` ADD COLUMN `creation_date` timestamp NULL DEFAULT NULL AFTER `received`;',
  )
  // Create new `linked_user_id` column (former `send_receiver_user_id`)
  await queryFn(
    'ALTER TABLE `state_user_transactions` ADD COLUMN `linked_user_id` int(10) unsigned DEFAULT NULL AFTER `creation_date`;',
  )
  // Create new `linked_state_user_transaction_id`
  await queryFn(
    'ALTER TABLE `state_user_transactions` ADD COLUMN `linked_state_user_transaction_id` int(10) unsigned DEFAULT NULL AFTER `linked_user_id`;',
  )
  // Create new `tx_hash`
  await queryFn(
    'ALTER TABLE `state_user_transactions` ADD COLUMN `tx_hash` binary(48) DEFAULT NULL AFTER `linked_state_user_transaction_id`;',
  )
  // Create new `signature`
  await queryFn(
    'ALTER TABLE `state_user_transactions` ADD COLUMN `signature` binary(64) DEFAULT NULL AFTER `tx_hash`;',
  )
  // Create new `pubkey`
  await queryFn(
    'ALTER TABLE `state_user_transactions` ADD COLUMN `pubkey` binary(32) DEFAULT NULL AFTER `signature`;',
  )
  // Create new `creation_ident_hash`
  await queryFn(
    'ALTER TABLE `state_user_transactions` ADD COLUMN `creation_ident_hash` binary(32) DEFAULT NULL AFTER `pubkey`;',
  )

  // Insert Data from `transactions` for creations
  await queryFn(`
    UPDATE state_user_transactions
    LEFT JOIN transactions ON state_user_transactions.transaction_id = transactions.id
    SET state_user_transactions.amount = transactions.amount,
        state_user_transactions.send_sender_final_balance = transactions.send_sender_final_balance,
        state_user_transactions.memo = transactions.memo,
        state_user_transactions.received = transactions.received,
        state_user_transactions.creation_date = transactions.creation_date,
        state_user_transactions.linked_user_id = transactions.send_receiver_user_id,
        state_user_transactions.linked_state_user_transaction_id = NULL,
        state_user_transactions.tx_hash = transactions.tx_hash,
        state_user_transactions.signature = transactions.signature,
        state_user_transactions.pubkey = transactions.pubkey,
        state_user_transactions.creation_ident_hash = transactions.creation_ident_hash
    WHERE state_user_transactions.transaction_type_id = 1;
  `)

  // Insert Data from `transactions` for sendCoin sender
  await queryFn(`
    UPDATE state_user_transactions
    LEFT JOIN transactions ON state_user_transactions.transaction_id = transactions.id
    SET state_user_transactions.amount = transactions.amount,
        state_user_transactions.send_sender_final_balance = transactions.send_sender_final_balance,
        state_user_transactions.memo = transactions.memo,
        state_user_transactions.received = transactions.received,
        state_user_transactions.creation_date = transactions.creation_date,
        state_user_transactions.linked_user_id = transactions.send_receiver_user_id,
        state_user_transactions.linked_state_user_transaction_id = (
          SELECT id FROM state_user_transactions AS sut
          WHERE sut.transaction_type_id = 2
          AND sut.transaction_id = state_user_transactions.transaction_id
          AND sut.user_id = transactions.send_receiver_user_id
        ),
        state_user_transactions.tx_hash = transactions.tx_hash,
        state_user_transactions.signature = transactions.signature,
        state_user_transactions.pubkey = transactions.pubkey,
        state_user_transactions.creation_ident_hash = transactions.creation_ident_hash
    WHERE state_user_transactions.transaction_type_id = 2
    AND state_user_transactions.user_id = transactions.user_id;
  `)

  // Insert Data from `transactions` for sendCoin receiver
  await queryFn(`
    UPDATE state_user_transactions
    LEFT JOIN transactions ON state_user_transactions.transaction_id = transactions.id
    SET state_user_transactions.amount = transactions.amount,
        state_user_transactions.send_sender_final_balance = transactions.send_sender_final_balance,
        state_user_transactions.memo = transactions.memo,
        state_user_transactions.received = transactions.received,
        state_user_transactions.creation_date = transactions.creation_date,
        state_user_transactions.linked_user_id = transactions.user_id,
        state_user_transactions.linked_state_user_transaction_id = (
          SELECT id FROM state_user_transactions AS sut
          WHERE sut.transaction_type_id = 2
          AND sut.transaction_id = state_user_transactions.transaction_id
          AND sut.user_id = transactions.user_id
        ),
        state_user_transactions.tx_hash = transactions.tx_hash,
        state_user_transactions.signature = transactions.signature,
        state_user_transactions.pubkey = transactions.send_receiver_public_key,
        state_user_transactions.creation_ident_hash = transactions.creation_ident_hash,
        state_user_transactions.transaction_type_id = 3
    WHERE state_user_transactions.transaction_type_id = 2
    AND state_user_transactions.user_id = transactions.send_receiver_user_id;
  `)

  // Modify defaults after our inserts
  await queryFn('ALTER TABLE `state_user_transactions` MODIFY COLUMN `amount` bigint(20) NOT NULL;')
  await queryFn(
    'ALTER TABLE `state_user_transactions` MODIFY COLUMN `memo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL',
  )
  await queryFn(
    'ALTER TABLE `state_user_transactions` MODIFY COLUMN `received` timestamp NOT NULL DEFAULT current_timestamp()',
  )

  // Drop table `transactions`
  await queryFn('DROP TABLE `transactions`;')

  // Rename table `transaction_send_coins` to `transactions`
  await queryFn('RENAME TABLE `state_user_transactions` TO `transactions`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('RENAME TABLE `transactions` TO `state_user_transactions`;')
  await queryFn(`CREATE TABLE \`transactions\` (
      \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_type_id\` int(10) unsigned NOT NULL,
      \`user_id\` int(10) unsigned NOT NULL,
      \`amount\` bigint(20) NOT NULL,
      \`tx_hash\` binary(48) DEFAULT NULL,
      \`memo\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`received\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`signature\` binary(64) DEFAULT NULL,
      \`pubkey\` binary(32) DEFAULT NULL,
      \`creation_ident_hash\` binary(32) DEFAULT NULL,
      \`creation_date\` timestamp NULL DEFAULT NULL,
      \`send_receiver_public_key\` binary(32) DEFAULT NULL,
      \`send_receiver_user_id\` int(10) unsigned DEFAULT NULL,
      \`send_sender_final_balance\` bigint(20) DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=3424 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await queryFn(`
    INSERT INTO transactions (
      id, transaction_type_id, user_id, amount,
      tx_hash, memo, received, signature, pubkey,
      creation_ident_hash, creation_date,
      send_receiver_public_key, send_receiver_user_id,
      send_sender_final_balance
    )
    SELECT  transaction_id AS id, transaction_type_id,
            user_id, amount, tx_hash, memo, received,
            signature, pubkey, creation_ident_hash,
            creation_date, send_receiver_public_key,
            linked_user_id AS send_receiver_user_id,
            send_sender_final_balance
    FROM state_user_transactions LEFT JOIN (
      SELECT id, pubkey AS send_receiver_public_key
      FROM state_user_transactions AS sut
      WHERE sut.transaction_type_id = 3
    ) AS sutj ON sutj.id = state_user_transactions.id 
    WHERE transaction_type_id IN (1,2)
  `)
  await queryFn(
    'UPDATE state_user_transactions SET transaction_type_id = 2 WHERE transaction_type_id = 3;',
  )
  await queryFn('ALTER TABLE `state_user_transactions` DROP COLUMN `creation_ident_hash`;')
  await queryFn('ALTER TABLE `state_user_transactions` DROP COLUMN `pubkey`;')
  await queryFn('ALTER TABLE `state_user_transactions` DROP COLUMN `signature`;')
  await queryFn('ALTER TABLE `state_user_transactions` DROP COLUMN `tx_hash`;')
  await queryFn(
    'ALTER TABLE `state_user_transactions` DROP COLUMN `linked_state_user_transaction_id`;',
  )
  await queryFn('ALTER TABLE `state_user_transactions` DROP COLUMN `linked_user_id`;')
  await queryFn('ALTER TABLE `state_user_transactions` DROP COLUMN `creation_date`;')
  await queryFn('ALTER TABLE `state_user_transactions` DROP COLUMN `received`;')
  await queryFn('ALTER TABLE `state_user_transactions` DROP COLUMN `memo`;')
  await queryFn('ALTER TABLE `state_user_transactions` DROP COLUMN `send_sender_final_balance`;')
  await queryFn('ALTER TABLE `state_user_transactions` DROP COLUMN `amount`;')
  await queryFn(
    'ALTER TABLE `state_user_transactions` CHANGE COLUMN user_id state_user_id int(10);',
  )
}
