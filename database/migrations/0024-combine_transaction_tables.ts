/* MIGRATION TO COMBINE SEVERAL TRANSACTION TABLES
 *
 * Combine several transaction tables into one table with all data
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Create new `user_id` column (former `state_user_id`), with a temporary default of null
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `user_id` int(10) unsigned DEFAULT NULL AFTER `transaction_type_id`;',
  )
  // Create new `amount` column, with a temporary default of null
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `amount` bigint(20) DEFAULT NULL AFTER `user_id`;',
  )
  // Create new `creation_ident_hash` column (former `ident_hash`)
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `creation_ident_hash` binary(32) DEFAULT NULL AFTER `pubkey`;',
  )
  // Create new `creation_date` column (former `target_date`)
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `creation_date` timestamp NULL DEFAULT NULL AFTER `creation_ident_hash`;',
  )
  // Create new `send_receiver_public_key` column (former `receiver_public_key`)
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `send_receiver_public_key` binary(32) DEFAULT NULL AFTER `creation_date`;',
  )
  // Create new `send_receiver_user_id` column (former `receiver_user_id`)
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `send_receiver_user_id` int(10) unsigned DEFAULT NULL AFTER `send_receiver_public_key`;',
  )
  // Create new `send_sender_final_balance` column (former `sender_final_balance`)
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `send_sender_final_balance` bigint(20) DEFAULT NULL AFTER `send_receiver_user_id`;',
  )

  // Insert Data from `transaction_creations`
  await queryFn(`
    UPDATE transactions
    INNER JOIN transaction_creations ON transaction_creations.transaction_id = transactions.id
    SET transactions.user_id = transaction_creations.state_user_id,
      transactions.amount = transaction_creations.amount,
      transactions.creation_ident_hash = transaction_creations.ident_hash,
      transactions.creation_date = transaction_creations.target_date;
  `)

  // Insert Data from `transaction_send_coins`
  // Note: we drop `sender_public_key` in favor of `pubkey` from the original `transactions` table
  //       the data from `transaction_send_coins` seems incomplete for half the dataset (zeroed pubkey)
  //       with one key being different.
  await queryFn(`
    UPDATE transactions
    INNER JOIN transaction_send_coins ON transaction_send_coins.transaction_id = transactions.id
    SET transactions.user_id = transaction_send_coins.state_user_id,
      transactions.amount = transaction_send_coins.amount,
      transactions.send_receiver_public_key = transaction_send_coins.receiver_public_key,
      transactions.send_receiver_user_id = transaction_send_coins.receiver_user_id,
      transactions.send_sender_final_balance = transaction_send_coins.sender_final_balance;
  `)

  // Modify defaults after our inserts
  await queryFn('ALTER TABLE `transactions` MODIFY COLUMN `user_id` int(10) unsigned NOT NULL;')
  await queryFn('ALTER TABLE `transactions` MODIFY COLUMN `amount` bigint(20) NOT NULL;')

  // Drop table `transaction_creations`
  await queryFn('DROP TABLE `transaction_creations`;')
  // Drop table `transaction_send_coins`
  await queryFn('DROP TABLE `transaction_send_coins`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE \`transaction_send_coins\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`sender_public_key\` binary(32) NOT NULL,
      \`state_user_id\` int(10) unsigned DEFAULT 0,
      \`receiver_public_key\` binary(32) NOT NULL,
      \`receiver_user_id\` int(10) unsigned DEFAULT 0,
      \`amount\` bigint(20) NOT NULL,
      \`sender_final_balance\` bigint(20) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=659 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    CREATE TABLE \`transaction_creations\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`state_user_id\` int(10) unsigned NOT NULL,
      \`amount\` bigint(20) NOT NULL,
      \`ident_hash\` binary(32) DEFAULT NULL,
      \`target_date\` timestamp NULL DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=2769 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  await queryFn(`
    INSERT INTO transaction_send_coins
      ( transaction_id, sender_public_key, state_user_id,
        receiver_public_key, receiver_user_id,
        amount, sender_final_balance )
      ( SELECT  id AS transaction_id, IF(pubkey, pubkey, 0x00000000000000000000000000000000) AS sender_public_key, user_id AS state_user_id,
                send_receiver_public_key AS receiver_public_key, send_receiver_user_id AS receiver_user_id,
                amount, send_sender_final_balance AS sender_final_balance
        FROM transactions
        WHERE transaction_type_id = 2 );
  `)

  await queryFn(`
    INSERT INTO transaction_creations
      ( transaction_id, state_user_id,
        amount, ident_hash, target_date )
      ( SELECT  id AS transaction_id, user_id AS state_user_id,
                amount, creation_ident_hash AS ident_hash, creation_date AS target_date
        FROM transactions
        WHERE transaction_type_id = 1 );
  `)

  await queryFn('ALTER TABLE `transactions` DROP COLUMN `send_sender_final_balance`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `send_receiver_user_id`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `send_receiver_public_key`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `creation_date`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `creation_ident_hash`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `amount`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `user_id`;')
}
