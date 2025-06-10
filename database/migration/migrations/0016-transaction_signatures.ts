/* MIGRATION TO CLEANUP TRANSACTIONS TABLE
 *
 * This migration cleans up the transactions table and
 * combines its data with transaction_signatures.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Drop column `state_group_id` since it only contains "0" as value, no variation.
  // Furthermore it was not present in our model itself (meaning that newly created )
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `state_group_id`;')

  // Drop column `blockchain_type_id` since it only contains "1" as value, no variation.
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `blockchain_type_id`;')

  // Create `signature` column - for data from `transaction_signatures` table.
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `signature` binary(64) DEFAULT NULL AFTER `received`;',
  )

  // Create `pubkey` column - for data from `transaction_signatures` table.
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `pubkey` binary(32) DEFAULT NULL AFTER `signature`;',
  )

  // Transfer data from `transaction_signatures` table to `transactions` table
  await queryFn(`
    UPDATE transactions
    INNER JOIN transaction_signatures ON transactions.id = transaction_signatures.transaction_id
    SET transactions.signature = transaction_signatures.signature, transactions.pubkey = transaction_signatures.pubkey;
  `)

  // Drop `transaction_signatures` table
  await queryFn('DROP TABLE `transaction_signatures`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE \`transaction_signatures\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`signature\` binary(64) NOT NULL,
      \`pubkey\` binary(32) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await queryFn(`
    INSERT INTO transaction_signatures (transaction_id, signature, pubkey)
      (SELECT id as transaction_id, signature, pubkey FROM transactions WHERE signature IS NOT NULL and pubkey IS NOT NULL);
  `)
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `pubkey`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `signature`;')
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `blockchain_type_id` bigint(20) unsigned NOT NULL DEFAULT 1 AFTER `received` ;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `state_group_id` int(10) unsigned DEFAULT NULL AFTER `id`;',
  )
  // We have to set the correct values previously in the table , since its not the same as the column's default
  await queryFn('UPDATE `transactions` SET `state_group_id` = 0;')
}
